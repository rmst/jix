# nix Namespace

*Source: [src/jix/nix/index.js](../../src/jix/nix/index.js)*

Nix package management utilities for building and accessing Nix packages.

## Functions

### pkg(name, nixpkgsPath)
Build a Nix package by name.

**Parameters:**
- `name` - Package name (e.g., "git")
- `nixpkgsPath` - Optional path/URL to nixpkgs (default: uses current channel)

**Returns:** [Effect](./Effect.md) that builds the package

**Example nixpkgsPath:**
- `https://github.com/NixOS/nixpkgs/archive/YOUR_COMMIT_HASH.tar.gz` (reproducible)
- `null` - Uses current channel (not reproducible)

**Source:** [src/jix/nix/index.js:18](../../src/jix/nix/index.js#L18)

## Objects

### pkgs
Proxy object for accessing package binaries directly.

**Usage:**
```javascript
nix.pkgs.git.git        // Returns path to git binary
nix.pkgs.nodejs.node    // Returns path to node binary
nix.pkgs.python3.python // Returns path to python binary
```

**Returns:** String path to the specified binary within the package

**Implementation:** Uses [pkg function](#pkg) internally and [str function](./Readme.md#str) for string construction

**Source:** [src/jix/nix/index.js:40](../../src/jix/nix/index.js#L40)

## Platform Support

- **NixOS:** Uses `/run/current-system/sw/bin/nix-build`
- **Other platforms:** Uses `/nix/var/nix/profiles/default/bin/nix-build`

## Related

- [nixos namespace](./nixos.md) - NixOS-specific utilities
- [nixosConfig function](./Readme.md#nixosconfig) - Deploy NixOS configurations
