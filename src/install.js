


import * as std from 'std';
import * as os from 'os';

import * as util from './util.js'
import * as drv from './drv.js'
import { dedent, sh, shVerbose } from './util.js'
import { BIN_PATH, TMP_PATH, NUX_PATH, STORE_PATH } from "./const.js";
import * as nux from './nux.js'
import { sha256 } from './sha256.js';

import * as lib from './lib.js'



const loadActions = async (path, name) => {
  // globalThis.nux = nux

  let module = await import(path)
  return module[name]
}


const setDifference = (a, b) => {
  a = [...new Set(a)]  // deduplicate
  b = new Set(b)
  return a.filter(x => ! b.has(x))
}




const uninstall = (hashes) => {
  // use reversed hashed since that's the proper way to clean up co-dependent things
  let reversedHashes = [...hashes]
  reversedHashes.reverse()

  let stats = reversedHashes.map(h => {
    let x = util.fileRead(`${STORE_PATH}/${h}`)
    // let [install, uninstall] = JSON.parse(x)
    let {uninstall = null} = JSON.parse(x)


    if(uninstall) {
      let [f, ...args] = uninstall

      try {
        lib[f](...args)

      } catch (e) {
        console.log(`Error with ${h}, ${f}, ${args}:\n${e.message}`)
        console.log(e.stack)
        console.log("\n...uninstall continuing...\n")
        return [h, e]
      }
    }

    return [h, null]
  })
  
  let errors = stats.filter(([h, e]) => e !== null)
  let failedHashes = errors.map(([h, e]) => h)

  return failedHashes
}


const install = (hashes, ignoreErrors=false) => {
  let successfulHashes = []


  for (const hash of hashes) {
    try {
      let x = util.fileRead(`${STORE_PATH}/${hash}`)
    
      // let [install, uninstall] = JSON.parse(x)
      var {install = null, build = null} = JSON.parse(x)

      let outPath = `${NUX_PATH}/out/${hash}`
      if(build && !util.exists(outPath)) {
        var [f, ...args] = build
        lib[f](...args, hash)
      }
      
      if(install) {
        var [f, ...args] = install
        lib[f](...args, hash)
      }

      successfulHashes.push(hash)

    } catch (e) {
      // TODO: return don't print errors
      console.log(`Error: ${e.message}`)
      console.log(e.stack)

      if(!ignoreErrors)
        break
    }
  }

  return successfulHashes
}


export const install_raw = async (sourcePath, name="default", nuxId=null) => {
  // console.log("install-raw")

  nuxId = nuxId ?? name
  
  let current_path = `${NUX_PATH}/cur-${nuxId}`
      
  var oldHashes = util.exists(current_path) ? JSON.parse(util.fileRead(current_path)) : []

  // TODO: instead of processing a list of drvs use a single top level drv
  let drvs = []

  if(sourcePath) {
    let f = await loadActions(sourcePath, name)
    if(f === undefined)
      throw new Error(`setup.nux.js doesn't export "${name}"`)

    drvs = f()  // compute the derivations
  }

  drvs = drvs.flat(Infinity)  // allows for nested derivations for convenience

  drvs = drvs.map(d => {
    d = d.hash ? d : drv.derivation(d)
    return d.flatten()
  })
  drvs = drvs.flat()


  // write derivations to disk
  drvs.map(d => {
    let p = `${STORE_PATH}/${d.hash}`
    if(!util.exists(p))
      util.fileWrite(p, d.serialize())
  })

  let hashes = [...new Set(drvs.map(d => d.hash))]  // deduplicated hashes


  let hashesToUninstall = setDifference(oldHashes, hashes)
  let hashesToInstall = setDifference(hashes, oldHashes)


  console.log(dedent`
    Uninstalling ${hashesToUninstall.length} of ${oldHashes.length}:
      ${hashesToUninstall.join('\n  ')}
  `)
  
  var failedUninstalls = uninstall(hashesToUninstall)

  if(failedUninstalls.length > 0) {
    throw Error(dedent`
      ${failedUninstalls.length} out of ${hashesToUninstall.length} uninstalls failed:
        ${failedUninstalls.join('\n  ')}
      
      Uninstall them manually, then delete them from ${current_path} manually or run nux force-remove ${name} '<paste the newline separated hashes here>'
    `)
  }

  console.log(`Installing ${hashesToInstall.length} of ${hashes.length}`)

  let installedHashes = install(hashesToInstall)
  
  if(installedHashes.length == hashesToInstall.length) {

    util.fileWrite(current_path, JSON.stringify(hashes))

  } else {
    // failed to install completely
    console.log(`Partial install ${installedHashes.length}/${hashes.length}`)
    console.log(`Trying to remove partial install...`)

    // TODO: maybe we should call uninstalled on the hash that failed too in case there is anything that needs to be cleaned up?
    // try to undo what we've done so far
    var failedUninstalls = uninstall(installedHashes)
    console.log(`Cleaned up ${installedHashes.length-failedUninstalls.length}/${installedHashes.length}`)

    if(failedUninstalls.length != 0)
      console.log(`Leftover installed hashes: ${failedUninstalls}`)
    
    console.log(`Trying to restore old install...`)

    let reinstalledHashes = install(hashesToUninstall, true)

    if(reinstalledHashes.length == hashesToUninstall.length) {

      console.log(`Successfully restored previous install`)
    
    } else {
    
      let missingHashes = hashesToUninstall.filter(h => !reinstalledHashes.includes(h))

      console.log(dedent`
        Error: Only partially restored previous install (missing ${missingHashes.length}):
          ${missingHashes.join('\n  ')}
      `)

      let remainingHashes = hashes.filter(h => !missingHashes.includes(h))

      util.fileWrite(current_path, JSON.stringify(remainingHashes))  // update db
    }

    std.exit(1)  // exit with error

  }
}


