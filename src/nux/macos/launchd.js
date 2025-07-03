import context from "../context"
import nux from "../base"
import db from "nux/db"

const timeout_script = nux.script`
	#!/usr/bin/env perl
	alarm shift; exec @ARGV;
`

export const jobsDir = db.stateDir("nux.jobs")

/**
	to see the logs: log show --predicate 'senderImagePath CONTAINS "test"' --info

	let name = sha256(JSON.stringify([config, script]))

	TODO: maybe allow JS objects and generate xml?

	EXAMPLE:
	```js
	nux.launchdJob(
		"test",
		dedent`
			<key>StartInterval</key>
			<integer>10</integer>
			<key>RunAtLoad</key>
			<true/>
		`,
		dedent`
			#!/bin/bash
			NOW=$(date +"%Y-%m-%d %H:%M:%S")
			echo "hello launchd"
			echo "$NOW ga" >> ~/text.txt
		`,
		HOME
	),
	```
*/
export const launchdJob = ({name, config, runscript, timeout=null}) => {
	/* 
		https://chat.openai.com/g/g-YyyyMT9XH-chatgpt-classic/c/4a977680-d227-4001-a228-5f4b65a19910
	*/

	name ?? (()=>{throw Error()})()
	config ?? (()=>{throw Error()})()
	runscript ?? (()=>{throw Error()})()

	// TODO: the timeout mechanism should be in separate wrapper function

	let label = `com.nux.${name}`
	let wpath = `${context.BIN_PATH}/nux_job_${name}`
	let ppath = `${context.HOME}/Library/LaunchAgents/${label}.plist`
	let logpath = `${jobsDir}/logs/${name}`

	let timeout_cmd = timeout == null ? "" : `${timeout_script} ${timeout}`  

	let wrapper = nux.script`
		#!/usr/bin/env zsh

		scripthash=$(basename ${runscript})

		add_timestamp() {
			while IFS= read -r line; do
				printf "%s\t%s\n" "$(date "+%Y-%m-%d %H:%M:%S")" "$line"
			done
		}

		mkdir -p "${jobsDir}/status"

		echo "$(date "+%Y-%m-%d %H:%M:%S"),$scripthash,start" >> "${jobsDir}/status/${name}"


		set -o pipefail  # if any of the pipe's process fail output a non-zero exit code 

		# Run the script and process its output
		{ ${timeout_cmd} "${runscript}" 2>&1 ; } | add_timestamp

		exitcode=$?
		echo "$(date "+%Y-%m-%d %H:%M:%S"),$scripthash,stop,$exitcode" >> "${jobsDir}/status/${name}"
	`
	.symlinkTo(wpath)

	let plist = nux.textfile`
		<?xml version="1.0" encoding="UTF-8"?>
		<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
		<plist version="1.0">
		<dict>
				<key>Label</key>
				<string>${label}</string>
				<key>ProgramArguments</key>
				<array>
					<string>${wrapper}</string>
				</array>
				<key>StandardErrorPath</key>
				<string>${logpath}</string>
				<key>StandardOutPath</key>
				<string>${logpath}</string>

		${config}

		</dict>
		</plist>
	`
		.symlinkTo(ppath)


	let TARGET = "gui/$(id -u)"
	// let TARGET = "user/$(id -u)"

	let load_unload = nux.effect({
		// https://chat.openai.com/g/g-YyyyMT9XH-chatgpt-classic/c/2c6eb981-9987-4ac6-8cb3-48877d315b48

		install: ["execShV1", nux.dedent`
			# uninstall if launch agent already exists (to increase robustness)
			launchctl list | grep -q ${label} && launchctl bootout ${TARGET}/${label} || true
			launchctl bootstrap ${TARGET} "${plist}"
		`],
		uninstall: ["execShV1", nux.dedent`
			# do nothing if launch agent doesn't exist (to increase robustness)
			launchctl list | grep -q ${label} || exit 0  
			launchctl bootout ${TARGET}/${label}
		`],
		dependencies: [ plist ]
	})

	return [
		load_unload,
	]
}
