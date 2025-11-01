---
parent: CLI Reference
title: jix uninstall
nav_order: 4
---

# jix uninstall

Source: [`src/jix-cli/uninstall.js`](https://github.com/rmst/jix/blob/cf7ca20/src/jix-cli/uninstall.js)

Uninstall a jix manifest.

## Usage

```
jix uninstall [name]
```

## Description

Uninstall all effects currently active for a given jix manifest.

## Arguments

- `[name]` - Name of the install (default: 'default')

## Options

- `-f, --file <path>` - Use a specific manifest file or directory

## Examples

```bash
jix uninstall
jix uninstall default
jix uninstall -f ~/work/my-tools
```
