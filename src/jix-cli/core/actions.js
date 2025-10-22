import { dedent } from '../../jix/dedent.js';
import { NUX_DIR } from '../../jix/context.js';
import { shellEscape } from '../../jix/util.js';

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
	// we need to escape our command and args because ssh can't actually execute commands without first passing them through a shell
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


export const buildV6 = (script, hash) => {
	// TODO: make output files read only

	let extraLines = dedent`
		set -e  # error script if single command fails
		set -o pipefail  # error on piped command fails
		set -u  # error on unset variables
	`
	script = extraLines + '\n' + script

	return exxVerbose(
		"/bin/sh", 
		"-c", 
		dedent`
			tmp="$HOME"/${NUX_DIR}/tmp_drv/${hash}

			mkdir -p "$HOME"/${NUX_DIR}/out
			mkdir -p "$tmp"
			cd "$tmp"
			
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
		"/bin/sh", 
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

export const copyV2 = (from, to, hash) => {
	// TODO: check path against file hash, maybe?
	// TODO: make it work with MacOS' copy on write
	to = shellEscape(to)
	from = shellEscape(from)
	return exx("/bin/sh", "-c", dedent`
		[ -e ${to} ] && { echo "Error: Destination exists." >&2; exit 1; }
		cp -R ${from} ${to}
	`)
}



export const stateDirInstallV1 = (id) => {
	// TODO: the db-inactive backwards compatibility code can probably be deleted soon
	id = shellEscape(id)
	return exx("/bin/sh", "-c", dedent`
		ND="$HOME"/${shellEscape(NUX_DIR)}
		LINKDIR="$ND"/d
		SD="$ND"/db/${id}
		SD_INACTIVE="$ND"/db-inactive/${id}

		mkdir -p "$LINKDIR"

		if [ -d "$SD" ]; then
			exit 0  # we'll just accept that as the correct state dir
		else
			# for backwards compatibility
			rm -f "$SD"  # no error even if it doesn't exist
			if [ -d "$SD_INACTIVE" ]; then
				mv -f "$SD_INACTIVE" "$SD"  # reactivate old state dir
			else
				mkdir -p "$SD"  # new empty directory
			fi
		fi

		ln -sf '..'/db/${id} "$LINKDIR"/${id}  # mark as active
	`)
}

export const stateDirUninstallV1 = (id) => {
	id = shellEscape(id)
	return exx("/bin/sh", "-c", dedent`
		ND="$HOME"/${shellEscape(NUX_DIR)}
		LINKDIR="$ND"/d

		rm -f "$LINKDIR"/${id}
	`)
}
