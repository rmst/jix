import { readFileSync } from 'node:fs';
import { LOCAL_NUX_PATH, ACTIVE_HASHES_PATH, EXISTING_HASHES_PATH } from '../nux/context.js';
import { exists } from './util.js';
import { style, prettyPrintEffect } from './prettyPrint.js';

export function showEffect(effectHash) {
	const path = `${LOCAL_NUX_PATH}/store/${effectHash}`;

	console.log(`${style.title('Inspecting effect:')} ${style.path(path)}\n`);

	const effectData = JSON.parse(readFileSync(path, 'utf8'));
	prettyPrintEffect(effectData);

	const activeHashesById = exists(ACTIVE_HASHES_PATH)
		? JSON.parse(readFileSync(ACTIVE_HASHES_PATH, 'utf8'))
		: {};

	const existingHashes = exists(EXISTING_HASHES_PATH)
		? JSON.parse(readFileSync(EXISTING_HASHES_PATH, 'utf8'))
		: [];

	const wantedBy = Object.entries(activeHashesById)
		.filter(([id, hashes]) => hashes.includes(effectHash))
		.map(([id, hashes]) => style.info(id));

	const isInstalled = existingHashes.includes(effectHash);

	console.log(`\n${style.title('--- Status ---')}`);
	console.log(`${style.key('Installed')} ${isInstalled ? style.success('Yes') : style.failure('No')}`);
	
	if (wantedBy.length > 0) {
		console.log(`${style.key('Wanted by')} ${wantedBy.join(', ')}`);
	} else {
		console.log(`${style.key('Wanted by')} No one`);
	}
}
