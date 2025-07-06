


import nixos from "../../nixos"



let firejail = nixos.module`
	{ config, pkgs, ... }:
	{
		security.wrappers = {
			firejail = {
				source = "\${pkgs.firejail}/bin/firejail";
				owner = "root";
				group = "wheel";
				setuid = true;
				setgid = true;
			};
		};
	}
`