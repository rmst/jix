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

### [nix](./nix.md)
Nix package management utilities:
- `pkg(name, nixpkgsPath)` - Build a Nix package
- `pkgs` - Proxy object for accessing package binaries (e.g., `nix.pkgs.git.git`)

*Source: [src/nux/nix/index.js](../../src/nux/nix/index.js)*

### [git](./git.md)
Git-related helpers.

*Source: [src/nux/git/index.js](../../src/nux/git/index.js)*


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

*Source: [src/nux/base.js:158](../../src/nux/base.js#L158)*

### textfile
Convenience alias for [`writeFile()`](#writefile) with default permissions.
- **Parameters**: Template strings and values
- **Returns**: [Effect](./Effect.md) that creates a text file

*Source: [src/nux/base.js:179](../../src/nux/base.js#L179)*

### script
Create an executable script from template strings (equivalent to [`writeFile('-w+x')`](#writefile)).
- **Parameters**: Template strings and values
- **Returns**: [Effect](./Effect.md) that creates an executable script

*Source: [src/nux/base.js:188](../../src/nux/base.js#L188)*

### build
Create a build script that writes to `$out` environment variable.
- **Parameters**: Template strings and values for build script
- **Returns**: [Effect](./Effect.md) that builds an artifact

*Source: [src/nux/base.js:194](../../src/nux/base.js#L194)*

### copy(from, to)
Copy a file from source to destination.
- **Parameters**:
  - `from` - Source file path
  - `to` - Destination file path
- **Returns**: [Effect](./Effect.md)

*Source: [src/nux/base.js:172](../../src/nux/base.js#L172)*

### buildDir(files)
Create a directory with specified files.
- **Parameters**: `files` - Object mapping names to source paths
- **Returns**: [Effect](./Effect.md) that builds the directory

*Source: [src/nux/base.js:87](../../src/nux/base.js#L87)*

### dir(path, extraArgs)
Ensure a directory exists (creates if missing).
- **Parameters**:
  - `path` - Directory path
  - `extraArgs` - Additional effect properties (default: {})
- **Returns**: [Effect](./Effect.md)

*Source: [src/nux/base.js:109](../../src/nux/base.js#L109)*

### link(origin, path, symbolic)
Create a hard link or symbolic link.
- **Parameters**:
  - `origin` - Source file/path
  - `path` - Link destination
  - `symbolic` - Boolean, true for symlink (default: false)
- **Returns**: [Effect](./Effect.md)

*Source: [src/nux/base.js:33](../../src/nux/base.js#L33)*

### symlink(origin, path)
Create a symbolic link (convenience wrapper for `link` with symbolic=true).
- **Parameters**:
  - `origin` - Source file/path
  - `path` - Link destination
- **Returns**: [Effect](./Effect.md)

*Source: [src/nux/base.js:51](../../src/nux/base.js#L51)*

### alias(mapping)
Create command aliases by symlinking to bin directory.
- **Parameters**: `mapping` - Object mapping alias names to executables
- **Returns**: Array of [Effect](./Effect.md) instances

*Source: [src/nux/base.js:54](../../src/nux/base.js#L54)*

### str
Create a string effect with dependency tracking.
- **Parameters**: Template strings and values
- **Returns**: [Effect](./Effect.md) with str property

*Source: [src/nux/base.js:146](../../src/nux/base.js#L146)*

### dedent
Remove common leading whitespace from template strings.
- **Parameters**: Template strings and values
- **Returns**: Processed string

*Source: [src/nux/dedent.js](../../src/nux/dedent.js)*

### run(options)
Execute shell commands for install/uninstall.
- **Parameters**: Object with `install`, `uninstall` strings and other properties
- **Returns**: [Effect](./Effect.md)

*Source: [src/nux/base.js:67](../../src/nux/base.js#L67)*

### stateDir(id, owner)
Create a managed state directory that persists across installs/uninstalls.
- **Parameters**:
  - `id` - Unique identifier for the state directory
  - `owner` - Optional owner user (default: null)
- **Returns**: [Effect](./Effect.md) with path property pointing to the state directory
- **Behavior**:
  - **Install**: Creates or reactivates state directory at `${HOME}/.nux/db/${id}`
  - **Uninstall**: Moves state directory to `${HOME}/.nux/db-inactive/${id}` for later reactivation
  - **Owner Management**: If `owner` is specified, directory ownership is changed using `chown -R ${owner}`

*Source: [src/nux/stateDir.js](../../src/nux/stateDir.js)*

### service(options)
Create cross-platform services (uses launchd on macOS, systemd on Linux/NixOS).
- **Parameters**: Object with `label`, `runscript`, `system`, `runOnInstall`, `noUninstall`
- **Returns**: Platform-appropriate service [Effect](./Effect.md)

*Source: [src/nux/service/index.js](../../src/nux/service/index.js)*

## Constants

### HOME
Placeholder for user home directory.

*Source: [src/nux/context.js](../../src/nux/context.js)*

### HASH
Placeholder for effect hash (`_HASH_PLACEHOLDER_d6165af5669c8a3de2aab402ad97c778`).

*Source: [src/nux/base.js:13](../../src/nux/base.js#L13)*
