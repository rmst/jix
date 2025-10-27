---
title: API Reference
nav_order: 5
has_children: true
---

# Jix API Reference

## `script`
Source: [`src/jix/base.js#L170`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L170)

Template tag function for creating executable script files.

**Parameters:**

- Template string containing script content

**Returns:** [Effect](./Effect.md)

---

## `textfile`
Source: [`src/jix/base.js#L161`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L161)

Template tag function for creating text files.

**Parameters:**

- Template string containing file content

**Returns:** [Effect](./Effect.md)

---

## `importScript(origin)`
Source: [`src/jix/base.js#L214`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L214)

Import an executable script file.

**Parameters:**

- `origin` (string) - Path to script file

**Returns:** [Effect](./Effect.md) with additional `name` property set to file basename

---

## `importTextfile(origin)`
Source: [`src/jix/base.js#L201`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L201)

Read a text file from the filesystem and create an effect containing its contents.

**Parameters:**

- `origin` (string) - Path to file to import

**Returns:** [Effect](./Effect.md) with additional `name` property set to file basename

---

## `copy(from, to)`
Source: [`src/jix/base.js#L56`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L56)

Copy a file to a destination path.

**Parameters:**

- `from` (string \| [Effect](./Effect.md)) - Source path
- `to` (string) - Destination path

**Returns:** [Effect](./Effect.md)

---

## `link(origin, path)`
Source: [`src/jix/base.js#L24`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L24)

Create a hard link.

**Parameters:**

- `origin` (string \| [Effect](./Effect.md)) - Source path
- `path` (string) - Link destination path (tilde expanded)

**Returns:** [Effect](./Effect.md)

---

## `symlink(origin, path)`
Source: [`src/jix/base.js#L48`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L48)

Create a symbolic link. Equivalent to `link(origin, path, true)`.

**Parameters:**

- `origin` (string \| [Effect](./Effect.md)) - Source path
- `path` (string) - Link destination path

**Returns:** [Effect](./Effect.md)

---

## `alias(mapping)`
Source: [`src/jix/base.js#L67`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L67)

Create command aliases in the jix bin directory.

**Parameters:**

- `mapping` (Object) - Maps alias names to target paths/effects

**Returns:** [Effect](./Effect.md)

---

## `dir(path, extraArgs={})`
Source: [`src/jix/base.js#L107`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L107)

Create a directory at the specified path using `mkdir -p`. Uninstall will only remove the directory if it is empty.

**Parameters:**

- `path` (string) - Directory path to create
- `extraArgs` (Object, optional) - Additional effect properties

**Returns:** [Effect](./Effect.md)

---

## `customEffect({install, uninstall, dependencies, ...other})`
Source: [`src/jix/base.js#L93`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L93)

Create an effect with custom shell commands for install/uninstall.

**Parameters:**

- `install` (string, optional) - Shell command to run on install
- `uninstall` (string, optional) - Shell command to run on uninstall
- `dependencies` (Array, optional) - Array of [EffectOrFn](./Effect.md#effectorfn) dependencies
- Additional properties passed to effect

**Returns:** [Effect](./Effect.md)

---

## `stateDir(id)`
Source: [`src/jix/stateDir.js#L8`](https://github.com/rmst/jix/blob/main/src/jix/stateDir.js#L8)

Create a state directory in `~/.jix/db/<id>` that persists across installs/uninstalls.

**Parameters:**

- `id` (string) - Non-empty identifier for the state directory

**Returns:** [Effect](./Effect.md)

---

## `str`
Source: [`src/jix/base.js#L123`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L123)

Template tag function for creating string effects with dependency tracking.

**Parameters:**

- Template string with possible effect interpolations

**Returns:** [Effect](./Effect.md) with `str` property containing the resulting string

---

## `build`
Source: [`src/jix/base.js#L228`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L228)

Template tag function for building artifacts from shell scripts. The build script is executed in a temporary directory, and the build result should be written to the path given by the `$out` environment variable.

**Parameters:**

- Template string containing shell script

**Returns:** [Effect](./Effect.md) with build output path in `$out`

---

## `target()`
Source: [`src/jix/base.js#L289`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L289)

Get the current target context (host and user).

**Returns:** Object with `host` and `user` properties

---

## `dedent`
Source: [`src/jix/dedent.js`](https://github.com/rmst/jix/blob/main/src/jix/dedent.js)

Remove common leading whitespace from template strings.

**Parameters:**

- `templateStrings` (Array) - Template string parts
- `...values` - Interpolated values

**Returns:** string

---

## `effect(obj)`
Source: [`src/jix/effect.js#L119`](https://github.com/rmst/jix/blob/main/src/jix/effect.js#L119)

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

## `service({label, runscript, system, runOnInstall, noUninstall})`
Source: [`src/jix/service/index.js#L15`](https://github.com/rmst/jix/blob/main/src/jix/service/index.js#L15)

Create a persistent background service.

**Parameters:**

- `label` (string, required) - Service identifier
- `runscript` (string \| [Effect](./Effect.md), required) - Path to executable or script effect
- `system` (boolean, optional) - Install as system service if true (default: false)
- `runOnInstall` (boolean, optional) - Start service on install (default: true)
- `noUninstall` (boolean, optional) - Skip uninstallation (default: false)

**Returns:** [Effect](./Effect.md)


---


### [git](./git.md)
Source: [`src/jix/git/index.js`](https://github.com/rmst/jix/blob/main/src/jix/git/index.js)

Git repository operations.

### [nix](./nix.md)
Source: [`src/jix/nix/index.js`](https://github.com/rmst/jix/blob/main/src/jix/nix/index.js)

Nix package management integration.

### experimental
Source: [`src/jix/index.js#L34-44`](https://github.com/rmst/jix/blob/main/src/jix/index.js#L34-44)

Contains experimental features: `nixos`, `shelltools`, `appendToFile`, `scriptWithTempdir`, `withTarget`, `getTarget`.


---


### [Effect](./Effect.md)
Source: [`src/jix/effect.js#L154`](https://github.com/rmst/jix/blob/main/src/jix/effect.js#L154)

Core class representing a jix effect.

### [Host](./Host.md)
Source: [`src/jix/targets.js#L6`](https://github.com/rmst/jix/blob/main/src/jix/targets.js#L6)

Represents a target host machine.

### [User](./User.md)
Source: [`src/jix/targets.js#L69`](https://github.com/rmst/jix/blob/main/src/jix/targets.js#L69)

Represents a user on a host.
