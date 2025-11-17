import { Effect } from '../effect.js';
import { aptInstall } from './util.js';
import jix, { HASH, scriptWithTempdir } from '../base.js';
import nix from '../nix/index.js';
import { createContext, useContext } from '../useContext.js';

/**
  @typedef {import('../effect.js').EffectOrFn} EffectOrFn
 */

/**
  @typedef {Object} ContainerOptions
  @property {import("../effect").EffectOrFn | (()=>string) | string | null} [dockerCli] - Path to docker-cli (or compatible CLI like podman)
 */

const CONTAINER_CONTEXT = createContext(/** @type {ContainerOptions} */({ dockerCli: null }))

/**
  @template T
  @param {ContainerOptions} options - Container options
  @param {() => T} [fn] - Function to execute with these options
  @returns {T}
 */
export const withOptions = (options, fn) => {
	return CONTAINER_CONTEXT.provide(options, fn)
}

/**
  @returns {ContainerOptions}
 */
const getOptions = () => {
	return useContext(CONTAINER_CONTEXT)
}

/**
  Reference to the docker-cli (or a compatible cli such as podman)
  @returns {Effect}
 */
export const docker = () => {
	let options = getOptions()

	if(options.dockerCli) {
    let result = options.dockerCli
    if(typeof result === "function")
		  result = result()
    if(typeof result === "string")
      result = jix.str`${result}`
    return result
	}

	let target = jix.target()

	if (target.host.os === "nixos") {
		return nix.pkgs.podman.podman
	}

	return jix.existingCommand("docker")
}


/**
  @param {Record<string, EffectOrFn>} mapping 
  @returns {Effect}
 */
export const tag = (mapping) => {
  let ops = Object.entries(mapping).map(([k, v]) => jix.customEffect({
    install: `${docker} tag "${v}" ${k}`,
    uninstall: `${docker} rmi "${k}" || true`
  }))

  return jix.effect(ops)
}


export const network = (name, args=[]) => jix.customEffect({
  install: `${docker} network create ${args.join(" ")} ${name}`,
  // sleep to give docker time to free the resources
  uninstall: `sleep 0.5 && ${docker} network rm ${name}`,
  str: name,
})


export const volume = (name) => jix.customEffect({
  install: `${docker} volume create ${name}`,
  // sleep to give docker time to free the resources
  uninstall: `sleep 0.5 && ${docker} volume rm ${name}`,
  str: name,
})


/**
  Allows us to write build images from a Dockerfile string
  Referenced derivations are automatically copied into the build context so they can be used with the COPY Docker command

  @param {TemplateStringsArray} templateStrings
  @param {...(string|number|EffectOrFn)} values
  @returns {Effect}
 */
export const imageFromDockerfile = (templateStrings, ...values) => {
  
  let drvsToCopy = []
  let transformedValues = values.map(x => {
    if(typeof x === "function") {
      x = x()
      if(! (x instanceof Effect))
        throw TypeError(`Interpolated functions must return Effect, instead got: ${x}`)
    }

    if(typeof x !== "object")
      return x

    if(! (x instanceof Effect))
      return x

    if(! x.path)
      return x  // is effect but doesn't have a path (e.g. another image)

    drvsToCopy.push(x)
    return x.hash  // the new path
  })

  let dockerfile = jix.textfile(templateStrings, ...transformedValues)

  let copyCommands = drvsToCopy.map(x => {
    // TODO: assert that x is on the same machine
    return `cp -R "${x}" "./${x.hash}"`
  }).join("\n")

  // console.log("COPY COMMANDS", copyCommands)

  let script = scriptWithTempdir`
    #!/bin/sh

    echo "Building Docker image in $(realpath .)"

    ${copyCommands}

    cp "${dockerfile}" ./Dockerfile
    "${docker}" build -t jix:$JIX_HASH .
  
  `


  return jix.effect({
    install: ["execShVerboseV1", jix.dedent`
      export JIX_HASH=${HASH}
      "${script}"
    `],
    uninstall: ["execShV1", `"${docker}" rmi jix:${HASH} || true`],
    str: `jix:${HASH}`,
  })
}





/**
  Create a script that runs a docker container with specified options
  @param {Object} options
  @param {string} [options.workdir] - Working directory inside the container
  @param {string} [options.basedir="/"] - Base directory for relative volume mounts
  @param {Record<string, EffectOrFn>} [options.volumes] - Volume mounts (path: source)
  @param {Record<string, string>} [options.env] - Environment variables
  @param {string} [options.name] - Container name
  @param {(string|EffectOrFn)[]} [options.args] - Additional docker run arguments
  @param {string|EffectOrFn} [options.image] - A docker image
  @param {string|EffectOrFn} [options.exec] - Script (scring or jix.script) to execute
  @returns {Effect}
  @example
  jix.script`
    ${jix.container.run({workdir: "/wd", volumes: {wd: "$(pwd)"}})} myimage bash
  `
 */
export const run = ({workdir=null, basedir="/", volumes={}, env={}, name=null, args=[], image=null, exec=null}={}) => {
  // TODO: always killing an existing container, doesn't seem to be generally desirable

  let killExisting = name 
    ? `${docker} kill ${name} > /dev/null 2>&1 || true`  // in case it was orphaned
    : ''

  let deleteExisting = name 
    ? `${docker} rm -f ${name} > /dev/null 2>&1 || true`  // in case it was orphaned
    : ''

  let volumeArgs = Object.entries(volumes).map(([k, v])=> {
    return k.startsWith("/")
      ? `-v "${v}:${k}"`
      : `-v "${v}:${basedir}/${k}"`
  })

  let envArgs = Object.entries(env).map(([k,v]) => {
    return `-e "${k}=${v}"`
  })

  let [execVolumeArgs, execArgs] = exec
    ? typeof exec === "string"
      ? [[], [`/bin/sh -c ${jix.util.shellEscape(exec)}`]]
      : [[`-v ${exec}:/.jix-user-exec:ro`], [`/.jix-user-exec`]]
    : [[], []]

  args = [
    '-i',  // "interactive" TODO: is this needed? document more
    '--log-driver=none',
    '-a stdin -a stdout -a stderr',  // log to stdout and nowhere else
    '--rm', // clean up image after run
    '--pull never',  // don't pull image from the internet (must exist locally)
    // ...(isPodman ? ['--replace'] : []), // necessary for podman
    ...(workdir ? [`--workdir "${workdir}"`] : []),
    ...(name ? [`--name ${name}`] : []),
    ...volumeArgs,
    ...execVolumeArgs,
    ...envArgs,
    ...args,
    ...(image ? [image] : []),
    ...execArgs,
  ]

  return jix.script`
    #!/bin/sh
    set -euo pipefail

    ${killExisting}
    ${deleteExisting}
    
    test -t 1 && USE_TTY="-it" || USE_TTY=""  # run interactively if we're in an interactive shell

    exec "${docker}" run \
    $USE_TTY \
    ${args.join(" \\\n")} \
    "$@"
  `
}



export default {
  docker,
  run,

  aptInstall,
  tag,
  imageFromDockerfile,
  network,
  volume,

  with: withOptions,
}



/*
Notes:

Potentially useful in the future:
  WORKDIR="$(docker inspect --format='{{.Config.WorkingDir}}')"
*/
