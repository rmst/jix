# db Namespace

*Source: [src/nux/db.js](../../src/nux/db.js)*

Database and persistent state management utilities.

## Functions

### stateDir(id, owner)
Create a managed state directory that persists across installs/uninstalls.

**Parameters:**
- `id` - Unique identifier for the state directory
- `owner` - Optional owner user (default: null)

**Returns:** [Effect](./Effect.md) with path property pointing to the state directory

**Behavior:**
- **Install:** Creates or reactivates state directory at `${HOME}/.nux/db/${id}`
- **Uninstall:** Moves state directory to `${HOME}/.nux/db-inactive/${id}` for later reactivation
- **Path:** Returns path to active state directory

**Owner Management:**
If `owner` is specified, the directory ownership is changed using `chown -R ${owner}`.

**Source:** [src/nux/db.js:7](../../src/nux/db.js#L7)

## Directory Structure

```
${HOME}/.nux/
├── db/           # Active state directories
│   └── ${id}/    # Individual state directory
└── db-inactive/  # Deactivated state directories
    └── ${id}/    # Preserved state for reactivation
```

## Use Cases

- Persistent application data
- Configuration that survives nux reinstalls
- Database files
- User-generated content

## Related

- [run function](./Readme.md#run) - Execute shell commands
- [NUX_DIR constant](./Readme.md#constants) - Base nux directory (.nux)