import * as fs from 'node:fs'
import { EXISTING_HASHES_PATH } from '../nux/context'
import { dedent } from '../nux/dedent.js'
import db from './db/index.js'


export function forceRemove(drvs) {
  const lines = drvs.split('\n').map(line => line.trim()).filter(line => line !== '')
  let existing = db.existing.read()
  console.log('Before:', existing.length, 'derivations')

  existing = existing.filter(item => !lines.includes(item))
  console.log('After:', existing.length, 'derivations')

  db.existing.write(existing)
}

export default {
	name: 'force-remove',
	description: 'Forcefully remove derivations.',
	usage: 'nux force-remove <drvs>',
	help: dedent`
	Force-remove one or more effect hashes from the existing set.

	Arguments:
	  <drvs>  Newline-separated list of hashes (single argument)

	Example:
	  nux force-remove 'hash1\nhash2'
	`,
	run(a) {
		if (!a[0] || a.includes('--help') || a.includes('-h')) {
			console.log(`Usage:\n  ${this.usage}\n\n${this.help}`)
			return
		}
		const drvs = a[0]
		forceRemove(drvs)
	}
}
