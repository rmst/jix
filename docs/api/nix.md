---
parent: API Reference
title: nix
nav_order: 11
---

# nix

Source: [`src/jix/nix/index.js`](https://github.com/rmst/jix/blob/main/src/jix/nix/index.js)

Nix package management namespace.

## `pkg({name, options})`
Source: [`src/jix/nix/index.js#L47`](https://github.com/rmst/jix/blob/main/src/jix/nix/index.js#L47)

Build a Nix package using nix-build.

**Parameters:**

- `name` (string, required) - Package attribute name (e.g., "git")
- `options` (Object, optional) - Nix build options (merged with context options)
  - `nixpkgs` (string \| [Effect](./Effect.md) \| null, optional) - Path to nixpkgs (default: uses current channel)
  - `extraArgs` (Object, optional) - Additional nix-build arguments

**Returns:** [Effect](./Effect.md) representing the nix package derivation output path

Uses `/run/current-system/sw/bin/nix-build` on NixOS, `/nix/var/nix/profiles/default/bin/nix-build` elsewhere.

---

## `pkgs`
Source: [`src/jix/nix/index.js#L78`](https://github.com/rmst/jix/blob/main/src/jix/nix/index.js#L78)

Proxy object for accessing package binaries.

Usage: `jix.nix.pkgs.<packageName>.<binaryName>`

Returns a string effect pointing to the binary path.

---

## `with(options, fn)`
Source: [`src/jix/nix/index.js#L23`](https://github.com/rmst/jix/blob/main/src/jix/nix/index.js#L23)

Context manager for setting Nix build options.

**Parameters:**

- `options` (Object, required) - Nix build options
  - `nixpkgs` (string \| [Effect](./Effect.md) \| null, optional) - Path to nixpkgs
  - `extraArgs` (Object, optional) - Additional nix-build arguments
- `fn` (Function, optional) - Function to execute with these options

**Returns:** Result of `fn()` if provided

**Example:**

```javascript
jix.nix.with({nixpkgs: "https://github.com/NixOS/nixpkgs/archive/HASH.tar.gz"}, () => {
  return jix.nix.pkg({name: "git"})
})
```
