import * as fs from 'node:fs'
import { ACTIVE_HASHES_PATH, LOCAL_STORE_PATH, EXISTING_HASHES_PATH, LOCAL_NUX_PATH, LOCAL_BIN_PATH } from '../../nux/context.js'
import { UserError } from '../core/UserError.js'

const HOSTS_PATH = `${LOCAL_NUX_PATH}/hosts.json`

export default {
	init: () => {
		if (!fs.existsSync(LOCAL_NUX_PATH)) fs.mkdirSync(LOCAL_NUX_PATH, { recursive: true })
		if (!fs.existsSync(LOCAL_BIN_PATH)) fs.mkdirSync(LOCAL_BIN_PATH, { recursive: true })
		if (!fs.existsSync(LOCAL_STORE_PATH)) fs.mkdirSync(LOCAL_STORE_PATH, { recursive: true })
		if (!fs.existsSync(`${LOCAL_NUX_PATH}/logs`)) fs.mkdirSync(`${LOCAL_NUX_PATH}/logs`, { recursive: true })  // TODO: get rid of this safely
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
		write: (arr) => fs.writeFileSync(EXISTING_HASHES_PATH, JSON.stringify(arr), 'utf8')
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
