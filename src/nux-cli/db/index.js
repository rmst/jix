import * as fs from 'node:fs'
import { ACTIVE_HASHES_PATH, LOCAL_STORE_PATH, EXISTING_HASHES_PATH, LOCAL_NUX_PATH, LOCAL_BIN_PATH } from '../../nux/context.js'
import { UserError } from '../core/UserError.js'
import { sh } from '../util.js'
import set from '../core/set.js'

const HOSTS_PATH = `${LOCAL_NUX_PATH}/hosts.json`
const SHORT_PATH_DIR = `${LOCAL_NUX_PATH}/s`

function syncShortPaths() {
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
		sh`rm ${SHORT_PATH_DIR}/${link}`
	)

	// Create symlinks for new hashes
	existingHashes
		.filter(hash => !currentLinks.has(hash.slice(0, 7)))
		.map(hash => sh`ln -s ../store/${hash} ${SHORT_PATH_DIR}/${hash.slice(0, 7)}`)
}

export default {
	init: () => {
		if (!fs.existsSync(LOCAL_NUX_PATH)) fs.mkdirSync(LOCAL_NUX_PATH, { recursive: true })
		if (!fs.existsSync(LOCAL_BIN_PATH)) fs.mkdirSync(LOCAL_BIN_PATH, { recursive: true })
		if (!fs.existsSync(LOCAL_STORE_PATH)) fs.mkdirSync(LOCAL_STORE_PATH, { recursive: true })
		if (!fs.existsSync(SHORT_PATH_DIR)) fs.mkdirSync(SHORT_PATH_DIR, { recursive: true })
		if (!fs.existsSync(`${LOCAL_NUX_PATH}/logs`)) fs.mkdirSync(`${LOCAL_NUX_PATH}/logs`, { recursive: true })  // TODO: get rid of this safely

		syncShortPaths()
	},

	active: {
		exists: () => fs.existsSync(ACTIVE_HASHES_PATH),
		read: () => {
			try {
				return JSON.parse(fs.readFileSync(ACTIVE_HASHES_PATH, 'utf8'))
			} catch (e) {
				throw new UserError(`Failed to read active manifests: ${e.message}. File may be corrupted.`)
			}
		},
		write: (obj) => fs.writeFileSync(ACTIVE_HASHES_PATH, JSON.stringify(obj), 'utf8')
	},

	existing: {
		exists: () => fs.existsSync(EXISTING_HASHES_PATH),
		read: () => {
			try {
				return JSON.parse(fs.readFileSync(EXISTING_HASHES_PATH, 'utf8'))
			} catch (e) {
				throw new UserError(`Failed to read existing effects: ${e.message}. File may be corrupted.`)
			}
		},
		write: (arr) => {
			fs.writeFileSync(EXISTING_HASHES_PATH, JSON.stringify(arr), 'utf8')
			syncShortPaths()
		}
	},

	store: {
		exists: (hash) => fs.existsSync(`${LOCAL_STORE_PATH}/${hash}`),
		read: (hash) => {
			try {
				return JSON.parse(fs.readFileSync(`${LOCAL_STORE_PATH}/${hash}`, 'utf8'))
			} catch (e) {
				throw new UserError(`Failed to read effect ${hash}: ${e.message}. Store may be corrupted.`)
			}
		},
		write: (hash, data) => fs.writeFileSync(`${LOCAL_STORE_PATH}/${hash}`, data, 'utf8')
	},

	hosts: {
		exists: () => fs.existsSync(HOSTS_PATH),
		read: () => {
			try {
				return JSON.parse(fs.readFileSync(HOSTS_PATH, 'utf8'))
			} catch (e) {
				throw new UserError(`Failed to read hosts config: ${e.message}. File may be corrupted.`)
			}
		},
		write: (obj) => fs.writeFileSync(HOSTS_PATH, JSON.stringify(obj, null, 2), 'utf8')
	}
}
