import jix from "../base"
import { Effect } from "../effect"

/**
 * @typedef {Record<string, Record<string, Effect>>} NixPkgs
 */

/*
https://nixos.org/guides/nix-pills/11-garbage-collector.html

1. nix-build automatically adds the result symlink as a GC root (i.e. the derivation won't be garbage collected by nix)
2. removing the result symlink will remove the GC root
*/

/**
 * 
 * @param {*} name e.g. git
 * @param {*} nixpkgsPath, e.g. https://github.com/NixOS/nixpkgs/archive/YOUR_COMMIT_HASH.tar.gz
 * @returns the outpath for a nix package
 */
export const pkg = (name, nixpkgsPath=null) => {

	let target = jix.target()

	let nixbuildPath = target.host.os == "nixos"
		? "/run/current-system/sw/bin/nix-build"
		: "/nix/var/nix/profiles/default/bin/nix-build"

	
	let nixbuildArgs = nixpkgsPath
		? `-I nixpkgs='${nixpkgsPath}'`
		: `'<nixpkgs>'`  // uses whatever is the current channel (TODO: this isn't reproducible and won't even trigger a re-evaluation if nixpkgs is updated)
	

	let derivation = jix.build`
		"${nixbuildPath}" ${nixbuildArgs} -A "${name}" --out-link $out
	`

	return derivation
}


/** @type {NixPkgs} */
export const pkgs = new Proxy({}, {
	get: (_, name) => {
		return new Proxy({}, {
			get: (_, bin) => {
				// TODO: maybe make nixpkgsPath controllable here via useContext
				return jix.str`${pkg(name)}/bin/${bin}`
			}
		})
	},
})
	

export default {
	pkg,
	pkgs,
}
