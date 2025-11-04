import { execFileSync } from 'node:child_process'
import * as fs from 'node:fs'
import set from '../core/set.js'

export const isMacOS = () => {
	try {
		return execFileSync('uname', []).toString().trim() === 'Darwin'
	} catch {
		return false
	}
}

export function makeWritable(path) {
	try {
		// TODO: implement and use quickjs-x fs.chmod instead
		execFileSync('chmod', ['-R', '+w', path])
	} catch {}

	if (isMacOS()) {
		// On macOS, also remove immutable/readonly flags
		try {
			execFileSync('chflags', ['-R', 'nouchg', path])
		} catch {}
	}
}

export function syncShortPaths(EXISTING_HASHES_PATH, SHORT_PATH_DIR) {
	const existingHashes = fs.existsSync(EXISTING_HASHES_PATH)
		? JSON.parse(fs.readFileSync(EXISTING_HASHES_PATH, 'utf8'))
		: []

	if (!fs.existsSync(SHORT_PATH_DIR)) {
		fs.mkdirSync(SHORT_PATH_DIR, { recursive: true })
	}

	const existingShortHashes = set(existingHashes.map(hash => hash.slice(0, 7)))
	const currentLinks = set(fs.readdirSync(SHORT_PATH_DIR))

	// Remove symlinks that are no longer needed
	currentLinks.minus(existingShortHashes).list().map(link =>
		fs.unlinkSync(`${SHORT_PATH_DIR}/${link}`)
	)

	// Create symlinks for new hashes
	existingHashes
		.filter(hash => !currentLinks.has(hash.slice(0, 7)))
		.map(hash => fs.symlinkSync(`../store/${hash}`, `${SHORT_PATH_DIR}/${hash.slice(0, 7)}`))
}
