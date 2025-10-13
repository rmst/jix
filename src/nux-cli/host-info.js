import { queryHostInfo, queryUserInfo } from './core/hosts.js'
import { dedent } from '../nux/dedent.js'
import db from './db/index.js'
import set from './core/set.js'
import { shortPath } from './effectUtil.js'

export default {
	name: 'host-info',
	description: 'Query and display host and user information.',
	usage: 'nux host-info [host] [user]',
	help: dedent`
	Query OS and user information for a local or remote host.

	Arguments:
	  [host]  Optional hostname; omitted means local
	  [user]  Optional user; omitted means current user

	Example:
	  nux host-info
	  nux host-info example.com alice
	`,
	run(a) {
		if (a.includes('--help') || a.includes('-h')) {
			console.log(`Usage:\n  ${this.usage}\n\n${this.help}`)
			return
		}
		const host = a[0] || null
		const user = a[1] || null
		console.log(JSON.stringify(queryHostInfo(host, user), null, 2))
		console.log(JSON.stringify(queryUserInfo(host, user), null, 2))

		// Show applied effects for this target
		if (db.active.exists()) {
			let activeHashesById = db.active.read()
			let activeHashes = set(Object.values(activeHashesById).flat()).list()

			let effectsForTarget = activeHashes
				.map(hash => {
					let effectData = db.store.read(hash)
					return { ...effectData, hash }
				})
				.filter(effectData => {
					// Filter by target
					let matchesHost = (host === null && !effectData.host) || effectData.host === host
					let matchesUser = (user === null && !effectData.user) || effectData.user === user
					return matchesHost && matchesUser
				})

			console.log(`\nApplied effects: ${effectsForTarget.length}`)

			let effectsWithValidPaths = effectsForTarget.filter(effectData => effectData.path)

			if (effectsWithValidPaths.length > 0) {
				console.log('\nApplied effects with valid paths:')
				effectsWithValidPaths.forEach(effectData => {
					let path = shortPath(effectData.hash)
					console.log(`${path}\t${effectData.path}`)
				})
			}
		}
	}
}
