import * as util from './util.js';
import { BIN_PATH, NUX_PATH } from './context.js';
import { parseDrvValues, derivation } from './drv.js';
import * as fs from './node/fs.js'
import { createHash } from './shaNext.js';


export { derivation } from './drv.js';
// -----

export const HOME = util.getEnv().HOME  // TODO: switch to node API
export const NUX_PATH = NUX_PATH

// ----- OLD SYSTEM ----
// TODO: get rid of this at some point




export const copy = (origin, path, mode = '-w') => {
  // TODO: maybe cache the hash, don't read the file every time
  // TODO: make permissions work
  let content = util.fileRead(origin);
  return link(writeFile(mode)(content), path)
};


// ------ NEW SYSTEM ----


export const link = (origin, path, symbolic=false) => {
  // TODO: use builtin link functions
  var { values: [ origin, path ], dependencies } = parseDrvValues([origin, path])

  // console.log("link", origin, path)

  return derivation({
    install: [symbolic ? "symlinkV3" : "hardlinkV1", origin, path],
    // uninstall: ["deleteFileV1", path],
    uninstall: ["deleteFileV2", path],  // TODO: don't remove if the file is sth else than our symlink to prevent accidental data loss, i.e. create deleteSpecificFile
    dependencies,
    str: path,
  })
};

export const symlink = (origin, path) => link(origin, path, true)


export const alias = (mapping) => {
  return Object.entries(mapping).map(([k, v]) => symlink(v, `${BIN_PATH}/${k}`))
}


// TODO: delete this
// export const user = (config) => {
//   let { name, home, enabled=true, conf=u=>[] } = config

//   if(!enabled)
//     return []

//   // TODO: perform checks or install user

//   let u = {
//     name,
//     home,
    
//   }
//   return conf(u)
  
// }

export const run = (install, uninstall) => {
  return {
    install: ["execShV1", install],
    uninstall: ["execShV1", uninstall]
  };
};


export const mkdir = (path) => {
  return derivation({
    install: ["execV1", "mkdir", "-p", path],
    uninstall: ["execShV1", `[ ! -e "${path}" ] || rmdir "${path}"`],
    str: path,
  })
}

// export const globalConfigFile = (path, content, original, reloadScript = null) => {
//   return {
//     install: ["writeConfSudoV1", path, content, reloadScript],
//     uninstall: ["writeConfSudoV1", path, original, reloadScript],
//   };
// };


export const str = (templateStrings, ...values) => {

  var { values, dependencies } = parseDrvValues(values)
  let text = util.dedent(templateStrings, ...values)

  return derivation({
    str: text,
    dependencies,
  })
}

export const writeFile = (mode='-w') => (templateStrings, ...values) => {

  var { values, dependencies } = parseDrvValues(values)
  let text = util.dedent(templateStrings, ...values)

  return derivation({
    build: ["writeOutFileV1", text, mode],
    dependencies,
  })
}

export const textfile = writeFile()


// TODO: this is dumb, instead users should be able to import non js files and reference them like any other built file
export const file = (path) => {
  path = path.replace('~', util.getEnv().HOME)  // TODO: use context home
  let data = fs.readFileSync(path)
  const fileHash = createHash().update(data).digest("hex");
  return derivation({
    build: ["copyV1", path, fileHash],
  })
};



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
export const build = (templateStrings, ...values) => {
  // TODO: dependencies in the build script should be separated from runtime dependencies
  
  let buildScript = script(templateStrings, ...values)

  return derivation({
    build: ["buildV5", buildScript],
    dependencies: [buildScript],
  })
}



export default {
  derivation,
  HOME,
  NUX_PATH,
  
  copy,
  link,
  symlink,
  alias,
  run,
  mkdir,
  str,
  writeFile,
  textfile,
  file,
  script,
  build,
}