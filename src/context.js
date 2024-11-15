import * as std from 'std';

export const NUX_DIR = '.nux'  // relative to the user home
const LOCAL_HOME = std.getenv('HOME')
export const LOCAL_NUX_PATH = `${LOCAL_HOME}/${NUX_DIR}`;  // local path
export const TMP_PATH = `${LOCAL_NUX_PATH}/tmp`;
export const LOCAL_BIN_PATH = `${LOCAL_NUX_PATH}/bin`;
export const LOCAL_STORE_PATH = `${LOCAL_NUX_PATH}/store`;



const MAGIC_STRING = "d6165af5669c8a3de2aab402ad97c778"
// WARNING: the HASH_PLACEHOLDER string should never appear any user generated content because it will be replaced by the derivation hash!
export const HASH_PLACEHOLDER = `_HASH_PLACEHOLDER_${MAGIC_STRING}`  




// if(!globalThis.nuxContext) {

// }

// const scope = (fn) => {
// 	let originalCtx = {...globalThis.nuxContext}
// 	// Object.assign(globalThis.nuxContext, ctx)
// 	let result = fn()  // context change is defined here
// 	Object.assign(globalThis.nuxContext, originalCtx)
// 	return result
// }

const remote = (host, user, fn) => {
	let c = globalThis.nuxContext
	let original = {host: c.host, user: c.user}
	Object.assign(globalThis.nuxContext, {host, user})
	let result = fn()
	Object.assign(globalThis.nuxContext, original)
	return result ?? []
}

const home = () => {
	let c = globalThis.nuxContext
	if(c.host === null) {
		if(c.user === null)
			return LOCAL_HOME
		else
			throw Error("Not Implemented Yet: Getting the home for other local users")
	}
	let defaultHome = c.user === "root" ? "/root" : "/home/" + c.user
	let h = c?.hosts?.[c.host]?.users?.[c.user]?.home ?? defaultHome
	return h
}

// We do this so that IDEs can infer the properties on nuxContext better, while also being about to handle that this module code gets executed multiple times which does happens sometimes for some reason.
let originalCtx = globalThis.nuxContext

globalThis.nuxContext = {
	hosts: null,
	repo: null,  // TODO: maybe remove? we can also do import.meta.url instead i think
	// verbose: false,
	host: null,
	user: null,
	home,
	get HOME() { return home() },
	get NUX_PATH() { return home() + "/" + NUX_DIR },
	get BIN_PATH() { return home() + "/" + NUX_DIR + "/bin"},

	// scope
	remote
}

if(originalCtx)
	Object.assign(globalThis, {nuxContext: originalCtx})


export default globalThis.nuxContext