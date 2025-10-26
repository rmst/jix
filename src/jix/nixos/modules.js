
import jix from "../base"
import { Effect } from "../effect"
import { shellEscape } from "../util"


// export const rebuild = (e) => jix.effect(target => {

// 	let root = jix.target(target, e)
// 	// root.dependencies.map(d => d.)
// })
	

/**
 * @param {Effect[] | Record<string,Effect>} files 
 * @param {*} options 
 * @returns 
 */
export const importModules = (files, { core=false, keep=false }={}) => {
	
	let target = jix.target()

	if(target.host.os !== "nixos" || target.user.name !== "root")
		throw Error(`${target.host.os} !== "nixos" || ${target.user.name} !== "root"`)
	

	/** @type {[string, Effect][]} */
	const filesEntries = !Array.isArray(files)
		? Object.entries(files)
		: files.map(f => typeof f === "string"
				? [null, jix.importFile(f)]
				: [null, f]
			)

	// just for debugging convenience
	filesEntries.map(([name, f]) => {
		// @ts-ignore
		name = name ?? f.name
		if(name && !name.endsWith(".nix"))
			throw Error(`Module name has to end in ".nix", instead we have: ${name}`)
	})
	
	let configurationDotNix = jix.textfile`
		# jix-autoimport
		{ lib, ... }:

		{
			imports = map (name: ./modules + "/\${name}") (lib.attrNames (lib.filterAttrs
				(name: type: type == "regular" && lib.hasSuffix ".nix" name)
				(builtins.readDir ./modules)));
		}
	`

	let root = jix.customEffect({
		install: jix.dedent`
			f=/etc/nixos/configuration.nix
			[ -f "$f" ] && ! grep -q "jix-autoimport" "$f" && { echo "Error: File exists" >&2; exit 1; }
			
			cp -f '${configurationDotNix}' /etc/nixos/configuration.nix
		`,
		path: "/etc/nixos/configuration.nix",
	})

	let modulesDir = jix.customEffect({
		install: "mkdir -p /etc/nixos/modules",
		path: "/etc/nixos/modules",
	})

	if(!core)
		throw Error("core=false is currenlty unsupported")

	// let uninstall = jix.effect({
	// 	// if it's a core module (e.g. configuration.nix) we never want to run the system without it and therefore we don't need to rebuild it when it is removed
	// 	uninstall: core ? null : ["execShVerboseV1", jix.dedent`
	// 		start=$(date +%s)
	// 		/run/current-system/sw/bin/nixos-rebuild switch
	// 		exitcode=$?
	// 		echo nixos-rebuild switch ran for $(($(date +%s)-start)) seconds
	// 		exit $exitcode
	// 	`],
	// })

	let configFiles = filesEntries.map(([name, file]) => {
		
		// determine name
		name = name ?? ( file.name
			? `${file.name.replace(/\.nix$/,'')}-${file.hash.slice(0, 4)}.nix`
			: `${file.hash.slice(0, 8)}.nix`
		)

		if(!name.endsWith(".nix"))
			throw Error(`Module name has to end in ".nix", instead we have: ${name}`)

		let configFile = keep
			? jix.customEffect({install: `cp -f '${file}' ${modulesDir}/${name}`})
			: file
				.copyTo(`${modulesDir}/${name}`)  // TODO: dependsOn(uninstall)
				// .dependOn(uninstall)

		return configFile
	})

	let install = jix.effect({
		install: ["execShVerboseV1", jix.dedent`
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
}


export const importCoreModules = (files, options) => importModules(
	files, 
	{ ...options, core: true }
)

export const module = (...args) => importModules([jix.textfile(...args)]) 

export default {
	importModules,
	importCoreModules,
	module,
}
