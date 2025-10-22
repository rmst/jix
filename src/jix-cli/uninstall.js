import install from './core/install.js'
import { dedent } from '../jix/dedent.js'
import { MANIFEST_NAME } from './install/util.js'
import { sh } from './util.js'
import db from './db/index.js'

export default {
	name: 'uninstall',
	description: 'Uninstall a jix manifest by its path.',
	usage: 'jix uninstall <path>',
	help: dedent`
	Uninstall all effects currently active for a given jix manifest.

	Arguments:
	  <path>  A path inside the project containing ${MANIFEST_NAME} or the path to ${MANIFEST_NAME} itself

	Example:
	  jix uninstall ~/work/my-tools/${MANIFEST_NAME}
	`,
	async run(args) {
		const arg = args[0]
		if (!arg || args.includes('--help') || args.includes('-h')) {
			console.log(`Usage:\n  ${this.usage}\n\n${this.help}`)
			return
		}

		const active = db.active.exists()
			? db.active.read()
			: {}

		let id = arg

		if(!active[id])
			id = sh`realpath '${arg}' || true`.trim()
			
		if(!active[id])
			id = `${id}/${MANIFEST_NAME}`

		if(!active[id])
			throw new Error(`'${arg}' isn't a valid, active manifest path or id`)  // TODO: instead of throw we should print to stderr and process.exit(1), note: console.error is missing in Quickjs

		await install({ sourcePath: id, uninstall: true })
	}
}
