import install from './core/install.js'
import { dedent } from '../jix/dedent.js'
import { MANIFEST_BASENAME } from '../jix/context.js'
import { parseArgs } from './parseArgs.js'
import { sh } from './util.js'
import db from './db/index.js'

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
		const inputPath = flags.f || flags.file || '.'
		const path = sh`realpath -m ${inputPath}`.trim()

		// Check active.json to determine if path is a directory containing __jix__.js
		db.init()
		const activeHashesById = db.active.read()
		const sourcePath = `${path}/${MANIFEST_BASENAME}#${name}` in activeHashesById
			? `${path}/${MANIFEST_BASENAME}`
			: path

		await install({ sourcePath, name, uninstall: true })
	}
}
