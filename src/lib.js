import * as std from 'std';
import * as os from 'os';
import * as util from './util.js'
import { dedent, sh, shVerbose, execShFunction } from './util.js'
import * as fs from './node/fs.js'   // mimicking node:fs
import { NUX_PATH } from './const.js';
import { createHash } from './shaNext.js';


export const deleteFileV1 = path => util.fileDelete(path, true)


/* TODO: this should be (like all actions) environment agnostic as much as possible. It shouldn't yield different results if it is run by different users. This means that
	1. the permissions are the same for owner+group+all_users (i.e. enforce that each permission byte is the same)
or otherwise
	2. the owner and group need to be specified explicitly
*/
export const writeFileV1 = (path, content, permissions) => util.fileWriteWithPermissions(path, content, permissions)


// FIXME: if the target is an existing directory it will create a link inside that dir, this needs to be fixed
export const symlinkV2 = (origin, path) => sh`ln -s ${origin} ${path}`

export const hardlinkV0 = (origin, path) => sh`ln ${origin} ${path}`

// TODO: this is terrible, it's not properly escaping the file contents
export const writeFileSudoV1 = (path, content) => {
	console.log(`writeFileSudoV1: ${path}`)
  sh`echo '${content}' | sudo tee ${path} > /dev/null`
}

export const writeConfSudoV1 = (path, content, reloadScript) => {
	writeFileSudoV1(path, content)
	if(reloadScript)
		sh`${reloadScript}`
}

export const writeScpV1 = (host, path, content) => {
	let tmp = sh`mktemp`
	try {
		util.fileWrite(tmp, content)
		sh`scp "${tmp}" "${host}:${path}"`
	} finally {
		util.fileDelete(tmp, true)
	}
}

export const execShV1 = (script) => {
	sh(script)
}


export const remoteNixosRebuildSwitchV1 = (host, hash) => {
	// hash is just a dummy variable to force the action
	shVerbose`
		start=$(date +%s)
		ssh ${host} nixos-rebuild switch
		echo nixos-rebuild switch ran for $(($(date +%s)-start)) seconds
	`
}

export const noop = () => {}


// export const buildV1 = (script, hash) => {
// 	sh`mkdir -p ${NUX_PATH}/out`
// 	execShFunction({verbose: true, env: {out: `${NUX_PATH}/out/${hash}`}})(script)
// }


export const buildV3 = (script, hash) => {
	sh`mkdir -p ${NUX_PATH}/out`
	execShFunction({verbose: true, env: {out: `${NUX_PATH}/out/${hash}`}})(script)
}

export const writeOutFileV1 = (content, mode, hash) => {
	sh`mkdir -p ${NUX_PATH}/out`
	let path = `${NUX_PATH}/out/${hash}`
	fs.writeFileSync(path, content)
	fs.chmodSync(path, mode)
}


export const copyV1 = (path, fileHash, hash) => {

	// TODO: check path against file hash!!
	// TODO: make it work with MacOS' copy on write

	// TODO: maybe make it work for directories?
	
	sh`cp "${path}" "${NUX_PATH}/out/${hash}"`
}