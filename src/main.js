


import * as std from 'std';
import * as os from 'os';
import * as util from './util.js'
import { dedent, sh, shVerbose } from './util.js'
import { BIN_PATH, TMP_PATH, NUX_PATH } from "./const.js";
import * as nux from './nux.js'
import * as BIN_PATHJs from "./const.js";
import { sha256 } from './sha256.js';

import * as lib from './lib.js'


const NUX_REPO = "~/.g/23b7-nux"


util.monkeyPatchConsoleLog()


// UTILS

const git = {}

git.clone = (path, remote, commit_hash) => {
  sh`
    set -e
    mkdir ${path}
    cd ${path}
    git init
    git remote add origin ${remote}
    git fetch --depth 1 origin ${commit_hash}
    git checkout ${commit_hash}
    # rm -rf .git
  `

  return path
}

git.isClean = (path) => {
  let status = sh`
    git -C "${path}" status --porcelain
  `
  return status == ""
}

git.latestCommitHash = (path) => {
  return sh`
    git -C "${path}" rev-parse HEAD
  `
}



// APPLY CONFIGURATION


const install_commit = async (repo, commit, name) => {
  sh`rm -rf ${TMP_PATH}`
  git.clone(TMP_PATH, repo, commit)
  // let out = sh`${NUX_REPO}/bin/qjs-macos --unhandled-rejection ${NUX_REPO}/src/main.js install-raw ${TMP_PATH}`

  await install_raw(TMP_PATH, name)

  // console.log(out)
  sh`rm -rf ${TMP_PATH}`
  // util.fileWrite(CUR_PATH, commit)
}


const update = async (name) => {
  util.mkdir(NUX_PATH, true)
  util.mkdir(BIN_PATH, true)
  util.mkdir(BIN_PATHJs.STORE_PATH, true)
  util.mkdir(`${NUX_PATH}/logs`, true)

  let path = os.getcwd()[0]
	
  if(! git.isClean(path)) {
    // throw Error(`Uncommited changes in ${path}`)
		sh`
			cd ${path}
			git add .
			git commit -m nux_update
  	`
	}

  let commit = git.latestCommitHash(path)

  console.log(`Installing ${name} from ${path}:${commit}`)
  await install_commit(path, commit, name)

}


const loadActions = async (path, name) => {
  globalThis.nux = nux

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
    let x = util.fileRead(`${BIN_PATHJs.STORE_PATH}/${h}`)
    // let [install, uninstall] = JSON.parse(x)
    let {install, uninstall} = JSON.parse(x)
    let [f, ...args] = uninstall

    try {
      lib[f](...args)
      return [h, null]

    } catch (e) {
      console.log(`Error: ${e.message}`)
      console.log(e.stack)
      console.log("\n...uninstall continuing...\n")
      return [h, e]
    }
    
  })

  // TODO: we should be returning the failed hashes not just the number
  
  let errors = stats.filter(([h, e]) => e !== null)
  let failedHashes = errors.map(([h, e]) => h)

  return failedHashes
}


const install = (hashes) => {
  let stats = hashes.map(h => {
    let x = util.fileRead(`${BIN_PATHJs.STORE_PATH}/${h}`)
    // let [install, uninstall] = JSON.parse(x)
    let {install, uninstall} = JSON.parse(x)
    
    let [f, ...args] = install

    lib[f](...args, h)
  })
}



const install_raw = async (path, name) => {
  // console.log("install-raw")
  
  let current_path = `${NUX_PATH}/cur-${name}`
      
  var oldHashes = util.exists(current_path) ? JSON.parse(util.fileRead(current_path)) : []

  var conf = await loadActions(`${path}/setup.nux.js`, name)
  if(conf === undefined)
    throw new Error(`setup.nux.js doesn't export "${name}"`)

  conf = conf().flat(Infinity)  // allows for nested conf

  // compute hashes and write actions to disk
  var hashes = conf.map((c, i, arr) => {
    // let {install, uninstall} = c
    // install ?? uninstall ?? (()=>{throw new Error(`action ${i}/${arr.length}: missing install/uninstall attribute`)})()
    // let s = JSON.stringify([install, uninstall])
    // let h = sha256(s)
    let s = JSON.stringify(c)
    let h = sha256(s)

    let p = `${BIN_PATHJs.STORE_PATH}/${h}`
    if(!util.exists(p))
      util.fileWrite(p, s)
    
    return h
  })

  hashes = [...new Set(hashes)]  // deduplicate

  let removedHashes = setDifference(oldHashes, hashes)
  let addedHashes = setDifference(hashes, oldHashes)

  console.log(`Uninstalling ${removedHashes.length} of ${oldHashes.length}`)

  let failedHashes = uninstall(removedHashes)

  if(failedHashes.length > 0) {
    throw Error(dedent`
      ${failedHashes.length} out of ${removedHashes.length} uninstalls failed:
        ${failedHashes.join('\n  ')}
      
      Uninstall them manually, then delete them from ${current_path}.
    `)
  }

  try {
    console.log(`Installing ${addedHashes.length} of ${hashes.length}`)
    install(addedHashes)
    
    util.fileWrite(current_path, JSON.stringify(hashes))

  } catch (e) {

    console.log(`Error: ${e.message}`)
    console.log(e.stack)

    try {
      uninstall(addedHashes)  // TODO: remove the proper subset of addedHashes
      console.log(`Cleaned up`)

    } catch (e) {

      console.log(`ATTEMPTED to clean up`)
      console.log(`Error: ${e.message}`)
      console.log(e.stack)
    }
    
    try {
      install(removedHashes)
      console.log(`RESTORED previous config`)

    } catch (e) {
      console.log(`ATTEMPTED to RESTORE previous config`)
      console.log(`Error: ${e.message}`)
      console.log(e.stack)
    }

    std.exit(1)  // exit with error

  }
}



const main = async () => {

  if(scriptArgs.length == 2) {
    let name = scriptArgs[1]
    await update(name)
    return
  }

	// switch(scriptArgs[1]) {
	// 	case "install-raw":
  //     await install_raw(scriptArgs[2])

	// 		break

	// 	default:
	// 		throw Error(`Invalid command: ${scriptArgs[1]}`)
	// }

}


main().then(null, e => {
  console.log(`Error: ${e.message}`)
  console.log(e.stack)
  std.exit(1)
})
