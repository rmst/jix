export function shortPath(hash) {
	const shortHash = hash.slice(0, 7)
	return `~/.nux/s/${shortHash}`
}

export function toSummaryString(effectData) {
	let target = effectData.host ? `${effectData.user}@${effectData.host}` : 'localhost'
	let path = shortPath(effectData.hash)
	return `${path} ${target}\t${effectData.path || '-'}`
}
