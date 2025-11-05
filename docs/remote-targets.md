---
title: Remote Targets
parent: Advanced
nav_order: 1
---

# Remote Targets

Effects in Jix are always created within a target context that specifies the host and user they apply to. This allows for managing installations across different machines. The target context is automatically set when using `Host.install()` or `User.install()` methods, and effects created within these contexts can access information about the target host and user.

```javascript
const vps1 = new jix.Host("10.200.200.1", { alice: {} })

let hellojix = () => jix.script`
  Hello from ${jix.target().host.hostname}!
`

export const install = () => {
  // Here, jix.target().host === Host("localhost")
  vps1.install(host => {
    // Here, jix.target().host === vps1 === host
    // and   jix.target().user.name === "root"
    jix.alias({ hellojix })  
    // makes hellojix available in ssh root@10.200.200.1

    host.users.alice.install(user => {
      // Here jix.target().user.name === "alice"
      jix.alias({ hellojix })
      // makes hellojix available in ssh alice@10.200.200.1
    })
  })
}
```
