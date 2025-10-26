import * as fs from 'node:fs'
import process from 'node:process'
import { ACTIVE_HASHES_PATH, LOCAL_HOME, MANIFEST_BASENAME } from '../../jix/context.js'
import { dedent } from '../../jix/dedent.js'
import db from '../db/index.js'


export const MANIFEST_NAME = MANIFEST_BASENAME

export function findJixRoot(path) {

  if (fs.existsSync(`${path}/${MANIFEST_NAME}`)) {
    return `${path}/${MANIFEST_NAME}`
  }

  const parentDir = path.substring(0, path.lastIndexOf('/'))
  if (parentDir === '' || parentDir === path) {
    throw new Error(`No ${MANIFEST_NAME} file found in any parent directories`)
  }

  return findJixRoot(parentDir)
}


// Print a warning about manifest IDs in active.json whose files no longer exist
export function warnAboutStaleManifestIds() {
  if (!db.active.exists()) return
  const active = db.active.read()
  const stale = Object.keys(active).filter(id => {
    const [path] = id.split('#')
    const p = path.startsWith('~/') ? (process.env.HOME || LOCAL_HOME) + path.slice(1) : path
    return !fs.existsSync(p)
  })
  if (stale.length) {
		console.log(dedent`
			🚨 Warning: The following manifests seem to have moved or been deleted:
			  ${stale.join('\n  ')}

			Consider cleaning up with:
			  ${stale.map(id => {
				const [path, name] = id.split('#')
				return `jix uninstall ${name} -f ${path}`
			}).join('\n  ')}
    ` + "\n")
  }
}
