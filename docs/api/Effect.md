# Effect Class

*Source: [src/nux/effect.js](../../src/nux/effect.js)*

Base effect class that represents a recipe to take actions (build, install, uninstall).

## Constructor

### Effect(obj)
Creates a new Effect instance.

**Parameters:**
- `obj` - EffectProps object, Array, or TargetFn

**Source:** [src/nux/effect.js:110](../../src/nux/effect.js#L110)

## Methods

### dependOn(...others)
Returns copy with additional dependencies.

**Parameters:**
- `...others` - Additional AbstractEffect instances to depend on

**Returns:** Effect instance

**Throws:** Error if called on function-based effects

**Source:** [src/nux/effect.js:120](../../src/nux/effect.js#L120)

### target(x)
Target this effect to a specific host and user.

**Parameters:**
- `x` - Object with `host`, `user`, and optional `home` properties

**Returns:** [TargetedEffect](./TargetedEffect.md) instance

**Source:** [src/nux/effect.js:140](../../src/nux/effect.js#L140)

## Related

- [TargetedEffect](./TargetedEffect.md) - Effects targeted to specific hosts
- [AbstractEffect](./AbstractEffect.md) - Base class for all effects
- [effect function](./Readme.md#effect) - Factory function for creating effects