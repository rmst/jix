

import * as fs from "node:fs"
import * as os from 'os';
import { dedent } from './dedent';

export function traverseFileSystem(rootPath, ignore = '') {
	// Recursive function to traverse the file system
	ignore = dedent(ignore).split('\n');

	let dirs = [];
	let files = [];

	// Inner function to handle recursion
	function traverse(currentPath) {
		let entries = fs.readdirSync(currentPath);

		entries.forEach(entry => {

			let fullPath = currentPath + "/" + entry;

			// TODO: replace os.stat with fs.statSync from node:fs
			let [stat, err] = os.stat(fullPath); // os.stat follows symlinks (as opposed to os.lstat)
			if (err)
				throw new Error(`Unable to stat ${fullPath}`);

			let relativePath = fullPath.substring((rootPath + "/").length);

			let isDir = stat.mode & 0o040000; // directory
			let isFile = stat.mode & 0o100000; // fegular file

			if ([".", "..", ".DS_Store"].includes(entry) || ignore.includes(relativePath)) {
				// console.log("ignoring", relativePath)
				// TODO: maybe support .gitignore directly?
				return;
			}

			if (isDir) {
				dirs.push(relativePath);
				// console.log(fullPath)
				traverse(fullPath);
			} else if (isFile) {
				files.push(relativePath);
			}
		});
	}

	traverse(rootPath);
	return { dirs, files };
}
