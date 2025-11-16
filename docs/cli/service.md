---
title: service
parent: CLI Reference
nav_order: 8
---

# jix service

Source: [`src/jix-cli/service/index.js`](https://github.com/rmst/jix/blob/c79ce89/src/jix-cli/service/index.js)

Display running services for all Jix manifests in the current directory.

## Usage

```
jix service [status <service-name>]
jix service log <service-name>
```

## Subcommands

- `status <service-name>` - Show detailed status for a specific service
- `log <service-name>` - Show logs for a specific service

## Examples

```bash
# List all services in current directory
jix service

# Show status for a specific service
jix service status my-service

# Show logs for a specific service
jix service log my-service
```
