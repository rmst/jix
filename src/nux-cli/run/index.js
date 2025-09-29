import apply from '../core/apply.js'
import { sh } from '../util.js'
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

  // TODO: we should make apply silent (or at least remove the output once it's done somehow)
  const runScriptPaths = await apply({ sourcePath: absoluteManifestPath })

  console.log()
  
  if (!cmd) {
    console.log('Available commands:')
    Object.keys(runScriptPaths).forEach(key => {
      console.log(`- ${key}`)
    })
    return
  }

  const scriptPath = runScriptPaths[cmd]
  if (!scriptPath) {
    console.error(`Command "${cmd}" not found in the manifest's run configuration.`)
    return
  }

  try {

    execFileSync(scriptPath, args, { stdout: 'inherit', stderr: 'inherit' })

  } catch (e) {
    // The execFileSync function throws an error if the script returns a non-zero exit code.
    // This is expected behavior, so we don't need to log the error unless it's a true execution failure.
    // For now, we can just suppress the error to prevent crashing nux.
    // A more robust solution might inspect the error object.
    process.exit(e.status || 1)
  }
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
