---
parent: CLI Reference
title: jix install
nav_order: 2
---

# jix install

Source: [`src/jix-cli/install/index.js`](https://github.com/rmst/jix/blob/main/src/jix-cli/install/index.js)

Install a jix configuration.

## Usage

```
jix install [name]
```

## Description

Install a jix manifest from the current directory's `__jix__.js`.

## Arguments

- `[name]` - Name of the install (defaults to "default")

## Options

- `--dry-run` - Show what would be installed/uninstalled without making changes
- `-f, --file <path>` - Use a specific manifest file or directory

## Examples

```bash
jix install
jix install default
jix install foo
jix install -f ./my-tools
jix install --dry-run
```
