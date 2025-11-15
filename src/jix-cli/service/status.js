import { existsSync, readFileSync } from 'node:fs'
import process from 'node:process'
import { dedent } from '../../jix/dedent.js'
import { style } from '../prettyPrint.js'
import { findServiceByName, getServicePaths } from './util.js'

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
	const home = process.env.HOME || process.env.USER

	const foundService = findServiceByName(serviceName, currentDir)

	if (!foundService) {
		console.log(`Service '${serviceName}' not found in current directory. Run 'jix service' to see available services.`)
		return
	}

	const { detailsPath, logPath, statusPath } = getServicePaths(serviceName, foundService.system, home)

	console.log(`${style.key('name')} ${serviceName}`)
	console.log(`${style.key('system-service')} ${foundService.system}`)
	console.log(`${style.key('id')} ${foundService.jixId}`)
	console.log(``)
	console.log(style.title('--- Status ---'))

	// Check if service details file exists
	if (!existsSync(detailsPath)) {
		console.log('Status: stopped (no details file)')
		return
	}

	// Read and parse details file
	let details = {}
	try {
		const detailsContent = readFileSync(detailsPath, 'utf8')
		for (const line of detailsContent.split('\n')) {
			const [key, ...valueParts] = line.split('=')
			if (key && valueParts.length > 0) {
				details[key] = valueParts.join('=')
			}
		}
	} catch (err) {
		console.error(`Error reading service details: ${err.message}`)
		return
	}

	// Display status information
	console.log(`${style.key('state')} ${details.state || 'unknown'}`)

	if (details.state === 'started') {
		console.log(`${style.key('pid')} ${details.pid || 'unknown'}`)
		console.log(`${style.key('start')} ${details.start_time || 'unknown'}`)
		console.log(`${style.key('exec')} ${details.exec || 'unknown'}`)

		// Show recent log entries if log file exists
		if (existsSync(logPath)) {
			console.log(``)
			console.log(style.title('--- Recent Log Entries ---'))
			try {
				const logContent = readFileSync(logPath, 'utf8')
				const logLines = logContent.split('\n')
				const recentLines = logLines.slice(-10).filter(line => line.trim())

				if (recentLines.length > 0) {
					for (const line of recentLines) {
						console.log(line)
					}
				} else {
					console.log('(no recent entries)')
				}
			} catch (err) {
				console.log(`(error reading log: ${err.message})`)
			}
		}
	} else {
		if (details.state === 'exited') {
			console.log(`${style.key('exit-code')} ${details.exit_code || 'unknown'}`)
			console.log(`${style.key('exit-time')} ${details.exit_time || 'unknown'}`)
		}
	}

	// Show entire status history if status file exists
	if (existsSync(statusPath)) {
		console.log(``)
		console.log(style.title('--- Status History ---'))
		try {
			const statusContent = readFileSync(statusPath, 'utf8')
			const statusLines = statusContent.split('\n').filter(line => line.trim())
			const recentStatus = statusLines.slice(-5)

			if (recentStatus.length > 0) {
				for (const line of recentStatus) {
					console.log(line)
				}
			} else {
				console.log('(no status entries)')
			}
		} catch (err) {
			console.log(`(error reading status: ${err.message})`)
		}
	}
}
