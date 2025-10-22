import jix from "../base.js"
import nixos from "../nixos"


export default ({
	label,
	runscript,
	system = false,
	runOnInstall = true,
	noUninstall = false,
}) => jix.effect(target => {

	label ?? (()=>{throw Error("label is required")})()
	runscript ?? (()=>{throw Error("runscript is required")})()

	const serviceName = `${label}.service`;

	let serviceFile = jix.textfile`
		[Unit]
		Description=${label}

		[Service]
		ExecStart=${runscript}
		Restart=no

		[Install]
		WantedBy=${system ? 'multi-user.target' : 'default.target'}
	`

	if(system && target.os === "nixos") {
		// return nixos.systemdUnit({
		// 	name: serviceName,
		// 	file: serviceFile,
		// 	runOnInstall
		// })

		return nixos.systemd.enableUnit({
			name: serviceName,
			file: serviceFile,
			runOnInstall,
			noUninstall,
		})
	}

	const servicePath = system
	? `/etc/systemd/system/${serviceName}`
	: `${jix.dir(`${target.home}/.config/systemd/user`)}/${serviceName}`;

	const systemctlFlags = system ? "" : "--user";


	serviceFile = serviceFile.symlinkTo(servicePath)

	// NOTE: "restart" will ensure we start our newly created service
	const startCmd = runOnInstall ? `systemctl ${systemctlFlags} restart ${serviceName}` : '';

	return jix.effect({
		// if necessary, this will replace existing
		install: ["execShV1", jix.dedent`
			set -e
			# Create parent directory for service file if it doesn't exist
			mkdir -p "$(dirname "${servicePath}")"
			# Reload systemd to recognize the new service
			systemctl ${systemctlFlags} daemon-reload
			# Enable the service to start on boot
			systemctl ${systemctlFlags} enable "${serviceName}"
			# Start the service now if requested
			${startCmd}
		`],
		uninstall: noUninstall ? null : ["execShV1", jix.dedent`
			# Stop the service
			systemctl ${systemctlFlags} stop ${serviceName} || true
			# Disable the service
			systemctl ${systemctlFlags} disable ${serviceName} || true
			# Reload systemd
			systemctl ${systemctlFlags} daemon-reload
		`],
		dependencies: [ serviceFile ]
	})
})
