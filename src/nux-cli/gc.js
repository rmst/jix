import { dedent } from '../nux/dedent.js'
import set from './core/set.js'
import db from './db/index.js'

export default {
	name: 'gc',
	description: 'Delete unreferenced effect files from the store.',
	usage: 'nux gc [--dry-run]',
	help: dedent`
	Remove all effect files from the nux store that are not referenced in active or existing hashes.

	Options:
	  --dry-run  Show what would be deleted without actually deleting

	Example:
	  nux gc
	  nux gc --dry-run
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

		// List all files in the store directory
		const filesInStore = db.store.list()

		// Find files to delete (in store but not in referenced hashes)
		const filesToDelete = filesInStore.filter(file => !referencedHashes.has(file))

		if (filesToDelete.length === 0) {
			console.log('No unreferenced effects found.')
			return
		}

		if (dryRun) {
			console.log(`Would delete ${filesToDelete.length} unreferenced effect(s)`)
		} else {
			// Delete unreferenced files from the store
			filesToDelete.forEach(file => {
				db.store.delete(file)
			})

			console.log(`Deleted ${filesToDelete.length} unreferenced effect(s)`)
		}
	}
}
