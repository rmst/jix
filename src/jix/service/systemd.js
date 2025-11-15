import jix from "../base.js"
import nixos from "../nixos"


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

	const serviceName = `${name}.service`;

	let serviceFile = jix.textfile`
		[Unit]
		Description=${name}

		[Service]
		ExecStart=${exec}
		Restart=no

		[Install]
		WantedBy=${system ? 'multi-user.target' : 'default.target'}
	`

	if(system && target.host.os === "nixos") {
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
	: `${jix.dir(`${target.user.home}/.config/systemd/user`)}/${serviceName}`;

	const systemctlFlags = system ? "" : "--user";


	serviceFile = serviceFile.symlinkTo(servicePath)

	// NOTE: "restart" will ensure we start our newly created service
	const startCmd = runOnInstall ? `systemctl ${systemctlFlags} restart ${serviceName}` : '';

	// TODO: this works but should ideally be health-check-based
	let waitUntilSuccessfulStartup = runOnInstall ? "sleep 0.5" : ""

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
			${waitUntilSuccessfulStartup}
		`],
		uninstall: noUninstall ? null : ["execShV1", jix.dedent`
			# Stop the service
			systemctl ${systemctlFlags} stop ${serviceName} || true
			# Disable the service
			systemctl ${systemctlFlags} disable ${serviceName} || true
			# Reload systemd
			systemctl ${systemctlFlags} daemon-reload
		`],
		dependencies: [ serviceFile, ...dependencies ],
		str: name,
	})
}
