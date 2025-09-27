# shelltools Namespace

*Source: [src/nux/shelltools/index.js](../../src/nux/shelltools/index.js)*

Shell utility scripts for file and directory monitoring.

## Scripts

### watch
File watching script.

**Type:** [Effect](./Effect.md) (imported script)

**Source:** [src/nux/shelltools/watch](../../src/nux/shelltools/watch)

### watchfile
Watch specific file for changes.

**Type:** [Effect](./Effect.md) (imported script)

**Source:** [src/nux/shelltools/watchfile](../../src/nux/shelltools/watchfile)

### watchdir
Watch directory for changes.

**Type:** [Effect](./Effect.md) (imported script)

**Source:** [src/nux/shelltools/watchdir](../../src/nux/shelltools/watchdir)

## Convenience Functions

### aliasAll
Creates aliases for all shelltools scripts in the bin directory.

**Type:** Array of [Effect](./Effect.md) instances

**Implementation:** Uses [alias function](./nux.md#alias) to create symlinks

**Source:** [src/nux/shelltools/index.js:15](../../src/nux/shelltools/index.js#L15)

## Usage

All shelltools are imported as executable scripts using [importScript function](./nux.md#importscript).

**Source:** [src/nux/shelltools/index.js:5](../../src/nux/shelltools/index.js#L5)

## Related

- [alias function](./Readme.md#alias) - Create command aliases
- [importScript function](./Readme.md#importscript) - Import executable scripts