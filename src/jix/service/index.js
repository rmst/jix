import jix, { dirWith } from "../base.js"
import { Effect } from "../effect.js"
import stateDir from "../stateDir.js"
import launchdService from './launchd.js'
import systemdService from './systemd.js'

export const userServicesDir = () => stateDir("jix.user-services")
export const systemServicesDir = () => stateDir("jix.services")

const serviceImplementations = {
	macos: launchdService,
	nixos: systemdService,
}

/**
	Create a persistent background service
	@param {Object} config - Service configuration
	@param {string} config.name - Service identifier (alphanumerics, dots, hyphens, underscores, and @ only)
	@param {string|import("../effect.js").EffectOrFn} config.exec - Path to executable or script effect
	@param {boolean} [config.system=false] - Install as system service if true
	@param {boolean} [config.runOnInstall=true] - Start service on install
	@param {boolean} [config.noUninstall=false] - Skip uninstallation
	@param {Array} [config.dependencies=[]] - Additional dependencies for the service
	@returns {Effect}
 */
export default ({
	name,
	exec,
	system = false,
	runOnInstall = true,
	noUninstall = false,
	dependencies = [],
}) => {

	const target = jix.target()
	const targetUser = target.host.users[system ? "root" : target.user.name]

	return targetUser.install(() => {

		if(typeof name !== "string" || !name)
			throw Error(`Invalid arg "name": ${name}`)

		if(!/^[a-zA-Z0-9._@-]+$/.test(name))
			throw Error(`Invalid arg "name": Name can only contain alphanumerics, dots, hyphens, underscores, and @. Instead, got: ${name}`)

		if(exec === null || exec === undefined)
			throw Error(`Invalid arg "exec": null/undefined`)
		
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
			mkdir -p "${servicesDir}/${name}"

			add_timestamp() {
				while IFS= read -r line; do
					printf "%s\t%s\n" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$line"
				done
			}

			DPATH="${servicesDir}/${name}/details"

			set -o pipefail  # important

			while true; do

				START_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

				echo "$START_TIME,started,$$" >> "${servicesDir}/${name}/status"

				echo "exec=${exec}" > "$DPATH"
				echo "state=started" >> "$DPATH"
				echo "start_time=$START_TIME" >> "$DPATH"
				echo "pid=$$" >> "$DPATH"

				# Execute the actual runscript, redirecting its output to the log file
				( ${exec} ) 2>&1 | add_timestamp >> "${servicesDir}/${name}/log"

				EXIT_CODE=$?

				EXIT_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

				echo "$EXIT_TIME,exited,$EXIT_CODE" >> "${servicesDir}/${name}/status"

				echo "exec=${exec}" > "$DPATH"
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
		wrapperScript = jix.str`${dirWith({[name]: wrapperScript })}/${name}`

		const serviceImplementation = target.host.os === "macos"
			? launchdService
			: target.host.kernel_name === "Linux"
			? systemdService
			: (()=>{throw new Error(`Unsupported platform: ${target.host.os}`)})()


		return serviceImplementation({
			name,
			exec: wrapperScript,
			system,
			runOnInstall,
			noUninstall,
			dependencies,
		})
	})
}
