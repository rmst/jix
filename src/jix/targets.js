import { hostInfoWithUser } from '../jix-cli/core/hosts.js'
import { TargetedEffect, withTarget } from './effect.js'


/** @template {Record<string, any>} Users */
export class Host {
	/** @type {string} */
	address 
	/** @type {{ root: User } & Record<string, User>} */
	users 
	/** @type {string} */
	os
	/** @type {string} */
	kernel_name
	/** @type {string} */
	architecture
	/** @type {string} */
	os_version
	/** @type {string} */
	machineId

	// TODO: add missing properties

	/**
	 * @param {string} address
	 * @param {Users} [users]
	 */
	constructor(address, users = /** @type {any} */({})) {
		if (!address)
			throw new TypeError('Host requires a non-empty address')
		this.address = address
		// Build a plain users object (root + provided keys)

		let hostInfo = {} /** @type {hostInfo} */
		this.users = /** @type {any} */(Object.fromEntries(
			[...Object.keys(users), 'root'].map(u => {
				hostInfo = hostInfoWithUser({address}, u)
				let userInfo = hostInfo.users[u]
				return [u, new User(this, u, userInfo)]
			})
		))

		hostInfo = {...hostInfo}
		delete hostInfo["users"]

		Object.assign(this, {...hostInfo})

	}

	/**
	 * @template T
	 * @param {(host: this) => T} fn
	 * @returns {T}
	 */
	install(fn) {
		if (typeof fn !== 'function')
			throw new TypeError('Host.install(...) expects a function argument')

		return withTarget({host: this, user: this.users.root}, () => fn(this))
	}
}


export class User {
	/** @type {string} */
	name
	/** @type {Host} */
	host
	/** @type {string} */
	home
	/** @type {string} */
	uid
	/** @type {string} */
	gid
	/** @type {string} */
	shell

	// TODO: add missing properties

	/**
	 * @param {Host} host
	 * @param {string} name
	 * @param {import('../jix-cli/core/hosts.js').UserInfo} info
	 */
	constructor(host, name, info) {
		if (!name)
			throw new TypeError('User requires a non-empty name')

		if (!(host instanceof Host))
			throw TypeError(host)
		
		this.host = host
		this.name = name
		Object.assign(this, info)
	}

	/**
	 * @template T
	 * @param {(user: this) => T} fn
	 * @returns {T}
	 */
	install(fn) {
		if (typeof fn !== 'function')
			throw new TypeError('Host.install(...) expects a function argument')
		
		return withTarget({host: this.host, user: this}, () => fn(this))
		// return new TargetedEffect({ machineId: this.host.machineId, user: this.name}, x)
	}
}
