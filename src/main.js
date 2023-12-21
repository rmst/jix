


import * as std from 'std';
import * as os from 'os';
import * as util from './util.js'
import { dedent, sh } from './util.js'
import { BIN_PATH, CUR_PATH, TMP_PATH, NUX_PATH } from './nux_lib.js'
import * as nux from './nux_lib.js'

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


const install_commit = (repo, commit) => {
  sh`rm -rf ${TMP_PATH}`
  git.clone(TMP_PATH, repo, commit)
  let out = sh`${NUX_REPO}/bin/qjs-macos --unhandled-rejection ${NUX_REPO}/src/main.js install-raw ${TMP_PATH}`
  // console.log(out)
  sh`rm -rf ${TMP_PATH}`
  util.fileWrite(CUR_PATH, commit)
}


const uninstall_commit = (repo, commit) => {
  sh`rm -rf ${TMP_PATH}`
  git.clone(TMP_PATH, repo, commit)
  let out = sh`${NUX_REPO}/bin/qjs-macos --unhandled-rejection ${NUX_REPO}/src/main.js uninstall-raw ${TMP_PATH}`
  // console.log(out)
  sh`rm -rf ${TMP_PATH}`
  util.fileDelete(CUR_PATH, true)
}


const update = () => {
  util.mkdir(NUX_PATH, true)
  util.mkdir(BIN_PATH, true)
  sh`rm -rf ${TMP_PATH}`

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

  let oldCommit

  if(util.exists(CUR_PATH)) {
    try {
      oldCommit = util.fileRead(CUR_PATH)
      console.log("uninstall", {oldCommit})

      uninstall_commit(path, oldCommit)

    } catch (e) {

      console.log(`Error: ${e.message}`)
      console.log(e.stack)

      console.log(`Uninstall manually, then delete ${CUR_PATH}"`)

      std.exit(1)  // exit with error
    }

  }

  console.log("install", {commit})

  try {

    install_commit(path, commit)

  } catch (e) {

    console.log(`Error: ${e.message}`)
    console.log(e.stack)

    try {
      uninstall_commit(path, commit)
      console.log(`Cleaned up ${commit}`)

    } catch (e) {

      console.log(`ATTEMPTED to clean up ${commit}`)
      console.log(`Error: ${e.message}`)
      console.log(e.stack)
    }
    
    if(oldCommit) {
      try {
        install_commit(path, oldCommit)
        console.log(`REVERTED to ${oldCommit}`)

      } catch (e) {
        console.log(`ATTEMPTED to REVERT to ${oldCommit}`)
        console.log(`Error: ${e.message}`)
        console.log(e.stack)
      }
    }

    std.exit(1)  // exit with error
  }


}


// function processAndExecuteScript(filePath, basePath) {
// 	let scriptContent = readFile(filePath);

// 	// Simple regex to modify import statements
// 	// Adjust the regex as per your requirement
// 	scriptContent = scriptContent.replace(/from\s+['"](.+?)['"]/g, (match, moduleName) => {
// 			if (moduleName === 'bla') {
// 					// Replace with the full path
// 					return `from '${basePath + moduleName}'`;
// 			}
// 			return match;
// 	});

// 	// Dynamically evaluate the modified script
// 	eval(scriptContent);
// }

const loadNixfile = async (path) => {
  globalThis.nux_lib = {
    v1: nux
  }

  let module = await import(path)
  return module.default
}

const main = async () => {
  if(scriptArgs.length <= 1) {
    update()
    return
  }

	switch(scriptArgs[1]) {
		case "uninstall-raw":
			// console.log("uninstall-raw")
      
      var path = scriptArgs[2]
      var conf = await loadNixfile(`${path}/nux.js`)
			util.withCwd(path, () => conf.map(x => x.uninstall()))
			break
		
		case "install-raw":
			// console.log("install-raw")

      var path = scriptArgs[2]
      var conf = await loadNixfile(`${path}/nux.js`)
			util.withCwd(path, () => conf.map(x => x.install()))
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
