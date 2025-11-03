# Jix vs. Nix home-manager

Here, we are comparing between Jix and Nix home-manager. The Jix files are in this directory while the home-manager files I attached below.

### Jix version

In `./jix/` run

```bash
jix install
```

<br>

File: [`./jix/__jix__.js`](./jix/__jix__.js)
```javascript

export const install = () => {

	let target = jix.target()

	let pkgs = jix.nix.pkgs

	jix.alias({
		hello: pkgs.hello.hello,
		cowsay: pkgs.cowsay.cowsay,
		lolcat: pkgs.lolcat.lolcat,
	})

	jix.script`
		#!/usr/bin/env bash

		echo "Hello, ${target.user.name}!"
		echo '*slaps roof* This script can fit so many lines in it'

	`
    .symlinkTo(`${target.user.home}/hello.sh`)

	jix.textfile`
		[user]
			name = My Name
			email = me@example.com
		[init]
			defaultBranch = main
	`
    .symlinkTo(`${target.user.home}/.gitconfig`)
}
```


### Nix home-manager version

In `./home-manager/` run
```bash
home-manager switch --flake .#myprofile
```

<br>

File: [`./home-manager/home.nix`](./home-manager/home.nix)

```nix

{ lib, pkgs, ... }: let
  username = "myusername";
in {
  home = {
    packages = with pkgs; [
      hello
      cowsay
      lolcat
    ];

    inherit username;
    homeDirectory = "/home/${username}";

    file = {
      "hello.sh" = {
        text = ''
          #!/usr/bin/env bash

          echo "Hello, ${username}!"
          echo '*slaps roof* This script can fit so many lines in it'
        '';
        executable = true;
      };
    };

    stateVersion = "23.11";
  };

  programs.git = {
    enable = true;
    userName = "My Name";
    userEmail = "me@example.com";
    extraConfig = {
      init.defaultBranch = "main";
    };
  };
}
```

For all files see [`./home-manager`](./home-manager).

This home-manager example was adapted from https://github.com/Evertras/simple-homemanager.
