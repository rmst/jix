import apply from '../core/install.js'
import { sh } from '../util.js'
import nux from '../../nux'
import * as util from '../util.js'
import { ACTIVE_HASHES_PATH } from '../../nux/context.js'
import * as fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import process from 'node:process'
import { dedent } from '../../nux/dedent.js'
import { withLogger } from '../logger.js'
import db from '../db/index.js'
import { style } from '../prettyPrint.js'


async function run(cmd, args, { verbose = false, file } = {}) {
	let manifestPath = './__nux__.js'
	const join = (a, b) => (a.endsWith('/') || a.endsWith('\\')) ? a + b : a + '/' + b
	if (file) {
		let candidate = file
		if (!fs.existsSync(candidate)) {
			console.log(`Specified path does not exist: ${candidate}`)
			return
		}
		const stat = fs.statSync(candidate)
		if (stat.isDirectory())
			candidate = join(candidate, '__nux__.js')
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
	const nuxId = `${absoluteManifestPath}#${name}`

  // Fail fast if there is a leftover active entry for this run id
  const activeById = db.active.exists()
    ? db.active.read()
    : {}
  if (activeById[nuxId]) {
    console.log(`${style.red('Error:')} The last call to \`nux run\` did not exit gracefully. Before continuing, clean up leftover state by running:\n\nnux uninstall ${nuxId}`)
    process.exit(1)
  }

	// Apply only the effects required for this specific run script
	let scriptPath
	scriptPath = await withLogger({ verbose }, async () => await apply({ sourcePath: absoluteManifestPath, name }))
  console.log()

	// Cleanup function to uninstall effects
	const cleanup = async () => {
		console.log()
		try {
			await withLogger({ verbose }, async () => await apply({ sourcePath: absoluteManifestPath, uninstall: true, name }))
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
    // For now, we can just suppress the error to prevent crashing nux.
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
	description: 'Execute a nux script or command.',
	usage: 'nux run <command-name> [args...]',
	help: dedent`
	Run a command defined in the current directory's __nux__.js manifest.

	Arguments:
	  <command-name>  Name of the entry under export const run = {...}
	  [args...]  Arguments forwarded to the invoked script

		Options before <command-name>:
		  -v, --verbose        Show Nux install/uninstall logs for this run
		  -f, --file <path>    Use a specific manifest file or directory

	Notes:
	  - Only flags placed before <command-name> are consumed by Nux itself.
	    Everything after <command-name> (or after a standalone "--") is forwarded
	    unchanged to your script.

	Examples:
	  nux run
	  nux run hello
	  nux run --verbose build --release
	  nux run -- hello --debug
	`,
	async run(a) {
		// Parse flags before the script name; support "--" sentinel
		let verbose = false
		let file
		let i = 0
		while (i < a.length) {
			const tok = a[i]
			if (tok === '--') { i++; break }
			if (tok === '--help' || tok === '-h') {
				console.log(`Usage:\n  ${this.usage}\n\n${this.help}`)
				return
			}
			if (tok === '--verbose' || tok === '-v') { verbose = true; i++; continue }
			if (tok === '-f') {
				file = a[i + 1]
				i += 2
				continue
			}
			if (tok.startsWith('--file=')) {
				file = tok.slice('--file='.length)
				i++
				continue
			}
			if (tok === '--file') {
				file = a[i + 1]
				i += 2
				continue
			}
			if (tok.startsWith('-')) { i++; continue }
			break
		}

		const sub = a[i]
		const rest = a.slice(i + 1)

		await run(sub, rest, { verbose, file })
	}
}
