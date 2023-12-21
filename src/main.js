


import * as std from 'std';
import * as os from 'os';
import * as x from './util.js'
import { dedent } from './util.js'
import { BIN_PATH, CUR_PATH, TMP_PATH, NUX_PATH } from './nux_lib.js'
import * as nux from './nux_lib.js'

const NUX_REPO = "~/.g/23b7-nux"


x.monkeyPatchConsoleLog()



// UTILS

const git = {}

git.clone = (path, remote, commit_hash) => {
  x.sh`
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
  let status = x.sh`
    git -C "${path}" status --porcelain
  `
  return status == ""
}

git.latestCommitHash = (path) => {
  return x.sh`
    git -C "${path}" rev-parse HEAD
  `
}



// APPLY CONFIGURATION

const update = () => {
  x.mkdir(NUX_PATH, true)
  x.mkdir(BIN_PATH, true)
  x.sh`rm -rf ${TMP_PATH}`

  let path = os.getcwd()[0]
	

  if(! git.isClean(path)) {
    // throw Error(`Uncommited changes in ${path}`)
		x.sh`
			cd ${path}
			git add .
			git commit -m nux_update
  	`
	}

  let commit = git.latestCommitHash(path)

  if(x.exists(CUR_PATH)) {
    let oldCommit = x.fileRead(CUR_PATH)

    console.log("uninstall", {oldCommit})

    git.clone(TMP_PATH, path, oldCommit)

    let out = x.sh`${NUX_REPO}/bin/qjs-macos --unhandled-rejection ${NUX_REPO}/src/main.js uninstall-raw ${TMP_PATH}/nux.js`
		console.log(out)
    x.sh`rm -rf ${TMP_PATH}`
  }

  console.log("install", {commit})

  git.clone(TMP_PATH, path, commit)
  x.sh`${NUX_REPO}/bin/qjs-macos --unhandled-rejection ${NUX_REPO}/src/main.js install-raw ${TMP_PATH}/nux.js`
  x.sh`rm -rf ${TMP_PATH}`
  x.fileWrite(CUR_PATH, commit)
}


function processAndExecuteScript(filePath, basePath) {
	let scriptContent = readFile(filePath);

	// Simple regex to modify import statements
	// Adjust the regex as per your requirement
	scriptContent = scriptContent.replace(/from\s+['"](.+?)['"]/g, (match, moduleName) => {
			if (moduleName === 'bla') {
					// Replace with the full path
					return `from '${basePath + moduleName}'`;
			}
			return match;
	});

	// Dynamically evaluate the modified script
	eval(scriptContent);
}

const loadNixfile = async (path) => {
  globalThis.nux = nux
  globalThis.dedent = dedent

  let module = await import(scriptArgs[2])
  return module.default
}

const main = async () => {
  if(scriptArgs.length <= 1) {
    update()
    return
  }

	switch(scriptArgs[1]) {
		case "uninstall-raw":
			console.log("uninstall-raw")
      
      var conf = await loadNixfile(scriptArgs[2])
			conf.map(x => x.uninstall())
			// console.log("raw-done")
			break
		
		case "install-raw":
			console.log("install-raw")

      var conf = await loadNixfile(scriptArgs[2])
			conf.map(x => x.install())
			break

		default:
			throw Error(`Invalid command: ${scriptArgs[1]}`)
	}

}

main()