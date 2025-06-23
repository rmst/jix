
// TODO: migrate this entire file to cli.js (and install.js, etc)


import * as std from 'std';
import * as os from 'os';

import * as util from './util.js'
import { monkeyPatchProcess } from './node/util.js'
// util.monkeyPatchConsoleLog()
util.monkeyPatchObjectToString()

monkeyPatchProcess()

import { dedent, sh, shVerbose } from './util.js'
import { LOCAL_BIN_PATH, TMP_PATH, LOCAL_NUX_PATH, LOCAL_STORE_PATH } from "./context.js";
import context from "./context.js"

import nux from './nux.js'

import { install_raw } from './install.js';


import * as fs from './node/fs.js';


// UTILS

const git = {}
git.root = (path) => {
  let root = sh`cd "$(dirname "${path}")" && git rev-parse --show-toplevel`
  return root.trim()
}

git.clone = (path, remote, commit_hash) => {
  sh`
    set -e
    mkdir -p ${path}
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
  `.trim()
}


// const ROOTNAME = "root.nux.js"
const ROOTNAME = "__nux__.js"

function findNuxRoot(path) {

	if (fs.existsSync(`${path}/${ROOTNAME}`)) {
		return `${path}/${ROOTNAME}`;
	}

	const parentDir = path.substring(0, path.lastIndexOf('/'));
	if (parentDir === '' || parentDir === path) {
		throw new Error(`No ${ROOTNAME} file found in any parent directories`);
	}

	return findNuxRoot(parentDir);
}


// APPLY CONFIGURATION

const install_commit = async (repo, commit, path) => {

  context.repo = path  // TODO: maybe get rid of context.repo entirely

  await install_raw({sourcePath: path})
}


const install_commit2 = async (repo, commit, path) => {
  sh`rm -rf ${TMP_PATH} 2> /dev/null || true`
  //  && sleep 0.5`
  git.clone(`${TMP_PATH}/${commit}`, repo, commit)
  // let out = sh`${NUX_REPO}/bin/qjs-macos --unhandled-rejection ${NUX_REPO}/src/main.js install-raw ${TMP_PATH}`
  
  context.repo = `${TMP_PATH}/${commit}`  // TODO: maybe get rid of context.repo entirely

  let relpath = util.relpath(repo, path)

  await install_raw({sourcePath: `${TMP_PATH}/${commit}/${relpath}`})

  // console.log(out)

  sh`rm -rf ${TMP_PATH} 2> /dev/null || true`  // TODO: this seems to fail sometimes
  // util.fileWrite(CUR_PATH, commit)
}


function exportsID(path) {
  let text = fs.readFileSync(path, 'utf8')

  return ( false
    || text.includes('export const ID') 
    || text.includes('export let ID') 
    || text.includes('export var ID') 
    || text.includes('export { ID }')
  ) 
}




const install = async (path) => {
  util.mkdir(LOCAL_NUX_PATH, true)
  util.mkdir(LOCAL_BIN_PATH, true)
  util.mkdir(LOCAL_STORE_PATH, true)
  util.mkdir(`${LOCAL_NUX_PATH}/logs`, true)

  // let path = process.env.NUX_REPO || os.getcwd()[0]


  // NOTE: path can be any path inside of a git repo and doesn't necessarily have to point to a root.nux.js file

  console.log("path", path)

  path = sh`realpath "${findNuxRoot(path)}"`.trim()
  console.log("nuxroot", path)

  if(!exportsID(path)) {
    // let id = util.uuidV4()
    let id = util.basename(util.dirname(path))
    console.log(`new path assigning ID ${id}`)
    sh`echo '\n\n\nexport const ID = "${id}"' >> "${path}"`
  }

  let gitRoot = git.root(path)
  console.log("gitroot", gitRoot)


  if(! git.isClean(gitRoot)) {
    // throw Error(`Uncommited changes in ${path}`)
    // console.log(`git not clean ${path}`)

		sh`
			cd ${gitRoot}
			git add .
			git commit -m nux_update
  	`
	}

  let commit = git.latestCommitHash(gitRoot)

  // console.log(`Installing ${path} from ${gitRoot}:${commit}`)
  await install_commit(gitRoot, commit, path)

}



const main = async () => {
  // TODO: add help improve this

  if(true) {
    let operator = scriptArgs[1]

    if(operator === "i"){
      let path = scriptArgs[2]
      // if(path === "_") {
      //   path = fs.readFileSync(`${LOCAL_NUX_PATH}/last_update_name`, 'utf8')
      // }
      // fs.writeFileSync(`${LOCAL_NUX_PATH}/last_update_name`, path)
      await install(path)
      return

    } else if (operator === "uninstall") {
      let nuxId = scriptArgs[2]
      install_raw({nuxId})
      return

    } else if (operator === "force-remove") {
      let nuxId = scriptArgs[2]
      let drvs = scriptArgs[3]
      // Split and trim the input string into lines
      const lines = drvs.split('\n').map(line => line.trim()).filter(line => line !== '');
      // console.log(lines)
      // Load the existing JSON file
      const jsonPath = `${LOCAL_NUX_PATH}/cur-${nuxId}`;
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
