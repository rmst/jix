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
nux apply <path>
```

**Parameters:**
- `path` - Path to the nux configuration file or directory to apply

**Description:**
Installs the specified nux configuration by executing the install actions defined in the configuration.

*Source: [src/nux-cli/main.js:26](../../src/nux-cli/main.js#L26)*

### delete
Delete/uninstall a nux manifest by its path.

```
nux delete <path>
```

**Parameters:**
- `path` - A filesystem path inside the project containing `__nux__.js` or the path to `__nux__.js` itself

**Description:**
Removes a previously applied nux manifest. The path is resolved to its canonical manifest ID internally.

*Source: [src/nux-cli/main.js:37](../../src/nux-cli/main.js#L37)*

### force-remove
Forcefully remove derivations.

```
nux force-remove <drvs>
```

**Parameters:**
- `drvs` - Derivation(s) to force remove

**Description:**
Forcefully removes the specified derivations without going through the normal uninstall process.

*Source: [src/nux-cli/main.js:46](../../src/nux-cli/main.js#L46)*

### host-info
Query and display host and user information.

```
nux host-info [host] [user]
```

**Parameters:**
- `host` - Optional hostname or IP address to query (defaults to local host)
- `user` - Optional username to query (defaults to current user)

**Description:**
Displays detailed information about the target host and user, including OS details, architecture, home directory, and user-specific information. Output is formatted as JSON.

*Source: [src/nux-cli/main.js:51](../../src/nux-cli/main.js#L51)*

### show
Display information about a nux effect.

```
nux show <effectId>
```

**Parameters:**
- `effectId` - The identifier of the effect to display information about

**Description:**
Shows detailed information about the specified nux effect, including its configuration and current state.

*Source: [src/nux-cli/main.js:59](../../src/nux-cli/main.js#L59)*

### run
Execute a nux script or command.

```
nux run <script> [args...]
```

**Parameters:**
- `script` - The script or command to execute
- `args` - Optional arguments to pass to the script

**Description:**
Runs the specified script or command with the provided arguments in the nux environment.

*Source: [src/nux-cli/main.js:63](../../src/nux-cli/main.js#L63)*

### init
Initialize a new nux environment.

```
nux init
```

**Description:**
Sets up a new nux environment in the current location, creating necessary directories and configuration files.

*Source: [src/nux-cli/main.js:67](../../src/nux-cli/main.js#L67)*

## Exit Codes

- `0` - Success
- `1` - Error (with error message and stack trace printed to console)
