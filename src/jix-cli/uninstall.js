import install from './core/install.js'
import { dedent } from '../jix/dedent.js'
import { MANIFEST_BASENAME } from '../jix/context.js'
import { parseArgs } from './parseArgs.js'
import { sh, resolveManifestPath } from './util.js'

export default {
	name: 'uninstall',
	description: 'Uninstall a jix manifest.',
	usage: 'jix uninstall [name]',
	help: dedent`
	Uninstall all effects currently active for a given jix manifest.

	Arguments:
	  [name]  Name of the install (default: 'default')

	Options:
	  -f, --file <path>     Use a specific manifest file or directory
	  --find-manifest       Search parent directories for manifest

	Examples:
	  jix uninstall
	  jix uninstall default
	  jix uninstall -f ~/work/my-tools
	  jix uninstall --find-manifest
	`,
	async run(args) {
		const { flags, positionals } = parseArgs(args, { f: 'value', file: 'value' })

		if (flags.help || flags.h) {
			console.log(`Usage:\n  ${this.usage}\n\n${this.help}`)
			return
		}

		const name = positionals[0] || 'default'
		const inputPath = flags.f || flags.file || '.'
		const findManifest = flags['find-manifest'] || false

		const path = resolveManifestPath(inputPath, findManifest)

		if (!path) {
			if (findManifest) {
				console.log(`No ${MANIFEST_BASENAME} found in ${inputPath} or any parent directories`)
			} else {
				console.log(`Manifest not found: ${inputPath}`)
			}
			return
		}

		await install({ sourcePath: path, name, uninstall: true })
	}
}
