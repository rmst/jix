import * as util from './util.js';
import { BIN_PATH, NUX_PATH } from './const.js';
import { sha256 } from './sha256.js';

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
  let { values, dependencies } = computeOutPaths([origin])
  var [ origin ] = values

  return {
    install: ["symlinkV1", origin, path],
    uninstall: ["deleteFileV1", path],
    dependencies,
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


const computeOutPaths = (values) => {
  let dependencies = []
  values = values.map(v => {
    if(v.build) {
      // v is a derivation object
      // add it to the dependencies array
      // and replace the object with it's out path
      dependencies.push(v)
      v = util.serializeDrvs([v])
      v = v[v.length - 1]  // last element is the actual derivation, because it's [...deps, drv]
      let h = sha256(v)
      let outPath = `${NUX_PATH}/out/${h}`
      return outPath
    }
    else
      return v
  })

  return {values, dependencies}
}


export const textfile = (mode='-w') => (templateStrings, ...values) => {

  var { values, dependencies } = computeOutPaths(values)
  let text = util.dedent(templateStrings, ...values)

  return {
    build: ["writeOutFileV1", text, mode],
    dependencies,
  }
}

export const mkScript = (templateStrings, ...values) => textfile('-w+x')(templateStrings, ...values)

// export const build = (templateStrings, ...values) => {

//   let dependencies = []
//   values = values.map(v => {
//     if(v.install && v.uninstall) {
//       dependencies.push(v)
//       let h = sha256([v.install, v.uninstall])  // TODO: make function for hash computation
//       return h
//     }
//     else
//       return v
//   })
//   let script = util.dedent(templateStrings, ...values)


//   return {
//     install: ["buildV2", script],
//     uninstall: ["noop"],
//     dependencies,
//   }
// }