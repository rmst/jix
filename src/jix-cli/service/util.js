import db from '../db/index.js'
import set from '../core/set.js'
import { hostInfoWithUser } from '../core/hosts.js'
import { getCurrentUser, sh } from '../util.js'
import { userServicesDir, systemServicesDir } from './index.js'
import process from 'node:process'

export function findServiceByName(serviceName, currentDir) {
	const targetInfo = hostInfoWithUser({ address: 'localhost' }, getCurrentUser())
	const targetMachineId = targetInfo.machineId
	const currentUser = getCurrentUser()

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
				if (effectData.host !== targetMachineId || effectData.user !== currentUser) continue

				if (effectData.info && effectData.info.type === 'jix.service' && effectData.info.name === serviceName) {
					return {
						jixId,
						hash,
						name: effectData.info.name,
						system: effectData.info.system || false,
						effectData
					}
				}
			} catch {
				continue
			}
		}
	}

	return null
}

export function getServicePaths(serviceName, isSystem, home) {
	const servicesBaseDir = isSystem ? systemServicesDir(home) : userServicesDir(home)
	const serviceDir = `${servicesBaseDir}/${serviceName}`

	return {
		serviceDir,
		detailsPath: `${serviceDir}/details`,
		logPath: `${serviceDir}/log`,
		statusPath: `${serviceDir}/status`
	}
}

export function isProcessAlive(pid) {
	if (!pid) return false
	const cleanPid = String(pid).trim()
	if (!cleanPid || !/^\d+$/.test(cleanPid)) return false
	try {
		sh(`kill -0 ${cleanPid}`)
		return true
	} catch {
		return false
	}
}

export function getServiceFiles(currentDir) {
	const targetInfo = hostInfoWithUser({ address: 'localhost' }, getCurrentUser())
	const targetMachineId = targetInfo.machineId
	const currentUser = getCurrentUser()

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
					if (effectData.host !== targetMachineId || effectData.user !== currentUser) return []

					if (effectData.info && effectData.info.type === 'jix.service') {
						return [{
							jixId,
							hash,
							name: effectData.info.name,
							system: effectData.info.system || false,
							effectData
						}]
					}
					return []
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
