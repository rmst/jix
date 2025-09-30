import apply from '../core/apply.js'
import { sh } from '../util.js'
import nux from '../../nux'
import * as util from '../util.js'
import { ACTIVE_HASHES_PATH } from '../../nux/context.js'
import * as fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import process from 'node:process'
import * as os from 'os'
import { dedent } from '../../nux/dedent.js'


async function run(cmd, args) {
  const manifestPath = './__nux__.js'

  if (!fs.existsSync(manifestPath)) {
    console.log(`No __nux__.js manifest found in the current directory.`)
    return
  }

  // The dynamic import in 'apply' needs an absolute path.
  const absoluteManifestPath = sh`realpath ${manifestPath}`.trim() // TODO: obvious get rid of this

  // For listing, just read the manifest without applying anything
  if (!cmd) {
    // Manifests may expect globalThis.nux
    globalThis.nux = nux
    const module = await import(absoluteManifestPath)
    const names = Object.keys(module.run || {})
    console.log('Available commands:')
    names.forEach(key => console.log(`- ${key}`))
    return
  }

	const name = `run.${cmd}`
	const nuxId = `${absoluteManifestPath}#${name}`

  // Fail fast if there is a leftover active entry for this run id
  const activeById = util.exists(ACTIVE_HASHES_PATH)
    ? JSON.parse(fs.readFileSync(ACTIVE_HASHES_PATH, 'utf8'))
    : {}
  if (activeById[nuxId]) {
    console.error(`Refusing to run: active.json already contains id ${nuxId}. Clean up leftover state first (it should be cleared after each run).`)
    process.exit(1)
  }

  // Apply only the effects required for this specific run script
  let scriptPath
  try {
    scriptPath = await apply({ sourcePath: absoluteManifestPath, name })
  } catch (e) {
    console.error(e.message || String(e))
    return
  }
  console.log()

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
    console.log()
    // Always uninstall effects installed for this run
    try {
      await apply({ sourcePath: absoluteManifestPath, uninstall: true, name })
    } catch (_) {
      // Best effort cleanup; errors here should not mask the original exit code
    }
  }

  if (exitCode !== 0)
    process.exit(exitCode)
}

export default {
	name: 'run',
	description: 'Execute a nux script or command.',
	usage: 'nux run <script> [args...]',
	help: dedent`
	Run a script defined in the current directory's __nux__.js manifest.

	Arguments:
	  <script>   Name of the script under export const run = {...}
	  [args...]  Arguments forwarded to the invoked script

	Examples:
	  nux run hello
	  nux run build --release
	`,
	async run(a) {
		if (a.includes('--help') || a.includes('-h')) {
			console.log(`Usage:\n  ${this.usage}\n\n${this.help}`)
			return
		}
		const sub = a[0]
		const rest = a.slice(1)
		await run(sub, rest)
	}
}
