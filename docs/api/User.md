---
parent: API Reference
title: User
nav_order: 22
---

# User

Source: [`src/jix/targets.js#L69-113`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/targets.js#L69-113)

Class representing a user on a host.

## `new User(host, name, info)`

User instances are typically created automatically by Host constructor.

**Parameters:**

- `host` ([Host](./Host.md), required) - The host this user belongs to
- `name` (string, required) - Username
- `info` (Object, required) - User information object

## Properties

- `name` (string) - Username
- `host` ([Host](./Host.md)) - The associated host
- `home` (string) - Home directory path
- `uid` (string) - User ID
- `gid` (string) - Group ID
- `shell` (string) - Default shell path

---

## `install(fn)`
Source: [`src/jix/targets.js#L107-112`](https://github.com/rmst/jix/blob/cf7ca20/src/jix/targets.js#L107-112)

Execute a function with this user as the target context.

**Parameters:**

- `fn` ([EffectFn](./Effect.md#effectfn)) - Function that receives the user as argument

**Returns:** The return value of `fn`
