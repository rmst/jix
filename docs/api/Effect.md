---
parent: API Reference
title: Effect
nav_order: 20
---

# Effect
{: #effect }

Source: [`src/jix/effect.js#L163-308`](https://github.com/rmst/jix/blob/c79ce89/src/jix/effect.js#L163-308)

Core class representing a jix effect. Effects are the fundamental building blocks in Jix that describe actions to build, install, and uninstall configurations.

## Type Definitions
{: #type-definitions }

## `EffectFn`
{: #effectFn }
Source: [`src/jix/effect.js#L97`](https://github.com/rmst/jix/blob/c79ce89/src/jix/effect.js#L97)

A function that returns an [Effect](#effect).

**Type:** `() => Effect`

---

## `EffectOrFn`
{: #effectOrFn }
Source: [`src/jix/effect.js#L101`](https://github.com/rmst/jix/blob/c79ce89/src/jix/effect.js#L101)

An [Effect](#effect) or a function that returns an Effect.

**Type:** `Effect | EffectFn`

---

## `new Effect(props)`
{: #newEffect }

**Parameters:**

- `props` (Object, optional) - Effect properties
  - `install` (Array, optional) - Install action specification
  - `uninstall` (Array, optional) - Uninstall action specification
  - `build` (Array, optional) - Build action specification
  - `dependencies` (Array, optional) - Array of [Effect](#effect) dependencies
  - `path` (string, optional) - File system path for the effect
  - `str` (string, optional) - String representation
  - `hash` (string, optional) - Pre-computed hash (usually auto-generated)

## Properties
{: #properties }

- `dependencies` ([Effect](#effect)[]) - Array of dependencies
- `install` (Array) - Install action specification
- `uninstall` (Array) - Uninstall action specification
- `build` (Array) - Build action specification
- `host` (string) - Target host machine ID
- `user` (string) - Target user name
- `hash` (string) - Content hash of the effect
- `path` (string) - Associated file system path
- `str` (string) - Associated string (defaults to `path`)

---

## `symlinkTo(path)`
{: #symlinkTo }
Source: [`src/jix/effect.js#L298`](https://github.com/rmst/jix/blob/c79ce89/src/jix/effect.js#L298)

Create a symbolic link to this effect at the specified path.

**Parameters:**

- `path` (string) - Destination path for the symbolic link

**Returns:** [Effect](#effect)

---

## `linkTo(path)`
{: #linkTo }
Source: [`src/jix/effect.js#L303`](https://github.com/rmst/jix/blob/c79ce89/src/jix/effect.js#L303)

Create a hard link to this effect at the specified path.

**Parameters:**

- `path` (string) - Destination path for the link

**Returns:** [Effect](#effect)

---

## `copyTo(path)`
{: #copyTo }
Source: [`src/jix/effect.js#L308`](https://github.com/rmst/jix/blob/c79ce89/src/jix/effect.js#L308)

Copy this effect to the specified path.

**Parameters:**

- `path` (string) - Destination path for the copy

**Returns:** [Effect](#effect)

---

## `normalize()`
{: #normalize }

Returns normalized representation of the effect for hashing.

**Returns:** Object with `install`, `uninstall`, `build`, `dependencies`, `host`, and `user`

---

## `serialize()`
{: #serialize }

Serialize the effect to JSON string.

**Returns:** string

---

## `toString()`
{: #toString }

Returns the string representation of the effect.

**Returns:** string (same as `str` property)

## Notes
{: #notes }

- Effects are automatically tracked when created within a target context
- The hash is computed from the normalized representation
- Use the `effect()` function (from the main API) to create effects rather than instantiating directly
