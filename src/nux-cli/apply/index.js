import { LOCAL_NUX_PATH, LOCAL_BIN_PATH, LOCAL_STORE_PATH } from '../../nux/context.js'

import * as dirnameJs from '../../nux/util.js'
import * as util from '../util.js'
import { sh } from '../util.js'
import { git } from './git.js'
import apply from '../core/apply.js'
import { findNuxRoot } from './util.js'
import { dedent } from '../../nux/dedent.js'

import process from 'node:process'

export const install = async (path, dryRun = false) => {

  // NOTE: path can be any path inside of a git repo and doesn't necessarily have to point to a root.nux.js file
  console.log("path", path)

  path = sh`realpath '${findNuxRoot(path)}'`.trim() // TODO: obviously get rid of this
  console.log("nuxroot", path)



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

  await apply({sourcePath: path, dryRun})
}

export default {
	name: 'apply',
	description: 'Apply/install a nux configuration or effect.',
	usage: 'nux apply [--dry-run] <path>',
	help: dedent`
	Apply a nux manifest located at <path>.

	Arguments:
	  <path>  Path to a file or any path inside a git repo containing __nux__.js

	Options:
	  --dry-run  Show what would be installed/uninstalled without making changes

	Examples:
	  nux apply ./my-tools
	  nux apply ~/work/project/__nux__.js
	  nux apply --dry-run ./my-tools
	`,
	async run(a) {
		const dryRun = a.includes('--dry-run')
		const p = a.find(arg => !arg.startsWith('--'))
		if (!p || a.includes('--help') || a.includes('-h')) {
			console.log(`Usage:\n  ${this.usage}\n\n${this.help}`)
			return
		}
		await install(p, dryRun)
	}
}
