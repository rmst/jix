import db from '../db/index.js'
import set from '../core/set.js'
import { existsSync, readFileSync } from 'node:fs'
import process from 'node:process'
import { dedent } from '../../jix/dedent.js'
import { hostInfoWithUser } from '../core/hosts.js'
import { getCurrentUser } from '../util.js'
import { style } from '../prettyPrint.js'
import statusSubcommand from './status.js'
import logSubcommand from './log.js'
import { isProcessAlive } from './util.js'

export const userServicesDir = (home) => `${home}/.jix/db/jix.user-services`
export const systemServicesDir = (home) => `${home}/.jix/db/jix.services`

export default {
	name: 'service',
	description: 'Display running services',
	usage: 'jix service [status <service-name>]',
	help: dedent`
	Display running services for all Jix manifests in the current directory

	Subcommands:
	  status <service-name>  Show detailed status for a specific service
	  log <service-name>     Show logs for a specific service

	Examples:
	  jix service
	  jix service status my-service
	  jix service log my-service
	`,
	run(args) {
		if (args.includes('--help') || args.includes('-h')) {
			console.log(`Usage:\n  ${this.usage}\n\n${this.help}`)
			return
		}

		// Handle subcommands
		if (args[0] === 'status') {
			this.status(args.slice(1))
			return
		}

		if (args[0] === 'log') {
			this.log(args.slice(1))
			return
		}

		if (args.length > 0) {
			console.error(`Unknown service subcommand: ${args[0]}`)
			console.log(`Usage:\n  ${this.usage}\n\n${this.help}`)
			return
		}

		const currentDir = process.cwd()
		const targetInfo = hostInfoWithUser({ address: 'localhost' }, getCurrentUser())
		const targetMachineId = targetInfo.machineId
		const currentUser = getCurrentUser()

		if (db.active.exists() === false) {
			console.log('No active jix configurations found.')
			return
		}

		const activeHashesById = db.active.read()
		const serviceEffects = []

		// Get service effects from active jix IDs
		serviceEffects.push(
			...Object.entries(activeHashesById).flatMap(([jixId, hashes]) => {
				const [jixIdPath] = jixId.split('#')
				if (!jixIdPath.startsWith(currentDir)) return []

				return set(hashes).list().flatMap(hash => {
					try {
						const effectData = db.store.read(hash)
						if (effectData.host !== targetMachineId || effectData.user !== currentUser) return []

						if (effectData.info && effectData.info.type === 'jix.service') {
							return [{
								jixId,
								hash,
								name: effectData.info.name,
								system: effectData.info.system || false,
								effectData
							}]
						}
						return []
					} catch {
						return []
					}
				})
			})
		)

		if (serviceEffects.length === 0) {
			console.log('No running services found for current directory.')
			return
		}

		console.log(`Found ${serviceEffects.length} service(s):\n`)

		// Group services by jix ID for better display
		const servicesByJixId = Object.groupBy(serviceEffects, s => s.jixId)

		Object.entries(servicesByJixId).forEach(([jixId, services]) => {
			// Simple relative path calculation
			let relativePath = jixId
			if (jixId.startsWith(currentDir + '/')) {
				relativePath = jixId.slice(currentDir.length + 1)
			} else if (jixId === currentDir) {
				relativePath = '.'
			}
			console.log(`${relativePath}:`)

			services.forEach(service => {
				const serviceType = service.system ? 'system' : 'user'
				const servicesBaseDir = service.system ? systemServicesDir(process.env.HOME || getCurrentUser()) : userServicesDir(process.env.HOME || getCurrentUser())
				const serviceDetailsPath = `${servicesBaseDir}/${service.name}/details`

				let status = 'stopped'

				// Check if service is actually running
				try {
					if (existsSync(serviceDetailsPath)) {
						const detailsContent = readFileSync(serviceDetailsPath, 'utf8')
						const stateMatch = detailsContent.match(/^state=(.+)$/m)
						const pidMatch = detailsContent.match(/^pid=(.+)$/m)

						if (stateMatch && stateMatch[1] === 'started' && pidMatch) {
							const pid = pidMatch[1]
							if (isProcessAlive(pid)) {
								status = 'started'
							}
						}
					}
				} catch {
					// Ignore errors checking service status
				}

				const statusIndicator = status === 'started' ? '●' : '○'
				console.log(`  ${statusIndicator} ${service.name.padEnd(40)} ${serviceType}`)
			})
			console.log()
		})
	},

	status(args) {
		if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
			console.log('Usage:\n  jix service status <service-name>')
			console.log('\nShow detailed status for a specific service')
			return
		}

		statusSubcommand(args)
	},

	log(args) {
		if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
			console.log('Usage:\n  jix service log <service-name>')
			console.log('\nShow logs for a specific service')
			return
		}

		logSubcommand(args)
	},
}
