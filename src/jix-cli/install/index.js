
import { sh } from '../util.js'
import { git } from './git.js'
import install from '../core/install.js'
import { findNuxRoot as findJixRoot } from './util.js'
import { dedent } from '../../jix/dedent.js'

import process from 'node:process'

export default {
	name: 'install',
	description: 'Install/apply a jix configuration or effect.',
	usage: 'jix install [--dry-run] <path>',
	help: dedent`
	Install a jix manifest located at <path>.

	Arguments:
	  <path>  Path to a file or any path inside a git repo containing __jix__.js

	Options:
	  --dry-run  Show what would be installed/uninstalled without making changes

	Examples:
	  jix install ./my-tools
	  jix install ~/work/project/__jix__.js
	  jix install --dry-run ./my-tools
	`,
	async run(args) {
		const dryRun = args.includes('--dry-run')
		const p = args.find(arg => !arg.startsWith('--'))
		if (!p || args.includes('--help') || args.includes('-h')) {
			console.log(`Usage:\n  ${this.usage}\n\n${this.help}`)
			return
		}

		// NOTE: path can be any path inside of a git repo and doesn't necessarily have to point to a __jix__.js file
		let path = sh`realpath '${findJixRoot(p)}'`.trim() // TODO: obvious get rid of this

		if (process.env.JIX_GITCOMMIT) {
			let gitRoot = git.root(path)
			if (!git.isClean(gitRoot)) {
				// TODO: configurable between {autocommit, fail on dirty, ignore dirty}
				sh`
					cd ${gitRoot}
					git add .
					git commit -m jix_update
				`
			}
		}

		await install({ sourcePath: path, dryRun })
	}
}
