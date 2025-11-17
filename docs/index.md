---
layout: home
title: Getting Started
nav_order: 1
---

## Jix: Declarative Project and System Configs in JS
(*alpha version – rough edges*)

Use JavaScript to declaratively define your project environments or system/user configurations, with good editor and type-checking support.

Jix is conceptually similar to [Nix](https://en.wikipedia.org/wiki/Nix_(package_manager)). In Jix, "effects" are a generalization of Nix' "derivations". [Effects](https://rmst.github.io/jix/api/Effect.md) can have install and uninstall actions which allows them to influence system state declaratively. Dependencies are tracked automatically.

Jix itself has no out-of-repo dependencies. It does not depend on NPM or Node.js or Nix.

Jix can be used as an ergonomic, lightweight alternative[^1] to
- devenv (see [`examples/devenv/`](https://github.com/rmst/jix/tree/main/examples/devenv))
- docker compose (see [`examples/docker-compose/`](https://github.com/rmst/jix/tree/main/examples/docker-compose))
- process-compose (see [`examples/process-compose/`](https://github.com/rmst/jix/tree/main/examples/process-compose))
- nix home-manager (see [`examples/home-manager/`](https://github.com/rmst/jix/tree/main/examples/home-manager))
- Ansible (see [remote targets](https://rmst.github.io/jix/remote-targets))

[Nixpkgs](https://github.com/NixOS/nixpkgs) are available in Jix via `jix.nix.pkgs.<packageName>.<binaryName>` (see [example](https://github.com/rmst/jix/blob/main/examples/devenv/jix/__jix__.js)).


### Getting Started
**Install Jix**: Run

```bash
git clone --recurse-submodules --depth 1 "https://github.com/rmst/jix.git"
make -C jix install
rm -rf jix
```

Follow the instruction to add `. "$HOME/.jix/jix/shell_integration"` to your shell rcfile.


**Create a __jix__.js file**: in a new or existing dir run `jix init`, which will create a `__jix__.js` for you (also `.jix/` and `jsconfig.json` for code completion and type-checking).

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


### Reference
- [CLI Reference](https://rmst.github.io/jix/cli/) - Command-line interface documentation
- [API Reference](https://rmst.github.io/jix/api/) - JavaScript API documentation


### FAQ
#### Why JavaScript?
JavaScript was chosen for Jix because it has:
- Great multiline string and string interpolation support to embed scripts and config files
- Decent functional programming support (as opposed to Python, which lacks proper anonymous functions)
- Great tooling (e.g. IDE support for JS is outstanding)
- Great object/dictionary ergonomics
- Great, super minimalist interpreter: Fabrice Bellard's Quickjs

#### Why not Typescript?
Typescript support might be added in the future. Jix already supports typing via JSDoc. The entire Jix standard library is typed.


### Development
This repo contains everything to build Jix from source (including the Quickjs Javascript engine). It only requires `make` and a C compiler, has no other dependencies and takes less than a minute to build.

The quickjs-x git submodule provides a partial Nodejs standard library shim. This allows us to write code that works both with Quickjs and Nodejs.


### Next Steps
- Check out examples in [examples/](https://github.com/rmst/jix/tree/main/examples/)
- Check out Jix's own `__jix__.js`

<br>

---

[^1]: Within each niche that each of the alternatives occupy Jix's built-in feature set is comparatively very basic. However, Jix should be flexible enough for users to work around missing features.
