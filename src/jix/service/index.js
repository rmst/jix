import jix from "../base.js"
import stateDir from "../stateDir.js"
import launchdService from './launchd.js'
import systemdService from './systemd.js'

export const userServicesDir = () => stateDir("jix.user-services")
export const systemServicesDir = () => stateDir("jix.services")

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
}) => {

	const target = jix.target()
	const targetUser = target.host.users[system ? "root" : target.user.name]

	return targetUser.install(() => {
			
		if(typeof label !== "string" || !label)
			throw Error(`Invalid arg "label": ${label}`)

		if(runscript === null || runscript === undefined)
			throw Error(`Invalid arg "runscript": null/undefined`)
		
		const servicesDir = system ? systemServicesDir : userServicesDir
		
		const PATH = target.host.os === "nixos"
			? "PATH=" + [
				"/bin", 
				"/usr/bin", 
				"/run/current-system/sw/bin", 
				"/nix/var/nix/profiles/default/bin",
			].join(":")  // these are necessary to get a POSIX shell on NixOS
			: ""

		let wrapperScript = jix.script`
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
		wrapperScript = jix.str`${jix.experimental.buildDir({[label]: wrapperScript })}/${label}`

		const serviceImplementation = serviceImplementations[target.host.os]

		if (serviceImplementation) {

			return serviceImplementation({
				label,
				runscript: wrapperScript,
				system,
				runOnInstall,
				noUninstall,
			})

		} else {
			throw new Error(`Unsupported platform: ${target.host.os}`);
		}
	})
}
