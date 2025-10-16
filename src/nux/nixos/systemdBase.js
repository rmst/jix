import modules from "./modules"
import nux from "../base"



export const generator = ({
	name, 
	file, 
})=> nux.effect(target => {

	if(target.os !== "nixos")
		throw Error(`target.os should be "nixos" but we have: ${target.os}`)


	let module = modules.importModules({ [`${name}-systemd-generator.nix`]:
		nux.textfile`
			{ config, pkgs, lib, ... }:
			{
				systemd.generators."${name}" = "${file}";
			}
		`,
	}, { core: true, keep: true })
	
	// NOTE: nixos seems to start these on install by default
	return nux.customEffect({
		// install: `systemctl daemon-reload`,
		dependencies: [ module ]
	}).target({host: target.host, user: "root"})

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
})=> nux.effect(target => {

	if(!name.endsWith(".service"))
		throw Error(`Unit name should end in .service but we have: ${name}`)

	if(target.os !== "nixos")
		throw Error(`target.os should be "nixos" but we have: ${target.os}`)


	let module = modules.importModules({ [`${name}.nix`]:
		nux.textfile`
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
	return nux.customEffect({
		// install: runOnInstall ? `systemctl start ${name}` : null,
		dependencies: [ module ]
	}).target({host: target.host, user: "root"})

})



export default {
	generator,
	unit,
}