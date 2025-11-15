import { existsSync, readFileSync } from 'node:fs'
import process from 'node:process'
import { dedent } from '../../jix/dedent.js'
import { style } from '../prettyPrint.js'
import { findServiceByName, getServicePaths } from './util.js'

export default function log(args) {
	if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
		console.log('Usage:\n  jix service log <service-name>')
		console.log('\nShow the log for a specific service')
		return
	}

	if (args.length > 1) {
		console.error('Too many arguments. Usage: jix service log <service-name>')
		return
	}

	const serviceName = args[0]
	const currentDir = process.cwd()
	const home = process.env.HOME || process.env.USER

	const foundService = findServiceByName(serviceName, currentDir)

	if (!foundService) {
		console.log(`Service '${serviceName}' not found in current directory. Run 'jix service' to see available services.`)
		return
	}

	const { logPath } = getServicePaths(serviceName, foundService.system, home)

	if (!existsSync(logPath)) {
		console.error(`Error: No log file found for service '${serviceName}'`)
		console.error(`Expected log file at: ${logPath}`)
		process.exitCode = 1
		return
	}

	try {
		const logContent = readFileSync(logPath, 'utf8')
		if (logContent.trim()) {
			console.log(logContent)
		}
	} catch (err) {
		console.error(`Error reading log: ${err.message}`)
		process.exitCode = 1
	}
}
