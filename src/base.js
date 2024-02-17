import * as util from './util.js';
import { BIN_PATH } from './const.js';
import { parseDrvValues, derivation } from './drv.js';

// -----

export const HOME = util.getEnv().HOME


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

export const copy = (origin, path, permissions = '-w') => {
  // TODO: maybe cache the hash, don't read the file every time
  let content = util.fileRead(origin);
  return file(path, content, permissions);
};


export const link = (origin, path, symbolic=false) => {
  // TODO: use builtin link functions
  let { values, dependencies } = parseDrvValues([origin])
  var [ origin ] = values

  return derivation({
    install: [symbolic ? "symlinkV2": "hardlinkV0", origin, path],
    uninstall: ["deleteFileV1", path],
    dependencies,
    str: path,
  })
};

// ------ NEW SYSTEM ----
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
  return {
    install: ["execShV1", `mkdir -p "${path}"`],
    uninstall: ["execShV1", `rm -r "${path}"`]
  };
};

export const globalConfigFile = (path, content, original, reloadScript = null) => {
  return {
    install: ["writeConfSudoV1", path, content, reloadScript],
    uninstall: ["writeConfSudoV1", path, original, reloadScript],
  };
};



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