import install from './core/install.js'
import { dedent } from '../jix/dedent.js'
import { MANIFEST_BASENAME } from '../jix/context.js'
import { parseArgs } from './parseArgs.js'

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

	Examples:
	  jix uninstall
	  jix uninstall default
	  jix uninstall -f ~/work/my-tools
	`,
	async run(args) {
		const { flags, positionals } = parseArgs(args, { f: 'value', file: 'value' })

		if (flags.help || flags.h) {
			console.log(`Usage:\n  ${this.usage}\n\n${this.help}`)
			return
		}

		const name = positionals[0] || 'default'
		let path = flags.f || flags.file

		await install({ sourcePath: path, name, uninstall: true })
	}
}
