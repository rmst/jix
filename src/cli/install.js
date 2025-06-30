
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';

import nux from 'nux'
import { LOCAL_NUX_PATH, LOCAL_STORE_PATH, NUX_DIR } from "../nux/context.js";
import context from '../nux/context.js';
import { effect, TargetedEffect, Effect } from '../nux/effect.js';
import { dedent } from '../nux/dedent.js';

import * as util from './util.js'
import * as actions from './actions.js'


export const updateHosts = (hosts) => {
  fs.writeFileSync(`${LOCAL_NUX_PATH}/hosts.json`, JSON.stringify(hosts, null, 2), 'utf8');
  loadHosts();
};

export const loadHosts = () => {
  let hosts = JSON.parse(fs.readFileSync(`${LOCAL_NUX_PATH}/hosts.json`, 'utf8'));
  // console.log("LOAD HOSTS", hosts)
  context.hosts = hosts;
};


const setDifference = (a, b) => {
  a = [...new Set(a)]  // deduplicate
  b = new Set(b)
  return a.filter(x => ! b.has(x))
}


const executeCmd = (c, host, user) => {
  
  if(c === null)  // noop
    return

  let options = c.verbose ? { stdout: 'inherit', stderr: 'inherit' } : {}
  let { cmd, args } = c
  if(host !== null) {
    // console.log("RC", host, user)
    // TODO: add a check here on first ssh connection whether the user home matches context.hosts
    host = context.hosts?.[host]?.address ?? host
    args = [cmd, ...args]
    args = args.map(s => `'` + s.replaceAll(`'`, `'"'"'`) + `'`)  // escape all args
    cmd = "ssh"
    args = [`${user}@${host}`, "--", ...args]
  }

  return execFileSync(cmd, args, options)
}


const uninstall = (hashes) => {
  // use reversed hashed since that's the proper way to clean up co-dependent things
  let reversedHashes = [...hashes]
  reversedHashes.reverse()

  let stats = reversedHashes.map(hash => {
    let x = fs.readFileSync(`${LOCAL_STORE_PATH}/${hash}`, 'utf8')

    let {uninstall=null, host, user} = JSON.parse(x)

    if(uninstall) {
      let [f, ...args] = uninstall

      try {
        let cmd = actions[f](...args, hash)
        executeCmd(cmd, host, user)

      } catch (e) {
        console.log(`Error with ${hash}, ${f}, ${args}:\n${e.message}`)
        console.log(e.stack)
        console.log("\n...uninstall continuing...\n")
        return [hash, e]
      }
    }

    return [hash, null]
  })
  
  let errors = stats.filter(([h, e]) => e !== null)
  let failedHashes = errors.map(([h, e]) => h)

  return failedHashes
}


const install = (hashes, ignoreErrors=false) => {
  let successfulHashes = []


  for (const hash of hashes) {
    try {
      let x = fs.readFileSync(`${LOCAL_STORE_PATH}/${hash}`, 'utf8')
    
      var {install = null, build = null, host, user, debug={}} = JSON.parse(x)

      if(build) {
        // check if the out file exists (works both locally and over ssh)
        let exists = executeCmd({
          cmd: "/bin/sh", 
          args: ["-c", `[ -e "$HOME/${NUX_DIR}/out/${hash}" ] && echo "y" || echo "n"`],
        }, host, user)
      
        exists = (exists === "y")

        // let outPath = `${NUX_PATH}/out/${hash}`  // get rid of NUX_PATH
        // let exists = util.exists(outPath)  // maybe keep for local check is prob much faster
        if(!exists) {
          var [f, ...args] = build
          let cmd = actions[f](...args, hash)

          try {
            executeCmd(cmd, host, user)
          } catch (e) {
            if(debug.stack)
              // TODO: this try/catch and the debug property itself is a massive hack, the displayed stack trace 
              console.log(`DEBUG Stack trace for effect defined ${debug.date}:\n`, debug.stack)
            throw e
          }
        }
      }
      
      if(install) {
        var [f, ...args] = install
        let cmd = actions[f](...args, hash)
        try {
          executeCmd(cmd, host, user)
        } catch (e) {
          if(debug.stack)
            // TODO: this try/catch and the debug property itself is a massive hack, the displayed stack trace 
            console.log(`DEBUG Stack trace for effect defined ${debug.date}:\n`, debug.stack)
          throw e
        }
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


export const install_raw = async ({
  sourcePath = null, 
  // name="default", 
  nuxId = null
}) => {
  // console.log("install-raw")


  // TODO: UPDATE HOSTS if the path is hosts.nux.js or sth
  // let hosts = (await import(`${util.dirname(sourcePath)}/hosts.js`)).default
  // if(hosts)
  //   updateHosts(hosts)
  
  loadHosts()


  let module

  if(nuxId === null) {
    module = await import(sourcePath)
    nuxId = module.ID
  }


  let current_path = `${LOCAL_NUX_PATH}/cur-${nuxId}`
 

  var oldHashes = util.exists(current_path) ? JSON.parse(fs.readFileSync(current_path, 'utf8')) : []


  let drvs = nux.target()  // create empty TargetedEffect

  if(sourcePath) {

    // let obj = module.default[name]
    let obj = module.default

    if(obj === undefined)
      throw new Error(`${sourcePath} is missing "export default ..."`)

    else if (obj instanceof Promise)
      drvs = await obj

    else if (typeof obj === 'function')
      drvs = await obj()
    
    else
      drvs = obj
    
    // console.log(drvs)
    if (! (drvs instanceof TargetedEffect)) {
      // drvs can e.g be a list of Effects
      drvs = nux.target(null, drvs)

      // console.log(`\n${drvs.toDebugString()}\n`)
    }
  }

  drvs = drvs.flatten()

  // write derivations to disk
  drvs.map(d => {
    let p = `${LOCAL_STORE_PATH}/${d.hash}`
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
      
      Uninstall them manually, then delete them from ${current_path} manually or run nux force-remove ${nuxId} '<paste the newline separated hashes here>'
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

    process.exit(1)  // exit with error

  }
}


