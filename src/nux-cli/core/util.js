import * as fs from 'node:fs'
import process from 'node:process'

import { ACTIVE_HASHES_PATH, LOCAL_STORE_PATH, EXISTING_HASHES_PATH } from "../../nux/context.js"
import { dedent } from '../../nux/dedent.js'
import * as util from '../util.js'
import { style } from '../prettyPrint.js'
import { toSummaryString } from '../effectUtil.js'
import set from './set.js'

export function checkOrphanedEffects() {
	let activeHashesById = util.exists(ACTIVE_HASHES_PATH)
		? JSON.parse(fs.readFileSync(ACTIVE_HASHES_PATH, 'utf8'))
		: {}

	let activeHashes = set(Object.values(activeHashesById).flat()).list()

	let existingHashes = util.exists(EXISTING_HASHES_PATH)
		? set(JSON.parse(fs.readFileSync(EXISTING_HASHES_PATH, 'utf8'))).list()
		: []

	if(activeHashes.length != existingHashes.length) {
		let orphanedHashes = set(existingHashes).minus(activeHashes).list()

		let orphanedSummaries = orphanedHashes.map(hash => {
			let effectData = JSON.parse(fs.readFileSync(`${LOCAL_STORE_PATH}/${hash}`, 'utf8'))
			return toSummaryString(effectData.path, effectData.user, effectData.host, hash)
		})

		console.log(dedent`
			${style.red('Error:')} Found ${orphanedHashes.length} orphaned effects in the store (${activeHashes.length} active, ${existingHashes.length} in store)

			${orphanedSummaries.join('\n')}

			Before continuing, please remove them via:

				nux force-remove '
				${orphanedHashes.join('\n  ')}
				'
		`)

		process.exit(1)
	}
}
