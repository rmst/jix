import * as fs from 'node:fs'
import { ACTIVE_HASHES_PATH, LOCAL_STORE_PATH, EXISTING_HASHES_PATH, LOCAL_JIX_PATH, LOCAL_BIN_PATH } from '../../jix/context.js'
import { UserError } from '../core/UserError.js'
import { makeWritable, syncShortPaths } from './util.js'

const HOSTS_PATH = `${LOCAL_JIX_PATH}/hosts.json`
const SHORT_PATH_DIR = `${LOCAL_JIX_PATH}/s`
const LOCAL_OUT_PATH = `${LOCAL_JIX_PATH}/out`
const STACK_TRACE_PATH = `${LOCAL_JIX_PATH}/stackTrace.json`

export default {
	init: () => {
		if (!fs.existsSync(LOCAL_JIX_PATH)) fs.mkdirSync(LOCAL_JIX_PATH, { recursive: true })
		if (!fs.existsSync(LOCAL_BIN_PATH)) fs.mkdirSync(LOCAL_BIN_PATH, { recursive: true })
		if (!fs.existsSync(LOCAL_STORE_PATH)) fs.mkdirSync(LOCAL_STORE_PATH, { recursive: true })
		if (!fs.existsSync(LOCAL_OUT_PATH)) fs.mkdirSync(LOCAL_OUT_PATH, { recursive: true })
		if (!fs.existsSync(SHORT_PATH_DIR)) fs.mkdirSync(SHORT_PATH_DIR, { recursive: true })

		syncShortPaths(EXISTING_HASHES_PATH, SHORT_PATH_DIR)
	},

	active: {
		exists: () => fs.existsSync(ACTIVE_HASHES_PATH),
		read: () => {
			if (!fs.existsSync(ACTIVE_HASHES_PATH)) return {}
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
			if (!fs.existsSync(EXISTING_HASHES_PATH)) return []
			try {
				return JSON.parse(fs.readFileSync(EXISTING_HASHES_PATH, 'utf8'))
			} catch (e) {
				throw new UserError(`Failed to read existing effects: ${e.message}. File may be corrupted.`)
			}
		},
		write: (arr) => {
			fs.writeFileSync(EXISTING_HASHES_PATH, JSON.stringify(arr), 'utf8')
			syncShortPaths(EXISTING_HASHES_PATH, SHORT_PATH_DIR)
		}
	},

	store: {
		exists: (hash) => fs.existsSync(`${LOCAL_STORE_PATH}/${hash}`),

		/**
		 * @param {string} hash 
		 * @returns {{install: [], uninstall: [], build: [], host: string, user: string, debug: any}}
		 */
		read: (hash) => {
			try {
				return JSON.parse(fs.readFileSync(`${LOCAL_STORE_PATH}/${hash}`, 'utf8'))
			} catch (e) {
				throw new UserError(`Failed to read effect ${hash}: ${e.message}. Store may be corrupted.`)
			}
		},
		write: (hash, data) => fs.writeFileSync(`${LOCAL_STORE_PATH}/${hash}`, data, 'utf8'),
		list: () => {
			if (!fs.existsSync(LOCAL_STORE_PATH)) return []
			return fs.readdirSync(LOCAL_STORE_PATH)
		},
		delete: (hash) => {
			fs.rmSync(`${LOCAL_STORE_PATH}/${hash}`, { force: true })
		}
	},

	out: {
		list: () => {
			if (!fs.existsSync(LOCAL_OUT_PATH)) return []
			return fs.readdirSync(LOCAL_OUT_PATH)
		},
		delete: (hash) => {
			const path = `${LOCAL_OUT_PATH}/${hash}`
			try {
				fs.rmSync(path, { recursive: true })
			} catch (e) {
				// If delete failed (likely due to permissions), make writable and retry
				makeWritable(path)
				fs.rmSync(path, { recursive: true, force: true })
				// FIXME: this isn't actually a guarantee that it will be deleted
			}
		}
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
	},

	stackTrace: {
		exists: () => fs.existsSync(STACK_TRACE_PATH),
		read: () => {
			if (!fs.existsSync(STACK_TRACE_PATH)) return {}
			try {
				return JSON.parse(fs.readFileSync(STACK_TRACE_PATH, 'utf8'))
			} catch (e) {
				throw new UserError(`Failed to read stackTrace.json: ${e.message}`)
			}
		},
		write: (obj) => fs.writeFileSync(STACK_TRACE_PATH, JSON.stringify(obj, null, 2), 'utf8')
	}
}
