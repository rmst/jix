import { readFileSync } from 'node:fs';
import { LOCAL_NUX_PATH, ACTIVE_HASHES_PATH, EXISTING_HASHES_PATH } from '../nux/context.js';
import { exists } from './util.js';

const colors = {
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
};

const style = {
	key: (text) => `${colors.bold}${colors.cyan}${text}:${colors.reset}`,
	command: (text) => `${colors.yellow}${text}${colors.reset}`,
	path: (text) => `${colors.dim}${text}${colors.reset}`,
	title: (text) => `${colors.bold}${text}${colors.reset}`,
	success: (text) => `${colors.green}${text}${colors.reset}`,
	failure: (text) => `${colors.red}${text}${colors.reset}`,
	info: (text) => `${colors.blue}${text}${colors.reset}`,
	hash: (text) => `${colors.magenta}${text}${colors.reset}`,
};


function prettyPrintEffect(effect) {
	const indent = (str, amount = 1) => str.split('\n').map(line => `${'  '.repeat(amount)}${line}`).join('\n');

	const printKeyValue = (key, value) => {
		console.log(`${style.key(key)} ${value}`);
	};

	Object.entries(effect).forEach(([key, value]) => {
		if (key === 'install' || key === 'uninstall') {
			const [command, ...args] = value;
			console.log(style.key(key));
			console.log(indent(style.command(command)));
			args.forEach(arg => console.log(indent(arg, 2)));
		} else if (key === 'dependencies' && Array.isArray(value) && value.length > 0) {
			console.log(style.key('dependencies'));
			value.forEach(dep => console.log(indent(style.hash(dep))));
		} else if (key === 'debug' && typeof value === 'object' && value !== null) {
			console.log(style.key('debug'));
			Object.entries(value).forEach(([dKey, dValue]) => {
				if (dKey === 'stack') {
					console.log(indent(style.key('stack')));
					console.log(indent(dValue, 2));
				} else {
					console.log(indent(`${style.key(dKey)} ${dValue}`));
				}
			});
		} else if (value !== null && value !== undefined) {
			printKeyValue(key, value);
		}
	});
}

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
