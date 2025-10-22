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
 *   users: Record<string, UserHandle> & { root: UserHandle }
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
 *   users: ({ root: UserHandle } & { [K in keyof Users]: UserHandle } & Record<string, UserHandle>)
 * }} HostWithUsers
 */

/**
 * Callable host type that passes its full type into the callback parameter.
 * @template T
 * @typedef {((cb: (host: T) => any) => import('./effect.js').TargetedEffect) & T} HostCallable
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
 * @typedef {(
 *   ((fn: (u: UserInfoShape) => any) => import('./effect.js').TargetedEffect)
 * ) & (
 *   ((any) => import('./effect.js').TargetedEffect)
 * ) & UserInfoShape} UserHandle
 */

/**
 * @template {Record<string, any>} Users
 * Create a Host handle bound to an address.
 *
 * Pass an object literal of usernames so keys are preserved for IntelliSense:
 *   Host('10.0.0.1', { simon: {}, alice: {} })
 *
 * @param {string} address
 * @param {Users} [users]
 * @returns {HostCallable<HostWithUsers<Users>>}
 */
export function Host(address, users = /** @type {Users} */({})) {
	if (!address)
		throw new TypeError('Host requires a non-empty address')

	/** @type {HostCallable<HostWithUsers<Users>>} */
	function handle(cb) {
		if (typeof cb !== 'function')
			throw new TypeError('Host(...) expects a function argument')
		return cb(/** @type {any} */(handle))
	}

	handle.address = address

	// Build a plain users object (root + provided keys)
	// @ts-ignore
	handle.users = Object.fromEntries(['root', ...Object.keys(users)].map(u => [u, User(handle, u)]))

	return handle
}

/**
 * @param {BaseHost} hostHandle
 * @param {string} name
 * @returns {UserHandle}
 */
export function User(hostHandle, name) {
	if (!name)
		throw new TypeError('User requires a non-empty name')

	/** @type {UserHandle} */
	const userHandle = (x) => {
		return new Effect(x).target({ address: hostHandle.address, user: name })
	}

	userHandle.name = name
	userHandle.host = hostHandle

	return userHandle
}
