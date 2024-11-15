import * as util from './util.js';
import { NUX_DIR, HASH_PLACEHOLDER } from './context.js';
import { parseEffectValues, Effect } from './effect.js';

import { dedent } from './util.js';
import context from './context.js';

export { Effect } from './effect.js';
// -----

// export const HOME = util.getEnv().HOME  // TODO: switch to node API
// export const NUX_PATH = NUX_PATH

// ----- OLD SYSTEM ----
// TODO: get rid of this at some point


export const HASH = HASH_PLACEHOLDER


export const copy = (origin, path, mode = '-w') => {
  // TODO: maybe cache the hash, don't read the file every time
  // TODO: make permissions work
  let content = util.fileRead(origin);
  return link(writeFile(mode)(content), path)
};


export const importScript = (origin) => {
  // TODO: maybe cache the hash, don't read the file every time
  let content = util.fileRead(origin);
  return script`${content}`
}


// ------ NEW SYSTEM ----


export const link = (origin, path, symbolic=false) => {
  // TODO: use builtin link functions
  var { values: [ origin, path ], dependencies } = parseEffectValues([origin, path])

  // console.log("link", origin, path)

  return Effect({
    install: [symbolic ? "symlinkV3" : "hardlinkV1", origin, path],
    // uninstall: ["deleteFileV1", path],
    uninstall: ["deleteFileV2", path],  // TODO: don't remove if the file is sth else than our symlink to prevent accidental data loss, i.e. create deleteSpecificFile
    dependencies,
    path: path,
  })
};

export const symlink = (origin, path) => link(origin, path, true)


export const alias = (mapping) => {
  // TODO: add PATH check (to see if the login shell has .nux/bin in its path and warn if not (could be done via build script maybe?)
  let binDir = ensureDir(context.BIN_PATH)
  let links = Object.entries(mapping).map(([k, v]) => symlink(v, `${binDir}/${k}`))

  return links
}

export const run = ({install=null, uninstall=null, ...other}) => {
  let extraLines = util.dedent`
    set -e  # error script if single command fails
    set -o pipefail  # error on piped command fails
    set -u  # error on unset variables
  `

  return Effect({
    install: install ? ["execShV1", `${extraLines}\n${install}`] : ["noop"],
    uninstall: uninstall ? ["execShV1", `${extraLines}\n${uninstall}`] : ["noop"],
    ...other
  });
};

export const ensureDir = path => Effect({
  install: ["execV1", "mkdir", "-p", path],
  path: path,
})

export const mkdir = (path) => {
  return Effect({
    install: ["execV1", "mkdir", "-p", path],
    uninstall: ["execShV1", `[ ! -e "${path}" ] || rmdir "${path}"`],
    path: path,
  })
}

export const scriptWithTempdir = (...args) => {
  let inner = script(...args)
  return script`
    #!/bin/sh
    export NUX_TEMP="$HOME"/${NUX_DIR}/tmp_drv/${HASH}
    mkdir -p "$NUX_TEMP"

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

export const str = (templateStrings, ...values) => {

  var { values, dependencies } = parseEffectValues(values)
  let text = util.dedent(templateStrings, ...values)

  return Effect({
    str: text,
    dependencies,
  })
}

export const writeFile = (mode='-w') => (templateStrings, ...values) => {
  // TODO: shouldn't we use the str function here?
  var { values, dependencies } = parseEffectValues(values)
  let text = util.dedent(templateStrings, ...values)

  return Effect({
    build: ["writeOutFileV2", text, mode],
    dependencies,
  })
}

export const copyFile = (from, to) => Effect({
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

export const build = (templateStrings, ...values) => {
  // TODO: dependencies in the build script should be separated from runtime dependencies
  
  let buildScript = dedent(templateStrings, ...values)

  return Effect({
    build: ["buildV6", buildScript],
    dependencies: [buildScript],
  })
}


export default {
  Effect,
  // HOME,
  // NUX_PATH,
  
  copy,
  importScript,
  link,
  symlink,
  alias,
  run,
  mkdir,
  ensureDir,
  str,
  writeFile,
  textfile,
  script,
  scriptWithTempdir,
  build,
  copyFile,

  HASH,
}