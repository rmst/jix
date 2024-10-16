
// TODO: migrate this entire file to cli.js (and install.js, etc)


import * as std from 'std';
import * as os from 'os';

util.monkeyPatchConsoleLog()

import * as util from './util.js'
import { monkeyPatchProcess } from './node/util.js'
monkeyPatchProcess()

import { dedent, sh, shVerbose } from './util.js'
import { BIN_PATH, TMP_PATH, NUX_PATH, STORE_PATH } from "./context.js";
import context from "./context.js"

import nux from './nux.js'

import { install_raw } from './install.js';


import * as fs from './node/fs.js';


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
  
  context.repo = TMP_PATH
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

  let path = process.env.NUX_REPO || os.getcwd()[0]


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

  if(true) {
    let operator = scriptArgs[1]

    if(operator === "update"){
      let name = scriptArgs[2]
      await update(name)
      return

    } else if (operator === "uninstall") {
      let name = scriptArgs[2]
      install_raw(null, null, name)
      return

    } else if (operator === "force-remove") {
      let name = scriptArgs[2]
      let drvs = scriptArgs[3]
      // Split and trim the input string into lines
      const lines = drvs.split('\n').map(line => line.trim()).filter(line => line !== '');
      // console.log(lines)
      // Load the existing JSON file
      const jsonPath = `${NUX_PATH}/cur-${name}`;
      let jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      console.log('Before:', jsonData.length, "derivations")

      // Remove each line from the JSON list
      jsonData = jsonData.filter(item => !lines.includes(item));
      console.log('After:', jsonData.length, "derivations")
      // Save the updated list back to the JSON file
      fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');
    }

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
