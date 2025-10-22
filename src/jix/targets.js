import { Effect } from './effect.js'

/**
 * Minimal host shape used by User handles.
 * @typedef {{
 *   address: string,
 *   os?: string,
 *   kernel_name?: string,
 *   hostname?: string,
 *   architecture?: string,
 *   os_version?: string,
 *   machineId?: string,
 *   friendlyName?: string,
 *   users: Record<string, User> & { root: User }
 * }} BaseHost
 */

/**
 * @template {Record<string, any>} Users
 * @typedef {{
 *   address: string,
 *   os?: string,
 *   kernel_name?: string,
 *   hostname?: string,
 *   architecture?: string,
 *   os_version?: string,
 *   machineId?: string,
 *   friendlyName?: string,
 *   users: ({ root: User } & { [K in keyof Users]: User } & Record<string, User>)
 * }} HostWithUsers
 */

/**
 * @typedef {{
 *   name: string,
 *   host: BaseHost,
 *   uid?: string,
 *   gid?: string,
 *   home?: string,
 *   shell?: string,
 * }} UserInfoShape
 */

/**
 * @typedef {User} UserHandle
 */

/**
 * @template {Record<string, any>} Users
 * Host object bound to an address.
 */
export class Host {
	/** @type {string} */
	address
	/** @type {{ root: User } & Record<string, User>} */
	users

	/**
	 * @template {Record<string, any>} Users
	 * @param {string} address
	 * @param {Users} [users]
	 */
	constructor(address, users = /** @type {any} */({})) {
		if (!address)
			throw new TypeError('Host requires a non-empty address')
		this.address = address
		// Build a plain users object (root + provided keys)
		this.users = /** @type {any} */(Object.fromEntries(
			['root', ...Object.keys(users)].map(u => [u, new User(this, u)])
		))

	}

	/**
	 * Run an installer callback with this host
	 * @template T
	 * @param {(host: this) => T} cb
	 * @returns {T}
	 */
	install(cb) {
		if (typeof cb !== 'function')
			throw new TypeError('Host.install(...) expects a function argument')
		return cb(this)
	}
}

/**
 * User on a given host
 */
export class User {
	/** @type {string} */
	name
	/** @type {BaseHost} */
	host

	/**
	 * @param {BaseHost} host
	 * @param {string} name
	 */
	constructor(host, name) {
		if (!name)
			throw new TypeError('User requires a non-empty name')
		this.host = host
		this.name = name
	}

	/**
	 * Target and install the given effect(s) for this user
	 * @param {any} x
	 */
	install(x) {
		return new Effect(x).target({ address: this.host.address, user: this.name })
	}
}
