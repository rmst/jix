import * as util from './util.js';
import { BIN_PATH } from './const.js';

// -----

export const HOME = util.getEnv().HOME

export const file = (path, content, permissions = '-w') => {
  path = path.replace('~', util.getEnv().HOME);

  return {
    install: ["writeFileV1", path, content, permissions],
    uninstall: ["deleteFileV1", path],
  };
};

export const script = (name, contents) => {
  return file(`${BIN_PATH}/${name}`, contents, "+x-w");
};

export const scripts = (c) => {
  return Object.keys(c).map(k => script(k, c[k]));
};

export const copy = (origin, path, permissions = '-w') => {
  // TODO: maybe cache the hash, don't read the file every time
  let content = util.fileRead(origin);
  return file(path, content, permissions);
};

export const link = (origin, path) => {
  // TODO: use builtin link functions
  return {
    install: ["symlinkV1", origin, path],
    uninstall: ["deleteFileV1", path],
  };
};

export const alias = (origin, name) => {

  return link(origin, `${BIN_PATH}/${name}`);
};


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
