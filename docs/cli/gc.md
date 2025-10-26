---
parent: CLI Reference
title: jix gc
---

# jix gc

Source: [`src/jix-cli/gc.js`](https://github.com/rmst/jix/blob/main/src/jix-cli/gc.js)

Delete unreferenced build outputs and effect files.

## Usage

```
jix gc [--dry-run]
```

## Description

Remove all unreferenced build outputs (`~/.jix/out`) and effect files (`~/.jix/store`) that are not referenced in active or existing hashes.

## Options

- `--dry-run` - Show what would be deleted without actually deleting

## Example

```bash
jix gc
jix gc --dry-run
```

## Behavior

- Collects all active hashes from all manifests
- Collects all existing hashes
- Identifies unreferenced entries in both `store` and `out` directories
- Deletes or reports what would be deleted (based on `--dry-run` flag)
- Reports the number of items deleted or that would be deleted
