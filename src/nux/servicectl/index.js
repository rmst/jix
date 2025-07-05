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
	runOnInstall = true
}) => nux.effect(target => {

  const servicesDir = system ? systemServicesDir : userServicesDir
  
	const logFile = `${servicesDir}/logs/${label}`;
	const statusFile = `${servicesDir}/status/${label}`;

  const PATH = target.os == "nixos" ? "PATH=/bin:/usr/bin:/run/current-system/sw/bin:/nix/var/nix/profiles/default/bin" : ""

	let wrapperScript = nux.script`
		#!/bin/sh

    ${PATH}

    # ensure log dirs exist
		mkdir -p "${servicesDir}/logs"
		mkdir -p "${servicesDir}/status"

		add_timestamp() {
			while IFS= read -r line; do
				printf "%s\t%s\n" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$line"
			done
		}
		
    set -o pipefail  # important

		while true; do
			echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ"),started,$$" >> "${statusFile}"

			# Execute the actual runscript, redirecting its output to the log file
			( ${runscript} ) 2>&1 | add_timestamp >> "${logFile}"
			
			exit_code=$?
			
      echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ"),exited,$exit_code" >> "${statusFile}"

			if [ $exit_code -eq 0 ]; then
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
			runOnInstall
		})

		return nux.target({
			host: target.host,
			user: system ? "root" : target.user,
		}, service)

	} else {
		throw new Error(`Unsupported platform: ${target.os}`);
	}
});

