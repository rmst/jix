---
title: API Reference
nav_order: 5
has_children: true
---

# Jix API Reference

## `script`
Source: [`src/jix/base.js#L190`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/base.js#L190)

Template tag function for creating executable script files.

**Parameters:**

- Template string containing script content

**Returns:** [Effect](./Effect.md)

---

## `textfile`
Source: [`src/jix/base.js#L181`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/base.js#L181)

Template tag function for creating text files.

**Parameters:**

- Template string containing file content

**Returns:** [Effect](./Effect.md)

---

## `importScript(origin)`
Source: [`src/jix/base.js#L240`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/base.js#L240)

Import an executable script file.

**Parameters:**

- `origin` (string) - Path to script file

**Returns:** [Effect](./Effect.md) with additional `name` property set to file basename

---

## `importTextfile(origin)`
Source: [`src/jix/base.js#L227`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/base.js#L227)

Read a text file from the filesystem and create an effect containing its contents.

**Parameters:**

- `origin` (string) - Path to file to import

**Returns:** [Effect](./Effect.md) with additional `name` property set to file basename

---

## `copy(from, to)`
Source: [`src/jix/base.js#L57`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/base.js#L57)

Copy a file to a destination path.

**Parameters:**

- `from` (string \| [Effect](./Effect.md)) - Source path
- `to` (string) - Destination path

**Returns:** [Effect](./Effect.md)

---

## `link(origin, path)`
Source: [`src/jix/base.js#L25`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/base.js#L25)

Create a hard link.

**Parameters:**

- `origin` (string \| [Effect](./Effect.md)) - Source path
- `path` (string) - Link destination path (tilde expanded)

**Returns:** [Effect](./Effect.md)

---

## `symlink(origin, path)`
Source: [`src/jix/base.js#L49`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/base.js#L49)

Create a symbolic link. Equivalent to `link(origin, path, true)`.

**Parameters:**

- `origin` (string \| [Effect](./Effect.md)) - Source path
- `path` (string) - Link destination path

**Returns:** [Effect](./Effect.md)

---

## `alias(mapping)`
Source: [`src/jix/base.js#L68`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/base.js#L68)

Create command aliases in the jix bin directory.

**Parameters:**

- `mapping` (Object) - Maps alias names to target paths/effects

**Returns:** [Effect](./Effect.md)

---

## `dir(path, extraArgs={})`
Source: [`src/jix/base.js#L127`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/base.js#L127)

Create a directory at the specified path using `mkdir -p`. Uninstall will only remove the directory if it is empty.

**Parameters:**

- `path` (string) - Directory path to create
- `extraArgs` (Object, optional) - Additional effect properties

**Returns:** [Effect](./Effect.md)

---

## `customEffect({install, uninstall, dependencies, ...other})`
Source: [`src/jix/base.js#L94`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/base.js#L94)

Create an effect with custom shell commands for install/uninstall.

**Parameters:**

- `install` (string, optional) - Shell command to run on install
- `uninstall` (string, optional) - Shell command to run on uninstall
- `dependencies` (Array, optional) - Array of [EffectOrFn](./Effect.md#effectorfn) dependencies
- Additional properties passed to effect

**Returns:** [Effect](./Effect.md)

---

## `existingCommand(command, {errorMessage}={})`
Source: [`src/jix/base.js#L108`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/base.js#L108)

Create an effect that verifies a command exists on the system.

**Parameters:**

- `command` (string, required) - Command name to check for
- `errorMessage` (string, optional) - Custom error message if command not found

**Returns:** [Effect](./Effect.md) with `str` property set to the command name

---

## `stateDir(id)`
Source: [`src/jix/stateDir.js#L8`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/stateDir.js#L8)

Create a state directory in `~/.jix/db/<id>` that persists across installs/uninstalls.

**Parameters:**

- `id` (string) - Non-empty identifier for the state directory

**Returns:** [Effect](./Effect.md)

---

## `str`
Source: [`src/jix/base.js#L143`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/base.js#L143)

Template tag function for creating string effects with dependency tracking.

**Parameters:**

- Template string with possible effect interpolations

**Returns:** [Effect](./Effect.md) with `str` property containing the resulting string

---

## `build`
Source: [`src/jix/base.js#L254`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/base.js#L254)

Template tag function for building artifacts from shell scripts. The build script is executed in a temporary directory, and the build result should be written to the path given by the `$out` environment variable.

**Parameters:**

- Template string containing shell script

**Returns:** [Effect](./Effect.md) with build output path in `$out`

---

## `dirWith(files)`
Source: [`src/jix/base.js#L272`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/base.js#L272)

Create a directory containing specified files.

**Parameters:**

- `files` (Object, required) - Maps file names to source paths or effects

**Returns:** [Effect](./Effect.md) representing the directory

---

## `target()`
Source: [`src/jix/base.js#L318`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/base.js#L318)

Get the current target context (host and user).

**Returns:** Object with `host` and `user` properties

---

## `dedent`
Source: [`src/jix/dedent.js`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/dedent.js)

Remove common leading whitespace from template strings.

**Parameters:**

- `templateStrings` (Array) - Template string parts
- `...values` - Interpolated values

**Returns:** string

---

## `effect(obj)`
Source: [`src/jix/effect.js#L125`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/effect.js#L125)

Create an effect from properties or dependencies.

**Parameters:**

- `obj` (Object \| Array) - [Effect](./Effect.md) properties or array of dependencies
  - `install` (Array, optional) - Install action specification
  - `uninstall` (Array, optional) - Uninstall action specification
  - `build` (Array, optional) - Build action specification
  - `dependencies` (Array, optional) - [EffectOrFn](./Effect.md#effectorfn) dependencies
  - `path` (string, optional) - File system path
  - `str` (string, optional) - String representation

**Returns:** [Effect](./Effect.md)

---

## `service({name, exec, system, runOnInstall, noUninstall, dependencies})`
Source: [`src/jix/service/index.js#L15`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/service/index.js#L15)

Create a persistent background service.

**Parameters:**

- `name` (string, required) - Service identifier
- `exec` (string \| [Effect](./Effect.md), required) - Path to executable or script effect
- `system` (boolean, optional) - Install as system service if true (default: false)
- `runOnInstall` (boolean, optional) - Start service on install (default: true)
- `noUninstall` (boolean, optional) - Skip uninstallation (default: false)
- `dependencies` (array, optional) - Additional dependencies for the service (default: [])

**Returns:** [Effect](./Effect.md)


---


### [container](./container.md)
Source: [`src/jix/container/index.js`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/container/index.js)

Container operations for Docker and compatible runtimes.

### [git](./git.md)
Source: [`src/jix/git/index.js`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/git/index.js)

Git repository operations.

### [nix](./nix.md)
Source: [`src/jix/nix/index.js`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/nix/index.js)

Nix package management integration.

### experimental
Source: [`src/jix/index.js#L38-47`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/index.js#L38-47)

Contains experimental features: `nixos`, `shelltools`, `appendToFile`, `scriptWithTempdir`, `withTarget`, `getTarget`.


---


### [Effect](./Effect.md)
Source: [`src/jix/effect.js#L160`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/effect.js#L160)

Core class representing a jix effect.

### [Host](./Host.md)
Source: [`src/jix/targets.js#L6`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/targets.js#L6)

Represents a target host machine.

### [User](./User.md)
Source: [`src/jix/targets.js#L69`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/targets.js#L69)

Represents a user on a host.
