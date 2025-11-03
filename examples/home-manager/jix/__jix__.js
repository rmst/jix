/*
	Here, we are comparing between Jix and Nix home-manager.

	This Jix configuration provides the same functionality as the home-manager
	configuration shown in Readme.md:

	1. Installs packages: hello, cowsay, lolcat
	2. Creates an executable script at ~/hello.sh
	3. Configures git

*/



/*
	This is optional. In home-managaer this would be pinned with hash in flake.lock. If omitted, it would use the system default. It can also be applied to specific packages via `let someBinary = jix.nix.with(..., () => jix.nix.pkgs.somepackage.somebinary)`.
*/
jix.nix.with({
	nixpkgs: jix.git.checkout({
		repo: "https://github.com/NixOS/nixpkgs",
		commit: "11cb3517b3af6af300dd6c055aeda73c9bf52c48"  // 25.05
	}),
})


export const install = () => {

	let target = jix.target()  // give us host/user info (e.g. target.user.name)

	let pkgs = jix.nix.pkgs


	// Install packages (equivalent to home.packages in home-manager)
	jix.alias({
		hello: pkgs.hello.hello,
		cowsay: pkgs.cowsay.cowsay,
		lolcat: pkgs.lolcat.lolcat,
		// we don't have to use nix here if we don't want to
		// we could also use brew or custom-built things
	})

	// Create the executable hello.sh file in home directory
	jix.script`
		#!/usr/bin/env bash

		echo "Hello, ${target.user.name}!"
		echo '*slaps roof* This script can fit so many lines in it'

	`.symlinkTo(`${target.user.home}/hello.sh`)

	// Configure git (equivalent to programs.git in home-manager)
	jix.textfile`
		[user]
			name = My Name
			email = me@example.com
		[init]
			defaultBranch = main
	`.symlinkTo(`${target.user.home}/.gitconfig`)
}
