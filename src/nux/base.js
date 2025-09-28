import * as fs from 'node:fs';

import { NUX_DIR, HASH_PLACEHOLDER } from './context.js';
import { parseEffectValues, effect, target } from './effect.js';
import { AbstractEffect } from './effectUtil.js';

import { dedent } from './dedent.js';
import context from './context.js';
import { dirname, basename, shellEscape } from './util.js';

import db from './db.js';

export const HASH = HASH_PLACEHOLDER


/**
 * @param {string} origin 
 * @param {string} mode 
 * @returns {AbstractEffect & { name: string }}
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

export const copy = (origin, path, mode = '-w') => {
  // TODO: maybe cache the hash, don't read the file every time
  // TODO: make permissions work
  // TODO: use importFile
  // TODO: is this even use, delete
  let content = fs.readFileSync(origin, 'utf8');
  return link(writeFile(mode)(content), path)
};


// export const importScript = (origin) => {
//   // TODO: maybe cache the hash, don't read the file every time
//   let content = util.fileRead(origin);
//   return script`${content}`
// }


// ------ NEW SYSTEM ----


export const link = (origin, path, symbolic=false) => effect( target => {
  // FIXME: we're not doing anythign to verify that path is something valid 
  // TODO?: use builtin link functions
  let { values: [origin2, path2], dependencies } = parseEffectValues(target, [origin, path])

  if (path2.startsWith('~')) {
    path2 = path2.replace('~', target.home)  // replaces first (i.e. leading) tilde
  }

  // console.log("AAAHHH", originT, pathT)

  return {
    install: [symbolic ? "symlinkV3" : "hardlinkV1", origin2, path2],
    // uninstall: ["deleteFileV1", path],
    uninstall: ["deleteFileV2", path2],  // TODO: don't remove if the file is sth else than our symlink to prevent accidental data loss, i.e. create deleteSpecificFile
    path: path2,
    dependencies,
  }
})

export const symlink = (origin, path) => link(origin, path, true)


export const alias = (mapping) => {
  // TODO: add PATH check (to see if the login shell has .nux/bin in its path and warn if not (could be done via build script maybe?)
  let binDir = ensureDir(context.BIN_PATH)
  let links = Object.entries(mapping).map(([k, v]) => symlink(v, `${binDir}/${k}`))

  return links
}



/** 
  @param {{install?: string, uninstall?: string, dependencies?: Array, path?: string, str?: string}} obj
*/
export const run = ({install=null, uninstall=null, ...other}) => {
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



export const dir = (files) => {
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

export const ensureDir = (path, eff={}) => effect({
  install: ["execV1", "mkdir", "-p", path],
  path: path,
  ...eff,
})

export const mkdir = (path) => {
  return effect({
    install: ["execV1", "mkdir", "-p", path],
    uninstall: ["execShV1", `[ ! -e "${path}" ] || rmdir "${path}"`],
    path: path,
  })
}

/**

 */
export const scriptInTempdir = (...args) => {
  let inner = script(...args)
  // # export NUX_TEMP="$HOME"/${NUX_DIR}/tmp_drv/${HASH}
  return script`
    #!/bin/sh
    export NUX_TEMP="$(mktemp -d)"
    cd "$NUX_TEMP"

    "${inner}"
    exitcode=$?

    rm -rf "$NUX_TEMP"

    exit $exitcode
  `
}

// export const globalConfigFile = (path, content, original, reloadScript = null) => {
//   return {
//     install: ["writeConfSudoV1", path, content, reloadScript],
//     uninstall: ["writeConfSudoV1", path, original, reloadScript],
//   };
// };


export const str = (templateStrings, ...rawValues) => effect( target => {

  let { values, dependencies } = parseEffectValues(target, rawValues)
  let text = dedent(templateStrings, ...values)

  return {
    str: text,
    dependencies,
  }
})


export const writeFile = (mode='-w') => (templateStrings, ...rawValues) => {
  return effect( target => {
    // TODO: shouldn't we use the str function here?
    var { values, dependencies } = parseEffectValues(target, rawValues)
    let text = dedent(templateStrings, ...values)

    return {
      build: ["writeOutFileV2", text, mode],
      dependencies,
    }
  })
}


export const copyFile = (from, to) => effect({
  install: ["copyV2", from, to],
  uninstall: ["deleteFileV2", to],
  path: to,
})


export const textfile = writeFile()


// TODO: this is dumb, instead users should be able to import non js files and reference them like any other built file
// export const file = (path) => {
//   path = path.replace('~', util.getEnv().HOME)  // TODO: use context home
//   let data = fs.readFileSync(path)
//   const fileHash = createHash().update(data).digest("hex");
//   return derivation({
//     build: ["copyV1", path, fileHash],
//   })
// };



/**
 * Creates a runnable script.
 * TODO: what behaviour of we don't include shebang, e.g. #!/bin/bash)?
 * @returns the derivation / out path of the script
 */
export const script = (templateStrings, ...values) => writeFile('-w+x')(templateStrings, ...values)


export const cleanScript = (templateStrings, ...values) => {
  throw Error("This function is deprecated because it produces strange indentation. Fix it or use sth else")
  let s
  s = dedent(templateStrings, ...values)

  s = s
    .split('\n')
    .filter(line => !line.trim().startsWith('#') || line.startsWith("#!"))  // comment lines
    .filter(line => line.trim())  // empty lines
    .join('\n')

  return script(s)
}

/**
 * define a build script writing to $out (environment variable named "out")
 * @returns the derivation / out path of the built artefact
 */
// export const build2 = (templateStrings, ...values) => {
//   // TODO: dependencies in the build script should be separated from runtime dependencies
  
//   let buildScript = script(templateStrings, ...values)

//   return derivation({
//     build: ["buildV5", buildScript],
//     dependencies: [buildScript],
//   })
// }



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


/**
 * @param {*} path 
 * @param {string} line 
 */
export const appendTo = (path, line) => {
  if(line.includes("\n"))
    throw Error("Currently we only can append single line at a time")

  line = shellEscape(line)

  let removeLine = script`
    #!/bin/sh
    # Find the line number of the last exact, full-line match.
    # grep -F: fixed string (no regex), -x: exact line match, -n: line number
    line_to_del=$(grep -Fxn -- "$2" "$1" | tail -n 1 | cut -d: -f1)

    if [ -n "$line_to_del" ]; then
      # Use printf to pipe the "delete" command to ed.
      # ed -s: run ed in silent mode.
      printf '%s\n' "\${line_to_del}d" w | ed -s "$1"
    fi
  `

  return run({
    install: nux.dedent`
      # add missing newline if necessary
      [ -s '${path}' ] && [ -n "$(tail -c 1 '${path}')" ] && echo >> '${path}'
      
      # add line
      echo ${line} >> '${path}'
    `,
    uninstall: `${removeLine} '${path}' ${line}`,
  })
}


let base = {
  dirname,
  dedent,

  effect,
  target,
  
  build,

  importFile,
  importScript,
  copy,
  copyFile,

  link,
  symlink,
  alias,
  run,

  dir,
  mkdir,
  ensureDir,

  str,

  writeFile,
  textfile,
  script,
  cleanScript,
  scriptInTempdir,

  appendTo,

  ...db,

  HASH,
}


// this is to work around a severe quickjs bug whereas different modules are created for the same file when using dynamic imports (i.e. await import(...))
if(globalThis._nux_modules_base)
  base = globalThis._nux_modules_base
else
  globalThis._nux_modules_base = base


export default base