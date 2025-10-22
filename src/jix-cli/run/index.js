import install from '../core/install.js'
import { sh } from '../util.js'
import * as fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import process from 'node:process'
import { dedent } from '../../jix/dedent.js'
import { withLogger } from '../logger.js'
import db from '../db/index.js'
import { style } from '../prettyPrint.js'
import { MANIFEST_BASENAME } from '../../jix/context.js'


async function run(cmd, args, { verbose = false, file } = {}) {
	let manifestPath = `./${MANIFEST_BASENAME}`
	const join = (a, b) => (a.endsWith('/') || a.endsWith('\\')) ? a + b : a + '/' + b
	if (file) {
		let candidate = file
		if (!fs.existsSync(candidate)) {
			console.log(`Specified path does not exist: ${candidate}`)
			return
		}
		const stat = fs.statSync(candidate)
		if (stat.isDirectory())
			candidate = join(candidate, MANIFEST_BASENAME)
		manifestPath = candidate
	}

	if (!fs.existsSync(manifestPath)) {
		console.log(`Manifest not found: ${manifestPath}`)
		return
	}

  // The dynamic import in 'apply' needs an absolute path.
  const absoluteManifestPath = sh`realpath ${manifestPath}`.trim() // TODO: obvious get rid of this

  // Default to the "default" entry if no name is provided
  if (!cmd)
    cmd = 'default'

	const name = `run.${cmd}`
	const jixId = `${absoluteManifestPath}#${name}`

	// If there is leftover state for this run id, try a full uninstall first
	if (db.active.read()[jixId]) {
		try {
			await withLogger({ verbose }, async () => await install({ sourcePath: jixId, uninstall: true }))
		} catch (e) {
			console.log(`${style.red('Error:')} Detected leftover effects from a previous 'jix run'. Tried to auto-clean them but failed. Specifically:\n`)
			console.log(e.message)
			process.exit(1)
		}
	}

	// Apply only the effects required for this specific run script
	let scriptPath
	scriptPath = await withLogger({ verbose }, async () => await install({ sourcePath: absoluteManifestPath, name }))
  console.log()

	// Cleanup function to uninstall effects
	const cleanup = async () => {
		console.log()
		try {
			await withLogger({ verbose }, async () => await install({ sourcePath: absoluteManifestPath, uninstall: true, name }))
		} catch (_) {
			// Best effort cleanup
		}
	}

	// Handle signals to ensure cleanup on Ctrl+C
	let signalReceived = false
	const handleSignal = (signal) => {
		if (signalReceived) return
		signalReceived = true
		cleanup().then(() => {
			process.exit(signal === 'SIGINT' ? 130 : 143)
		})
	}

	process.on('SIGINT', () => handleSignal('SIGINT'))
	process.on('SIGTERM', () => handleSignal('SIGTERM'))

  let exitCode = 0
  try {
    execFileSync('/bin/sh', [scriptPath, ...args], { stdout: 'inherit', stderr: 'inherit' })
  } catch (e) {
    // The execFileSync function throws an error if the script returns a non-zero exit code.
    // This is expected behavior, so we don't need to log the error unless it's a true execution failure.
    // For now, we can just suppress the error to prevent crashing jix.
    // A more robust solution might inspect the error object.
    exitCode = e.status || 1
  } finally {
		// Remove signal handlers
		process.removeAllListeners('SIGINT')
		process.removeAllListeners('SIGTERM')

		if (!signalReceived) {
			await cleanup()
		}
  }

  if (exitCode !== 0)
    process.exit(exitCode)
}

export default {
	name: 'run',
	description: 'Execute a jix script or command.',
	usage: 'jix run <command-name> [args...]',
	help: dedent`
	Run a command defined in the current directory's ${MANIFEST_BASENAME} manifest.

	Arguments:
	  <command-name>  Name of the entry under export const run = {...}
	  [args...]  Arguments forwarded to the invoked script

		Options before <command-name>:
		  -v, --verbose        Show jix install/uninstall logs for this run
		  -f, --file <path>    Use a specific manifest file or directory

	Notes:
	  - Only flags placed before <command-name> are consumed by jix itself.
	    Everything after <command-name> (or after a standalone "--") is forwarded
	    unchanged to your script.

	Examples:
	  jix run
	  jix run hello
	  jix run --verbose build --release
	  jix run -- hello --debug
	`,
	async run(args) {
		// Parse flags before the script name; support "--" sentinel
		let verbose = false
		let file
		let i = 0
		while (i < args.length) {
			const tok = args[i]
			if (tok === '--') { i++; break }
			if (tok === '--help' || tok === '-h') {
				console.log(`Usage:\n  ${this.usage}\n\n${this.help}`)
				return
			}
			if (tok === '--verbose' || tok === '-v') { verbose = true; i++; continue }
			if (tok === '-f') {
				file = args[i + 1]
				i += 2
				continue
			}
			if (tok.startsWith('--file=')) {
				file = tok.slice('--file='.length)
				i++
				continue
			}
			if (tok === '--file') {
				file = args[i + 1]
				i += 2
				continue
			}
			if (tok.startsWith('-')) { i++; continue }
			break
		}

		const sub = args[i]
		const rest = args.slice(i + 1)

		await run(sub, rest, { verbose, file })
	}
}
