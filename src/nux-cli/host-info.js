import { queryHostInfo, queryUserInfo, hostInfoWithUser } from './core/hosts.js'
import { dedent } from '../nux/dedent.js'
import db from './db/index.js'
import set from './core/set.js'
import { shortPath } from './effectUtil.js'
import process from 'node:process'

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
		const host = a[0] || "localhost"
		const user = a[1] || process.env.USER
		
		let hostInfo = hostInfoWithUser(host, user, true)
		console.log(JSON.stringify({...hostInfo, users: undefined}, null, 2))
		const userInfo = hostInfo.users[user]
		console.log(JSON.stringify(userInfo, null, 2))

		// Show applied effects for this target
		if (db.active.exists()) {
			let activeHashesById = db.active.read()
			let activeHashes = set(Object.values(activeHashesById).flat()).list()

			// Get the machineId for the requested host
			const targetHostInfo = hostInfoWithUser(host, user)
			const targetMachineId = targetHostInfo.machineId

			let effectsForTarget = activeHashes
				.map(hash => {
					let effectData = db.store.read(hash)
					return { ...effectData, hash }
				})
				.filter(x => (x.host === targetMachineId && x.user === user))

			console.log(`\nApplied effects: ${effectsForTarget.length}`)

			const hostNuxDir = `${userInfo.home}/.nux/`
			let effectsWithValidPaths = effectsForTarget
				.filter(effectData => effectData.path)
				.filter(effectData => !effectData.path.startsWith(hostNuxDir))

			if (effectsWithValidPaths.length > 0) {
				console.log('\nApplied effects with valid paths:')
				effectsWithValidPaths.forEach(effectData => {
					let path = shortPath(effectData.hash)
					console.log(`${path} ${effectData.path}`)
				})
			}
		}
	}
}
