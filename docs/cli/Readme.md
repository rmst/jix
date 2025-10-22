# Jix CLI Reference

*Source: [src/jix-cli/main.js](../../src/jix-cli/main.js)*

This document contains auto-generated documentation for the jix CLI commands.

## Usage

```
jix <command> [arguments...]
```

## Commands

### install
Install/apply a jix configuration or effect.

```
jix install [--dry-run] <path>
```

**Parameters:**
- `path` - Path to a file or any path inside a git repo containing `__jix__.js`

**Options:**
- `--dry-run` - Show what would be installed/uninstalled without making changes

**Description:**
Apply a jix manifest located at the specified path. The path can point to a `__jix__.js` file directly or any path inside a git repository containing one.

**Examples:**
```
jix install ./my-tools
jix install ~/work/project/__jix__.js
jix install --dry-run ./my-tools
```

*Source: [src/jix-cli/install/index.js](../../src/jix-cli/install/index.js)*

### uninstall
Uninstall a jix manifest by its path.

```
jix uninstall <path>
```

**Parameters:**
- `path` - A path inside the project containing `__jix__.js` or the path to `__jix__.js` itself

**Description:**
Uninstall all effects currently active for a given jix manifest. The path is resolved to its canonical manifest ID internally.

**Example:**
```
jix uninstall ~/work/my-tools/__jix__.js
```

*Source: [src/jix-cli/uninstall.js](../../src/jix-cli/uninstall.js)*

### force-remove
Forcefully remove derivations.

```
jix force-remove <drvs>
```

**Parameters:**
- `drvs` - Newline-separated list of hashes (single argument)

**Description:**
Force-remove one or more effect hashes from the existing set without going through the normal uninstall process.

**Example:**
```
jix force-remove 'hash1\nhash2'
```

*Source: [src/jix-cli/forceRemove.js](../../src/jix-cli/forceRemove.js)*

### host-info
Query and display host and user information.

```
jix host-info [host] [user]
```

**Parameters:**
- `host` - Optional hostname; omitted means local host
- `user` - Optional user; omitted means current user

**Description:**
Query OS and user information for a local or remote host. Displays detailed information about the target host and user, including OS details, architecture, home directory, and user-specific information. Output is formatted as JSON.

**Examples:**
```
jix host-info
jix host-info example.com alice
```

*Source: [src/jix-cli/host-info.js](../../src/jix-cli/host-info.js)*

### show
Display information about a jix effect.

```
jix show <effectId>
```

**Parameters:**
- `effectId` - Hash of effect file under `~/.jix/store/<hash>`

**Description:**
Show metadata about an effect by hash, including its configuration and current state.

**Example:**
```
jix show 3f8c...
```

*Source: [src/jix-cli/show.js](../../src/jix-cli/show.js)*

### run
Execute a jix script or command.

```
jix run [options] [command-name] [args...]
```

**Parameters:**
- `command-name` - Name of the entry under `export const run = {...}` (defaults to `default` if omitted)
- `args` - Arguments forwarded to the invoked script

**Options (before command-name):**
- `-v, --verbose` - Show Jix install/uninstall logs for this run
- `-f, --file <path>` - Use a specific manifest file or directory

**Description:**
Run a command defined in the current directory's `__jix__.js` manifest. By default, the manifest is `./__jix__.js`. Use `-f/--file` to point to a different manifest file or a directory containing one. If `<command-name>` is not provided, Jix runs the `default` entry.

Only flags placed before `<command-name>` are consumed by Jix itself. Everything after `<command-name>` (or after a standalone `--`) is forwarded unchanged to your script.

**Examples:**
```
jix run
jix run hello
jix run --verbose build --release
jix run -- hello --debug
```

*Source: [src/jix-cli/run/index.js](../../src/jix-cli/run/index.js)*

### init
Initialize a new jix environment.

```
jix init
```

**Description:**
Initialize jix support in the current working directory. This creates `.jix/modules` directory, sets up editor hints, and links the jix libs locally.

**Example:**
```
jix init
```

*Source: [src/jix-cli/init/index.js](../../src/jix-cli/init/index.js)*

### help
Show help for a command.

```
jix help [command]
```

**Parameters:**
- `command` - Optional command name to show help for

**Description:**
Show help for a specific command, or show an overview of all available commands if no command is specified.

**Examples:**
```
jix help
jix help install
```

*Source: [src/jix-cli/main.js](../../src/jix-cli/main.js)*

## Exit Codes

- `0` - Success
- `1` - Error (with error message and stack trace printed to console)
