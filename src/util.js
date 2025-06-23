import * as std from 'std';
import * as os from 'os';

// TODO: move away from these functions towards the node/fs functions


export function relpath(from, to) {
	// https://chatgpt.com/c/677e8740-bb78-8013-8000-894d66c69cc8
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


export function traverseFileSystem(rootPath, ignore='') {
	// Recursive function to traverse the file system

	ignore = dedent(ignore).split('\n')

	let dirs = [];
	let files = [];

	// Inner function to handle recursion
	function traverse(currentPath) {
		let entries = dirRead(currentPath)

		entries.forEach(entry => {
				
			let fullPath = currentPath + "/" + entry
			let [stat, err] = os.stat(fullPath)  // os.stat follows symlinks (as opposed to os.lstat)
			if(err)
				throw new Error(`Unable to stat ${fullPath}`)

			let relativePath = fullPath.substring((rootPath + "/").length);

			let isDir = stat.mode & 0o040000   // directory
			let isFile = stat.mode & 0o100000  // fegular file

			if([".", "..", ".DS_Store"].includes(entry) || ignore.includes(relativePath)) {
				// console.log("ignoring", relativePath)
				// TODO: maybe support .gitignore directly?
				return
			}

			if (isDir) { 
				dirs.push(relativePath)
				// console.log(fullPath)
				traverse(fullPath)
			} else if (isFile) {  
				files.push(relativePath)
			}
		});
	}

	traverse(rootPath);
	return { dirs, files };
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


export const withCwd = (cwd, f) => {
	let oldCwd = os.getcwd()[0]
	os.chdir(cwd)
	let result = f()
	os.chdir(oldCwd)
	return result
}

export const withEnv = (env, f) => {
	let oldEnv = std.getenviron()
	setEnv(env)
	let result = f()
	setEnv(oldEnv)
	return result
}

export const getEnv = std.getenviron

export const setEnv = (env) => {
	Object.keys(std.getenviron()).map(k => std.unsetenv(k))
	Object.keys(env).map(k => std.setenv(k, env[k]))
}

// export const system = (...command) => {
//     // TODO: delete
//     // Join the command and its arguments into a single string
//     const commandWithArgs = command.join(' ');
		
//     let error = {}

//     // Open the command for reading
//     let process = std.popen(commandWithArgs, "r", error);
//     xw

//     // Read the output
//     let output = process.readAsString();

//     // Close the process
//     process.close();

//     if(error.errno != 0)
//       throw Error(`Error: ${error.errno}, Output: ${output}`)


//     return output;
// }



// TODO: this code has been moved to node/child_process.js execSync, replace this function with a call to that
export const execShFunction = ({verbose=false, env={}, cwd=null}) => (template, ...args) => {
	let cmd = dedent(template, ...args)

	// make everything fail if one command fails, TODO: is this a good default?
	// redirect stderr to stdout

	// TODO: this is a hack, we don't escape env values properly
	let envSetup = Object.entries(env).map(([k, v]) => `export ${k}="${v}"`).join("\n")
	let cwdSetup = cwd ? `cd '${cwd}'` : ""

	let wrappedCmd = dedent`
		{
			set -e
			${envSetup}
			${cwdSetup}
			${cmd}
		} 2>&1
	`

	let process = std.popen(wrappedCmd, "r")
	// let output = process.readAsString().trim()
	let output = ""

	while (true) {
		let line = process.getline()
		if (line === null) {
			break;
		}
		output = output + line + '\n'
		// Print the line, getline() does not include the trailing line feed
		if (verbose)
			console.log(line)
	}


	let code = process.close()

	if(code != 0) {
		throw Error(dedent`
			Command:
			${cmd}
			failed with error code ${code}. Output:
			${verbose ? "see above" : output}
		`)
	}

	return output
}



export const sh = execShFunction({verbose: false})
export const shVerbose = execShFunction({verbose: true})


export const time = () => {
	return Math.floor(Date.now() / 1000)
}



export const dedent = (templateStrings, ...values) => {
	// https://github.com/MartinKolarik/dedent-js/blob/master/src/index.ts
	// TODO: simplify
	// TODO: allow for properly indented multiline values

	// TODO: we have to be careful with raw because it doesn't seem to escape anything, e.g. \` will be \` and not `, I don't remember why we're even doing this...
	templateStrings = templateStrings.raw ?? templateStrings

	let matches = [];
	let strings = typeof templateStrings === 'string' ? [ templateStrings ] : templateStrings.slice();


	// TODO: maybe just do this for shell/bash?
	strings = strings.map(x => x.replaceAll(String.raw`\$`, "$"))
	strings = strings.map(x => x.replaceAll(String.raw`\``, "`"))


	// 1. Remove trailing whitespace.
	strings[strings.length - 1] = strings[strings.length - 1].replace(/\r?\n([\t ]*)$/, '');

	// 2. Find all line breaks to determine the highest common indentation level.
	for (let i = 0; i < strings.length; i++) {
		let match;

		if (match = strings[i].match(/\n[\t ]+/g)) {
			matches.push(...match);
		}
	}

	// 3. Remove the common indentation from all strings.
	if (matches.length) {
		let size = Math.min(...matches.map(value => value.length - 1));
		let pattern = new RegExp(`\n[\t ]{${size}}`, 'g');

		for (let i = 0; i < strings.length; i++) {
			strings[i] = strings[i].replace(pattern, '\n');
		}
	}

	// 4. Remove leading whitespace.
	strings[0] = strings[0].replace(/^\r?\n/, '');

	// 5. Perform interpolation.
	let string = strings[0];

	for (let i = 0; i < values.length; i++) {
		string += values[i] + strings[i + 1];
	}

	return string;
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



// TODO: this should be part of the JS engine
export const monkeyPatchConsoleLog = () => {
	// TODO: maybe patch globalThis.console ?
	console.log_old = console.log
	console.log = (...args) => {
		args = args.map(x => toStr(x))
		console.log_old(...args)
	}
	return console
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


// export const getRandomString = (len) => Array.from({ length: len }, () => 
//     'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
//     .charAt(Math.floor(Math.random() * 62))
// ).join('');



/**
	gets the path of the directory for a file path or url, works with e.g.
	```
	dirname(import.meta.url)
	```
 */
export function dirname(path) {
	const isFileURL = path.startsWith('file://');
	if (isFileURL) path = path.slice(7); // Remove 'file://' prefix
	if (path.endsWith('/')) path = path.slice(0, -1); // Handle trailing slash
	const parts = path.split('/');
	parts.pop(); // Remove the last segment (assumed to be file or empty)
	return parts.join('/') || '/';
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