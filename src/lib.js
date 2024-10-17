import * as util from './util.js'
import { dedent, sh, shVerbose, execShFunction } from './util.js'
import * as fs from './node/fs.js'   // mimicking node:fs
import { NUX_DIR } from './context.js';
import { createHash } from './shaNext.js';
import { execFileSync } from './node/child_process.js'


const exx = (cmd, ...args) => {
	// execFileSync(cmd, args)
	return {cmd, args}  // this output is used in install.js
}

const exxVerbose = (cmd, ...args) => {
	// let options = { stdout: 'inherit' }
	// execFileSync(cmd, args, options)
	return {cmd, args, verbose: true}  // this output is used in install.js
}


const exxSsh = (host, ...cmd) => {
	// we need to escape our command and args because ssh can't actually execute commands without first passing the through a shell
	cmd = cmd.map(s => `'` + s.replaceAll(`'`, `'"'"'`) + `'`)
	return exx("ssh", `${host}`, "--", ...cmd)
}

// export const deleteFileV1 = path => util.fileDelete(path, true)
export const deleteFileV2 = path => {
	return exx("rm", "-f", path)
}

export const execV1 = (...args) => {
	let cmd = args.slice(0, -1)
	// let hash = args[args.length - 1]
	return exx(...cmd)
}
export const shV1 = execV1


export const symlinkV3 = (origin, path) => {
	// FIXME: if the target is an existing directory it will create a link inside that dir, this needs to be fixed
	return exx('ln', '-s', origin, path)
}

// export const hardlinkV0 = (origin, path) => sh`ln ${origin} ${path}`
export const hardlinkV1 = (origin, path) => exx('ln', origin, path)

export const writeScpV2 = (host, path, content) => {
	return exxSsh(host, "sh", "-c", 'printf "%s" "$2" > "$1"', "--", path, content)
}

export const execShV1 = (script) => {
	return exx("/bin/sh", "-c", script)
}

export const execShVerboseV1 = (script) => {
	return exxVerbose("/bin/sh", "-c", script)
}

export const noop = () => null


export const buildV5 = (script, hash) => {
	// TODO: make output files read only
	return exxVerbose(
		"/bin/sh", 
		"-c", 
		dedent`
			# echo buildV5  "$1"
			tmp="$HOME"/${NUX_DIR}/tmp_drv/${hash}

			mkdir -p "$HOME"/${NUX_DIR}/out
			mkdir -p "$tmp"

			export out="$HOME"/${NUX_DIR}/out/${hash}
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

export const buildV6 = (script, hash) => {
	// TODO: make output files read only
	return exxVerbose(
		"/bin/sh", 
		"-c", 
		dedent`
			# echo buildV5  "$1"
			tmp="$HOME"/${NUX_DIR}/tmp_drv/${hash}

			mkdir -p "$HOME"/${NUX_DIR}/out
			mkdir -p "$tmp"

			export out="$HOME"/${NUX_DIR}/out/${hash}
			export NUX_HASH=${hash}
			/bin/sh -c "$1"  # for build script string
			# "$1"  # for build script path
			exitcode=$?

			rm -rf "$tmp"

			exit $exitcode
		`,
		"--",
		script,
	)
}


// export const writeOutFileV1 = (content, mode, hash) => {
// 	sh`mkdir -p ${NUX_PATH}/out`
// 	let path = `${NUX_PATH}/out/${hash}`
// 	fs.writeFileSync(path, content)
// 	fs.chmodSync(path, mode)
// }
export const writeOutFileV2 = (content, mode, hash) => {
	return exx(
		"sh", 
		"-c", 
		dedent`
			mkdir -p "$HOME/${NUX_DIR}/out"
			path="$HOME/${NUX_DIR}/out/${hash}"
			printf "%s" "$1" > "$path" &&
			chmod ${mode} "$path"
		`, 
		"--", 
		content,
	)
}
export const writeOutFileV3 = writeOutFileV2

// export const copyV1 = (path, fileHash, hash) => {

// 	// TODO: check path against file hash!!
// 	// TODO: make it work with MacOS' copy on write

// 	// TODO: maybe make it work for directories?
	
// 	sh`cp '${path}' '${NUX_PATH}/out/${hash}'`
// }