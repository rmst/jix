import jix, { dirWith, HASH } from "../base.js"
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
			EXITFILE="${servicesDir}/${name}/exitcode"

			# Exponential backoff: 1s, 5s, 10s, 30s, 2min, 10min, then stay at 10min
			BACKOFF_DELAYS="1 5 10 30 120 600"
			FAILURE_COUNT=0

			while true; do

				START_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
				START_EPOCH=$(date +%s)

				echo "$START_TIME,started,$$" >> "${servicesDir}/${name}/status"

				echo "exec=${exec}" > "$DPATH"
				echo "state=started" >> "$DPATH"
				echo "start_time=$START_TIME" >> "$DPATH"
				echo "pid=$$" >> "$DPATH"

				# Execute the actual runscript, capture exit code via file
				( ${exec}; echo $? > "$EXITFILE" ) 2>&1 | add_timestamp >> "${servicesDir}/${name}/log"

				EXIT_CODE=$(cat "$EXITFILE")

				EXIT_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
				EXIT_EPOCH=$(date +%s)
				RUNTIME=$((EXIT_EPOCH - START_EPOCH))

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
					# Reset failure count if service ran for more than 60 seconds
					if [ $RUNTIME -ge 60 ]; then
						FAILURE_COUNT=0
					fi

					FAILURE_COUNT=$((FAILURE_COUNT + 1))
					# Get delay for current failure count, use max delay if beyond list
					DELAY=$(echo "$BACKOFF_DELAYS" | awk -v n="$FAILURE_COUNT" '{if (n <= NF) print $n; else print $NF}')
					sleep "$DELAY"
				fi
			done
		`;

		// this is just so MacOS shows a nice name in various UIs and not a hash
		wrapperScript = jix.str`${dirWith({[name]: wrapperScript })}/${name}`

		if (globalThis.__jix_service_transient) {
			const waitUntilSuccessfulStartup = runOnInstall ? "sleep 0.5" : ""
			const startCmd = runOnInstall ? jix.dedent`
				mkdir -p "${servicesDir}/${name}"
				# Start in subshell with new process group
				/bin/sh -c '
					set -m  # Enable job control to create new process group
					${wrapperScript} > /dev/null 2>&1 < /dev/null &
					echo $!
				' > "${servicesDir}/${name}/pid"
			` : ''

			return jix.effect({
				install: ["execShV1", jix.dedent`
					${startCmd}
					${waitUntilSuccessfulStartup}
				`],
				uninstall: noUninstall ? null : ["execShV1", jix.dedent`
					# Kill process group if PID file exists
					if [ -f "${servicesDir}/${name}/pid" ]; then
						PID=$(cat "${servicesDir}/${name}/pid" 2>/dev/null || true)
						if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
							# Kill the process group (negative PID)
							kill -TERM -"$PID" 2>/dev/null || true
							# Wait for graceful shutdown
							for i in 1 2 3 4 5 6 7 8 9 10; do
								kill -0 "$PID" 2>/dev/null || break
								sleep 0.5
							done
							# Force kill if still alive
							kill -0 "$PID" 2>/dev/null && kill -KILL -"$PID" 2>/dev/null || true
						fi
						rm -f "${servicesDir}/${name}/pid"
					fi
				`],
				dependencies: [...dependencies],
				str: name,
				info: { type: "jix.service", name, system },
			})
		}

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
