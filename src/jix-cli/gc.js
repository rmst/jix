import { dedent } from '../jix/dedent.js'
import set from './core/set.js'
import db from './db/index.js'
import { NUX_DIR } from '../jix/context.js'

export default {
	name: 'gc',
	description: 'Delete unreferenced build outputs and effect files.',
	usage: 'jix gc [--dry-run]',
	help: dedent`
	Remove all unreferenced build outputs (~/${NUX_DIR}/out) and effect files (~/${NUX_DIR}/store) that are not referenced in active or existing hashes.

	Options:
	  --dry-run  Show what would be deleted without actually deleting

	Example:
	  jix gc
	  jix gc --dry-run
	`,
	run(a) {
		if (a.includes('--help') || a.includes('-h')) {
			console.log(`Usage:\n  ${this.usage}\n\n${this.help}`)
			return
		}

		const dryRun = a.includes('--dry-run')

		// Get all active hashes from all manifests
		const activeHashesById = db.active.exists()
			? db.active.read()
			: {}

		const activeHashes = set(Object.values(activeHashesById).flat())

		// Get all existing hashes
		const existingHashes = db.existing.exists()
			? set(db.existing.read())
			: set([])

		// Union of active and existing hashes
		const referencedHashes = activeHashes.plus(existingHashes)

		// List entries in store and out directories
		const storeEntries = db.store.list()
		const outEntries = db.out.list()

		// Compute unreferenced entries
		const storeToDelete = storeEntries.filter(x => !referencedHashes.has(x))
		const outToDelete = outEntries.filter(x => !referencedHashes.has(x))

		if (storeToDelete.length === 0 && outToDelete.length === 0) {
			console.log('No unreferenced effects found.')
			return
		}

		if (dryRun) {
			console.log(`Would delete ${storeToDelete.length} store item(s) and ${outToDelete.length} out item(s)`) 
		} else {
			storeToDelete.forEach(x => db.store.delete(x))
			outToDelete.forEach(x => db.out.delete(x))
			console.log(`Deleted ${storeToDelete.length} store item(s) and ${outToDelete.length} out item(s)`) 
		}
	}
}
