import { Effect } from '../effect.js';
import { aptInstall } from './util.js';
import jix, { HASH, scriptWithTempdir } from '../base.js';
import nix from '../nix/index.js';

/**
  @typedef {import('../effect.js').EffectOrFn} EffectOrFn
 */


/**
  Reference to the docker-cli (or a compatible cli such as podman)
  TODO: should be configurable via context manager, e.g. jix.experimental.container.withContainer({ dockerCli: customPathOfEffect })
  @returns {Effect}
 */
export const docker = () => {
  let target = jix.target()

  if(false) {
    // TODO: use this condition if we have custom docker-cli set via jix.experimental.container.withContainer
  }

  else if (target.host.os === "nixos") {
    return nix.pkgs.podman.podman
  }

  else {
    return jix.existingCommand("docker")
  }
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


export const network = (name) => jix.customEffect({
  install: `${docker} network create --internal ${name}`,
  uninstall: `${docker} network rm ${name}`,
  str: name,
})


export const volume = (name) => jix.customEffect({
  install: `${docker} volume create ${name}`,
  uninstall: `${docker} volume rm ${name}`,
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
  @param {string[]} [options.args] - Additional docker run arguments
  @returns {Effect}
  @example
  jix.script`
    ${jix.container.run({workdir: "/wd", volumes: {wd: "$(pwd)"}})} myimage bash
  `
 */
export const run = ({workdir=null, basedir="/", volumes={}, env={}, name=null, args=[]}={}) => {
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
    ...envArgs,
    ...args,
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

}



/*
Notes:

Potentially useful in the future:
  WORKDIR="$(docker inspect --format='{{.Config.WorkingDir}}')"
*/
