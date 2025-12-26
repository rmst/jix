import db from '../db/index.js'
import set from '../core/set.js'
import { hostInfoWithUser, resolveEffectTarget } from '../core/hosts.js'
import { executeCmd } from '../core/installEffect.js'
import { getCurrentUser } from '../util.js'
import { userServicesDir, systemServicesDir } from './index.js'
import { shellEscape } from '../../jix/util.js'

const LOCAL_ADDRESSES = new Set(['localhost', '127.0.0.1', '::1'])
const REMOTE_SERVICE_TIMEOUT_MS = 2000

export class ServiceAccessError extends Error {
	constructor(message = 'Unable to reach service host', cause) {
		super(message)
		this.name = 'ServiceAccessError'
		this.cause = cause
	}
}

const buildServiceDescriptor = (jixId, hash, effectData, { includeAllLocalUsers = false } = {}) => {
	if (!effectData.info || effectData.info.type !== 'jix.service')
		return null

	let target
	try {
		target = resolveEffectTarget(effectData.host, effectData.user)
	} catch {
		return null
	}

	let hostInfo
	try {
		hostInfo = hostInfoWithUser({ address: target.address }, target.user)
	} catch {
		return null
	}

	const userInfo = hostInfo?.users?.[target.user]
	if (!userInfo?.home)
		return null

	const isLocal = LOCAL_ADDRESSES.has(target.address)
	const otherLocalUser = isLocal && target.user !== getCurrentUser()
	if (otherLocalUser && !includeAllLocalUsers)
		return null

	return {
		jixId,
		hash,
		name: effectData.info.name,
		system: effectData.info.system || false,
		effectData,
		address: target.address,
		user: target.user,
		home: userInfo.home,
		isLocal,
		accessible: !otherLocalUser,
	}
}

const runOnServiceHost = (service, script) => executeCmd({
	cmd: '/bin/sh',
	args: ['-c', script],
	timeoutMs: LOCAL_ADDRESSES.has(service.address) ? undefined : REMOTE_SERVICE_TIMEOUT_MS,
}, service.address, service.user)

const runServiceScript = (service, script) => runOnServiceHost(service, script)

const isMissingFileError = (error) => {
	if (!error)
		return false
	return error.status === 1 || error.code === 1 || error.status === 2 || error.code === 2
}

export const getServicePaths = (service) => {
	const baseDir = service.system
		? systemServicesDir(service.home)
		: userServicesDir(service.home)
	const serviceDir = `${baseDir}/${service.name}`

	return {
		baseDir,
		serviceDir,
		detailsPath: `${serviceDir}/details`,
		logPath: `${serviceDir}/log`,
		statusPath: `${serviceDir}/status`,
	}
}

export const readServiceFile = (service, path) => {
	const quotedPath = shellEscape(path)
	const script = `[ -f ${quotedPath} ] && cat ${quotedPath}`
	try {
		const result = runServiceScript(service, script)
		return result?.toString() ?? ''
	} catch (error) {
		if (isMissingFileError(error))
			return null
		throw new ServiceAccessError(undefined, error)
	}
}

export const readServiceFileTail = (service, path, lines = 10) => {
	const count = Number.isFinite(lines) && lines > 0 ? Math.floor(lines) : 10
	const quotedPath = shellEscape(path)
	const script = `if [ ! -f ${quotedPath} ]; then exit 1; fi; tail -n ${count} ${quotedPath}`
	try {
		const result = runServiceScript(service, script)
		return result?.toString() ?? ''
	} catch (error) {
		if (isMissingFileError(error))
			return null
		throw new ServiceAccessError(undefined, error)
	}
}

export function findServiceByName(serviceName, currentDir) {
	if (db.active.exists() === false) {
		return null
	}

	const activeHashesById = db.active.read()

	// Search for the service
	for (const [jixId, hashes] of Object.entries(activeHashesById)) {
		const [jixIdPath] = jixId.split('#')
		if (!jixIdPath.startsWith(currentDir)) continue

		for (const hash of set(hashes).list()) {
			try {
				const effectData = db.store.read(hash)
				const descriptor = buildServiceDescriptor(jixId, hash, effectData)
				if (!descriptor) {
					continue
				}

				if (descriptor.name === serviceName) {
					return descriptor
				}
			} catch {
				continue
			}
		}
	}

	return null
}

export function isProcessAlive(service, pid) {
	if (!pid) return false
	const cleanPid = String(pid).trim()
	if (!cleanPid || !/^\d+$/.test(cleanPid)) return false
	try {
		runOnServiceHost(service, `kill -0 ${cleanPid}`)
		return true
	} catch (error) {
		if (isMissingFileError(error))
			return false
		throw new ServiceAccessError(undefined, error)
	}
}

export function getServiceFiles(currentDir) {
	if (db.active.exists() === false) {
		return []
	}

	const activeHashesById = db.active.read()
	const serviceEffects = []

	// Get service effects from active jix IDs
	serviceEffects.push(
		...Object.entries(activeHashesById).flatMap(([jixId, hashes]) => {
			const [jixIdPath] = jixId.split('#')
			if (!jixIdPath.startsWith(currentDir)) return []

		return set(hashes).list().flatMap(hash => {
				try {
					const effectData = db.store.read(hash)
					const descriptor = buildServiceDescriptor(jixId, hash, effectData, { includeAllLocalUsers: true })
						return descriptor ? [descriptor] : []
					} catch {
						return []
					}
				})
			})
		)

	return serviceEffects
}

export function formatDuration(seconds) {
	if (seconds < 60) return `${seconds}s`
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
	if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
	return `${Math.floor(seconds / 86400)}d`
}
