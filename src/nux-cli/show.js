import { readFileSync } from 'node:fs'
import { LOCAL_NUX_PATH, ACTIVE_HASHES_PATH, EXISTING_HASHES_PATH } from '../nux/context.js'
import { exists } from './util.js'
import { style, prettyPrintEffect } from './prettyPrint.js'
import { dedent } from '../nux/dedent.js'

export function showEffect(effectHash) {
	const path = `${LOCAL_NUX_PATH}/store/${effectHash}`;

	console.log(`${style.title('Inspecting effect:')} ${style.path(path)}\n`)

	const effectData = JSON.parse(readFileSync(path, 'utf8'))
	prettyPrintEffect(effectData)

	const activeHashesById = exists(ACTIVE_HASHES_PATH)
		? JSON.parse(readFileSync(ACTIVE_HASHES_PATH, 'utf8'))
		: {}

	const existingHashes = exists(EXISTING_HASHES_PATH)
		? JSON.parse(readFileSync(EXISTING_HASHES_PATH, 'utf8'))
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
	description: 'Display information about a nux effect.',
	usage: 'nux show <effectId>',
	help: dedent`
	Show metadata about an effect by hash.

	Arguments:
	  <effectId>  Hash of effect file under ~/.nux/store/<hash>

	Example:
	  nux show 3f8c...
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
