import { execFileSync } from "node:child_process";

import * as std from 'std';
import * as os from 'os';
import { dedent } from '../nux/dedent';

// TODO: move away from these functions towards the node/fs functions


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


// Function to write content to a file
export const fileWrite = (path, content) => {
	const file = std.open(path, 'w');
	if (!file) {
		throw new Error(`Unable to open file for writing, ${path}`);
	}
	try {
		file.puts(content); // Write the content to the file
	} finally {
		file.close(); // Always close the file handle
	}
}

// export const fileWriteWithPermissions = (path, content, permissions) => {
//   fileDelete(path, true)
//   fileWrite(path, content)
//   sh`chmod ${permissions} ${path}`
// }

// Function to read content from a file
// TODO: delete this, it's unused
export const fileRead = (path) => {
	const file = std.open(path, 'r');
	if (!file) {
		throw new Error(`Unable to open file for reading, ${path}`);
	}
	try {
		return file.readAsString(); // Read the content as a string
	} finally {
		file.close(); // Always close the file handle
	}
}

export const dirRead = (path) => {
	// TODO: is this the correct way to handle errors?
	let [files, err] = os.readdir(path)
	if(err)
		throw new Error(`Unable to read dir ${path}`)

	return files
}


export const fileDelete = (path, ignoreNonexisting=false) => {
	if(ignoreNonexisting && !exists(path))
		return

	if(os.remove(path) != 0)
		throw new Error(`Unable to delete file: ${path}`);
}

export const exists = (path) => {
	return os.lstat(path)[0] != null
}


export const mkdir = (path, ignoreExists=false) => {
	if (!ignoreExists || !exists(path)) {
		os.mkdir(path);
	}
}


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
