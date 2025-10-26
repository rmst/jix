# Jix API Reference

Source: [`src/jix/index.js`](../../src/jix/index.js)

## Properties

### HOME
Type: `string`

Source: [`src/jix/context.js#L5`](../../src/jix/context.js#L5)

Placeholder for the user's home directory.

### HASH
Type: `string`

Source: [`src/jix/base.js#L12`](../../src/jix/base.js#L12)

Placeholder constant that gets replaced with the effect's hash.

## Functions

### effect
Source: [`src/jix/effect.js#L111`](../../src/jix/effect.js#L111)

```javascript
effect(obj)
```

Create an effect from properties or dependencies.

**Parameters:**
- `obj` (Object | Array) - Effect properties or array of dependencies
  - `install` (Array, optional) - Install action specification
  - `uninstall` (Array, optional) - Uninstall action specification
  - `build` (Array, optional) - Build action specification
  - `dependencies` (Array, optional) - Effect dependencies
  - `path` (string, optional) - File system path
  - `str` (string, optional) - String representation

**Returns:** Effect

### build
Source: [`src/jix/base.js#L189`](../../src/jix/base.js#L189)

Template tag function for building artifacts from shell scripts.

**Parameters:**
- Template string containing shell script

**Returns:** Effect with build output path in `$out`

### dedent
Source: [`src/jix/dedent.js`](../../src/jix/dedent.js)

Remove common leading whitespace from template strings.

**Parameters:**
- `templateStrings` (Array) - Template string parts
- `...values` - Interpolated values

**Returns:** string

### importFile
Source: [`src/jix/base.js#L19`](../../src/jix/base.js#L19)

```javascript
importFile(origin, mode='-w')
```

Read a file from the filesystem and create an effect containing its contents.

**Parameters:**
- `origin` (string) - Path to file to import
- `mode` (string, optional) - File permissions mode (default: '-w')

**Returns:** Effect with additional `name` property set to file basename

### importScript
Source: [`src/jix/base.js#L27`](../../src/jix/base.js#L27)

```javascript
importScript(origin)
```

Import an executable script file. Equivalent to `importFile(origin, '-w+x')`.

**Parameters:**
- `origin` (string) - Path to script file

**Returns:** Effect

### copy
Source: [`src/jix/base.js#L167`](../../src/jix/base.js#L167)

```javascript
copy(from, to)
```

Copy a file to a destination path.

**Parameters:**
- `from` (string | Effect) - Source path
- `to` (string) - Destination path

**Returns:** Effect

### link
Source: [`src/jix/base.js#L32`](../../src/jix/base.js#L32)

```javascript
link(origin, path, symbolic=false)
```

Create a hard or symbolic link.

**Parameters:**
- `origin` (string | Effect) - Source path
- `path` (string) - Link destination path (tilde expanded)
- `symbolic` (boolean, optional) - Create symbolic link if true (default: false)

**Returns:** Effect

### symlink
Source: [`src/jix/base.js#L53`](../../src/jix/base.js#L53)

```javascript
symlink(origin, path)
```

Create a symbolic link. Equivalent to `link(origin, path, true)`.

**Parameters:**
- `origin` (string | Effect) - Source path
- `path` (string) - Link destination path

**Returns:** Effect

### alias
Source: [`src/jix/base.js#L56`](../../src/jix/base.js#L56)

```javascript
alias(mapping)
```

Create command aliases in the jix bin directory.

**Parameters:**
- `mapping` (Object) - Maps alias names to target paths/effects

**Returns:** Array of Effect (symlinks)

### customEffect
Source: [`src/jix/base.js#L69`](../../src/jix/base.js#L69)

```javascript
customEffect({install, uninstall, ...other})
```

Create an effect with custom shell commands for install/uninstall.

**Parameters:**
- `install` (string, optional) - Shell command to run on install
- `uninstall` (string, optional) - Shell command to run on uninstall
- Additional properties passed to effect

**Returns:** Effect

### buildDir
Source: [`src/jix/base.js#L83`](../../src/jix/base.js#L83)

```javascript
buildDir(files)
```

Build a directory containing specified files.

**Parameters:**
- `files` (Object) - Maps filenames to source paths/effects

**Returns:** Effect representing the built directory

### dir
Source: [`src/jix/base.js#L105`](../../src/jix/base.js#L105)

```javascript
dir(path, extraArgs={})
```

Create a directory at the specified path using `mkdir -p`.

**Parameters:**
- `path` (string) - Directory path to create
- `extraArgs` (Object, optional) - Additional effect properties

**Returns:** Effect

### str
Source: [`src/jix/base.js#L135`](../../src/jix/base.js#L135)

Template tag function for creating string effects with dependency tracking.

**Parameters:**
- Template string with possible effect interpolations

**Returns:** Effect with `str` property containing the resulting string

### textfile
Source: [`src/jix/base.js#L174`](../../src/jix/base.js#L174)

Template tag function for creating text files. Equivalent to `writeFile()`.

**Parameters:**
- Template string containing file content

**Returns:** Effect

### script
Source: [`src/jix/base.js#L183`](../../src/jix/base.js#L183)

Template tag function for creating executable script files. Equivalent to `writeFile('-w+x')`.

**Parameters:**
- Template string containing script content

**Returns:** Effect

### writeFile
Source: [`src/jix/base.js#L147`](../../src/jix/base.js#L147)

```javascript
writeFile(mode='-w')
```

Create a template tag function for writing files with specified permissions.

**Parameters:**
- `mode` (string, optional) - File permissions mode (default: '-w')

**Returns:** Function that takes a template string and returns an Effect

### stateDir
Source: [`src/jix/stateDir.js#L8`](../../src/jix/stateDir.js#L8)

```javascript
stateDir(id)
```

Create a state directory in `~/.jix/db/<id>` that persists across installs/uninstalls.

**Parameters:**
- `id` (string) - Non-empty identifier for the state directory

**Returns:** Effect

### target
Source: [`src/jix/base.js#L204`](../../src/jix/base.js#L204)

Get the current target context (host and user).

**Returns:** Object with `host` and `user` properties

## Classes

### [Host](./Host.md)
Source: [`src/jix/targets.js#L6`](../../src/jix/targets.js#L6)

Represents a target host machine.

### [User](./User.md)
Source: [`src/jix/targets.js#L69`](../../src/jix/targets.js#L69)

Represents a user on a host.

## Namespaces

### [service](./service.md)
Source: [`src/jix/service/index.js`](../../src/jix/service/index.js)

Service management functions.

### [nix](./nix.md)
Source: [`src/jix/nix/index.js`](../../src/jix/nix/index.js)

Nix package management integration.

### [git](./git.md)
Source: [`src/jix/git/index.js`](../../src/jix/git/index.js)

Git repository operations.

### experimental
Source: [`src/jix/index.js#L29-38`](../../src/jix/index.js#L29-38)

Contains experimental features: `nixos`, `shelltools`, `appendToFile`, `scriptWithTempdir`, `withTarget`, `getTarget`.

### _internal
Source: [`src/jix/index.js#L41-47`](../../src/jix/index.js#L41-47)

Contains internal APIs: `Effect`, `JIX_PATH`, `HASH`, `writeFile`.
