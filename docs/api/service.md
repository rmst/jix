---
parent: API Reference
title: service
---

# service

Source: [`src/jix/service/index.js`](https://github.com/rmst/jix/blob/main/src/jix/service/index.js)

Service management namespace.

## Default Export

Source: [`src/jix/service/index.js#L15-117`](https://github.com/rmst/jix/blob/main/src/jix/service/index.js#L15-117)

```javascript
service({label, runscript, system, runOnInstall, noUninstall})
```

Create a persistent background service. Implementation varies by platform (launchd on macOS, systemd on Linux/NixOS).

**Parameters:**
- `label` (string, required) - Service identifier
- `runscript` (string | Effect, required) - Path to executable or script effect
- `system` (boolean, optional) - Install as system service if true (default: false)
- `runOnInstall` (boolean, optional) - Start service on install (default: true)
- `noUninstall` (boolean, optional) - Skip uninstallation (default: false)

**Returns:** Effect

Service output is logged with timestamps to state directory.

## Functions

### userServicesDir
Source: [`src/jix/service/index.js#L6`](https://github.com/rmst/jix/blob/main/src/jix/service/index.js#L6)

Get the state directory for user services.

**Returns:** Effect representing `jix.user-services` state directory

### systemServicesDir
Source: [`src/jix/service/index.js#L7`](https://github.com/rmst/jix/blob/main/src/jix/service/index.js#L7)

Get the state directory for system services.

**Returns:** Effect representing `jix.services` state directory
