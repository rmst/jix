import { LOCAL_STORE_PATH } from '../nux/context.js'
import { sh } from './util.js'

export function makeShortPath(hash) {
	const shortHash = hash.slice(0, 7)
	const shortPath = `~/.nux/s/${shortHash}`

	// Create symlink if it doesn't exist
	sh`mkdir -p ~/.nux/s && [ ! -e ~/.nux/s/${shortHash} ] && ln -s ${LOCAL_STORE_PATH}/${hash} ~/.nux/s/${shortHash} || true`

	return shortPath
}

export function toSummaryString(path, user, host, hash) {
	let target = host ? `${user}@${host}` : 'localhost'
	let shortPath = makeShortPath(hash)
	return `${shortPath} ${target}\t${path || '-'}`
}
