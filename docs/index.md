---
layout: home
title: Getting Started
nav_order: 1
---

## Jix: Configure Dev-Envs & Systems in JS

Jix allows you to write reproducible, declarative development and system configurations in Javascript with good editor/type-checking support.

Jix might be used as an ergonomic and lightweight alternative to
- devenv (see [`examples/devenv/`](https://github.com/rmst/jix/tree/main/examples/devenv))
- docker compose (see [`examples/docker-compose/`](https://github.com/rmst/jix/tree/main/examples/docker-compose))
- nix home-manager (see [`examples/home-manager/`](https://github.com/rmst/jix/tree/main/examples/home-manager))
- Ansible (no side-by-side example yet but see [remote targets](https://rmst.github.io/jix/remote-targets))

Jix is conceptually similar to [Nix](https://en.wikipedia.org/wiki/Nix_(package_manager)). In Jix, "effects" are a generalization of Nix' "derivations". [Effects](https://rmst.github.io/jix/api/Effect.md) can have install and uninstall actions which allows them to influence state outside of the Jix store (the equivalent of /nix/store).

[Nixpkgs](https://github.com/NixOS/nixpkgs) are available in Jix via `jix.nix.pkgs.<packageName>.<binaryName>` (see [example](https://github.com/rmst/jix/blob/main/examples/devenv/jix/__jix__.js)).


### Getting Started
**Install Jix**: Run

```bash
git clone --recurse-submodules --depth 1 "https://github.com/rmst/jix.git"
make -C jix install
rm -rf jix
```

Follow the instruction to add `. "$HOME/.jix/jix/shell_integration"` to your shell rcfile.


**Create a __jix__.js file**: in a new or existing dir run `jix init`, which will create a `__jix__.js` for you (also `.jix/` and `jsconfig.js` for code completion and type-checking).

```js
// __jix__.js
const hellojix = jix.script`
	echo "Hello from Jix!"
`
export const run = {
	hellojix,
}
```

You can run hellojix with `jix run hellojix`, which will output `Hello from Jix!`. Scripts, like all effects, behave like file paths or strings when composed/interpolated:

```js
// ...
export const run = {
	hellojix2: jix.script`
		${hellojix}
		which ${hellojix}
	`,
}
```
```text
> jix run hellojix2
Hello from Jix!
/home/bob/.jix/out/f452f0d23f58307e5b758b7fec88b35055dcb8fe9839d8e7ef3f28e33ac7588b
```


**jix install**: To persistently add hellojix as a shell command, you can add

```js
// ...
export const install = () => {
	jix.alias({ hellojix })
}
```

After running `jix install`, hellojix will be available as a shell command for your user. To remove it you can either comment out the `jix.alias` line and rerun `jix install` or you can run `jix uninstall`.


### Next Steps
- Check out examples in [examples/](https://github.com/rmst/jix/tree/main/examples/)
- Check out Jix's own `__jix__.js`
