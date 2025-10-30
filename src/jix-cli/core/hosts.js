import * as fs from "node:fs"
import context from "../../jix/context"
import { LOCAL_JIX_PATH } from "../../jix/context"
import { executeCmd } from "./installEffect";
import { dedent } from "../../jix/dedent"
import process from "node:process";
import { UserError } from "./UserError.js"
import db from "../db/index.js"

/**
 * Describes the properties of a single system user.
 * @typedef {object} UserInfo
 * @property {string} uid - The user ID.
 * @property {string} gid - The primary group ID.
 * @property {string} home - The path to the user's home directory.
 * @property {string} shell - The path to the user's default shell.
 */

/**
 * Represents detailed information about a host machine.
 * @typedef {object} HostInfo
 * @property {string} address - The IP address of the host.
 * @property {'macos' | 'nixos' | 'linux'} os - The name of the operating system (e.g., "nixos").
 * @property {'Linux' | 'Darwin'} kernel_name - The name of the kernel (e.g., "Linux").
 * @property {string} hostname - The hostname of the machine.
 * @property {string} architecture - The system architecture (e.g., "x86_64").
 * @property {string} os_version - The version of the operating system.
 * @property {Object<string, UserInfo>} [users] - A dictionary of system users, where the key is the username.
 * @property {string} machineId - A unique identifier for the machine.
 * @property {string} [friendlyName]
 */

/**
 * @global
 * @type {[HostInfo]}
 */
globalThis.jixHosts


/**
 * @argument {[HostInfo]} hosts 
 */
const writeHosts = (hosts) => {
	if (!fs.existsSync(LOCAL_JIX_PATH))
		throw Error(`Jix path doesn't exist: ${LOCAL_JIX_PATH}`)


  db.hosts.write(hosts)
  loadHosts()
}


/**
 * @returns {[HostInfo]}
 */
const loadHosts = () => {
	// TODO: don't export this, maybe?
  let hosts = []
  if (db.hosts.exists()) {
    hosts = db.hosts.read()
  }
  // console.log("LOAD HOSTS", hosts)
  // context.hosts = hosts  // TODO: is this used anywhere?

	return hosts
};


/**
 * Query host OS information.
 *
 * @param {string} address - Host address ("localhost" for local, IP/hostname for remote)
 * @param {string} user
 * @returns {Omit<HostInfo, "users">}
 */
export const queryHostInfo = (address, user) => {

	let sh = (...args) => executeCmd({
		cmd: "/bin/sh",
		args: ["-c", dedent(...args)]
	}, address, user)

	const kernel_name = sh`uname -s`  // e.g. Linux, Darwin, FreeBSD

	/** @type {string} */
	let os 
	/** @type {string} */
	let os_version
	/** @type {string} */
	let machineId

	if(kernel_name === "Linux") {
		os = sh`grep "^ID=" /etc/os-release | cut -d'=' -f2 | tr -d '"'`
		os_version = sh`grep "^VERSION_ID=" /etc/os-release | cut -d'=' -f2 | tr -d '"'`

		// Get machine ID for Linux with systemd
		try {
			machineId = address === "localhost"
				? sh`cat /etc/machine-id || echo ""`.trim()
				: sh`cat /etc/machine-id`.trim()
			if (address !== "localhost" && !machineId) {
				throw new UserError("Failed to obtain machine ID from /etc/machine-id")
			}
		} catch (e) {
			throw new UserError(`Failed to obtain machine ID: ${e.message}`)
		}
	}

	else if (kernel_name === "Darwin") {
		os = "macos"
		os_version = sh`sw_vers -productVersion`

		// Get machine ID for macOS using Volume UUID
		try {
			machineId = sh`diskutil info / | awk '/Volume UUID/ {print $3}'`.trim()
			if (!machineId) {
				throw new UserError("Failed to obtain machine ID using diskutil")
			}
		} catch (e) {
			throw new UserError(`Failed to obtain machine ID: ${e.message}`)
		}
	}

	else {
		throw new UserError(`${kernel_name} currently unsupported`)
	}

	return {
		hostname: sh`uname -n`,
		architecture: sh`uname -m`,  // e.g. x86_64, arm64, aarch64
		os,
		os_version,
		machineId,
		address,
		kernel_name,
	}

}


/**
 * @param {{host: HostInfo, user: string}} x
 * @returns {UserInfo} 
 */
