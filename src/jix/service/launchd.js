import jix from "../base"


export default ({
	label, 
	runscript, 
	system = false, 
	runOnInstall = true,
	noUninstall = false,
}) => jix.effect(target => {

	label ?? (()=>{throw Error("label is required")})()
	runscript ?? (()=>{throw Error("runscript is required")})()

	const plistPath = system
		? `/Library/LaunchDaemons/${label}.plist`
		: `${target.home}/Library/LaunchAgents/${label}.plist`;

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
			<string>${label}</string>
			<key>ProgramArguments</key>
			<array>
				<string>${runscript}</string>
			</array>
			${runAtLoadConfig}
		</dict>
		</plist>
	`.symlinkTo(plistPath)


	return jix.effect({
		// if necessary, this will replace existing
		install: ["execShV1", jix.dedent`
			# Unload existing job to ensure it's updated
			launchctl list | grep -q ${label} && launchctl bootout ${launchdTarget}/${label} || true
			# Load the new job
			launchctl bootstrap ${launchdTarget} "${plist}"
		`],
		uninstall: noUninstall ? null : ["execShV1", jix.dedent`
			# Do nothing if the job isn't loaded
			launchctl list | grep -q ${label} || exit 0
			# Unload the job
			launchctl bootout ${launchdTarget}/${label}
		`],
		dependencies: [ plist ]
	})
	
	
})

