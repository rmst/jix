---
parent: CLI Reference
title: jix show
nav_order: 5
---

# jix show

Source: [`src/jix-cli/show.js`](https://github.com/rmst/jix/blob/main/src/jix-cli/show.js)

Display information about a jix effect.

## Usage

```
jix show <effectId>
```

## Description

Show metadata about an effect by hash.

## Arguments

- `<effectId>` - Hash of effect file under `~/.jix/store/<hash>`

## Example

```bash
jix show 3f8c...
```

## Output

The command displays:
- Effect details (install/uninstall actions, path, dependencies)
- Installation status (whether the effect is currently installed)
- Which manifests want this effect (if any)
