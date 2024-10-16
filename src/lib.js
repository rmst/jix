import * as util from './util.js'
import { dedent, sh, shVerbose, execShFunction } from './util.js'
import * as fs from './node/fs.js'   // mimicking node:fs
import { NUX_PATH } from './context.js';
import { createHash } from './shaNext.js';
import { execFileSync } from './node/child_process.js'


const exx = (cmd, ...args) => {
	execFileSync(cmd, args)
	return {cmd: [cmd, ...args]}
}

const exxVerbose = (cmd, ...args) => {
	let options = { stdout: 'inherit' }
	execFileSync(cmd, args, options)
	return {cmd: [cmd, ...args], verbose: true}
}


const exxSsh = (host, ...cmd) => {
	// we need to escape our command and args because ssh can't actually execute commands without first passing the through a shell
	cmd = cmd.map(s => `'` + s.replaceAll(`'`, `'"'"'`) + `'`)
	return exx("ssh", `${host}`, "--", ...cmd)
}

export const deleteFileV1 = path => util.fileDelete(path, true)
export const deleteFileV2 = path => {
	return exx("rm", "-f", path)
}

export const execV1 = (...args) => {
	let cmd = args.slice(0, -1)
	// let hash = args[args.length - 1]
	return exx(...cmd)
}
export const shV1 = execV1


// TODO: this is unused, delete this
/* TODO: this should be (like all actions) environment agnostic as much as possible. It shouldn't yield different results if it is run by different users. This means that
	1. the permissions are the same for owner+group+all_users (i.e. enforce that each permission byte is the same)
or otherwise
	2. the owner and group need to be specified explicitly
*/
// export const writeFileV1 = (path, content, permissions) => util.fileWriteWithPermissions(path, content, permissions)


// export const symlinkV2 = (origin, path) => sh`ln -s ${origin} ${path}`
export const symlinkV3 = (origin, path) => {
	// FIXME: if the target is an existing directory it will create a link inside that dir, this needs to be fixed
	return exx('ln', '-s', origin, path)
}

// export const hardlinkV0 = (origin, path) => sh`ln ${origin} ${path}`
export const hardlinkV1 = (origin, path) => exx('ln', origin, path)

// TODO: delete
// TODO: this is terrible, it's not properly escaping the file contents
// export const writeFileSudoV1 = (path, content) => {
// 	console.log(`writeFileSudoV1: ${path}`)
//   sh`echo '${content}' | sudo tee ${path} > /dev/null`
// }
// export const writeConfSudoV1 = (path, content, reloadScript) => {
// 	writeFileSudoV1(path, content)
// 	if(reloadScript)
// 		sh`${reloadScript}`
// }

// export const writeScpV1 = (host, path, content) => {
// 	let tmp = sh`mktemp`
// 	try {
// 		util.fileWrite(tmp, content)
// 		sh`scp "${tmp}" "${host}:${path}"`
// 	} finally {
// 		util.fileDelete(tmp, true)
// 	}
// }
export const writeScpV2 = (host, path, content) => {
	return exxSsh(host, "sh", "-c", 'printf "%s" "$2" > "$1"', "--", path, content)
}

export const execShV1 = (script) => {
	// sh(script)
	return exx("/bin/sh", "-c", script)
}

export const execShVerboseV1 = (script) => {
	return exxVerbose("/bin/sh", "-c", script)
}

export const noop = () => null


export const buildV4 = (script, hash) => {
	// TODO: make output files read only
	return exxVerbose(
		"/bin/sh", 
		"-c", 
		dedent`
			echo BUILDV4 "$1"
			tmp="$HOME"/.nux/tmp_drv/${hash}

			mkdir -p "$HOME"/.nux/out
			mkdir -p "$tmp"

			export out="$HOME"/.nux/${hash}
			export NUX_HASH=${hash}
			# /bin/sh -c "$1"  # for build script string
			"$1"  # for build script path
			exitcode=$?

			rm -rf "$tmp"

			exit $exitcode
		`,
		"--",
		script,
	)
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
	
	sh`cp '${path}' '${NUX_PATH}/out/${hash}'`
}