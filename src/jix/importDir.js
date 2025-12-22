import * as fs from 'node:fs'
import { build, writeFile } from './base.js'
import { shellEscape } from './util.js'

/**
	@typedef {import('./effect.js').Effect} Effect
*/

/**
	Recursively import a directory and all its contents.
	Reads all files at eval time and uses writeFile + build to recreate the directory structure.
	@param {string} origin - Path to directory to import
	@param {{filter?: (path: string, isDir: boolean) => boolean}} options - Optional configuration
	@returns {Effect}
*/
export default function importDir(origin, options = {}) {
	const { filter = () => true } = options

	const files = []
	const dirs = new Set()

	const readDirRecursive = (dirPath, relativePath = '') => {
		const entries = fs.readdirSync(dirPath)

		for (const entry of entries) {
			const fullPath = `${dirPath}/${entry}`
			const relPath = relativePath ? `${relativePath}/${entry}` : entry
			const stat = fs.statSync(fullPath)
			const isDir = stat.isDirectory()

			if (!filter(relPath, isDir)) {
				continue
			}

			if (isDir) {
				dirs.add(relPath)
				readDirRecursive(fullPath, relPath)
			} else {
				const content = fs.readFileSync(fullPath, 'utf8')
				const mode = (stat.mode & 0o111) !== 0 ? '-w+x' : '-w'
				const effect = writeFile(mode)`${content}`
				files.push({ path: relPath, effect })
			}
		}
	}

	readDirRecursive(origin)

	const mkdirCommands = Array.from(dirs)
		.map(dir => `mkdir -p ${shellEscape(`./${dir}`)}`)
		.join(' && ')

	const copyCommands = files
		.map(({ path, effect }) => {
			const source = shellEscape(`${effect}`)
			const destination = shellEscape(`./${path}`)
			return `cp ${source} ${destination}`
		})
		.join(' && ')

	const allCommands = [mkdirCommands, copyCommands]
		.filter(cmd => cmd)
		.join(' && ')

	return build`
		mkdir "$out" && cd "$out" && ${allCommands}
	`
}
