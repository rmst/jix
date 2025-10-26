---
parent: API Reference
title: Effect
nav_order: 20
---

# Effect

Source: [`src/jix/effect.js#L146-252`](https://github.com/rmst/jix/blob/main/src/jix/effect.js#L146-252)

Core class representing a jix effect. Effects are the fundamental building blocks in Jix that describe actions to build, install, and uninstall configurations.

## Constructor

```javascript
new Effect(props)
```

**Parameters:**

- `props` (Object, optional) - Effect properties
  - `install` (Array, optional) - Install action specification
  - `uninstall` (Array, optional) - Uninstall action specification
  - `build` (Array, optional) - Build action specification
  - `dependencies` (Array, optional) - Array of Effect dependencies
  - `path` (string, optional) - File system path for the effect
  - `str` (string, optional) - String representation
  - `hash` (string, optional) - Pre-computed hash (usually auto-generated)

## Properties

- `id` (number) - Unique effect identifier
- `dependencies` (Effect[]) - Array of dependent effects
- `install` (Array) - Install action specification
- `uninstall` (Array) - Uninstall action specification
- `build` (Array) - Build action specification
- `host` (string) - Target host machine ID
- `user` (string) - Target user name
- `hash` (string) - Content hash of the effect
- `path` (string) - File system path where effect output is stored
- `str` (string) - String representation (defaults to `path`)

## Methods

### normalize()

Returns normalized representation of the effect for hashing.

**Returns:** Object with `install`, `uninstall`, `build`, `dependencies`, `host`, and `user`

### serialize()

Serialize the effect to JSON string.

**Returns:** string

### toString()

Returns the string representation of the effect.

**Returns:** string (same as `str` property)

## Notes

- Effects are automatically tracked when created within a target context
- The hash is computed from the normalized representation
- Use the `effect()` function (from the main API) to create effects rather than instantiating directly
