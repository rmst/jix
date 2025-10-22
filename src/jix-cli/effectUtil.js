
import { JIX_DIR } from '../jix/context.js'

export function shortPath(hash) {
	const shortHash = hash.slice(0, 7)
	return `~/${JIX_DIR}/s/${shortHash}`
}

/**
 * @param {Object} effectData
 * @returns {string}
 */
export function toSummaryString(effectData) {
	const target = `${effectData.user}@${effectData.host}`

	let path = shortPath(effectData.hash)
	return `${path} ${target}\t${effectData.path || '-'}`
}
