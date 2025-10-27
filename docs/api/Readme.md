---
title: API Reference
nav_order: 5
has_children: true
---

# Jix API Reference

Source: [`src/jix/index.js`](https://github.com/rmst/jix/blob/main/src/jix/index.js)

## Functions

### script
Source: [`src/jix/base.js#L170`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L170)

Template tag function for creating executable script files.

**Parameters:**

- Template string containing script content

**Returns:** Effect

### textfile
Source: [`src/jix/base.js#L161`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L161)

Template tag function for creating text files.

**Parameters:**

- Template string containing file content

**Returns:** Effect

### importScript
Source: [`src/jix/base.js#L214`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L214)

```javascript
importScript(origin)
```

Import an executable script file. Equivalent to `importTextfile(origin, '-w+x')`.

**Parameters:**

- `origin` (string) - Path to script file

**Returns:** Effect with additional `name` property set to file basename

### importTextfile
Source: [`src/jix/base.js#L201`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L201)

```javascript
importTextfile(origin)
```

Read a text file from the filesystem and create an effect containing its contents.

**Parameters:**

- `origin` (string) - Path to file to import

**Returns:** Effect with additional `name` property set to file basename

### copy
Source: [`src/jix/base.js#L56`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L56)

```javascript
copy(from, to)
```

Copy a file to a destination path.

**Parameters:**

- `from` (string \| Effect) - Source path
- `to` (string) - Destination path

**Returns:** Effect

### link
Source: [`src/jix/base.js#L24`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L24)

```javascript
link(origin, path, symbolic=false)
```

Create a hard or symbolic link.

**Parameters:**

- `origin` (string \| Effect) - Source path
- `path` (string) - Link destination path (tilde expanded)
- `symbolic` (boolean, optional) - Create symbolic link if true (default: false)

**Returns:** Effect

### symlink
Source: [`src/jix/base.js#L48`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L48)

```javascript
symlink(origin, path)
```

Create a symbolic link. Equivalent to `link(origin, path, true)`.

**Parameters:**

- `origin` (string \| Effect) - Source path
- `path` (string) - Link destination path

**Returns:** Effect

### alias
Source: [`src/jix/base.js#L67`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L67)

```javascript
alias(mapping)
```

Create command aliases in the jix bin directory.

**Parameters:**

- `mapping` (Object) - Maps alias names to target paths/effects

**Returns:** Effect

### dir
Source: [`src/jix/base.js#L107`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L107)

```javascript
dir(path, extraArgs={})
```

Create a directory at the specified path using `mkdir -p`. Uninstall will only remove the directory if it is empty.

**Parameters:**

- `path` (string) - Directory path to create
- `extraArgs` (Object, optional) - Additional effect properties

**Returns:** Effect

### customEffect
Source: [`src/jix/base.js#L93`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L93)

```javascript
customEffect({install, uninstall, dependencies, ...other})
```

Create an effect with custom shell commands for install/uninstall.

**Parameters:**

- `install` (string, optional) - Shell command to run on install
- `uninstall` (string, optional) - Shell command to run on uninstall
- `dependencies` (Array, optional) - Array of effect dependencies
- Additional properties passed to effect

**Returns:** Effect

### stateDir
Source: [`src/jix/stateDir.js#L8`](https://github.com/rmst/jix/blob/main/src/jix/stateDir.js#L8)

```javascript
stateDir(id)
```

Create a state directory in `~/.jix/db/<id>` that persists across installs/uninstalls.

**Parameters:**

- `id` (string) - Non-empty identifier for the state directory

**Returns:** Effect

### str
Source: [`src/jix/base.js#L123`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L123)

Template tag function for creating string effects with dependency tracking.

**Parameters:**

- Template string with possible effect interpolations

**Returns:** Effect with `str` property containing the resulting string

### build
Source: [`src/jix/base.js#L228`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L228)

Template tag function for building artifacts from shell scripts. The build script is executed in a temporary directory, and the build result should be written to the path given by the `$out` environment variable.

**Parameters:**

- Template string containing shell script

**Returns:** Effect with build output path in `$out`

### target
Source: [`src/jix/base.js#L289`](https://github.com/rmst/jix/blob/main/src/jix/base.js#L289)

Get the current target context (host and user).

**Returns:** Object with `host` and `user` properties

### dedent
Source: [`src/jix/dedent.js`](https://github.com/rmst/jix/blob/main/src/jix/dedent.js)

Remove common leading whitespace from template strings.

**Parameters:**

- `templateStrings` (Array) - Template string parts
- `...values` - Interpolated values

**Returns:** string

### effect
Source: [`src/jix/effect.js#L119`](https://github.com/rmst/jix/blob/main/src/jix/effect.js#L119)

```javascript
effect(obj)
```

Create an effect from properties or dependencies.

**Parameters:**

- `obj` (Object \| Array) - Effect properties or array of dependencies
  - `install` (Array, optional) - Install action specification
  - `uninstall` (Array, optional) - Uninstall action specification
  - `build` (Array, optional) - Build action specification
  - `dependencies` (Array, optional) - Effect dependencies
  - `path` (string, optional) - File system path
  - `str` (string, optional) - String representation

**Returns:** Effect

### service
Source: [`src/jix/service/index.js#L15`](https://github.com/rmst/jix/blob/main/src/jix/service/index.js#L15)

```javascript
service({label, runscript, system, runOnInstall, noUninstall})
```

Create a persistent background service.

**Parameters:**

- `label` (string, required) - Service identifier
- `runscript` (string \| Effect, required) - Path to executable or script effect
- `system` (boolean, optional) - Install as system service if true (default: false)
- `runOnInstall` (boolean, optional) - Start service on install (default: true)
- `noUninstall` (boolean, optional) - Skip uninstallation (default: false)

**Returns:** Effect

## Namespaces

### [git](./git.md)
Source: [`src/jix/git/index.js`](https://github.com/rmst/jix/blob/main/src/jix/git/index.js)

Git repository operations.

### [nix](./nix.md)
Source: [`src/jix/nix/index.js`](https://github.com/rmst/jix/blob/main/src/jix/nix/index.js)

Nix package management integration.

### experimental
Source: [`src/jix/index.js#L34-44`](https://github.com/rmst/jix/blob/main/src/jix/index.js#L34-44)

Contains experimental features: `nixos`, `shelltools`, `appendToFile`, `scriptWithTempdir`, `withTarget`, `getTarget`.

## Classes

### [Effect](./Effect.md)
Source: [`src/jix/effect.js#L154`](https://github.com/rmst/jix/blob/main/src/jix/effect.js#L154)

Core class representing a jix effect.

### [Host](./Host.md)
Source: [`src/jix/targets.js#L6`](https://github.com/rmst/jix/blob/main/src/jix/targets.js#L6)

Represents a target host machine.

### [User](./User.md)
Source: [`src/jix/targets.js#L69`](https://github.com/rmst/jix/blob/main/src/jix/targets.js#L69)

Represents a user on a host.
