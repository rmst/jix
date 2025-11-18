---
parent: API Reference
title: container
nav_order: 9
---

# container

Source: [`src/jix/container/index.js`](https://github.com/rmst/jix/blob/c79ce89/src/jix/container/index.js)

Container operations namespace for Docker and compatible runtimes (e.g., podman).

## `docker()`
{: #docker }
Source: [`src/jix/container/index.js#L38`](https://github.com/rmst/jix/blob/c79ce89/src/jix/container/index.js#L38)

Get a reference to the Docker CLI or a compatible CLI (e.g., podman).

**Returns:** [Effect](./Effect.md) representing the docker/podman command

Can be configured via `jix.container.with({dockerCli: customPath})`. On NixOS, defaults to `nix.pkgs.podman.podman`. Otherwise, returns an effect for the existing `docker` command.

---

## `run({workdir, basedir, volumes, env, name, args, image}={})`
{: #run }
Source: [`src/jix/container/index.js#L174`](https://github.com/rmst/jix/blob/c79ce89/src/jix/container/index.js#L174)

Create a script that runs a docker container with specified options.

**Parameters:**

- `workdir` (string, optional) - Working directory inside the container
- `basedir` (string, optional) - Base directory for relative volume mounts (default: "/")
- `volumes` (Object, optional) - Volume mounts mapping paths to source paths/effects
- `env` (Object, optional) - Environment variables to set
- `name` (string, optional) - Container name
- `args` (Array, optional) - Additional docker run arguments
- `image` (string \| [EffectOrFn](./Effect.md#effectorfn), optional) - Docker image to use

**Returns:** [Effect](./Effect.md) - Script that can be used to run containers

**Example:**

```javascript
jix.script`
  ${jix.container.run({workdir: "/wd", volumes: {wd: "$(pwd)"}})} myimage bash
`
```

---

## `tag(mapping)`
{: #tag }
Source: [`src/jix/container/index.js#L64`](https://github.com/rmst/jix/blob/c79ce89/src/jix/container/index.js#L64)

Create image tags.

**Parameters:**

- `mapping` (Object, required) - Maps tag names to source image names/effects

**Returns:** [Effect](./Effect.md)

---

## `imageFromDockerfile`
{: #imageFromDockerfile }
Source: [`src/jix/container/index.js#L98`](https://github.com/rmst/jix/blob/c79ce89/src/jix/container/index.js#L98)

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

## `network(name, args=[])`
{: #network }
Source: [`src/jix/container/index.js#L74`](https://github.com/rmst/jix/blob/c79ce89/src/jix/container/index.js#L74)

Create a Docker network.

**Parameters:**

- `name` (string, required) - Network name
- `args` (Array, optional) - Additional docker network create arguments (default: [])

**Returns:** [Effect](./Effect.md) with `str` property set to the network name

---

## `volume(name)`
{: #volume }
Source: [`src/jix/container/index.js#L82`](https://github.com/rmst/jix/blob/c79ce89/src/jix/container/index.js#L82)

Create a Docker volume.

**Parameters:**

- `name` (string, required) - Volume name

**Returns:** [Effect](./Effect.md) with `str` property set to the volume name

---

## `with(options, fn)`
{: #with }
Source: [`src/jix/container/index.js#L23`](https://github.com/rmst/jix/blob/c79ce89/src/jix/container/index.js#L23)

Context manager for setting container options.

**Parameters:**

- `options` (Object, required) - Container options
  - `dockerCli` (string \| [EffectOrFn](./Effect.md#effectorfn) \| Function \| null, optional) - Path to docker-cli or compatible CLI like podman
- `fn` (Function, optional) - Function to execute with these options

**Returns:** Result of `fn()` if provided

---

## `aptInstall`
{: #aptInstall }
Source: [`src/jix/container/util.js`](https://github.com/rmst/jix/blob/c79ce89/src/jix/container/util.js)

Utility for installing apt packages in Dockerfiles.
