import * as fs from 'node:fs'
import process from 'node:process'

import { ACTIVE_HASHES_PATH, LOCAL_STORE_PATH, EXISTING_HASHES_PATH } from "../../nux/context.js"
import { dedent } from '../../nux/dedent.js'
import * as util from '../util.js'
import { style } from '../prettyPrint.js'
import { toSummaryString } from '../effectUtil.js'
import set from './set.js'
import db from '../db/index.js'

export function checkOrphanedEffects() {
	let activeHashesById = db.active.read()

	let activeHashes = set(Object.values(activeHashesById).flat()).list()

	let existingHashes = set(db.existing.read()).list()

	if(activeHashes.length < existingHashes.length) {
		let orphanedHashes = set(existingHashes).minus(activeHashes).list()

		// Auto-clean orphaned effects that have no uninstall action
		const removable = orphanedHashes.filter(h => !db.store.read(h).uninstall)
		if (removable.length)
			db.existing.write(set(db.existing.read()).minus(removable).list())

		// Recompute after auto-clean
		existingHashes = set(db.existing.read()).list()
		orphanedHashes = set(existingHashes).minus(activeHashes).list()

		if (orphanedHashes.length === 0)
			return

		let orphanedSummaries = orphanedHashes.map(hash => {
			let effectData = db.store.read(hash)
			return toSummaryString({ ...effectData, hash })
		})

		console.log(dedent`
			${style.red('Error:')} Found ${orphanedHashes.length} orphaned effects in the store (${activeHashes.length} active, ${existingHashes.length} in store)

			${orphanedSummaries.join('\n')}

			Before continuing, please remove them via:

			nux force-remove '
			${orphanedHashes.join('\n')}
			'
		`)

		process.exit(1)
	}
}
