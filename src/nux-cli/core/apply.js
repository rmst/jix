
import * as fs from 'node:fs'
import process from 'node:process'

import nux from '../../nux'
import { ACTIVE_HASHES_PATH, LOCAL_NUX_PATH, LOCAL_STORE_PATH, LOCAL_BIN_PATH, EXISTING_HASHES_PATH } from "../../nux/context.js"
import { TargetedEffect } from '../../nux/effect.js'
import { dedent } from '../../nux/dedent.js'

import { tryInstallEffect, tryUninstallEffect } from './installEffect.js'
import set from './set.js'
import { checkOrphanedEffects } from './util.js'

// import { loadHosts } from './hosts.js'
import * as util from '../util.js'
import { sh } from '../util.js'
import { warnAboutStaleManifestIds } from '../apply/util.js'
import { log } from '../logger.js'
import { style } from '../prettyPrint.js'
import db from '../db/index.js'

// Add QJSXPATH entries for all parent directories of a file
// For /my/custom/path/__nux__.js, adds /my/custom/path/.nux/modules:/my/custom/.nux/modules:/my/.nux/modules
function addQjsxPathForFile(filePath) {
	const modulePaths = []
	let current = filePath.substring(0, filePath.lastIndexOf('/'))

	// Collect all parent directories
	while (current && current !== '/') {
		modulePaths.push(`${current}/.nux/modules`)
		const lastSlash = current.lastIndexOf('/')
		current = lastSlash > 0 ? current.substring(0, lastSlash) : ''
	}

	const qjsxPath = modulePaths.join(':')
	const existingQjsxPath = process.env.QJSXPATH
	process.env.QJSXPATH = existingQjsxPath ? `${qjsxPath}:${existingQjsxPath}` : qjsxPath
}



