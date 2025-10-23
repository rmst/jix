import modules from "./modules"
import jix from "../base"


export const generator = ({
	name, 
	file, 
})=> jix.target().host.install(host => {

	if(host.os !== "nixos")
		throw Error(`target os should be "nixos" but we have: ${host.os}`)

	let module = modules.importModules({ [`${name}-systemd-generator.nix`]:
		jix.textfile`
			{ config, pkgs, lib, ... }:
			{
				systemd.generators."${name}" = "${file}";
			}
		`,
	}, { core: true, keep: true })
	
	// NOTE: nixos seems to start these on install by default
	return jix.customEffect({
		// install: `systemctl daemon-reload`,
		dependencies: [ module ]
	})

})


/**
 * WARNING: This currently ignores the entire [Install] section
 * See: https://github.com/NixOS/nixpkgs/issues/81138
 * 
 * We're working around that by manually setting
 * .wantedBy = [ "multi-user.target" ];
 * 
 * For more see:
 * https://search.nixos.org/options?channel=unstable&query=systemd.units.
 */
export const unit = ({
	name, 
	file, 
	// runOnInstall=false,
	wantedBy=["multi-user.target"],
})=> {

	let target = jix.target()

	if(target.user.name !== "root")
		throw Error(`Needs "root", got ${target.user.name}`)

	if(!name.endsWith(".service"))
		throw Error(`Unit name should end in .service but we have: ${name}`)

	if(target.host.os !== "nixos")
		throw Error(`target.os should be "nixos" but we have: ${target.host.os}`)


	let module = modules.importModules({ [`${name}.nix`]:
		jix.textfile`
			{ config, pkgs, lib, ... }:
			{
				systemd.units."${name}" = {
					enable = true;
					text = builtins.readFile ${file};
					wantedBy = [ ${wantedBy.map(s=>`"${s}"`).join(" ")} ];
				};

				systemd.generators.test1 = "${generator}";
			}
		`,
	})
	
	// NOTE: nixos seems to start these on install by default
	return jix.customEffect({
		// install: runOnInstall ? `systemctl start ${name}` : null,
		dependencies: [ module ]
	})

}


export default {
	generator,
	unit,
}
