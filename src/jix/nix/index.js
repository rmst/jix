import jix from "../base"
import { Effect } from "../effect"
import { createContext, useContext } from "../useContext"

/**
	@typedef {Record<string, Record<string, Effect>>} NixPkgs
*/

/**
	@typedef {Object} NixOptions
	@property {import("../effect").EffectOrFn | string | null} [nixpkgs] - Path to nixpkgs (e.g. https://github.com/NixOS/nixpkgs/archive/COMMIT_HASH.tar.gz)
	@property {Record<string, string>} [extraArgs] - Additional nix-build arguments
*/

const NIX_CONTEXT = createContext(/** @type {NixOptions} */({ nixpkgs: null, extraArgs: {} }))

/**
	@template T
	@param {NixOptions} options - Nix build options
	@param {() => T} [fn] - Function to execute with these options
	@returns {T}
*/
export const withOptions = (options, fn) => {
	return NIX_CONTEXT.provide(options, fn)
}

/**
	@returns {NixOptions}
*/
const getOptions = () => {
	return useContext(NIX_CONTEXT)
}

/*
https://nixos.org/guides/nix-pills/11-garbage-collector.html

1. nix-build automatically adds the result symlink as a GC root (i.e. the derivation won't be garbage collected by nix)
2. removing the result symlink will remove the GC root
*/

/**
	@param {Object} params
	@param {string} params.name - Package name (e.g. 'git')
	@param {NixOptions} [params.options={}] - Nix build options (merged with context)
	@returns {Effect} the outpath for a nix package
*/
export const pkg = ({name, options={}}) => {

	let target = jix.target()

	// Merge context options with provided options (provided options override context)
	options = {...getOptions(), ...options}

	let nixBinPath = target.host.os == "nixos"
		? "/run/current-system/sw/bin"
		: "/nix/var/nix/profiles/default/bin"

	let nixbuildArgs = options.nixpkgs
		? `'${options.nixpkgs}'`
		: `'<nixpkgs>'`  // uses whatever is the current channel (TODO: this isn't reproducible and won't even trigger a re-evaluation if nixpkgs is updated)

	// Add any extra args
	let extraArgsStr = Object.entries(options.extraArgs || {})
		.map(([k, v]) => `${k} ${v}`)
		.join(' ')

	let derivation = jix.build`
		result="$("${nixBinPath}"/nix-build ${extraArgsStr} ${nixbuildArgs} -A "${name}" --no-out-link | tail -n 1)"
		"${nixBinPath}"/nix-store --add-root "$out" --indirect --realise "$result" > /dev/null

	`

	return derivation
}


/** @type {NixPkgs} */
export const pkgs = new Proxy({}, {
	/**
		@param {any} _
		@param {string} name
	*/
	get: (_, name) => {
		return new Proxy({}, {
			/**
				@param {any} _
				@param {string} bin
			*/
			get: (_, bin) => {
				return jix.str`${pkg({name})}/bin/${bin}`
			}
		})
	},
})
	

export default {
	pkg,
	pkgs,
	with: withOptions,
}