export default async function apply({
	sourcePath,
	uninstall = false,
	name = 'default',
	dryRun = false
}) {
	if (!sourcePath)
		throw new Error('apply requires a sourcePath')
  db.init()

  // loadHosts()

  // Derive ID from absolute manifest path and scoped name
  // When uninstall=true, sourcePath can be a manifest ID directly
  const manifestPath = uninstall ? sourcePath : sh`realpath '${sourcePath}'`.trim()
  const nuxId = name === 'default' ? manifestPath : `${manifestPath}#${name}`

  // Prepare results and drvs
  let drvs = []
  let result = {}

	// Build effects (non-uninstall mode)
	if (!uninstall) {
		globalThis.nux = nux
		addQjsxPathForFile(manifestPath)
		const module = await import(sourcePath)
		// Migration helper: if a manifest still exports an explicit ID,
		// rename its key in active.json to the absolute path-based ID.
		// Safe to delete this block once explicit IDs are no longer encountered.
		if (module && module.ID) {
      let active = db.active.exists()
        ? db.active.read()
        : {}
      if (active[module.ID]) {
        active[nuxId] = active[module.ID]
        delete active[module.ID]
        db.active.write(active)
      }
    }
		// Warn about stale manifest IDs referencing missing files
		warnAboutStaleManifestIds()

		// Determine which effects to apply based on name
		if (name.startsWith('run.')) {
			const runName = name.slice(4)
				const script = (module.run || {})[runName]
				if (!script)
					throw new Error(`run script not found: ${runName}`)

				if (typeof script !== 'string' && (!script || typeof script.target !== 'function'))
					throw new Error('Run scripts must be of type string or nux.script')

				let effect = typeof script === 'string'
					? nux.script(script)
					: script

				effect = effect.target({ host: null, user: null })
				result = effect.path
				drvs = effect
		} else {
			let obj = module.default || []
			if (obj === undefined)
				throw new Error(`${sourcePath} is missing "export default ..."`)
			else if (obj instanceof Promise)
				drvs = await obj
			else if (typeof obj === 'function')
				drvs = await obj()
			else
				drvs = obj
		}

		if (!(drvs instanceof TargetedEffect)) {
			// drvs can e.g be a list of Effects
			drvs = nux.target(null, drvs)
		}
		// Flatten only when we constructed drvs from a source
		drvs = drvs.flatten()
	}



  let activeHashesById = db.active.exists()
    ? db.active.read()
    : {}

  let activeHashes = set(Object.values(activeHashesById).flat()).list()

  let existingHashes = db.existing.exists()
    ? set(db.existing.read()).list()
    : []

  if(!uninstall) {
    checkOrphanedEffects()
  }


  // write derivations to disk
  drvs.map(d => {
    if (!db.store.exists(d.hash))
      db.store.write(d.hash, d.serialize())
  })

  let desiredForId = set(drvs.map(d => d.hash)).list()

  let activeForId = activeHashesById[nuxId] ?? []
  let activeOtherThanId = set(Object.values({...activeHashesById, [nuxId]: []}).flat())

  let hashesToUninstall = set(activeForId)  // "old" effects
    .intersect(existingHashes)  // only uninstall actually existing
    .minus(desiredForId) // new effects (shouldn't be removed if they already exist)
    .minus(activeOtherThanId)  // other effects that shouldn't be removed
    .list()
    
  let hashesToInstall = set(desiredForId)  // new effects
    .minus(existingHashes)  // we shouldn't re-install anything
    .list()


  log(`Effects: ${activeForId.length} ${style.red(`-${hashesToUninstall.length}`)} ${style.green(`+${hashesToInstall.length}`)}`)

  if (dryRun) {
    return result
  }

  var failedUninstalls = hashesToUninstall
    .slice().reverse()
    .map(hash => [hash, tryUninstallEffect(hash)])
    .filter(([h, e]) => e !== null)
    .map(([h, e]) => h)


  if (failedUninstalls.length > 0) {
    console.log(dedent`
      ${style.red('Error:')} ${failedUninstalls.length} out of ${hashesToUninstall.length} uninstalls failed.
      Uninstall them manually, then delete them via

        nux force-remove '
        ${failedUninstalls.join('\n  ')}
        '
    `)

    process.exit(1)
  }

  let installedHashes = [...(function*(){
    for (const hash of hashesToInstall) {
      let e = tryInstallEffect(hash)
      if(e)
        return  // return early on error
      yield hash
    }
  })()]

  if (installedHashes.length != hashesToInstall.length) {
    console.log(dedent`
      ${style.red('Error:')} Partial install: ${installedHashes.length} out of ${hashesToInstall.length} installed

      Trying to clean up partial install...

    `)

    var failedUninstalls = installedHashes
      .slice().reverse()
      .map(hash => [hash, tryUninstallEffect(hash)])
      .filter(([h, e]) => e !== null)
      .map(([h, e]) => h)

    if (failedUninstalls.length != 0) {
      console.log(dedent`
        ${style.red('Error:')} Leftover installed hashes ${failedUninstalls}/${installedHashes.length}:
          ${failedUninstalls.join('\n  ')}

      `)
    }

    console.log(`Trying to restore old install...\n`)

    let reinstalledHashes = [...(function*(){
      for (const hash of hashesToUninstall) {
        let e = tryInstallEffect(hash)   // continue despite errors this time
        yield hash
      }
    })()]

    if (reinstalledHashes.length != hashesToUninstall.length) {

      let missingHashes = set(hashesToUninstall)
        .minus(reinstalledHashes)
        .list()

      console.log(dedent`
        ${style.red('Error:')} Partial re-install: ${reinstalledHashes.length} of the removed ${hashesToUninstall.length} re-installed. Missing ${missingHashes.length}:
          ${missingHashes.join('\n  ')}
      `)   

    } else {

      console.log(`Successfully restored previous install`)
    }

    process.exit(1)  // exit with error

  }

  // success - desired hashes were installed
  // now we write to disk to remember to keep these hashes
  if (desiredForId.length === 0)
    delete activeHashesById[nuxId]
  else
    activeHashesById[nuxId] = desiredForId
  db.active.write(activeHashesById)


  return result
}
