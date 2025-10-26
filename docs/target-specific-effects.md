---
title: Target-Specific Effects
nav_order: 2
---

# Target-Specific Effects

Effects in Jix are always created within a target context that specifies the host and user they apply to. This enables creating platform-specific effects and managing installations across different machines. The target context is automatically set when using `Host.install()` or `User.install()` methods, and effects created within these contexts can access information about the target host and user.

```javascript
export const install = () => {
  const host = new jix.Host("localhost", { alice: {} })

  host.install(h => {
    console.log('The target OS is:', h.os) // e.g., 'macos', 'linux', 'nixos'

    // Create platform-specific effects
    if (h.os === 'macos') {
      return jix.script`echo "This is for macOS"`
    } else if (h.os === 'linux') {
      return jix.script`echo "This is for Linux"`
    } else {
      return jix.script`echo "Other OS: ${h.os}"`
    }
  })
}
```

You can also target specific users:

```javascript
export const install = () => {
  const host = new jix.Host("localhost", { alice: {}, bob: {} })

  // Install for alice
  host.users.alice.install(user => {
    jix.alias({ my_tool: jix.script`echo "Installed for ${user.name}"` })
  })

  // Install for bob
  host.users.bob.install(user => {
    jix.alias({ my_tool: jix.script`echo "Installed for ${user.name}"` })
  })
}
```