
// TODO: migrate this entire file to cli.js (and install.js, etc)


import * as std from 'std';
import * as os from 'os';

util.monkeyPatchConsoleLog()

import * as util from './util.js'
import { dedent, sh, shVerbose } from './util.js'
import { BIN_PATH, TMP_PATH, NUX_PATH, STORE_PATH } from "./const.js";


const NUX_REPO = "~/.g/23b7-nux"

import { install_raw } from './install.js';



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
  
  await install_raw(`${TMP_PATH}/setup.nux.js`, name, name)

  // console.log(out)
  sh`rm -rf ${TMP_PATH}`
  // util.fileWrite(CUR_PATH, commit)
}


const update = async (name) => {
  util.mkdir(NUX_PATH, true)
  util.mkdir(BIN_PATH, true)
  util.mkdir(STORE_PATH, true)
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



const main = async () => {

  if(scriptArgs.length == 2) {
    let name = scriptArgs[1]
    await update(name)
    return
  }

  else if(scriptArgs.length == 3) {
    let name = scriptArgs[1]
    let operator = scriptArgs[2]
    if(operator != "--uninstall")
      throw Error("second argument must be --uninstall")
    
    install_raw(null, null, name)
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
