# Nux API Reference

*Source: [src/nux/index.js](../../src/nux/index.js)*

This document contains auto-generated documentation for the `nux` object and its properties.

## Classes

### [Effect](./Effect.md)
Base effect class that represents a recipe to take actions (build, install, uninstall).

*Source: [src/nux/effect.js](../../src/nux/effect.js)*

### [TargetedEffect](./TargetedEffect.md)
An effect that has been targeted to a specific host and user.

*Source: [src/nux/effect.js](../../src/nux/effect.js)*

### [AbstractEffect](./AbstractEffect.md)
Base class for effects with common functionality including string conversion and convenience methods.

*Source: [src/nux/effectUtil.js](../../src/nux/effectUtil.js)*

## Namespaces

### [shelltools](./shelltools.md)
Shell utility scripts including:
- `watch` - File watching script
- `watchfile` - Watch specific file
- `watchdir` - Watch directory
- `aliasAll` - Create aliases for all shelltools

*Source: [src/nux/shelltools/index.js](../../src/nux/shelltools/index.js)*

### [nix](./nix.md)
Nix package management utilities:
- `pkg(name, nixpkgsPath)` - Build a Nix package
- `pkgs` - Proxy object for accessing package binaries (e.g., `nix.pkgs.git.git`)

*Source: [src/nux/nix/index.js](../../src/nux/nix/index.js)*

### [nixos](./nixos.md)
NixOS-specific utilities including systemd integration.

*Source: [src/nux/nixos/index.js](../../src/nux/nixos/index.js)*

### [db](./db.md)
Database and persistent state management utilities.

*Source: [src/nux/db.js](../../src/nux/db.js)*

## Functions

### effect(obj)
Creates a basic effect.
- **Parameters**: `obj` - EffectProps object, Array, or TargetFn
- **Returns**: [Effect](./Effect.md) instance

