import process from 'node:process'
import { dedent } from '../../jix/dedent.js'
import { style } from '../prettyPrint.js'
import statusSubcommand from './status.js'
import logSubcommand from './log.js'
import { formatDuration, getServiceFiles, getServicePaths, isProcessAlive, readServiceFile, readServiceFileTail } from './util.js'

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
		const serviceEffects = getServiceFiles(currentDir)

		if (serviceEffects.length === 0) {
			console.log('No running services found for current directory.')
			return
		}

			// Helper function to get service status
			const getServiceStatus = (service) => {
				if (service.accessible === false)
					return { indicator: '?', status: '', time: null }
				const { detailsPath } = getServicePaths(service)

			try {
				const detailsContent = readServiceFile(service, detailsPath)
				if (!detailsContent)
					return { indicator: '○', status: 'error', time: null }

				const stateMatch = detailsContent.match(/^state=(.+)$/m)
				const pidMatch = detailsContent.match(/^pid=(.+)$/m)
				const exitCodeMatch = detailsContent.match(/^exit_code=(.+)$/m)
				const startTimeMatch = detailsContent.match(/^start_time=(.+)$/m)
				const exitTimeMatch = detailsContent.match(/^exit_time=(.+)$/m)

					if (stateMatch && stateMatch[1] === 'started' && pidMatch) {
					const pid = pidMatch[1]
					if (isProcessAlive(service, pid)) {
						// Calculate uptime
						if (startTimeMatch) {
							const startTime = new Date(startTimeMatch[1])
							const now = new Date()
							const uptimeSeconds = Math.floor((now - startTime) / 1000)
							return { indicator: '●', status: 'uptime', time: formatDuration(uptimeSeconds) }
						}
						return { indicator: '●', status: 'running', time: null }
					} else {
						// Calculate time since start for error
						if (startTimeMatch) {
							const startTime = new Date(startTimeMatch[1])
							const now = new Date()
							const elapsedSeconds = Math.floor((now - startTime) / 1000)
							return { indicator: '●', status: 'error', time: `${formatDuration(elapsedSeconds)} ago` }
						}
						return { indicator: '●', status: 'error', time: null }
					}
				} else if (stateMatch && stateMatch[1] === 'exited' && exitCodeMatch) {
					const exitCode = exitCodeMatch[1]
					if (exitCode === '0') {
						// Calculate time since exit
						if (exitTimeMatch) {
							const exitTime = new Date(exitTimeMatch[1])
							const now = new Date()
							const elapsedSeconds = Math.floor((now - exitTime) / 1000)
							return { indicator: '○', status: 'success', time: `${formatDuration(elapsedSeconds)} ago` }
						}
						return { indicator: '○', status: 'success', time: null }
					} else {
						// Calculate time since exit for error (cleanly exited with non-zero code)
						if (exitTimeMatch) {
							const exitTime = new Date(exitTimeMatch[1])
							const now = new Date()
							const elapsedSeconds = Math.floor((now - exitTime) / 1000)
							return { indicator: '○', status: 'error', time: `${formatDuration(elapsedSeconds)} ago` }
						}
						return { indicator: '○', status: 'error', time: null }
					}
				}
			} catch {
				if (service.accessible === false)
					return { indicator: '?', status: '', time: null }
				// Ignore other errors checking service status
			}

			if (service.accessible === false)
				return { indicator: '?', status: '', time: null }
			return { indicator: '○', status: 'error', time: null }
		}

		const servicesByJixId = Object.groupBy(serviceEffects, s => s.jixId)

		Object.entries(servicesByJixId).forEach(([jixId, services]) => {
			let relativePath = jixId
			if (jixId.startsWith(currentDir + '/')) {
				relativePath = jixId.slice(currentDir.length + 1)
			} else if (jixId === currentDir) {
				relativePath = '.'
			}

			console.log(`${relativePath}:`)

			const servicesByTarget = Object.groupBy(services, s => `${s.user}@${s.address}`)

			Object.entries(servicesByTarget).forEach(([targetKey, targetServices]) => {
				const userServices = targetServices.filter(s => !s.system)
				const systemServices = targetServices.filter(s => s.system)

				if (userServices.length > 0) {
					console.log(`  ${targetKey} (user):`)
					userServices.forEach(service => {
						const status = getServiceStatus(service)
						let spacing = ''
						if (status.status === 'success') spacing = ''
						else if (status.status === 'uptime' || status.status === 'running') spacing = ' '
						else if (status.status === 'error') spacing = '  '
						const timeText = status.time || ''
						console.log(`    ${status.indicator} ${service.name.padEnd(38)} ${status.status}${spacing} ${timeText}`)
					})
					console.log()
				}

				if (systemServices.length > 0) {
					console.log(`  ${targetKey} (system):`)
					systemServices.forEach(service => {
						const status = getServiceStatus(service)
						let spacing = ''
						if (status.status === 'success') spacing = ''
						else if (status.status === 'uptime' || status.status === 'running') spacing = ' '
						else if (status.status === 'error') spacing = '  '
						const timeText = status.time || ''
						console.log(`    ${status.indicator} ${service.name.padEnd(38)} ${status.status}${spacing} ${timeText}`)
					})
					console.log()
				}
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
