---
parent: API Reference
title: User
nav_order: 22
---

# User

Source: [`src/jix/targets.js#L69-114`](https://github.com/rmst/jix/blob/main/src/jix/targets.js#L69-114)

Class representing a user on a host.

## Constructor

```javascript
new User(host, name, info)
```

User instances are typically created automatically by Host constructor.

**Parameters:**

- `host` (Host, required) - The host this user belongs to
- `name` (string, required) - Username
- `info` (Object, required) - User information object

## Properties

- `name` (string) - Username
- `host` (Host) - The associated host
- `home` (string) - Home directory path
- `uid` (string) - User ID
- `gid` (string) - Group ID
- `shell` (string) - Default shell path

## Methods

### install
Source: [`src/jix/targets.js#L107-112`](https://github.com/rmst/jix/blob/main/src/jix/targets.js#L107-112)

```javascript
install(fn)
```

Execute a function with this user as the target context.

**Parameters:**

- `fn` (Function) - Function that receives the user as argument

**Returns:** The return value of `fn`
