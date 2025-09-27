# TargetedEffect Class

*Source: [src/nux/effect.js](../../src/nux/effect.js)*

An effect that has been targeted to a specific host and user.

## Constructor

### TargetedEffect(tgt, props)
Creates a new TargetedEffect instance.

**Parameters:**
- `tgt` - Target object with `host` and `user` properties
- `props` - EffectProps object (optional, defaults to {})

**Source:** [src/nux/effect.js:193](../../src/nux/effect.js#L193)

## Properties

### dependencies
Array of TargetedEffect instances that this effect depends on.

**Type:** TargetedEffect[]

### install
Install action array.

### uninstall
Uninstall action array.

### build
Build action array.

### host
Target hostname.

**Type:** string

### user
Target username.

**Type:** string

### hash
Unique hash identifying this effect.

**Type:** string

### path
File system path where this effect's output is located.

**Type:** string

### str
String representation of this effect (typically same as path).

**Type:** string

## Methods

### normalize()
Returns normalized representation for hashing.

**Returns:** Object with install, uninstall, build, dependencies, host, user properties

**Source:** [src/nux/effect.js:241](../../src/nux/effect.js#L241)

### serialize()
Returns JSON serialized representation with placeholders replaced.

**Returns:** JSON string

**Source:** [src/nux/effect.js:264](../../src/nux/effect.js#L264)

### flatten()
Returns flattened array of this effect and all its dependencies.

**Returns:** TargetedEffect[]

**Source:** [src/nux/effect.js:283](../../src/nux/effect.js#L283)

### toDebugString()
Returns human-readable debug information.

**Returns:** string

**Source:** [src/nux/effect.js:291](../../src/nux/effect.js#L291)

## Related

- [Effect](./Effect.md) - Base effect class
- [AbstractEffect](./AbstractEffect.md) - Base class for all effects
- [target function](./Readme.md#target) - Factory function for creating targeted effects