import process from 'node:process'
import { style } from '../prettyPrint.js'
import { ServiceAccessError, findServiceByName, getServicePaths, isProcessAlive, readServiceFile, readServiceFileTail } from './util.js'

export default function status(args) {
	if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
		console.log('Usage:\n  jix service status <service-name>')
		console.log('\nShow detailed status for a specific service')
		return
	}

	if (args.length > 1) {
		console.error('Too many arguments. Usage: jix service status <service-name>')
		return
	}

	const serviceName = args[0]
	const currentDir = process.cwd()

	const foundService = findServiceByName(serviceName, currentDir)

	if (!foundService) {
		console.log(`Service '${serviceName}' not found in current directory. Run 'jix service' to see available services.`)
		return
	}

	const { detailsPath, logPath, statusPath } = getServicePaths(foundService)

	console.log(`${style.key('name')} ${serviceName}`)
	console.log(`${style.key('system-service')} ${foundService.system}`)
	console.log(`${style.key('target')} ${foundService.user}@${foundService.address}`)
	console.log(`${style.key('id')} ${foundService.jixId}`)
	console.log(`${style.key('hash')} ${foundService.hash}`)
	console.log(``)
	console.log(style.title('--- Status ---'))

	// Check if service details file exists
	let detailsContent
	try {
		detailsContent = readServiceFile(foundService, detailsPath)
	} catch (err) {
		console.error(`Error reading service details: ${err.message}`)
		return
	}
	if (detailsContent === null) {
		console.log('Status: stopped (no details file)')
		return
	}

	// Read and parse details file
	let details = {}
	for (const line of detailsContent.split('\n')) {
		const [key, ...valueParts] = line.split('=')
		if (key && valueParts.length > 0) {
			details[key] = valueParts.join('=')
		}
	}

	// Display status information
	let actualState = details.state || 'unknown'

	// Verify process is actually running if state is 'started'
		if (details.state === 'started' && details.pid) {
			try {
				if (!isProcessAlive(foundService, details.pid)) {
					actualState = 'stopped (stale pid)'
				}
			} catch (error) {
				if (error instanceof ServiceAccessError) {
					actualState = 'unknown (host unreachable)'
				} else {
					throw error
				}
			}
		}

	console.log(`${style.key('state')} ${actualState}`)

	if (details.state === 'started' && actualState === 'started') {
		console.log(`${style.key('pid')} ${details.pid || 'unknown'}`)
		console.log(`${style.key('start')} ${details.start_time || 'unknown'}`)
		console.log(`${style.key('exec')} ${details.exec || 'unknown'}`)

		// Show recent log entries if log file exists
			let logContent
			try {
				logContent = readServiceFileTail(foundService, logPath, 10)
			} catch (err) {
				console.log(`(error reading log: ${err.message})`)
				logContent = null
			}
			if (logContent !== null) {
				console.log(``)
				console.log(style.title('--- Recent Log Entries ---'))
				const lines = logContent.split('\n').filter(line => line.trim())
				if (lines.length > 0) {
					for (const line of lines) {
						console.log(line)
					}
				} else {
					console.log('(no recent entries)')
				}
			}
		} else {
		if (details.state === 'exited') {
			console.log(`${style.key('exit-code')} ${details.exit_code || 'unknown'}`)
			console.log(`${style.key('exit-time')} ${details.exit_time || 'unknown'}`)
		}
	}

	// Show entire status history if status file exists
		let statusContent
		try {
			statusContent = readServiceFile(foundService, statusPath)
		} catch (err) {
			console.log(`(error reading status: ${err.message})`)
			statusContent = null
		}
		if (statusContent !== null) {
			console.log(``)
			console.log(style.title('--- Status History ---'))
			const statusLines = statusContent.split('\n').filter(line => line.trim())
			const recentStatus = statusLines.slice(-5)

			if (recentStatus.length > 0) {
				for (const line of recentStatus) {
					console.log(line)
				}
			} else {
				console.log('(no status entries)')
			}
		}
	}
