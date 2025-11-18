/*

	Here, we're demostrating how to use Jix to automatically set up a reproducible development environment with Nix similar to github.com/cachix/devenv.

	Specifically we're providing the equivalent functionality as in
	https://github.com/cachix/devenv/blob/main/examples/scripts/devenv.nix
*/


/*
	This is optional. In devenv the nixpkgs is pinned with hash in devenv.lock.
	If omitted, it'd use the system default.
*/
jix.nix.with({
	nixpkgs: jix.git.checkout({
		repo: "https://github.com/NixOS/nixpkgs",
		commit: "11cb3517b3af6af300dd6c055aeda73c9bf52c48"  // 25.05
	}),
})


let pkgs = jix.nix.pkgs  // for convenience


let scripts = {

	"silly-example": jix.script`
		echo "{\"name\":\"$1\",\"greeting\":\"Hello $1!\",\"timestamp\":\"$(date -Iseconds)\"}" | ${pkgs.jq.jq}
	`,

	"serious-example": jix.script`
		${pkgs.cowsay.cowsay} "$*"
	`,

	"python-hello": jix.script`
		#!${pkgs.python3Minimal.python}
		print("Hello, world!")
	`,

	"nushell-greet": jix.script`
		#!${pkgs.nushell.nu}
		def greet [name] {
    	["hello" $name]
    }

    greet "world"
	`,

	"file-example": jix.importScript(import.meta.dirname+"/file-script.sh"),
}


// loaded in non-interactive shells
let env = jix.textfile`
	export PATH="${jix.dirWith(scripts)}:$PATH"
`

// loaded in interactive shells
let rc = jix.textfile`
	. ${env}
	echo
	echo 🦾 Helper scripts you can run to make your development richer:
	${Object.keys(scripts).map(x => `echo 🦾 ${x}`).join("\n")}
	echo
`

// We use bash with our rc file as our shell
let shell = jix.script`
	export BASH_ENV=${env}
	exec ${pkgs.bashInteractive.bash} --rcfile ${rc} "$@"
`

/*
	From the root of this repo run:
		cd examples/devenv
		jix run shell
	or:
		jix run test
*/
export const run = {
	
	shell,

	test: `${shell} ${jix.script`
		echo "Testing silly-example"
		silly-example world | grep Hello

		echo "Testing serious-example"
		serious-example hello world | grep hello

		echo "Testing python-hello"
		python-hello | grep Hello

		echo "Testing nushell-greet"
		nushell-greet | grep hello

		echo "Testing file-example"
		file-example test args | grep "This script was loaded from a file!"

	`}`,

	/*
		This test script helps to compare to devenv but ideally, scripts.* would be explicitly interpolated, making a custom PATH and shell unnecessary. E.g.:

			echo "Testing nushell-greet"
			${scripts["nushell-greet"]} | grep hello
	*/
}
