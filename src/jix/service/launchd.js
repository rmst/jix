import jix from "../base"


export default ({
	name,
	exec,
	system = false,
	runOnInstall = true,
	noUninstall = false,
	dependencies = [],
}) => {

	const target = jix.target()

	name ?? (()=>{throw Error("name is required")})()
	exec ?? (()=>{throw Error("exec is required")})()

	const plistPath = system
		? `/Library/LaunchDaemons/${name}.plist`
		: `${target.user.home}/Library/LaunchAgents/${name}.plist`;

	const launchdTarget = system ? "system" : `gui/$(id -u)`;

	const runAtLoadConfig = runOnInstall
		? `<key>RunAtLoad</key><true/>`
		: '';

	const plist = jix.textfile`
		<?xml version="1.0" encoding="UTF-8"?>
		<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
		<plist version="1.0">
		<dict>
			<key>Label</key>
			<string>${name}</string>
			<key>ProgramArguments</key>
			<array>
				<string>${exec}</string>
			</array>
			${runAtLoadConfig}
		</dict>
		</plist>
	`.symlinkTo(plistPath)


	// TODO: this works but should ideally be health-check-based
	let waitUntilSuccessfulStartup = runOnInstall ? "sleep 0.5" : ""

	return jix.effect({
		// if necessary, this will replace existing
		install: ["execShV1", jix.dedent`
			# Unload existing job to ensure it's updated
			launchctl list | grep -q ${name} && launchctl bootout ${launchdTarget}/${name} || true
			# Load the new job
			launchctl bootstrap ${launchdTarget} "${plist}"
			${waitUntilSuccessfulStartup}
		`],
		uninstall: noUninstall ? null : ["execShV1", jix.dedent`
			# Do nothing if the job isn't loaded
			launchctl list | grep -q ${name} || exit 0
			# Unload the job
			launchctl bootout ${launchdTarget}/${name}
		`],
		dependencies: [ plist, ...dependencies ],
		str: name,
	})
	
	
}

