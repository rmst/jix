# Host

Source: [`src/jix/targets.js#L6-66`](../../src/jix/targets.js#L6-66)

Class representing a target host machine.

## Constructor

```javascript
new Host(address, users = {})
```

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

## Methods

### install
Source: [`src/jix/targets.js#L60-65`](../../src/jix/targets.js#L60-65)

```javascript
install(fn)
```

Execute a function with this host and root user as the target context.

**Parameters:**
- `fn` (Function) - Function that receives the host as argument

**Returns:** The return value of `fn`
