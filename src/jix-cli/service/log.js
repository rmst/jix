import process from 'node:process'
import { parseArgs } from '../parseArgs.js'
import { ServiceAccessError, findServiceByName, getServicePaths, readServiceFile, readServiceFileTail } from './util.js'

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

	const { logPath, statusPath } = getServicePaths(foundService)

	const readFileContent = (path, lineCount) => {
		if (showAll)
			return readServiceFile(foundService, path)
		return readServiceFileTail(foundService, path, lineCount)
	}

	let logContent
	try {
		logContent = readFileContent(logPath, lines)
	} catch (err) {
		if (err instanceof ServiceAccessError) {
			console.error(`Error reading log: ${err.message}`)
		} else {
			console.error(`Error reading log: ${err?.message ?? String(err)}`)
		}
		process.exitCode = 1
		return
	}

	if (logContent === null) {
		console.error(`Error: No log file found for service '${serviceName}'`)
		console.error(`Expected log file at: ${logPath}`)
		process.exitCode = 1
		return
	}

	let statusContent = ''
	try {
		statusContent = readFileContent(statusPath, lines) ?? ''
	} catch (err) {
		if (!(err instanceof ServiceAccessError)) {
			console.error(`Warning: Unable to read status entries (${err?.message ?? String(err)})`)
		}
		statusContent = ''
	}

	const mergedEntries = mergeEntries(logContent, statusContent)

	if (mergedEntries.length === 0) {
		console.log('(log is empty)')
		return
	}

	const renderedLines = renderEntries(mergedEntries)
	renderedLines.forEach(line => console.log(line))
}

const parseLogEntries = (content) => content
	.split('\n')
	.map((line, index) => {
		if (!line || !line.trim())
			return null
		const tabIndex = line.indexOf('\t')
		const hasTimestamp = tabIndex !== -1
		const rawTimestamp = hasTimestamp ? line.slice(0, tabIndex) : null
		const message = hasTimestamp ? line.slice(tabIndex + 1) : line
		const timestampMs = hasTimestamp ? Date.parse(rawTimestamp) : Number.NaN
		return {
			type: 'log',
			timestampMs: Number.isNaN(timestampMs) ? null : timestampMs,
			order: index,
			rawTimestamp,
			message,
		}
	})
	.filter(Boolean)

const formatStatusMessage = (event, detail) => {
	if (event === 'started')
		return `service started (pid ${detail || '?'})`
	if (event === 'exited')
		return `service exited (code ${detail ?? '?'})`
	if (event === 'signal-forwarded')
		return `shutdown requested (forwarded ${detail || 'signal'})`
	if (event === 'forced-exit') {
		const extra = detail?.trim()
		return extra ? `forced exit (${extra})` : 'forced exit'
	}
	return `${event}${detail ? ` ${detail}` : ''}`
}

const parseStatusEntries = (content) => content
	.split('\n')
	.map((line, index) => {
		if (!line || !line.trim())
			return null
		const [rawTimestamp, event, detail = ''] = line.split(',')
		if (!event)
			return null
		const timestampMs = rawTimestamp ? Date.parse(rawTimestamp) : Number.NaN
		return {
			type: 'status',
			timestampMs: Number.isNaN(timestampMs) ? null : timestampMs,
			order: index,
			rawTimestamp: rawTimestamp ?? null,
			event,
			detail: detail ?? '',
		}
	})
	.filter(Boolean)

const compareEntries = (a, b) => {
	if (a.timestampMs === null && b.timestampMs === null)
		return a.order - b.order
	if (a.timestampMs === null)
		return 1
	if (b.timestampMs === null)
		return -1
	if (a.timestampMs === b.timestampMs)
		return a.order - b.order
	return a.timestampMs - b.timestampMs
}

const mergeEntries = (logContent, statusContent) => {
	const logEntries = parseLogEntries(logContent)
	const statusEntries = parseStatusEntries(statusContent)
	return [...logEntries, ...statusEntries].sort(compareEntries)
}

const formatLogLine = ({ rawTimestamp, message }) => {
	if (rawTimestamp)
		return `${rawTimestamp}     ${message}`
	return message
}

const formatStatusLine = ({ rawTimestamp, event, detail }) => {
	const message = formatStatusMessage(event, detail?.trim())
	if (rawTimestamp)
		return `${rawTimestamp}  !  ${message}`
	return `  !  ${message}`
}

const renderEntries = (entries) => entries.flatMap(entry => {
	if (entry.type === 'log')
		return [formatLogLine(entry)]

	const line = formatStatusLine(entry)
	if (entry.event === 'started')
		return ['', '', line, '']
	if (entry.event === 'exited')
		return ['', line]
	return [line]
})
