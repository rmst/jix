---
parent: API Reference
title: container
nav_order: 9
---

# container

Source: [`src/jix/container/index.js`](https://github.com/rmst/jix/blob/main/src/jix/container/index.js)

Container operations namespace for Docker and compatible runtimes (e.g., podman).

## `docker()`
Source: [`src/jix/container/index.js#L16`](https://github.com/rmst/jix/blob/main/src/jix/container/index.js#L16)

Get a reference to the Docker CLI or a compatible CLI (e.g., podman).

**Returns:** [Effect](./Effect.md) representing the docker/podman command

On NixOS, returns `nix.pkgs.podman.podman`. Otherwise, returns an effect for the existing `docker` command.

---

## `run({workdir, basedir, volumes, env, name, args}={})`
Source: [`src/jix/container/index.js#L143`](https://github.com/rmst/jix/blob/main/src/jix/container/index.js#L143)

Create a script that runs a docker container with specified options.

**Parameters:**

- `workdir` (string, optional) - Working directory inside the container
- `basedir` (string, optional) - Base directory for relative volume mounts (default: "/")
- `volumes` (Object, optional) - Volume mounts mapping paths to source paths/effects
- `env` (Object, optional) - Environment variables to set
- `name` (string, optional) - Container name
- `args` (Array, optional) - Additional docker run arguments

**Returns:** [Effect](./Effect.md) - Script that can be used to run containers

**Example:**

```javascript
jix.script`
  ${jix.container.run({workdir: "/wd", volumes: {wd: "$(pwd)"}})} myimage bash
`
```

---

## `tag(mapping)`
Source: [`src/jix/container/index.js#L37`](https://github.com/rmst/jix/blob/main/src/jix/container/index.js#L37)

Create image tags.

**Parameters:**

- `mapping` (Object, required) - Maps tag names to source image names/effects

**Returns:** [Effect](./Effect.md)

---

## `imageFromDockerfile`
Source: [`src/jix/container/index.js#L69`](https://github.com/rmst/jix/blob/main/src/jix/container/index.js#L69)

Template tag function for building Docker images from Dockerfile content. Referenced effects are automatically copied into the build context.

**Parameters:**

- Template string containing Dockerfile content

**Returns:** [Effect](./Effect.md) with `str` property set to the image name (`jix:HASH`)

**Example:**

```javascript
let myImage = jix.container.imageFromDockerfile`
  FROM ubuntu:22.04
  COPY ${myScript} /usr/local/bin/script
  RUN chmod +x /usr/local/bin/script
`
```

---

## `network(name)`
Source: [`src/jix/container/index.js#L47`](https://github.com/rmst/jix/blob/main/src/jix/container/index.js#L47)

Create an internal Docker network.

**Parameters:**

- `name` (string, required) - Network name

**Returns:** [Effect](./Effect.md) with `str` property set to the network name

---

## `volume(name)`
Source: [`src/jix/container/index.js#L54`](https://github.com/rmst/jix/blob/main/src/jix/container/index.js#L54)

Create a Docker volume.

**Parameters:**

- `name` (string, required) - Volume name

**Returns:** [Effect](./Effect.md) with `str` property set to the volume name

---

## `aptInstall`
Source: [`src/jix/container/util.js`](https://github.com/rmst/jix/blob/main/src/jix/container/util.js)

Utility for installing apt packages in Dockerfiles.