export const queryUserInfo = ({host, user}) => {
	let asUser = host.address === "localhost"
		? process.env.USER
		: user

	let sh = (...args) => executeCmd({
		cmd: "/bin/sh",
		args: ["-c", dedent(...args)]
	}, host.address, asUser)

	return {
		// name: sh`whoami`,
		uid: sh`id -u -- '${user}'`,
		gid: sh`id -g -- '${user}'`,
		home: host.os === "macos"
			? sh`id -P "${user}" | awk -F: '{print $9}'`
			: sh`getent passwd -- "${user}" | cut -d: -f6`,
		shell: host.os === "macos"
			? sh`id -P "${user}" | awk -F: '{print $10}'`
			: sh`getent passwd --  "${user}" | cut -d: -f7`,
	}

}


/**
	@param {
		  {address: string}
		| {machineId: string} 
		| {friendlyName: string}
	} x 
	@returns {HostInfo}
*/
const getHostInfo = (x) => {
	if(typeof x !== "object")
		throw TypeError(`Must be object: ${x}`)

	if(!globalThis.jixHosts)
		globalThis.jixHosts = loadHosts()
	
	if("address" in x) {
		for (const hostInfo of globalThis.jixHosts) {
			if (hostInfo.address === x.address)
				return hostInfo
		}
	}
	else if("machineId" in x) {
		for (const hostInfo of globalThis.jixHosts) {
			if (hostInfo.machineId === x.machineId)
				return hostInfo
		}
	}
	else if("friendlyName" in x) {
		// TODO: Backward compatibility - maybe remove in future
		// Tries to find by old friendly name (e.g., "home")
		for (const hostInfo of globalThis.jixHosts) {
			if (hostInfo.friendlyName === x.friendlyName)
				return hostInfo
		}
	}
	else {
		throw Error(`Argument can't be: ${x}`)
	}

	// throw Error(`Host not found with property: ${x}`)
	return null
}


/**
 * @param {HostInfo} hostInfo
 */
const setHostInfo = (hostInfo) => {
	if(!globalThis.jixHosts)
		globalThis.jixHosts = loadHosts()

	let idx = globalThis.jixHosts.findIndex(x => x.machineId === hostInfo.machineId)

	if(idx === -1) {
		// throw Error(`${hostInfo.machineId} not in hosts.json`)
		globalThis.jixHosts.push(hostInfo)
	} else {
		globalThis.jixHosts[idx] = hostInfo
	}

	writeHosts(globalThis.jixHosts)
}


/**
 * @param {string|null} machineIdOrFriendlyName
 * @param {string|null} userMayBeNull
 * @returns {{address: string, user: string}}
 */
export const resolveEffectTarget = (
	machineIdOrFriendlyName, // TODO: rename this to machineId
	userMayBeNull
) => {
	
	// TODO: Backward compatibility - remove in future
	// Handle old null user -> use current user
	if (!userMayBeNull) {
		if(machineIdOrFriendlyName)
			throw Error(`User can only be null for localhost not ${machineIdOrFriendlyName}`)
		userMayBeNull = process.env.USER
	}

	if (!userMayBeNull) {
		throw new UserError("Could not determine user (USER environment variable not set)")
	}

	// TODO: Backward compatibility - remove in future
	// Handle old null machineId -> localhost
	if (!machineIdOrFriendlyName) {
		return { address: "localhost", user: userMayBeNull }
	}

	const hostData = getHostInfo({machineId: machineIdOrFriendlyName})

	if (!hostData.address) {
		throw new UserError(`Host ${machineIdOrFriendlyName} has no address configured`)
	}

	return { address: hostData.address, user: userMayBeNull }
}

/**
	@param {
		  {address: string}
		| {machineId: string} 
		| {friendlyName: string}
	} host
	@param {string} user
	@param {boolean} [update]
	@returns {HostInfo}
 */
export const hostInfoWithUser = (host, user, update=false) => {
	if(typeof host !== "object")
		throw TypeError(`Must be object: ${host}`)

	if(!user)
		throw new Error(`hostInfo requires non-null user (got user: ${user})`)

	let hostInfo = getHostInfo(host)
	
	if(update || !hostInfo || !hostInfo.machineId) {
		console.log(`Updating OS info for ${host} via user ${user}`)

		if(!("address" in host))
			throw Error(`Needs host with address but got: ${host}`)

		hostInfo = {
			...hostInfo,
			...queryHostInfo(host.address, user),
		}

		setHostInfo(hostInfo)
	}

	
	if(!hostInfo?.users?.[user]) {
		console.log(`Updating user info for ${user}@${hostInfo.address}`)

		const userInfo = queryUserInfo({
			host: hostInfo,
			user,			
		})

		hostInfo = {
			...hostInfo,
			users: {...(hostInfo.users || {}), [user]: userInfo},
		}

		setHostInfo(hostInfo)
	}

	return hostInfo
}
