

import nux from "../base"


const nixosRebuild = nux.script`
  #!/bin/sh
  mkdir -p /root/.systemd

  rm -rf /root/.systemd/diff
  rsync -avc --compare-dest=/etc/static/systemd/system /etc/systemd/system/ /root/.systemd/diff
  # rm -rf /etc/systemd/system
  # ln -s /etc/static/systemd/system /etc/systemd/system  # restore original symlink

  /run/current-system/sw/bin/nixos-rebuild "$@"
  return_code=$?

  rm -rf /etc/systemd/system
  cp -rp $(realpath /etc/static/systemd/system) /etc/systemd/system

  rsync -a /root/.systemd/diff/ /etc/systemd/system/

  exit $return_code
`


const instanceofAbstractEffect = (obj) => {
		// NOTE: we do this bc instanceof doesn't work here, bc we have a split world problem with the imports (maybe Quickjs bug?)

	let className = Object.getPrototypeOf(obj)?.constructor?.name

	return [
		"Effect", 
		"AbstractEffect"
	].includes(className)
}


export const importModule = ({file, core=false}) => {
	file = instanceofAbstractEffect(file)
		? file
		: nux.importFile(file)

	let clearRoot = nux.run({
		install: nux.dedent`
			rm -f /etc/nixos/configuration.nix.backup
			mv /etc/nixos/configuration.nix /etc/nixos/configuration.nix.backup || true
		`
	})

	let root = nux.textfile`
		# Hack to insert this as a dependency: ${clearRoot}

		{ lib, ... }:

		{
			imports = map (name: ./modules + "/\${name}") (lib.attrNames (lib.filterAttrs
				(name: type: type == "regular" && lib.hasSuffix ".nix" name)
				(builtins.readDir ./modules)));
		}
	`.copyTo("/etc/nixos/configuration.nix")					

	let mdir = nux.ensureDir("/etc/nixos/modules")


	return nux.effect(target => {

		if(target.os !== "nixos" || target.user !== "root")
			throw Error(`${target.os} !== "nixos" || ${target.user} !== "root"`)
		
		
		let tfile = nux.target( target, file )

		let name = file.name
			? `${file.name.replace(/\.nix$/,'')}-${tfile.hash.slice(0, 4)}.nix`
			: `${tfile.hash.slice(0, 8)}.nix`


		let uninstall = nux.effect({
			// if it's a core module (e.g. configuration.nix) we never want to run the system without it and therefore we don't need to rebuild it when it is removed
			uninstall: core ? null : ["execShVerboseV1", nux.dedent`
				start=$(date +%s)
				${nixosRebuild} switch
				echo nixos-rebuild switch ran for $(($(date +%s)-start)) seconds
			`],
		})

		// let config = nux.effect({
		// 	dependencies: [
		// 		// TODO: actually we want the .copyTo to depend on withoutConfig, right now these are peer dependencies which is not right
		// 		withoutConfig,
		// 		tfile.copyTo(`${mdir}/${name}`)
		// 	]
		// })

		let config = tfile
			.copyTo(`${mdir}/${name}`)
			.dependOn(uninstall)

		let install = nux.effect({
			install: ["execShVerboseV1", nux.dedent`
				start=$(date +%s)
				${nixosRebuild} switch
				echo nixos-rebuild switch ran for $(($(date +%s)-start)) seconds
			`],

			dependencies: [
				root,
				config,
			]
		})

		return install
	})
}

export const importCoreModule = (file) => importModule({file, core: true})

export const module = (...args) => importModule({
	file: nux.textfile(...args), 
	core: false
})

export default {
	importModule,
	importCoreModule,
	module,
}