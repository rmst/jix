# Nux CLI Reference

*Source: [src/nux-cli/main.js](../../src/nux-cli/main.js)*

This document contains auto-generated documentation for the nux CLI commands.

## Usage

```
nux <command> [arguments...]
```

## Commands

### apply
Apply/install a nux configuration or effect.

```
nux apply [--dry-run] <path>
```

**Parameters:**
- `path` - Path to a file or any path inside a git repo containing `__nux__.js`

**Options:**
- `--dry-run` - Show what would be installed/uninstalled without making changes

**Description:**
Apply a nux manifest located at the specified path. The path can point to a `__nux__.js` file directly or any path inside a git repository containing one.

**Examples:**
```
nux apply ./my-tools
nux apply ~/work/project/__nux__.js
nux apply --dry-run ./my-tools
```

*Source: [src/nux-cli/apply/index.js](../../src/nux-cli/apply/index.js)*

### delete
Delete/uninstall a nux manifest by its path.

```
nux delete <path>
```

**Parameters:**
- `path` - A path inside the project containing `__nux__.js` or the path to `__nux__.js` itself

**Description:**
Uninstall all effects currently active for a given nux manifest. The path is resolved to its canonical manifest ID internally.

**Example:**
```
nux delete ~/work/my-tools/__nux__.js
```

*Source: [src/nux-cli/delete.js](../../src/nux-cli/delete.js)*

### force-remove
Forcefully remove derivations.

```
nux force-remove <drvs>
```

**Parameters:**
- `drvs` - Newline-separated list of hashes (single argument)

**Description:**
Force-remove one or more effect hashes from the existing set without going through the normal uninstall process.

**Example:**
```
nux force-remove 'hash1\nhash2'
```

*Source: [src/nux-cli/forceRemove.js](../../src/nux-cli/forceRemove.js)*

### host-info
Query and display host and user information.

```
nux host-info [host] [user]
```

**Parameters:**
- `host` - Optional hostname; omitted means local host
- `user` - Optional user; omitted means current user

**Description:**
Query OS and user information for a local or remote host. Displays detailed information about the target host and user, including OS details, architecture, home directory, and user-specific information. Output is formatted as JSON.

**Examples:**
```
nux host-info
nux host-info example.com alice
```

*Source: [src/nux-cli/host-info.js](../../src/nux-cli/host-info.js)*

### show
Display information about a nux effect.

```
nux show <effectId>
```

**Parameters:**
- `effectId` - Hash of effect file under `~/.nux/store/<hash>`

**Description:**
Show metadata about an effect by hash, including its configuration and current state.

**Example:**
```
nux show 3f8c...
```

*Source: [src/nux-cli/show.js](../../src/nux-cli/show.js)*

### run
Execute a nux script or command.

```
nux run [options] [command-name] [args...]
```

**Parameters:**
- `command-name` - Name of the entry under `export const run = {...}` (defaults to `default` if omitted)
- `args` - Arguments forwarded to the invoked script

**Options (before command-name):**
- `-v, --verbose` - Show Nux apply/uninstall logs for this run
- `-f, --file <path>` - Use a specific manifest file or directory

**Description:**
Run a command defined in the current directory's `__nux__.js` manifest. By default, the manifest is `./__nux__.js`. Use `-f/--file` to point to a different manifest file or a directory containing one. If `<command-name>` is not provided, Nux runs the `default` entry.

Only flags placed before `<command-name>` are consumed by Nux itself. Everything after `<command-name>` (or after a standalone `--`) is forwarded unchanged to your script.

**Examples:**
```
nux run
nux run hello
nux run --verbose build --release
nux run -- hello --debug
```

*Source: [src/nux-cli/run/index.js](../../src/nux-cli/run/index.js)*

### init
Initialize a new nux environment.

```
nux init
```

**Description:**
Initialize nux support in the current working directory. This creates `.nux/modules` directory, sets up editor hints, and links the nux libs locally.

**Example:**
```
nux init
```

*Source: [src/nux-cli/init/index.js](../../src/nux-cli/init/index.js)*

### help
Show help for a command.

```
nux help [command]
```

**Parameters:**
- `command` - Optional command name to show help for

**Description:**
Show help for a specific command, or show an overview of all available commands if no command is specified.

**Examples:**
```
nux help
nux help apply
```

*Source: [src/nux-cli/main.js](../../src/nux-cli/main.js)*

## Exit Codes

- `0` - Success
- `1` - Error (with error message and stack trace printed to console)
