import * as fs from 'node:fs'
import apply from './core/apply.js'
import { dedent } from '../nux/dedent.js'
import { MANIFEST_NAME } from './apply/util.js'
import { sh } from './util.js'
import { ACTIVE_HASHES_PATH } from '../nux/context.js'
import * as util from './util.js'
import db from './db/index.js'

export default {
	name: 'delete',
	description: 'Delete/uninstall a nux manifest by its path.',
	usage: 'nux delete <path>',
	help: dedent`
	Uninstall all effects currently active for a given nux manifest.

	Arguments:
	  <path>  A path inside the project containing __nux__.js or the path to __nux__.js itself

	Example:
	  nux delete ~/work/my-tools/__nux__.js
	`,
	async run(a) {
		const arg = a[0]
		if (!arg || a.includes('--help') || a.includes('-h')) {
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
			throw (`'${arg}' isn't a valid, active manifest path or id`)  // TODO: instead of throw we should print to stderr and process.exit(1), note: console.error is missing in Quickjs

		await apply({ sourcePath: id, uninstall: true })
	}
}
