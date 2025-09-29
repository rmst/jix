import { LOCAL_NUX_PATH, LOCAL_BIN_PATH, LOCAL_STORE_PATH } from '../../nux/context.js'

import * as dirnameJs from '../../nux/util.js'
import * as util from '../util.js'
import { sh } from '../util.js'
import { git } from './git.js'
import apply from '../core/apply.js'
import { findNuxRoot, exportsID } from './util.js'
import { dedent } from '../../nux/dedent.js'

import process from 'node:process'

export const install = async (path) => {

  // NOTE: path can be any path inside of a git repo and doesn't necessarily have to point to a root.nux.js file
  console.log("path", path)

  path = sh`realpath '${findNuxRoot(path)}'`.trim() // TODO: obviously get rid of this
  console.log("nuxroot", path)

  if (!exportsID(path)) {
    // TODO: this should only be done interactively by asking the user

    // let id = util.uuidV4()
    let id = util.basename(dirnameJs.dirname(path))
    console.log(`new path assigning ID ${id}`)
    sh`echo '\n\n\nexport const ID = "${id}"' >> "${path}"`
  }

  let gitRoot = git.root(path)
  console.log("gitroot", gitRoot)


  if (process.env.NUX_GITCOMMIT && !git.isClean(gitRoot)) {
    // TODO: this should be configurable between {autocommit, fail on dirty, ignore dirty}
    // throw Error(`Uncommited changes in ${path}`)
    // console.log(`git not clean ${path}`)
    sh`
			cd ${gitRoot}
			git add .
			git commit -m nux_update
  	`;
  }

  let commit = git.latestCommitHash(gitRoot)
  // console.log(`Installing ${path} from ${gitRoot}:${commit}`)
  
  await apply({sourcePath: path})
}

export default {
	name: 'apply',
	description: 'Apply/install a nux configuration or effect.',
	usage: 'nux apply <path>',
	help: dedent`
	Apply a nux manifest located at <path>.

	Arguments:
	  <path>  Path to a file or any path inside a git repo containing __nux__.js

	Examples:
	  nux apply ./my-tools
	  nux apply ~/work/project/__nux__.js
	`,
	async run(a) {
		const p = a[0]
		if (!p || a.includes('--help') || a.includes('-h')) {
			console.log(`Usage:\n  ${this.usage}\n\n${this.help}`)
			return
		}
		await install(p)
	}
}
