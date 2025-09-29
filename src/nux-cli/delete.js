import apply from './core/apply.js'
import { dedent } from '../nux/dedent.js'

export default {
	name: 'delete',
	description: 'Delete/uninstall a nux manifest by its ID.',
	usage: 'nux delete <nuxId>',
	help: dedent`
	Uninstall all effects currently active for a given nux manifest ID.

	Arguments:
	  <nuxId>  The manifest ID (as exported by the manifest file)

	Example:
	  nux delete my.tools
	`,
	async run(a) {
		const nuxId = a[0]
		if (!nuxId || a.includes('--help') || a.includes('-h')) {
			console.log(`Usage:\n  ${this.usage}\n\n${this.help}`)
			return
		}
		await apply({ nuxId })
	}
}
