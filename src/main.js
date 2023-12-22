


import * as std from 'std';
import * as os from 'os';
import * as util from './util.js'
import { dedent, sh } from './util.js'
import { BIN_PATH, CUR_PATH, TMP_PATH, NUX_PATH } from './nux.js'
import * as nux from './nux.js'
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


const install_commit = async (repo, commit) => {
  sh`rm -rf ${TMP_PATH}`
  git.clone(TMP_PATH, repo, commit)
  // let out = sh`${NUX_REPO}/bin/qjs-macos --unhandled-rejection ${NUX_REPO}/src/main.js install-raw ${TMP_PATH}`

  await install_raw(TMP_PATH)

  // console.log(out)
  sh`rm -rf ${TMP_PATH}`
  // util.fileWrite(CUR_PATH, commit)
}


const update = async () => {
  util.mkdir(NUX_PATH, true)
  util.mkdir(BIN_PATH, true)
  util.mkdir(nux.STORE_PATH, true)

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

  console.log(`Installing ${path}:${commit}`)
  await install_commit(path, commit)

}


const loadNixfile = async (path) => {
  globalThis.nux = nux

  let module = await import(path)
  return module.default
}


const setDifference = (a, b) => {
  b = new Set(b)
  return a.filter(x => ! b.has(x))
}



const uninstall = (hashes) => {

  let stats = hashes.map(h => {
    let x = util.fileRead(`${nux.STORE_PATH}/${h}`)
    let [install, uninstall] = JSON.parse(x)
    let [f, ...args] = uninstall

    try {
      lib[f](...args)
      return null

    } catch (e) {
      console.log(`Error: ${e.message}`)
      console.log(e.stack)
      console.log("\n...uninstall continuing...\n")
      return e
    }
    
  })

  let numErrors = stats.filter(x => x !== null).length

  if(numErrors) {
    throw Error(dedent`
      ${numErrors} out of ${stats.length} uninstalls failed.
      Uninstall them manually, then delete ${CUR_PATH}.
    `)
  }

}


const install = (hashes) => {
  let stats = hashes.map(h => {
    let x = util.fileRead(`${nux.STORE_PATH}/${h}`)
    let [install, uninstall] = JSON.parse(x)
    let [f, ...args] = install

    lib[f](...args)
  })
}



const install_raw = async (path) => {
  // console.log("install-raw")
      
  var oldHashes = util.exists(CUR_PATH) ? JSON.parse(util.fileRead(CUR_PATH)) : []

  var conf = await loadNixfile(`${path}/nux.js`)
  var hashes = conf.map(({install, uninstall}) => {
    let s = JSON.stringify([install, uninstall])
    let h = sha256(s)
    let p = `${nux.STORE_PATH}/${h}`
    if(!util.exists(p))
      util.fileWrite(p, s)
    
    return h
  })

  let removedHashes = setDifference(oldHashes, hashes)
  let addedHashes = setDifference(hashes, oldHashes)

  console.log(`Uninstalling ${removedHashes.length} of ${oldHashes.length}`)
  uninstall(removedHashes)

  try {
    console.log(`Installing ${addedHashes.length} of ${hashes.length}`)
    install(addedHashes)
    
    util.fileWrite(CUR_PATH, JSON.stringify(hashes))

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

  if(scriptArgs.length <= 1) {
    await update()
    return
  }

	switch(scriptArgs[1]) {
		case "install-raw":
      await install_raw(scriptArgs[2])

			break

		default:
			throw Error(`Invalid command: ${scriptArgs[1]}`)
	}

}


main().then(null, e => {
  console.log(`Error: ${e.message}`)
  console.log(e.stack)
  std.exit(1)
})
