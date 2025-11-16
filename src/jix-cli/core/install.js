
import process from 'node:process'

import jix from '../../jix'
import { collectEffects, effect, Effect, withTarget } from '../../jix/effect.js'
import { dedent } from '../../jix/dedent.js'

import { tryInstallEffect, tryUninstallEffect } from './installEffect.js'
import set from './set.js'
import { checkOrphanedEffects } from './util.js'

import { sh, getCurrentUser } from '../util.js'
import { warnAboutStaleManifestIds } from '../install/util.js'
import { UserError } from './UserError.js'
import { log } from '../logger.js'
import { style } from '../prettyPrint.js'
import db from '../db/index.js'

// Add QJSXPATH entries for all parent directories of a file
// For /my/custom/path/__<cli>__.js, adds /my/custom/path/.<cli>/modules:/my/custom/.<cli>/modules:/my/.<cli>/modules
import { JIX_DIR } from '../../jix/context.js'
import { Host, User } from '../../jix/targets'
function addQjsxPathForFile(filePath) {
	const modulePaths = []
	let current = filePath.substring(0, filePath.lastIndexOf('/'))

	// Collect all parent directories
	while (current && current !== '/') {
		modulePaths.push(`${current}/${JIX_DIR}/modules`)
		const lastSlash = current.lastIndexOf('/')
		current = lastSlash > 0 ? current.substring(0, lastSlash) : ''
	}

	const qjsxPath = modulePaths.join(':')
	const existingQjsxPath = process.env.QJSXPATH
	process.env.QJSXPATH = existingQjsxPath ? `${qjsxPath}:${existingQjsxPath}` : qjsxPath
}



export default async function install({
	sourcePath,
	uninstall = false,
	name = 'default',
	dryRun = false
}) {
	if (!sourcePath)
		throw new Error('install requires a sourcePath')
  db.init()

  // loadHosts()

  // Derive ID from absolute manifest path and scoped name
	// const manifestPath = sh`realpath '${sourcePath}'`.trim()
  const manifestPath = sourcePath
	const jixId = `${manifestPath}#${name}`

  // Prepare results and drvs
  let drvs = []
  let result = {}

	// Build effects (non-uninstall mode)
	if (!uninstall) {

    let host = new Host("localhost", {[getCurrentUser()]: {}})
    withTarget({host, user: host.users[getCurrentUser()]})

		globalThis.jix = jix
		addQjsxPathForFile(manifestPath)
		const module = await import(sourcePath)

		// Warn about stale manifest IDs referencing missing files
		warnAboutStaleManifestIds()

		// Determine which effects to apply based on name
		if (name.startsWith('run.')) {
			// Extract run name, ignoring the @pid suffix if present
			let runName = name.slice(4)
			const atIndex = runName.indexOf('@')
			if (atIndex !== -1) {
				runName = runName.slice(0, atIndex)
			}
			const fn = (module.run || {})[runName]
			if (!fn)
				throw new UserError(`run script not found: ${runName}`)

        drvs = (new Host("localhost", {[getCurrentUser()]: {}}))
          .users[getCurrentUser()]
          .install(() => effect(collectEffects(() => {
          
          let script

          if(typeof fn === 'string')
            script = fn
          else if(fn instanceof Effect)
            script = fn
          else if(typeof fn === 'function')
            script = fn()
          else
            throw new UserError(`export const run = { name: value }, expects value of type string, function or Effect, instead got: ${typeof fn}`)

          let effect = typeof script === 'string'
            ? jix.script`${script}`
            : script
  
          if(!effect.path) {
            throw new UserError(`export const run = { name: () => value }, value to be a jix.script, instead got: ${script}`)
          }
          
          result = effect.path

          return effect
        })))


		} else {

			let exported = module.install
			if (exported === undefined)
				throw new Error(`${sourcePath} is missing "export const install = ..."`)

			// Handle object export with named entries (similar to run)
			let fn
			if (typeof exported === 'object' && exported !== null && !Array.isArray(exported)) {
				fn = exported[name]
				if (!fn)
					throw new UserError(`install script not found: ${name}`)
			} else if (typeof exported === 'function') {
				// Direct function export (only works for "default")
				if (name !== 'default')
					throw new UserError(`install script not found: ${name} (only function export available)`)
				fn = exported
			} else {
				throw new TypeError(`Expected function or object, instead got: ${typeof exported}`)
			}

			drvs = (new Host("localhost", {[getCurrentUser()]: {}}))
				.users[getCurrentUser()]
				.install(() => effect(collectEffects(() => fn())))
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

		if (!dryRun) {
			const storedStacks = db.stackTrace.read()

			storedStacks[jixId] = Object.fromEntries(
				drvs.map(d => {
					if (!(d instanceof Effect) || typeof d.hash !== 'string' || typeof d._stack !== 'string')
						throw new Error(`Unexpected install result: ${d}`)
					return [d.hash, d._stack]
				})
			)

			db.stackTrace.write(storedStacks)
		}
	}


  // write derivations to disk
  drvs.map(d => {
    if (!db.store.exists(d.hash))
      db.store.write(d.hash, d.serialize())
  })

  let desiredForId = set(drvs.map(d => d.hash)).list()

  let activeForId = activeHashesById[jixId] ?? []
  let activeOtherThanId = set(Object.values({...activeHashesById, [jixId]: []}).flat())

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
    throw new UserError(dedent`
      ${failedUninstalls.length} out of ${hashesToUninstall.length} uninstalls failed.
      Try to uninstall them again via

      jix force-remove '
      ${failedUninstalls.join('\n')}
      '
    `)
  }

	let installedHashes = [...(function*(){
		for (const hash of hashesToInstall) {
			let e = tryInstallEffect(hash, jixId)
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
				let e = tryInstallEffect(hash, jixId)   // continue despite errors this time
				yield hash
			}
		})()]

    if (reinstalledHashes.length != hashesToUninstall.length) {

      let missingHashes = set(hashesToUninstall)
        .minus(reinstalledHashes)
        .list()

      throw new UserError(dedent`
        Partial install. Attempted to restore the previous install but only ${reinstalledHashes.length} of the removed ${hashesToUninstall.length} could be re-installed. Missing ${missingHashes.length}:
          ${missingHashes.join('\n  ')}
          
        See logs above for more details.
      `)

    } else {

      throw new UserError(`Partial install. Successfully restored previous install. See logs above for details.`)
    }


  }

  // success - desired hashes were installed
  // now we write to disk to remember to keep these hashes
  if (desiredForId.length === 0)
    delete activeHashesById[jixId]
  else
    activeHashesById[jixId] = desiredForId
  db.active.write(activeHashesById)


  return result
}
