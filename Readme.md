# Jix
Declarative development and system configurations using Javascript (or Typescript, maybe)


#### Cluster management
One use case for jix is to manage one or more machines based on a single git repository containing .js files describing the desired state of those machines.


### Install
This repo contains everything to build Jix from source (including the Quickjs Javascript engine). It only requires `make` and a C compiler and should take less than a minute to build.
```bash
git clone --recurse-submodules "https://github.com/rmst/jix"
cd jix
make install
```


### Jix might (partially) replace the following tools
- nix home-manager
- docker compose (yes, but doesn't do health checks yet)
- Ansible
- [ ] devenv (cli commands still missing)


### Design
Why I chose Javascript for Jix:
- Great multiline string and string interpolation support to embed shell scripts (and other scripts / config / text files)
- Decent functional programming support (e.g. as opposed to Python, which lacks multi-line anonymous functions)
- Great dev tools support (e.g. VSCode support for JS is outstanding)
- Great, super minimalist interpreter: Fabrice Bellard's Quickjs


### Why was Jix built
- Nix language is unfamiliar to most and poorly supported in editors
- Nix seemed like a nightmare to install on MacOS
  - needs to set up a new hard-drive partitition
  - requires background services
  - sometimes breaks on MacOS updates
- With Jix: single binary built from source, all state is stored in `~/.jix`
- On NixOS `nixos-rebuild switch` (required whenever updating anything) was too slow. E.g. trying to change a systemd service takes a few milliseconds when using systemd directly on Debian but on Nixos with `nixos-rebuild switch` it took/takes 15s or more. Now, with Jix (even on NixOS) it takes a few milliseconds again
- It is non-trivial to build Nix from source without already having Nix


### Additional goals
Bootstrapability: Jix is (and should remain) buildable with nothing other than `make` and `gcc`


### Development
The quickjs-x submodule provides a very incomplete Nodejs standard library shim but this allows us to write code that works both with Quickjs and Nodejs.
