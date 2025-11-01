---
parent: CLI Reference
title: jix force-remove
nav_order: 7
---

# jix force-remove

Source: [`src/jix-cli/forceRemove.js`](https://github.com/rmst/jix/blob/cf7ca20/src/jix-cli/forceRemove.js)

Forcefully remove derivations.

## Usage

```
jix force-remove [--abandon] <drvs>
```

## Description

Force-remove one or more effect hashes from the existing set.

By default, attempts to properly uninstall each effect before removal. Use `--abandon` to skip uninstallation and directly remove from the existing list.

## Arguments

- `<drvs>` - Newline-separated list of hashes (single argument)

## Options

- `--abandon` - Skip uninstallation attempts and directly remove from existing list

## Examples

```bash
# Attempts proper uninstallation
jix force-remove 'hash1
hash2'

# Directly removes without uninstalling
jix force-remove --abandon 'hash1
hash2'
```

## Behavior

- Without `--abandon`: Attempts to properly uninstall each effect and reports success/failure
- With `--abandon`: Directly removes hashes from the existing list without attempting uninstallation
