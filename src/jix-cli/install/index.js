
import { sh } from '../util.js'
import { git } from './git.js'
import install from '../core/install.js'
import { findJixRoot } from './util.js'
import { dedent } from '../../jix/dedent.js'
import { MANIFEST_BASENAME } from '../../jix/context.js'
import { parseArgs } from '../parseArgs.js'
import * as fs from 'node:fs'
import process from 'node:process'

export default {
	name: 'install',
	description: 'Install a jix configuration',
	usage: 'jix install [name]',
	help: dedent`
	Install a jix manifest from the current directory's ${MANIFEST_BASENAME}.

	Arguments:
	  [name]  Name of the install (only "default" is currently supported, this is the default)

	Options:
	  --dry-run         Show what would be installed/uninstalled without making changes
	  -f, --file <path> Use a specific manifest file or directory

	Examples:
	  jix install
	  jix install default
	  jix install -f ./my-tools
	  jix install --dry-run
	`,
	async run(args) {
		const { flags, positionals } = parseArgs(args, { f: 'value', file: 'value' })

		if (flags.help || flags.h) {
			console.log(`Usage:\n  ${this.usage}\n\n${this.help}`)
			return
		}

		const name = positionals[0] || 'default'

		if (name !== 'default') {
			console.log(`Error: Only "default" is currently supported as install name`)
			process.exit(1)
		}

		const path = sh`realpath '${findJixRoot(flags.f || flags.file || '.')}'`.trim()

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

		await install({ sourcePath: path, name, dryRun: flags['dry-run'] })
	}
}
