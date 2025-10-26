---
parent: CLI Reference
title: jix host info
---

# jix host-info

Source: [`src/jix-cli/host-info.js`](https://github.com/rmst/jix/blob/main/src/jix-cli/host-info.js)

Query and display host and user information.

## Usage

```
jix host-info [host] [user]
```

## Description

Query OS and user information for a local or remote host.

## Arguments

- `[host]` - Optional hostname; omitted means local (defaults to "localhost")
- `[user]` - Optional user; omitted means current user

## Example

```bash
jix host-info
jix host-info example.com alice
```

## Output

The command displays:
- Host information (OS, architecture, machine ID, etc.)
- User information (home directory, UID, GID, shell, etc.)
- List of applied effects for the target host/user combination
- Paths of effects that are not in the `~/.jix/` directory
