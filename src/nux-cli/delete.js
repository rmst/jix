import apply from './core/apply.js'
import { dedent } from '../nux/dedent.js'
import { findNuxRoot } from './apply/util.js'
import { sh } from './util.js'

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
		const manifestPath = findNuxRoot(arg)
		await apply({ sourcePath: manifestPath, uninstall: true })
	}
}
