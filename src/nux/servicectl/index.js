import nux from "../base.js"
import db from "nux/db"
import launchdService from './launchd.js'
import systemdService from './systemd.js'

export const userServicesDir = db.stateDir("nux.services")
export const systemServicesDir = db.stateDir("nux.system-services")

const serviceImplementations = {
	macos: launchdService,
	nixos: systemdService,
	linux: systemdService,
};

export default ({
	label, 
	runscript, 
	system = false, 
	runOnInstall = true,
	noUninstall = false,
}) => nux.effect(target => {

  const servicesDir = system ? systemServicesDir : userServicesDir
  
  const PATH = target.os === "nixos"
		? "PATH=" + [
			"/bin", 
			"/usr/bin", 
			"/run/current-system/sw/bin", 
			"/nix/var/nix/profiles/default/bin",
		].join(":")  // these are necessary to get a POSIX shell on NixOS
		: ""

	let wrapperScript = nux.script`
		#!/bin/sh

    ${PATH}

    # ensure log dirs exist
		mkdir -p "${servicesDir}/${label}"

		add_timestamp() {
			while IFS= read -r line; do
				printf "%s\t%s\n" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$line"
			done
		}

		DPATH="${servicesDir}/${label}/details"
		
    set -o pipefail  # important

		while true; do
			
			START_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
			
			echo "$START_TIME,started,$$" >> "${servicesDir}/${label}/status"

			echo "exec=${runscript}" > "$DPATH"
			echo "state=started" >> "$DPATH"
			echo "start_time=$START_TIME" >> "$DPATH"
			echo "pid=$$" >> "$DPATH"

			# Execute the actual runscript, redirecting its output to the log file
			( ${runscript} ) 2>&1 | add_timestamp >> "${servicesDir}/${label}/log"
			
			EXIT_CODE=$?
			
			EXIT_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

      echo "$EXIT_TIME,exited,$EXIT_CODE" >> "${servicesDir}/${label}/status"

			echo "exec=${runscript}" > "$DPATH"
			echo "state=exited" >> "$DPATH"
			echo "start_time=$START_TIME" >> "$DPATH"
			# echo "" >> "$DPATH"
			echo "exit_time=$START_TIME" >> "$DPATH"
			echo "exit_code=$EXIT_CODE" >> "$DPATH"

			if [ $EXIT_CODE -eq 0 ]; then
				break  # Exit the loop on success
			else
				sleep 5
			fi
		done
	`;

	// this is just so MacOS shows a nice name in various UIs and not a hash
	wrapperScript = `${nux.dir({[label]: wrapperScript })}/${label}`

	const serviceImplementation = serviceImplementations[target.os];

	if (serviceImplementation) {

		let service = serviceImplementation({
			label,
			runscript: wrapperScript,
			system,
			runOnInstall,
			noUninstall,
		})

		return nux.target({
			host: target.host,
			user: system ? "root" : target.user,
		}, service)

	} else {
		throw new Error(`Unsupported platform: ${target.os}`);
	}
});

