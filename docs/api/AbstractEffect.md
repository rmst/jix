# AbstractEffect Class

*Source: [src/nux/effectUtil.js](../../src/nux/effectUtil.js)*

Base class for effects with common functionality including string conversion and convenience methods.

## Constructor

### AbstractEffect()
Creates a new AbstractEffect instance with unique ID.

**Source:** [src/nux/effectUtil.js:10](../../src/nux/effectUtil.js#L10)

## Properties

### id
Unique numeric identifier for this effect instance.

**Type:** number

## Methods

### toString()
Converts effect to string placeholder for use in templates.

**Returns:** string - Placeholder key that gets registered in effectPlaceholderMap

**Source:** [src/nux/effectUtil.js:15](../../src/nux/effectUtil.js#L15)

### symlinkTo(path)
Create a symbolic link to this effect at the specified path.

**Parameters:**
- `path` - Destination path for the symbolic link

**Returns:** Effect from [symlink function](./Readme.md#symlink)

**Source:** [src/nux/effectUtil.js:24](../../src/nux/effectUtil.js#L24)

### linkTo(path, symbolic)
Create a link (hard or symbolic) to this effect at the specified path.

**Parameters:**
- `path` - Destination path for the link
- `symbolic` - Boolean, true for symlink, false for hard link (default: false)

**Returns:** Effect from [link function](./Readme.md#link)

**Source:** [src/nux/effectUtil.js:25](../../src/nux/effectUtil.js#L25)

### copyTo(path)
Copy this effect to the specified path.

**Parameters:**
- `path` - Destination path for the copy

**Returns:** Effect from [copyFile function](./Readme.md#copyfile)

**Source:** [src/nux/effectUtil.js:26](../../src/nux/effectUtil.js#L26)

## Static Properties

### nextId
Static counter for assigning unique IDs to effect instances.

**Type:** number

## Related

- [Effect](./Effect.md) - Concrete effect implementation
- [TargetedEffect](./TargetedEffect.md) - Effects targeted to specific hosts