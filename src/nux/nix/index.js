import nux from "../base";

/*
https://nixos.org/guides/nix-pills/11-garbage-collector.html

1. nix-build automatically adds the result symlink as a GC root (i.e. the derivation won't be garbage collected by nix)
2. removing the result symlink will remove the GC root
*/

// TODO: we need to add the built packages as a nix gc root (and remove the gc root on uninstall),

/**
 * 
 * @param {*} name e.g. git
 * @param {*} nixpkgsPath, e.g. https://github.com/NixOS/nixpkgs/archive/YOUR_COMMIT_HASH.tar.gz
 * @returns the outpath for a nix package
 */
export const pkg = (name, nixpkgsPath=null) => {

	return nux.effect(target => {

		let nixbuildPath = target.os == "nixos"
			? "/run/current-system/sw/bin/nix-build"
			: "/nix/var/nix/profiles/default/bin/nix-build"  // TODO: test this, this isn't actually verified

		
		let nixbuildArgs = nixpkgsPath
			? `-I nixpkgs='${nixpkgsPath}'`
			: `'<nixpkgs>'`  // uses whatever is the current channel (TODO: this isn't reproducible and won't even trigger a re-evaluation if nixpkgs is updated)
		

		let derivation = nux.build`
			"${nixbuildPath}" ${nixbuildArgs} -A "${name}" --out-link $out
		`

		return derivation
	})
}

export const pkgs = new Proxy({}, {
	get: (_, name) => {
		return new Proxy({}, {
			get: (_, bin) => {
				return nux.str`${pkg(name)}/bin/${bin}`
			}
		})
	},
})
	

export default {
	pkg,
	pkgs,
}