import * as util from './util.js';
import { BIN_PATH } from './const.js';
import { parseDrvValues, derivation } from './drv.js';

// -----

export const HOME = util.getEnv().HOME  // TODO: switch to node API


// ----- OLD SYSTEM ----
// TODO: get rid of this at some point


export const file = (path, content, permissions = '-w') => {
  path = path.replace('~', util.getEnv().HOME);

  return {
    install: ["writeFileV1", path, content, permissions],
    uninstall: ["deleteFileV1", path],
  };
};

export const script_old = (name, contents) => {
  return file(`${BIN_PATH}/${name}`, contents, "+x-w");
};

export const scripts = (c) => {
  return Object.keys(c).map(k => script_old(k, c[k]));
};

export const copy = (origin, path, mode = '-w') => {
  // TODO: maybe cache the hash, don't read the file every time
  // TODO: make permissions work
  let content = util.fileRead(origin);
  return symlink(writeFile(mode)(content), path)
};




// ------ NEW SYSTEM ----


export const link = (origin, path, symbolic=false) => {
  // TODO: use builtin link functions
  var { values: [ origin, path ], dependencies } = parseDrvValues([origin, path])

  return derivation({
    install: [symbolic ? "symlinkV2": "hardlinkV0", origin, path],
    uninstall: ["deleteFileV1", path],
    dependencies,
    str: path,
  })
};

export const symlink = (origin, path) => link(origin, path, true)


export const alias = (mapping) => {
  return Object.entries(mapping).map(([k, v]) => symlink(v, `${BIN_PATH}/${k}`))
}


export const user = (config) => {
  let { name, home, enabled=true, conf=u=>[] } = config

  if(!enabled)
    return []

  // TODO: perform checks or install user

  let u = {
    name,
    home,
    
  }
  return conf(u)
  
}

export const run = (install, uninstall) => {
  return {
    install: ["execShV1", install],
    uninstall: ["execShV1", uninstall]
  };
};


export const mkdir = (path) => {
  // TODO: use lib.js not shell functions to do this
  return derivation({
    install: ["execShV1", `mkdir -p "${path}"`],
    uninstall: ["execShV1", `[ ! -e "${path}" ] || rmdir "${path}"`],
    str: path,
  })
}

export const globalConfigFile = (path, content, original, reloadScript = null) => {
  return {
    install: ["writeConfSudoV1", path, content, reloadScript],
    uninstall: ["writeConfSudoV1", path, original, reloadScript],
  };
};


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


export const script = (templateStrings, ...values) => writeFile('-w+x')(templateStrings, ...values)


export const build = (templateStrings, ...values) => {

  let buildScript = script(templateStrings, ...values)

  return {
    build: ["buildV2", buildScript],
    dependencies: [buildScript],
  }
}