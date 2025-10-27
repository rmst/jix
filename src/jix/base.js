import * as fs from 'node:fs'

import { JIX_DIR, HASH_PLACEHOLDER } from './context.js'
import { parseEffectValues, effect, getTarget, Effect } from './effect.js'

import { dedent } from './dedent.js'
import context from './context.js'
import { dirname, basename, shellEscape } from './util.js'

import stateDir from './stateDir.js'

export const HASH = HASH_PLACEHOLDER


/**
	@param {string|Effect} origin
	@param {string} path
	@param {boolean} symbolic - @private For internal use only
	@returns {Effect}
*/
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

/**
	@param {string|Effect} origin
	@param {string} path
	@returns {Effect}
*/
export const symlink = (origin, path) => link(origin, path, true)


/**
	@param {string|Effect} from
	@param {string} to
	@returns {Effect}
*/
export const copy = (from, to) => effect({
  install: ["copyV2", from, to],
  uninstall: ["deleteFileV2", to],
  path: to,
})


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
  return effect({
    install: install ? ["execShV1", `${install}`] : null,
    uninstall: uninstall ? ["execShV1", `${uninstall}`] : null,
    ...other
  })
}


/**
  Creates a directory. Install via `mkdir -p`. Uninstall will only remove the dir if it is empty.
  @param {string} path 
  @param {object} extraArgs - @private
  @returns {Effect}
 */
export const dir = (path, extraArgs={}) => {
  return effect({
		install: ["execV1", "mkdir", "-p", path],
		uninstall: ["execShV1", `rmdir -- "${path}" 2>/dev/null || true`],
		path: path,
		...extraArgs,
	})
}


/**
	Creates an Effect with string property and dependencies according to the interpolated values
	@param {TemplateStringsArray} templateStrings
	@param  {...(string|number|Effect)} values
	@returns {Effect}
*/
export const str = (templateStrings, ...values) => {

  let { values: processedValues, dependencies } = parseEffectValues(values)
  let text = dedent(templateStrings, ...processedValues)

  return effect({
    str: text,
    dependencies,
  })
}


/** @private */
const writeFile = (mode='-w') => (templateStrings, ...rawValues) => {
    
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


/**
	Creates a text file
	@param {TemplateStringsArray} templateStrings
	@param  {...(string|number|Effect)} values
	@returns {Effect}
*/
export const textfile = writeFile()


/**
	Creates a runnable script
	@param {TemplateStringsArray} templateStrings
	@param  {...(string|number|Effect)} values
	@returns {Effect}
*/
export const script = (templateStrings, ...values) => writeFile('-w+x')(templateStrings, ...values)


/**
	Creates a runnable script that is executed from within a temporary directory
	@param {TemplateStringsArray} templateStrings
	@param  {...(string|number|Effect)} values
	@returns {Effect}
*/
export const scriptWithTempdir = (templateStrings, ...values) => {
  let inner = script(templateStrings, ...values)
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


/**
	@param {string} origin
	@param {string} mode - @private For internal use only
	@returns {Effect & { name: string }}
*/
export const importTextfile = (origin, mode='-w') => {
	let content = fs.readFileSync(origin, 'utf8')

	let e = writeFile(mode)`${content}`
	e.name = basename(origin)
	return e
}


/**
	@param {string} origin
	@returns {Effect & { name: string }}
*/
export const importScript = (origin) => {
  // TODO: add dependency tracking, e.g. for python and js
  return importTextfile(origin, '-w+x')
}



/**
	Creates a build shell script which will be executed in a temporary directory. The build result should be written to the path given by the $out environment variable.

	@param {TemplateStringsArray} templateStrings
	@param  {...(string|number|Effect)} values
	@returns {Effect}
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


/**
	creates a directory containing files
	@param {Record<string,string|Effect>} files
	@returns {Effect}
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


// ------


let base = {

  script,
  textfile,
  
  importScript,
  importTextfile,

  copy,
  link,
  symlink,

  alias,

  dir,

  customEffect,

  stateDir,

  str,

  build,

  target: () => getTarget(),

  dedent,

  effect,
}


// this is to work around a severe quickjs bug whereas different modules are created for the same file when using dynamic imports (i.e. await import(...))
if(globalThis._jix_modules_base)
	base = globalThis._jix_modules_base
else
	globalThis._jix_modules_base = base


export default base
