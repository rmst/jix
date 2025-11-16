---
parent: API Reference
title: Host
nav_order: 21
---

# Host

Source: [`src/jix/targets.js#L5-67`](https://github.com/rmst/jix/blob/c79ce89/src/jix/targets.js#L5-67)

Class representing a target host machine.

## `new Host(address, users = {})`

**Parameters:**

- `address` (string, required) - Host address or hostname
- `users` (Object, optional) - User definitions (default: `{}`)

Host information is automatically queried from the target machine.

## Properties

- `address` (string) - The host address
- `users` (Object) - User instances, always includes 'root'
- `os` (string) - Operating system type
- `kernel_name` (string) - Kernel name
- `architecture` (string) - CPU architecture
- `os_version` (string) - OS version string
- `machineId` (string) - Unique machine identifier
- `hostname` (string) - Hostname of the machine

---

## `install(fn)`
Source: [`src/jix/targets.js#L61-66`](https://github.com/rmst/jix/blob/c79ce89/src/jix/targets.js#L61-66)

Execute a function with this host and root user as the target context.

**Parameters:**

- `fn` ([EffectFn](./Effect.md#effectfn)) - Function that receives the host as argument

**Returns:** The return value of `fn`
