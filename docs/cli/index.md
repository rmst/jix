---
title: CLI Reference
nav_order: 4
has_children: true
---

# Jix CLI Reference

Source: [`src/jix-cli/main.js`](https://github.com/rmst/jix/blob/c79ce89/src/jix-cli/main.js)

Jix provides a command-line interface for managing configurations, running scripts, and controlling effects.

## Usage

```
jix <command> [arguments...]
```

Run `jix <command> --help` for details on each command.

## Commands

- [`install`](./install.md) - Install a jix configuration
- [`uninstall`](./uninstall.md) - Uninstall a jix manifest
- [`run`](./run.md) - Execute a jix script or command
- [`init`](./init.md) - Initialize a new jix environment
- [`show`](./show.md) - Display information about a jix effect
- [`force-remove`](./force-remove.md) - Forcefully remove derivations
- [`host-info`](./host-info.md) - Query and display host and user information
- [`service`](./service.md) - Display running services
- [`gc`](./gc.md) - Delete unreferenced build outputs and effect files
- [`help`](./help.md) - Show help for a command
