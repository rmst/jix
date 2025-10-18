
import { sh } from '../util.js'
import { git } from './git.js'
import install from '../core/install.js'
import { findNuxRoot } from './util.js'
import { dedent } from '../../nux/dedent.js'

import process from 'node:process'

export default {
	name: 'install',
	description: 'Install/apply a nux configuration or effect.',
	usage: 'nux install [--dry-run] <path>',
	help: dedent`
	Install a nux manifest located at <path>.

	Arguments:
	  <path>  Path to a file or any path inside a git repo containing __nux__.js

	Options:
	  --dry-run  Show what would be installed/uninstalled without making changes

	Examples:
	  nux install ./my-tools
	  nux install ~/work/project/__nux__.js
	  nux install --dry-run ./my-tools
	`,
	async run(args) {
		const dryRun = args.includes('--dry-run')
		const p = args.find(arg => !arg.startsWith('--'))
		if (!p || args.includes('--help') || args.includes('-h')) {
			console.log(`Usage:\n  ${this.usage}\n\n${this.help}`)
			return
		}

		// NOTE: path can be any path inside of a git repo and doesn't necessarily have to point to a root.nux.js file
		let path = sh`realpath '${findNuxRoot(p)}'`.trim() // TODO: obviously get rid of this

		if (process.env.NUX_GITCOMMIT) {
			let gitRoot = git.root(path)
			if (!git.isClean(gitRoot)) {
				// TODO: configurable between {autocommit, fail on dirty, ignore dirty}
				sh`
					cd ${gitRoot}
					git add .
					git commit -m nux_update
				`
			}
		}

		await install({ sourcePath: path, dryRun })
	}
}