*Source: [src/nux/effect.js:71](../../src/nux/effect.js#L71)*

### target(tgt, obj)
Creates a targeted effect for a specific host/user.
- **Parameters**:
  - `tgt` - Target specification (string like "user@host", Array, object with host/user, or null)
  - `obj` - TargetFn, [Effect](./Effect.md), or Array
- **Returns**: [TargetedEffect](./TargetedEffect.md) instance

*Source: [src/nux/effect.js:81](../../src/nux/effect.js#L81)*

### importFile(origin, mode)
Import a file from the local filesystem.
- **Parameters**:
  - `origin` - Path to source file
  - `mode` - File permissions (default: '-w')
- **Returns**: [AbstractEffect](./AbstractEffect.md) with name property

*Source: [src/nux/base.js:21](../../src/nux/base.js#L21)*

### importScript(origin)
Import an executable script file.
- **Parameters**: `origin` - Path to source script
- **Returns**: [AbstractEffect](./AbstractEffect.md) (equivalent to [importFile](#importfile) with '-w+x' mode)

*Source: [src/nux/base.js:28](../../src/nux/base.js#L28)*

### writeFile(mode)
Create a template function for writing files.
- **Parameters**: `mode` - File permissions (default: '-w')
- **Returns**: Template function that accepts template strings and values and returns an [Effect](./Effect.md)

*Source: [src/nux/base.js:173](../../src/nux/base.js#L173)*

### textfile
Convenience alias for [`writeFile()`](#writefile) with default permissions.
- **Parameters**: Template strings and values
- **Returns**: [Effect](./Effect.md) that creates a text file

*Source: [src/nux/base.js:194](../../src/nux/base.js#L194)*

### script
Create an executable script from template strings (equivalent to [`writeFile('-w+x')`](#writefile)).
- **Parameters**: Template strings and values
- **Returns**: [Effect](./Effect.md) that creates an executable script

*Source: [src/nux/base.js:214](../../src/nux/base.js#L214)*

### build
Create a build script that writes to `$out` environment variable.
- **Parameters**: Template strings and values for build script
- **Returns**: [Effect](./Effect.md) that builds an artifact

*Source: [src/nux/base.js:251](../../src/nux/base.js#L251)*

### copyFile(from, to)
Copy a file from source to destination.
- **Parameters**:
  - `from` - Source file path
  - `to` - Destination file path
- **Returns**: [Effect](./Effect.md)

*Source: [src/nux/base.js:187](../../src/nux/base.js#L187)*

### dir(files)
Create a directory with specified files.
- **Parameters**: `files` - Object mapping names to source paths
- **Returns**: [Effect](./Effect.md) that builds the directory

*Source: [src/nux/base.js:104](../../src/nux/base.js#L104)*

### mkdir(path)
Create a directory.
- **Parameters**: `path` - Directory path to create
- **Returns**: [Effect](./Effect.md)

*Source: [src/nux/base.js:125](../../src/nux/base.js#L125)*

### ensureDir(path, eff)
Ensure a directory exists (creates if missing).
- **Parameters**:
  - `path` - Directory path
  - `eff` - Additional effect properties (default: {})
- **Returns**: [Effect](./Effect.md)

*Source: [src/nux/base.js:119](../../src/nux/base.js#L119)*

### link(origin, path, symbolic)
Create a hard link or symbolic link.
- **Parameters**:
  - `origin` - Source file/path
  - `path` - Link destination
  - `symbolic` - Boolean, true for symlink (default: false)
- **Returns**: [Effect](./Effect.md)

*Source: [src/nux/base.js:53](../../src/nux/base.js#L53)*

### symlink(origin, path)
Create a symbolic link (convenience wrapper for `link` with symbolic=true).
- **Parameters**:
  - `origin` - Source file/path
  - `path` - Link destination
- **Returns**: [Effect](./Effect.md)

*Source: [src/nux/base.js:72](../../src/nux/base.js#L72)*

### alias(mapping)
Create command aliases by symlinking to bin directory.
- **Parameters**: `mapping` - Object mapping alias names to executables
- **Returns**: Array of [Effect](./Effect.md) instances

*Source: [src/nux/base.js:75](../../src/nux/base.js#L75)*

### str
Create a string effect with dependency tracking.
- **Parameters**: Template strings and values
- **Returns**: [Effect](./Effect.md) with str property

*Source: [src/nux/base.js:161](../../src/nux/base.js#L161)*

### dedent
Remove common leading whitespace from template strings.
- **Parameters**: Template strings and values
- **Returns**: Processed string

*Source: [src/nux/dedent.js](../../src/nux/dedent.js)*

### appendTo(path, line)
Append a line to a file.
- **Parameters**:
  - `path` - Target file path
  - `line` - Line to append (single line only)
- **Returns**: [Effect](./Effect.md)

*Source: [src/nux/base.js:268](../../src/nux/base.js#L268)*

### run(options)
Execute shell commands for install/uninstall.
- **Parameters**: Object with `install`, `uninstall` strings and other properties
- **Returns**: [Effect](./Effect.md)

*Source: [src/nux/base.js:88](../../src/nux/base.js#L88)*

### scriptInTempdir
Create a script that runs in a temporary directory.
- **Parameters**: Template strings and values
- **Returns**: [Effect](./Effect.md)

*Source: [src/nux/base.js:136](../../src/nux/base.js#L136)*

### service(options)
Create cross-platform services (uses launchd on macOS, systemd on Linux/NixOS).
- **Parameters**: Object with `label`, `runscript`, `system`, `runOnInstall`, `noUninstall`
- **Returns**: Platform-appropriate service [Effect](./Effect.md)

*Source: [src/nux/servicectl/index.js](../../src/nux/servicectl/index.js)*

### nixosConfig(configPath)
Deploy NixOS configuration from local directory.
- **Parameters**: `configPath` - Path to configuration directory
- **Returns**: [Effect](./Effect.md) that deploys config and rebuilds system
- **Requirements**: Must be targeted to root user on NixOS system

*Source: [src/nux/nixos/nixosConfig.js](../../src/nux/nixos/nixosConfig.js)*

### dirname(path)
Get directory name from path (equivalent to `dirname` utility).

*Source: [src/nux/util.js](../../src/nux/util.js)*

## Constants

### HOME
Placeholder for user home directory (`_HOME_PLACEHOLDER_d6165af5669c8a3de2aab402ad97c778`).

*Source: [src/nux/context.js:22](../../src/nux/context.js#L22)*

### NUX_PATH
Path to nux directory (`${HOME}/.nux`).

*Source: [src/nux/context.js:32](../../src/nux/context.js#L32)*

### HASH
Placeholder for effect hash (`_HASH_PLACEHOLDER_d6165af5669c8a3de2aab402ad97c778`).

*Source: [src/nux/base.js:13](../../src/nux/base.js#L13)*