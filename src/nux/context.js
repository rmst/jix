import process from 'node:process';

export const NUX_DIR = '.nux'  // relative to the user home
export const LOCAL_HOME = process.env.HOME
export const LOCAL_USER = process.env.USER
export const LOCAL_NUX_PATH = `${LOCAL_HOME}/${NUX_DIR}`;  // local path
export const TMP_PATH = `${LOCAL_NUX_PATH}/tmp`;
export const LOCAL_BIN_PATH = `${LOCAL_NUX_PATH}/bin`;
export const LOCAL_STORE_PATH = `${LOCAL_NUX_PATH}/store`;


export const MAGIC_STRING = "d6165af5669c8a3de2aab402ad97c778"

/*
Warning: This HASH_PLACEHOLDER string should never appear any user generated content because it will be replaced by the derivation hash. However, I don't know why it would appear anywhere. The only place would be in this code base, in this file and here we keep it separated into two variables.

TODO: With one extra step it likely would be possible to use a random generated string instead. That random string would be first replaced with a constant value for hash computation and then finally with the computed hash. We should probably do this.
*/
export const HASH_PLACEHOLDER = `_HASH_PLACEHOLDER_${MAGIC_STRING}` // we need to use this constant placeholder because there is no other way to make available the hash during the construction of an effect/derivation

export const HOME_PLACEHOLDER = `_HOME_PLACEHOLDER_${MAGIC_STRING}` // TODO: ideally get rid of this, unfortunately this is used in lots of places, search for nux.HOME

// export const USER_PLACEHOLDER = `_USER_PLACEHOLDER_${MAGIC_STRING}` // TODO: get rid of this, this is used almost never, search for nux.USER




// if(!globalThis.nuxContext) {

// }

// const scope = (fn) => {
// 	let originalCtx = {...globalThis.nuxContext}
// 	// Object.assign(globalThis.nuxContext, ctx)
// 	let result = fn()  // context change is defined here
// 	Object.assign(globalThis.nuxContext, originalCtx)
// 	return result
// }


// TODO: delete this (we now do nux.target([host, user], ...))
// const remote = (host, user, fn) => {
// 	let c = globalThis.nuxContext
// 	let original = {host: c.host, user: c.user}
// 	Object.assign(globalThis.nuxContext, {host, user})
// 	let result = fn()
// 	Object.assign(globalThis.nuxContext, original)
// 	return result ?? []
// }


// TODO: delete this
const home = () => {
	// let c = globalThis.nuxContext
	// if(c.host === null) {
	// 	if(c.user === null)
	// 		return LOCAL_HOME
	// 	else
	// 		throw Error("Getting the home for other local users is not implemented yet")
	// }
	// let defaultHome = c.user === "root" ? "/root" : "/home/" + c.user
	// let h = c?.hosts?.[c.host]?.users?.[c.user]?.home ?? defaultHome
	// return h
	return HOME_PLACEHOLDER
}

// We do this so that IDEs can infer the properties on nuxContext better, while also being about to handle that this module code gets executed multiple times which does happens sometimes for some reason.
let originalCtx = globalThis.nuxContext

globalThis.nuxContext = {
	hosts: null,
	repo: null,  // TODO: maybe remove? we can also do import.meta.url instead i think
	// verbose: false,
	// host: null,
	// user: null,

	// TODO: move the following to nux.js
	home,
	get HOME() { return home() },
	get NUX_PATH() { return home() + "/" + NUX_DIR },
	get BIN_PATH() { return home() + "/" + NUX_DIR + "/bin"},

	// scope
	// remote
}

if(originalCtx)
	Object.assign(globalThis, {nuxContext: originalCtx})


export default globalThis.nuxContext