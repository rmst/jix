---
parent: CLI Reference
title: jix run
nav_order: 3
---

# jix run

Source: [`src/jix-cli/run/index.js`](https://github.com/rmst/jix/blob/main/src/jix-cli/run/index.js)

Execute a jix script or command.

## Usage

```
jix run <command-name> [args...]
```

## Description

Run a command defined in the current directory's `__jix__.js` manifest under `export const run = {...}`.

## Arguments

- `<command-name>` - Name of the entry under export const run = {...}
- `[args...]` - Arguments forwarded to the invoked script

## Options (before `<command-name>`)

- `-v, --verbose` - Show jix install/uninstall logs for this run
- `-f, --file <path>` - Use a specific manifest file or directory
- `--find-manifest` - Search parent directories for manifest

## Examples

```bash
jix run
jix run hello
jix run --verbose build --release
jix run -- hello --debug
```
