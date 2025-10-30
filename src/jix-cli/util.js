import { execFileSync } from "node:child_process";
import { dedent } from '../jix/dedent';
import * as fs from 'node:fs';
import { MANIFEST_BASENAME } from '../jix/context.js';


export function relpath(from, to) {
	const fromParts = from.split('/').filter(Boolean);
	const toParts = to.split('/').filter(Boolean);

	while (fromParts.length && toParts.length && fromParts[0] === toParts[0]) {
		fromParts.shift();
		toParts.shift();
	}

	const up = '../'.repeat(fromParts.length);
	return up + toParts.join('/');
}


/**
 * @param  {...any} args 
 * @returns {string}
 */
export const sh = (...args) => {
	let command = dedent(...args)
	return execFileSync("/bin/sh", ["-c", command])
}

export const shVerbose = sh


export const time = () => {
	return Math.floor(Date.now() / 1000)
}



// TODO: this should be part of the JS engine
function toStr(x) {
	// Handle null and undefined
	if (x === null || x === undefined) {
			return String(x);
	}

	// Handle primitives (numbers, booleans, strings)
	if (typeof x !== 'object') {
			return String(x);
	}

	// Handle arrays
	if (Array.isArray(x)) {
			return '[' + x.map(item => toStr(item)).join(', ') + ']';
	}

	// Handle objects
	let result = [];
	for (let key in x) {
			try {
					// Attempt to stringify value, if not possible use placeholder
					const value = typeof x[key] === 'object' ? toStr(x[key]) : String(x[key]);
					result.push(`${key}: ${value}`);
			} catch (e) {
					result.push(`${key}: [${typeof x[key]}]`);
			}
	}
	return '{' + result.join(', ') + '}';
}


export const monkeyPatchObjectToString = () => {

	const oldLog = globalThis.console.log
	globalThis.console.log = (...args) => {
		return oldLog(...args.map(a => {
			if(typeof a === "object") {
				if(a.constructor.name === "Effect")
					return a.toDebugString()
			}
			return a
		}))
	}

	Object.prototype.toString = function() {
		if (this === null) return '[object Null]';
		if (typeof this !== 'object') return `[object ${typeof this}]`;
		
		const type = this.constructor && this.constructor.name ? this.constructor.name : 'Object';
		const keyValuePairs = Object.entries(this).map(([key, value]) => {
				let stringValue;
				if (typeof value === 'string') {
						stringValue = `"${value}"`;
				} else if (typeof value === 'object' && value !== null) {
						stringValue = '[object Object]'; // Avoids infinite recursion
				} else {
						stringValue = String(value);
				}
				return `${key}: ${stringValue}`;
		}).join(', ');

		return `${type} { ${keyValuePairs} }`;
	};

	Array.prototype.toString = function() {
		return `[${this.map(item => {
				if (typeof item === 'string') {
						return `"${item}"`;
				} else if (typeof item === 'object' && item !== null) {
						return '[object Object]'; // Similar treatment to avoid overly deep nesting
				} else {
						return String(item);
				}
		}).join(', ')}]`;
};

}

export function basename(path) {
	if (typeof path !== 'string' || path.length === 0) return '';
	
	// Remove trailing slashes
	while (path.endsWith('/')) {
			path = path.slice(0, -1);
	}
	
	// Find the last slash and get the substring after it
	const lastSlashIndex = path.lastIndexOf('/');
	return lastSlashIndex === -1 ? path : path.slice(lastSlashIndex + 1);
}



export function randomString256() {
	const hexCharacters = '0123456789abcdef';
	let randomString = '';

	for (let i = 0; i < 64; i++) {
			// Generate a random index for hexCharacters
			const randomIndex = Math.floor(Math.random() * 16);
			randomString += hexCharacters[randomIndex];
	}

	return randomString;
}



export function uuidV4() {
	const hexCharacters = '0123456789abcdef';
	let uuidString = '';

	for (let i = 0; i < 36; i++) {
		if (i === 8 || i === 13 || i === 18 || i === 23) {
			uuidString += '-';
		} else if (i === 14) {
			uuidString += '4'; // Version 4
		} else if (i === 19) {
			// Ensure the first two bits are `10`
			const randomIndex = Math.floor(Math.random() * 4) + 8; // 8, 9, A, B
			uuidString += hexCharacters[randomIndex];
		} else {
			const randomIndex = Math.floor(Math.random() * 16);
			uuidString += hexCharacters[randomIndex];
		}
	}

	return uuidString;
}


/**
 * Resolve manifest path from a given path or directory
 * @param {string} path - Path to file or directory (defaults to current directory)
 * @param {boolean} findManifest - If true, search parent directories for manifest
 * @returns {string|null} - Absolute path to manifest, or null if not found
 */
export function resolveManifestPath(path = '.', findManifest = false) {
	const join = (a, b) => (a.endsWith('/') || a.endsWith('\\')) ? a + b : a + '/' + b

	if (findManifest) {
		// For findManifest mode, start from the directory (not the file)
		let searchPath = path
		if (fs.existsSync(searchPath) && !fs.statSync(searchPath).isDirectory()) {
			// If it's a file, start from its parent directory
			searchPath = searchPath.substring(0, searchPath.lastIndexOf('/')) || '.'
		}

		// Search upward through parent directories
		while (true) {
			const candidate = join(searchPath, MANIFEST_BASENAME)
			if (fs.existsSync(candidate)) {
				return sh`realpath ${candidate}`.trim()
			}
			const parentDir = searchPath.substring(0, searchPath.lastIndexOf('/')) || '.'
			if (parentDir === searchPath) {
				return null
			}
			searchPath = parentDir
		}
	} else {
		// Exact path mode: if directory, look inside; if file, use it
		if (fs.existsSync(path) && fs.statSync(path).isDirectory()) {
			path = join(path, MANIFEST_BASENAME)
		}
		if (fs.existsSync(path)) {
			return sh`realpath ${path}`.trim()
		}
		return null
	}
}
