import { queryHostInfo, queryUserInfo } from './core/hosts.js'
import { dedent } from '../nux/dedent.js'

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
	}
}
