import * as std from 'std';


export const NUX_PATH = `${std.getenv('HOME')}/.nux`;  // local path
export const TMP_PATH = `${std.getenv('HOME')}/.nux/tmp`;
export const BIN_PATH = `${std.getenv('HOME')}/.nux/bin`;
export const STORE_PATH = `${std.getenv('HOME')}/.nux/store`;

export const NUX_DIR = '.nux'  // relative to the user home

// if(!globalThis.nuxContext) {

// }

const scope = (fn) => {
	let originalCtx = {...globalThis.nuxContext}
	// Object.assign(globalThis.nuxContext, ctx)
	let result = fn()  // context change is defined here
	Object.assign(globalThis.nuxContext, originalCtx)
	return result
}


// We do this so that IDEs can infer the properties on nuxContext better, while also being about to handle that this module code gets executed multiple times which does happens sometimes for some reason.
let originalCtx = globalThis.nuxContext

globalThis.nuxContext = {
	repo: null,
	verbose: false,
	host: null,
	user: null,
	scope
}

if(originalCtx)
	globalThis.nuxContext = originalCtx


export default globalThis.nuxContext