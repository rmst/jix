# Jix API Reference

*Source: [src/jix/index.js](../../src/jix/index.js)*

This document contains auto-generated documentation for the `jix` object and its properties.

## Classes

### [Effect](./Effect.md)
Base effect class that represents a recipe to take actions (build, install, uninstall).

*Source: [src/jix/effect.js](../../src/jix/effect.js)*

### [TargetedEffect](./TargetedEffect.md)
An effect that has been targeted to a specific host and user.

*Source: [src/jix/effect.js](../../src/jix/effect.js)*

### [AbstractEffect](./AbstractEffect.md)
Base class for effects with common functionality including string conversion and convenience methods.

*Source: [src/jix/effectUtil.js](../../src/jix/effectUtil.js)*

## Namespaces

### [nix](./nix.md)
Nix package management utilities:
- `pkg(name, nixpkgsPath)` - Build a Nix package
- `pkgs` - Proxy object for accessing package binaries (e.g., `nix.pkgs.git.git`)

*Source: [src/jix/nix/index.js](../../src/jix/nix/index.js)*

### [git](./git.md)
Git-related helpers.

*Source: [src/jix/git/index.js](../../src/jix/git/index.js)*


## Functions

### effect(obj)
Creates a basic effect.
- **Parameters**: `obj` - EffectProps object, Array, or TargetFn
- **Returns**: [Effect](./Effect.md) instance

*Source: [src/jix/effect.js:71](../../src/jix/effect.js#L71)*

### target(tgt, obj)
Creates a targeted effect for a specific host/user.
- **Parameters**:
  - `tgt` - Target specification (string like "user@host", Array, object with host/user, or null)
  - `obj` - TargetFn, [Effect](./Effect.md), or Array
- **Returns**: [TargetedEffect](./TargetedEffect.md) instance

*Source: [src/jix/effect.js:81](../../src/jix/effect.js#L81)*

### importFile(origin, mode)
Import a file from the local filesystem.
- **Parameters**:
  - `origin` - Path to source file
  - `mode` - File permissions (default: '-w')
- **Returns**: [AbstractEffect](./AbstractEffect.md) with name property

*Source: [src/jix/base.js:21](../../src/jix/base.js#L21)*

### importScript(origin)
Import an executable script file.
- **Parameters**: `origin` - Path to source script
- **Returns**: [AbstractEffect](./AbstractEffect.md) (equivalent to [importFile](#importfile) with '-w+x' mode)

*Source: [src/jix/base.js:28](../../src/jix/base.js#L28)*

### writeFile(mode)
Create a template function for writing files.
- **Parameters**: `mode` - File permissions (default: '-w')
- **Returns**: Template function that accepts template strings and values and returns an [Effect](./Effect.md)

*Source: [src/jix/base.js:158](../../src/jix/base.js#L158)*

### textfile
Convenience alias for [`writeFile()`](#writefile) with default permissions.
- **Parameters**: Template strings and values
- **Returns**: [Effect](./Effect.md) that creates a text file

*Source: [src/jix/base.js:179](../../src/jix/base.js#L179)*

### script
Create an executable script from template strings (equivalent to [`writeFile('-w+x')`](#writefile)).
- **Parameters**: Template strings and values
- **Returns**: [Effect](./Effect.md) that creates an executable script

*Source: [src/jix/base.js:188](../../src/jix/base.js#L188)*

### build
Create a build script that writes to `$out` environment variable.
- **Parameters**: Template strings and values for build script
- **Returns**: [Effect](./Effect.md) that builds an artifact

*Source: [src/jix/base.js:194](../../src/jix/base.js#L194)*

### copy(from, to)
Copy a file from source to destination.
- **Parameters**:
  - `from` - Source file path
  - `to` - Destination file path
- **Returns**: [Effect](./Effect.md)

*Source: [src/jix/base.js:172](../../src/jix/base.js#L172)*

### buildDir(files)
Create a directory with specified files.
- **Parameters**: `files` - Object mapping names to source paths
- **Returns**: [Effect](./Effect.md) that builds the directory

*Source: [src/jix/base.js:87](../../src/jix/base.js#L87)*

### dir(path, extraArgs)
Ensure a directory exists (creates if missing).
- **Parameters**:
  - `path` - Directory path
  - `extraArgs` - Additional effect properties (default: {})
- **Returns**: [Effect](./Effect.md)

*Source: [src/jix/base.js:109](../../src/jix/base.js#L109)*

### link(origin, path, symbolic)
Create a hard link or symbolic link.
- **Parameters**:
  - `origin` - Source file/path
  - `path` - Link destination
  - `symbolic` - Boolean, true for symlink (default: false)
- **Returns**: [Effect](./Effect.md)

*Source: [src/jix/base.js:33](../../src/jix/base.js#L33)*

### symlink(origin, path)
Create a symbolic link (convenience wrapper for `link` with symbolic=true).
- **Parameters**:
  - `origin` - Source file/path
  - `path` - Link destination
- **Returns**: [Effect](./Effect.md)

*Source: [src/jix/base.js:51](../../src/jix/base.js#L51)*

### alias(mapping)
Create command aliases by symlinking to bin directory.
- **Parameters**: `mapping` - Object mapping alias names to executables
- **Returns**: Array of [Effect](./Effect.md) instances

*Source: [src/jix/base.js:54](../../src/jix/base.js#L54)*

### str
Create a string effect with dependency tracking.
- **Parameters**: Template strings and values
- **Returns**: [Effect](./Effect.md) with str property

*Source: [src/jix/base.js:146](../../src/jix/base.js#L146)*

### dedent
Remove common leading whitespace from template strings.
- **Parameters**: Template strings and values
- **Returns**: Processed string

*Source: [src/jix/dedent.js](../../src/jix/dedent.js)*

### customEffect(options)
Execute shell commands for install/uninstall.
- **Parameters**: Object with `install`, `uninstall` strings and other properties
- **Returns**: [Effect](./Effect.md)

*Source: [src/jix/base.js:67](../../src/jix/base.js#L67)*

### stateDir(id, owner)
Create a managed state directory that persists across installs/uninstalls.
- **Parameters**:
  - `id` - Unique identifier for the state directory
  - `owner` - Optional owner user (default: null)
- **Returns**: [Effect](./Effect.md) with path property pointing to the state directory
- **Behavior**:
  - **Install**: Creates or reactivates state directory at `${HOME}/.jix/db/${id}`
  - **Uninstall**: Moves state directory to `${HOME}/.jix/db-inactive/${id}` for later reactivation
  - **Owner Management**: If `owner` is specified, directory ownership is changed using `chown -R ${owner}`

*Source: [src/jix/stateDir.js](../../src/jix/stateDir.js)*

### service(options)
Create cross-platform services (uses launchd on macOS, systemd on Linux/NixOS).
- **Parameters**: Object with `label`, `runscript`, `system`, `runOnInstall`, `noUninstall`
- **Returns**: Platform-appropriate service [Effect](./Effect.md)

*Source: [src/jix/service/index.js](../../src/jix/service/index.js)*

## Constants

### HOME
Placeholder for user home directory.

*Source: [src/jix/context.js](../../src/jix/context.js)*

### HASH
Placeholder for effect hash (`_HASH_PLACEHOLDER_d6165af5669c8a3de2aab402ad97c778`).

*Source: [src/jix/base.js:13](../../src/jix/base.js#L13)*
