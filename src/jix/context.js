import process from 'node:process'

// Project-wide constants
export const JIX_DIR = '.jix'               // relative to the user home
export const MANIFEST_BASENAME = '__jix__.js'
export const LOCAL_HOME = process.env.HOME
export const LOCAL_USER = process.env.USER
export const LOCAL_JIX_PATH = `${LOCAL_HOME}/${JIX_DIR}`  // local path
export const TMP_PATH = `${LOCAL_JIX_PATH}/tmp`
export const LOCAL_BIN_PATH = `${LOCAL_JIX_PATH}/bin`
export const LOCAL_STORE_PATH = `${LOCAL_JIX_PATH}/store`
export let ACTIVE_HASHES_PATH = `${LOCAL_JIX_PATH}/active.json`
export const EXISTING_HASHES_PATH = `${LOCAL_JIX_PATH}/existing.json`

export const MAGIC_STRING = "d6165af5669c8a3de2aab402ad97c778"
export const MAGIC_STRING2 = "494ff5669c8a3de2aab402ad974fhdaf"

/*
Warning: This HASH_PLACEHOLDER string should never appear any user generated content because it will be replaced by the derivation hash. However, I don't know why it would appear anywhere. The only place would be in this code base, in this file and here we keep it separated into two variables.

TODO: With one extra step it likely would be possible to use a random generated string instead. That random string would be first replaced with a constant value for hash computation and then finally with the computed hash. We should probably do this.
*/
export const HASH_PLACEHOLDER = `_HASH_PLACEHOLDER_${MAGIC_STRING2}` // we need to use this constant placeholder because there is no other way to make available the hash during the construction of an effect/derivation

export const HOME_PLACEHOLDER = `_HOME_PLACEHOLDER_${MAGIC_STRING2}` // TODO: ideally get rid of this; used in lots of places, search for jix.HOME


// We do this so that IDEs can infer the properties on jixContext better, while also being able to handle that this module code may execute multiple times.
let originalCtx = globalThis.jixContext

globalThis.jixContext = {
	hosts: null,

	HOME: HOME_PLACEHOLDER,
	JIX_PATH: HOME_PLACEHOLDER + "/" + JIX_DIR,
	BIN_PATH: HOME_PLACEHOLDER + "/" + JIX_DIR + "/bin",

}

if(originalCtx)
	Object.assign(globalThis, {jixContext: originalCtx})


export default globalThis.jixContext
