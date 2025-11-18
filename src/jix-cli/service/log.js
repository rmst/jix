import process from 'node:process'
import { parseArgs } from '../parseArgs.js'
import { findServiceByName, getServicePaths, readServiceFile, readServiceFileTail } from './util.js'

export default function log(args) {
	const { flags, positionals } = parseArgs(args, {
		lines: 'value',
		n: 'value',
	})
	const helpRequested = flags.h || flags.help

	if (helpRequested || args.length === 0) {
		console.log('Usage:\n  jix service log [--lines N|--all] <service-name>')
		console.log('\nShow the log for a specific service (default: last 200 lines)')
		return
	}

	const showAll = Boolean(flags.all)
	const linesFlag = flags.lines ?? flags.n
	let lines = 200

	if (linesFlag !== undefined) {
		const parsed = Number.parseInt(linesFlag, 10)
		if (!Number.isFinite(parsed) || parsed <= 0) {
			console.error('Invalid --lines value. Use a positive integer.')
			return
		}
		lines = parsed
	}

	if (positionals.length !== 1) {
		console.error('Usage: jix service log [--lines N|--all] <service-name>')
		return
	}

	const serviceName = positionals[0]
	const currentDir = process.cwd()

	const foundService = findServiceByName(serviceName, currentDir)

	if (!foundService) {
		console.log(`Service '${serviceName}' not found in current directory. Run 'jix service' to see available services.`)
		return
	}

	const { logPath } = getServicePaths(foundService)

	let logContent
	try {
		logContent = showAll
			? readServiceFile(foundService, logPath)
			: readServiceFileTail(foundService, logPath, lines)
	} catch (err) {
		console.error(`Error reading log: ${err.message}`)
		process.exitCode = 1
		return
	}
	if (logContent === null) {
		console.error(`Error: No log file found for service '${serviceName}'`)
		console.error(`Expected log file at: ${logPath}`)
		process.exitCode = 1
		return
	}

	if (logContent.trim()) {
		console.log(logContent)
	} else {
		console.log('(log is empty)')
	}
}
