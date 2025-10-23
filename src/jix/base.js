import * as fs from 'node:fs'

import { JIX_DIR, HASH_PLACEHOLDER } from './context.js'
import { parseEffectValues, effect, getTarget, TargetedEffect } from './effect.js'

import { dedent } from './dedent.js'
import context from './context.js'
import { dirname, basename, shellEscape } from './util.js'

import stateDir from './stateDir.js'

export const HASH = HASH_PLACEHOLDER


/**
 * @param {string} origin 
 * @param {string} mode 
 * @returns {TargetedEffect & { name: string }}
 */
export const importFile = (origin, mode='-w') => {
	let content = fs.readFileSync(origin, 'utf8')

	let e = writeFile(mode)`${content}`
	e.name = basename(origin)
	return e
}

export const importScript = (origin) => {
  // TODO: add dependency tracking, e.g. for python and js
  return importFile(origin, '-w+x')
}

export const link = (origin, path, symbolic=false) => {

  const target = getTarget()
  // FIXME: we're not doing anythign to verify that path is something valid 

  let { values: [origin2, path2], dependencies } = parseEffectValues([origin, path])

  if (path2.startsWith('~')) {
    path2 = path2.replace('~', target.user.home)  // replaces first (i.e. leading) tilde
  }

  return effect({
    install: [symbolic ? "symlinkV3" : "hardlinkV1", origin2, path2],
    // uninstall: ["deleteFileV1", path],
    uninstall: ["deleteFileV2", path2],  // TODO: don't remove if the file is sth else than our symlink to prevent accidental data loss, i.e. create deleteSpecificFile
    path: path2,
    dependencies,
  })
}

export const symlink = (origin, path) => link(origin, path, true)


export const alias = (mapping) => {
  // TODO: add PATH check (to see if the login shell has .jix/bin in its path and warn if not)
  let binDir = dir(context.BIN_PATH)
  let links = Object.entries(mapping).map(([k, v]) => symlink(v, `${binDir}/${k}`))

  return links
}



/**
  @param {{install?: string, uninstall?: string, dependencies?: Array, path?: string, str?: string}} obj
*/
export const customEffect = ({install=null, uninstall=null, ...other}) => {
  let extraLines = dedent`
		set -e  # error script if single command fails
		set -o pipefail  # error on piped command fails
		set -u  # error on unset variables
	`

  return effect({
    install: install ? ["execShV1", `${extraLines}\n${install}`] : ["noop"],
    uninstall: uninstall ? ["execShV1", `${extraLines}\n${uninstall}`] : ["noop"],
    ...other
  })
}


/**
 * creates a directory containing files
 * @param {Record<string,string|TargetedEffect>} files 
 * @returns {TargetedEffect}
 */
export const buildDir = (files) => {
  const copyCommands = Object.entries(files)
		.map(([name, sourcePath]) => {
			const source = shellEscape(`${sourcePath}`)
			const destination = shellEscape(`./${name}`)
			
			return `cp -r ${source} ${destination}`  // works for files and directories
		})
		.join(' && ')

  return build`
    mkdir "$out" && cd "$out" && ${copyCommands}
  `
}

// export const dir = (path, eff={}) => effect({
//   install: ["execV1", "mkdir", "-p", path],
//   uninstall: ["execShV1", `rmdir -- "${path}" 2>/dev/null || true`],
//   path: path,
//   ...eff,
// })

export const dir = (path, extraArgs={}) => {
  return effect({
		install: ["execV1", "mkdir", "-p", path],
		uninstall: ["execShV1", `rmdir -- "${path}" 2>/dev/null || true`],
		path: path,
		...extraArgs,
	})
}

/**

 */
export const scriptWithTempdir = (...args) => {
  let inner = script(...args)
  // # export JIX_TEMP="$HOME"/${JIX_DIR}/tmp_drv/${HASH}
  return script`
    #!/bin/sh
    export JIX_TEMP="$(mktemp -d)"
    cd "$JIX_TEMP"

    "${inner}"
    exitcode=$?

    rm -rf "$JIX_TEMP"

    exit $exitcode
  `
}


export const str = (templateStrings, ...rawValues) => {

  let { values, dependencies } = parseEffectValues(rawValues)
  let text = dedent(templateStrings, ...values)

  return effect({
    str: text,
    dependencies,
  })
}


export const writeFile = (mode='-w') => (templateStrings, ...rawValues) => {
    
  const { values, dependencies } = parseEffectValues(rawValues)

  // type check
  values.map(x => {
    if(typeof x === "function")
      throw TypeError(`Received invalid value of type "function": ${x}`)
  })

  let text = dedent(templateStrings, ...values)

  return effect({
    build: ["writeOutFileV2", text, mode],
    dependencies,
  })
}



export const copy = (from, to) => effect({
  install: ["copyV2", from, to],
  uninstall: ["deleteFileV2", to],
  path: to,
})


export const textfile = writeFile()



/**
 * Creates a runnable script.
 * TODO: what behaviour of we don't include shebang, e.g. #!/bin/bash)?
 * @returns the derivation / out path of the script
 */
export const script = (templateStrings, ...values) => writeFile('-w+x')(templateStrings, ...values)


/**
  write a build shell script, it drops you into a temp dir and
 */
export const build = (templateStrings, ...values) => {
  // TODO: dependencies in the build script should be separated from runtime dependencies
  // TODO: make output read only?
  // TODO: the error messages are terrible. we should first write a build script and execte that
  let buildScript = dedent(templateStrings, ...values)

  return effect({
		build: ["buildV6", buildScript],
		dependencies: [],
	})
}


let base = {

  target: () => getTarget(),

  dedent,

  effect,
  
  build,

  importFile,
  importScript,

  copy,
  link,
  symlink,

  alias,

  customEffect,

  buildDir,
  dir,

  str,

  textfile,
  script,

  stateDir,
}


// this is to work around a severe quickjs bug whereas different modules are created for the same file when using dynamic imports (i.e. await import(...))
if(globalThis._jix_modules_base)
	base = globalThis._jix_modules_base
else
	globalThis._jix_modules_base = base


export default base
