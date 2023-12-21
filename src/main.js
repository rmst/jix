


import * as std from 'std';
import * as os from 'os';
import * as x from './lib.js'
import {dedent} from './lib.js'
import {BIN_PATH, CUR_PATH, TMP_PATH, NUX_PATH} from './nux_lib.js'


console.log_old = console.log
console.log = (...args) => {
  args = args.map(x => {

    try {
      x = (typeof x === 'object') ? JSON.stringify(x) : x

    } catch {}

    return x

  })
  console.log_old(...args)
}




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

    let out = x.sh`~/.g/23b7-nux/bin/qjs-macos --unhandled-rejection ${path}/main.js uninstall-raw ${TMP_PATH}/nux.js`
		console.log(out)
    x.sh`rm -rf ${TMP_PATH}`
  }

  console.log("install", {commit})

  git.clone(TMP_PATH, path, commit)
  x.sh`~/.g/23b7-nux/bin/qjs-macos --unhandled-rejection ${path}/main.js install-raw ${TMP_PATH}/nux.js`
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
  
  module = await import(scriptArgs[2])
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
      
      var conf = loadNixfile(scriptArgs[2])
			conf.map(x => x.uninstall())
			// console.log("raw-done")
			break
		
		case "install-raw":
			console.log("install-raw")

			var module = await import(scriptArgs[2])
			var conf = module.default
			conf.map(x => x.install())
			break

		default:
			throw Error(`Invalid command: ${scriptArgs[1]}`)
	}

}

main()