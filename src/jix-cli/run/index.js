import install from '../core/install.js'
import { sh, resolveManifestPath } from '../util.js'
import * as fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import process from 'node:process'
import { dedent } from '../../jix/dedent.js'
import { withLogger } from '../logger.js'
import db from '../db/index.js'
import { style } from '../prettyPrint.js'
import { MANIFEST_BASENAME } from '../../jix/context.js'
import { parseArgs } from '../parseArgs.js'


async function run(cmd, args, { verbose = false, file, findManifest = false } = {}) {
	const inputPath = file || '.'
	const manifestPath = resolveManifestPath(inputPath, findManifest)

	if (!manifestPath) {
		if (findManifest) {
			console.log(`No ${MANIFEST_BASENAME} found in ${inputPath} or any parent directories`)
		} else {
			console.log(`Manifest not found: ${inputPath}`)
		}
		return
	}

  const absoluteManifestPath = manifestPath

  // Default to the "default" entry if no name is provided
  if (!cmd)
    cmd = 'default'

	const name = `run.${cmd}`
	const jixId = `${absoluteManifestPath}#${name}`

	// If there is leftover state for this run id, try a full uninstall first
	if (db.active.read()[jixId]) {
		try {
			await withLogger({ verbose }, async () => await install({ sourcePath: absoluteManifestPath, name, uninstall: true }))
		} catch (e) {
			console.log(`${style.red('Error:')} Detected leftover effects from a previous 'jix run'. Tried to auto-clean them but failed. Specifically:\n`)
			console.log(e.message)
			process.exit(1)
		}
	}

	// Apply only the effects required for this specific run script
	let scriptPath
	globalThis.__jix_service_transient = true
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
		  --find-manifest      Search parent directories for manifest

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
		const { flags, positionals, sawDoubleDash } = parseArgs(
			args,
			{ v: true, verbose: true, f: 'value', file: 'value', 'find-manifest': true },
			{ stopAtPositional: true }
		)

		if (flags.help || flags.h) {
			console.log(`Usage:\n  ${this.usage}\n\n${this.help}`)
			return
		}

		const verbose = flags.verbose || flags.v || false
		const file = flags.file || flags.f
		const findManifest = flags['find-manifest'] || false

		// If -- was used, treat all positionals as args to the default command
		const cmd = sawDoubleDash ? undefined : positionals[0]
		const rest = sawDoubleDash ? positionals : positionals.slice(1)

		await run(cmd, rest, { verbose, file, findManifest })
	}
}
