import * as fs from 'node:fs'
import process from 'node:process'
import { ACTIVE_HASHES_PATH, LOCAL_HOME } from '../../nux/context.js'
import { dedent } from '../../nux/dedent.js'


export const MANIFEST_NAME = "__nux__.js"

export function findNuxRoot(path) {

  if (fs.existsSync(`${path}/${MANIFEST_NAME}`)) {
    return `${path}/${MANIFEST_NAME}`
  }

  const parentDir = path.substring(0, path.lastIndexOf('/'))
  if (parentDir === '' || parentDir === path) {
    throw new Error(`No ${MANIFEST_NAME} file found in any parent directories`)
  }

  return findNuxRoot(parentDir)
}

// Print a warning about manifest IDs in active.json whose files no longer exist
export function warnAboutStaleManifestIds() {
  if (!fs.existsSync(ACTIVE_HASHES_PATH)) return
  const active = JSON.parse(fs.readFileSync(ACTIVE_HASHES_PATH, 'utf8'))
  const stale = Object.keys(active).filter(id => {
    if (id.includes('#')) return false
    const p = id.startsWith('~/') ? (process.env.HOME || LOCAL_HOME) + id.slice(1) : id
    return !fs.existsSync(p)
  })
  if (stale.length) {
    console.log(dedent`
			🚨 Warning: The following manifests seem to have moved or been deleted:
			  ${stale.join('\n  ')}

			Consider cleaning up with:
			  ${stale.map(id => `nux delete ${id}`).join('\n  ')}
    ` + "\n")
  }
}
