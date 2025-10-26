---
parent: API Reference
title: nix
---

# nix

Source: [`src/jix/nix/index.js`](https://github.com/rmst/jix/blob/main/src/jix/nix/index.js)

Nix package management namespace.

## Functions

### pkg
Source: [`src/jix/nix/index.js#L21-40`](https://github.com/rmst/jix/blob/main/src/jix/nix/index.js#L21-40)

```javascript
pkg(name, nixpkgsPath=null)
```

Build a Nix package using nix-build.

**Parameters:**
- `name` (string, required) - Package attribute name (e.g., "git")
- `nixpkgsPath` (string | null, optional) - URL to nixpkgs archive for pinning (default: uses current channel)

**Returns:** Effect representing the nix package derivation output path

Uses `/run/current-system/sw/bin/nix-build` on NixOS, `/nix/var/nix/profiles/default/bin/nix-build` elsewhere.

## Properties

### pkgs
Source: [`src/jix/nix/index.js#L44-53`](https://github.com/rmst/jix/blob/main/src/jix/nix/index.js#L44-53)

Proxy object for accessing package binaries.

Usage: `jix.nix.pkgs.<packageName>.<binaryName>`

Returns a string effect pointing to the binary path.
