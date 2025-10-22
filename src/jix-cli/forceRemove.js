import { dedent } from '../jix/dedent.js'
import db from './db/index.js'
import { tryUninstallEffect } from './core/installEffect.js'
import { style } from './prettyPrint.js'


export default {
	name: 'force-remove',
	description: 'Forcefully remove derivations.',
	usage: 'jix force-remove [--abandon] <drvs>',
	help: dedent`
	Force-remove one or more effect hashes from the existing set.

	By default, attempts to properly uninstall each effect before removal.
	Use --abandon to skip uninstallation and directly remove from the existing list.

	Arguments:
	  <drvs>      Newline-separated list of hashes (single argument)

	Options:
	  --abandon   Skip uninstallation attempts and directly remove from existing list

	Examples:
	  jix force-remove 'hash1\nhash2'               # Attempts proper uninstallation
	  jix force-remove --abandon 'hash1\nhash2'     # Directly removes without uninstalling
	`,
	run(a) {
		const abandon = a.includes('--abandon')
		const filteredArgs = a.filter(arg => arg !== '--abandon')

		if (!filteredArgs[0] || a.includes('--help') || a.includes('-h')) {
			console.log(`Usage:\n  ${this.usage}\n\n${this.help}`)
			return
		}

		const drvs = filteredArgs[0]
		const lines = drvs.split('\n').map(line => line.trim()).filter(line => line !== '')
		let existing = db.existing.read()
		console.log('Before:', existing.length, 'derivations')

		if (abandon) {
			existing = existing.filter(item => !lines.includes(item))
			console.log('After:', existing.length, 'derivations')
			db.existing.write(existing)
			return
		}

		const successfulUninstalls = []
		const failedUninstalls = []

		for (const hash of lines) {
			if (!existing.includes(hash)) {
				console.log(`${style.yellow('Warning:')} Hash ${hash} not found in existing list, skipping`)
				continue
			}

			console.log(`Uninstalling ${hash}...`)
			const error = tryUninstallEffect(hash)
			if (error === null) {
				successfulUninstalls.push(hash)
			} else {
				failedUninstalls.push(hash)
			}
		}

		console.log(`\n${style.green('Successfully uninstalled:')} ${successfulUninstalls.length} effects`)

		if (failedUninstalls.length > 0) {
			console.log(dedent`
				${style.red('Failed to uninstall:')} ${failedUninstalls.length} effects

				You can either:
				1. Try again later after addressing the issues
				2. Force abandon these effects (without proper cleanup) using:

				jix force-remove --abandon '
				${failedUninstalls.join('\n')}
				'
			`)
		}

		console.log('After:', db.existing.read().length, 'derivations')
	}
}
