import { readFileSync } from 'node:fs'
import { LOCAL_JIX_PATH, ACTIVE_HASHES_PATH, EXISTING_HASHES_PATH, JIX_DIR } from '../jix/context.js'
import { style, prettyPrintEffect } from './prettyPrint.js'
import { dedent } from '../jix/dedent.js'
import db from './db/index.js'
import { sh } from './util.js'
import { shellEscape } from '../jix/util.js'

/**
 * @param {string} effectHash 
 */
export function showEffect(effectHash) {
	const path = effectHash.includes("/")
		? effectHash
		: effectHash.length < 14
		? `${LOCAL_JIX_PATH}/s/${effectHash}`
		: `${LOCAL_JIX_PATH}/store/${effectHash}`

	console.log(`${style.title('Inspecting effect:')} ${style.path(path)}\n`)

	effectHash = sh`basename "$(realpath ${shellEscape(path)})"`
	
	const effectData = db.store.read(effectHash)
	prettyPrintEffect(effectData)

	const activeHashesById = db.active.exists()
		? db.active.read()
		: {}

	const existingHashes = db.existing.exists()
		? db.existing.read()
		: []

	const wantedBy = Object.entries(activeHashesById)
		.filter(([id, hashes]) => hashes.includes(effectHash))
		.map(([id, hashes]) => style.info(id))

	const isInstalled = existingHashes.includes(effectHash)

	console.log(`\n${style.title('--- Status ---')}`)
	console.log(`${style.key('Installed')} ${isInstalled ? style.success('Yes') : style.failure('No')}`)
	
	if (wantedBy.length > 0) {
		console.log(`${style.key('Wanted by')} ${wantedBy.join(', ')}`)
	} else {
		console.log(`${style.key('Wanted by')} No one`)
	}
}

export default {
	name: 'show',
	description: 'Display information about a jix effect.',
	usage: 'jix show <effectId>',
	help: dedent`
	Show metadata about an effect by hash.

	Arguments:
	  <effectId>  Hash of effect file under ~/${JIX_DIR}/store/<hash>

	Example:
	  jix show 3f8c...
	` ,
	run(a) {
		const id = a[0]
		if (!id || a.includes('--help') || a.includes('-h')) {
			console.log(`Usage:\n  ${this.usage}\n\n${this.help}`)
			return
		}
		showEffect(id)
	}
}
