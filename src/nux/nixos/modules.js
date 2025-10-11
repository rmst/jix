
import nux from "../base"


const instanceofAbstractEffect = (obj) => {
		// NOTE: we do this bc instanceof doesn't work here, bc we have a split world problem with the imports (maybe Quickjs bug?)

	let className = Object.getPrototypeOf(obj)?.constructor?.name

	return [
		"Effect", 
		"AbstractEffect"
	].includes(className)
}


export const rebuild = (e) => nux.effect(target => {

	let root = nux.target(target, e)
	// root.dependencies.map(d => d.)
})
	
	
export const importModules = (files, { core=false }={}) => {
	
	files = !Array.isArray(files)
		? Object.entries(files)
		: files.map(f => typeof f === "string"
				? [null, nux.importFile(f)]
				: [null, f]
			)

	// just for debugging convenience
	files.map(([name, f]) => {
		name = name ?? f.name
		if(name && !name.endsWith(".nix"))
			throw Error(`Module name has to end in ".nix", instead we have: ${name}`)
	})
	

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

	let mdir = nux.dir("/etc/nixos/modules")


	return nux.effect(target => {

		if(target.os !== "nixos" || target.user !== "root")
			throw Error(`${target.os} !== "nixos" || ${target.user} !== "root"`)
		

		let uninstall = nux.effect({
			// if it's a core module (e.g. configuration.nix) we never want to run the system without it and therefore we don't need to rebuild it when it is removed
			uninstall: core ? null : ["execShVerboseV1", nux.dedent`
				start=$(date +%s)
				/run/current-system/sw/bin/nixos-rebuild switch
				exitcode=$?
				echo nixos-rebuild switch ran for $(($(date +%s)-start)) seconds
				exit $exitcode
			`],
		})


		let configFiles = files.map(([name, file]) => {

			// necessary to get .hash for the name
			let targetedFile = nux.target( target, file )  

			// determine name
			name = name ?? ( file.name
				? `${file.name.replace(/\.nix$/,'')}-${targetedFile.hash.slice(0, 4)}.nix`
				: `${targetedFile.hash.slice(0, 8)}.nix`
			)

			if(!name.endsWith(".nix"))
				throw Error(`Module name has to end in ".nix", instead we have: ${name}`)


			let configFile = targetedFile
				.copyTo(`${mdir}/${name}`)
				.dependOn(uninstall)

			return configFile
		})

		let install = nux.effect({
			install: ["execShVerboseV1", nux.dedent`
				start=$(date +%s)
				/run/current-system/sw/bin/nixos-rebuild switch
				exitcode=$?
				echo nixos-rebuild switch ran for $(($(date +%s)-start)) seconds
				exit $exitcode
			`],

			dependencies: [
				root,
				configFiles,
			]
		})

		return install
	})
}


export const importCoreModules = (files, options) => importModules(
	files, 
	{ ...options, core: true }
)

export const module = (...args) => importModules([nux.textfile(...args)]) 

export default {
	importModules,
	importCoreModules,
	module,
}