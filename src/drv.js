import { NUX_PATH } from './const.js';
import { sha256 } from './sha256.js';

/*
A derivation is a basic recipie to take actions, i.e. build, install and uninstall

Basic form:
```js
let drv = {
  install: ["installActionV2", installArg0, installArg2],
  uninstall: ["uninstallActionV0", uninstallArg0],
  build: ["buildActionV1", buildArg0],
  dependencies: [otherDrv0, otherDrv1],
}
```

Base derivations are defined under nux.js
*/

export const derivation = (drv) => {
  let hash = drvhash(drv)
  let str = `${NUX_PATH}/out/${hash}`;
  return {
    hash,
    str: drv.build ? str : undefined,
    ...drv,
  };
};


export const drvhash = (drv) => {
  drv = serializeDrvs([drv]);
  drv = drv[drv.length - 1]; // last element is the actual derivation, because it's [...deps, drv]
  return sha256(drv);
};


export const parseDrvValues = (values) => {
  let dependencies = [];
  values = values.map(v => {
    if (v?.str) {
      // v is a derivation object
      // add it to the dependencies array
      // and replace the object with it's out path
      dependencies.push(v);
      return v.str;
    }

    else
      return v;
  });

  return { values, dependencies };
};


export function serializeDrvs (drvs) {

  let result = drvs.map(drv => {
    let deps = drv.dependencies ?? []
    
    var { install, uninstall, build } = drv

    // parse values in the arguments to install, uninstall, etc
    var [install, uninstall, build] = [install, uninstall, build].map(x => {
      if(!x) return x
      let {values, dependencies} = parseDrvValues(x)
      deps.push(...dependencies)
      return values
    })

    deps = serializeDrvs(deps)
    let hashes = deps.map(d => sha256(d))

    drv = {
      install,
      uninstall,
      build,
      dependencies: hashes
    }

    drv = JSON.stringify(drv)

    return [...deps, drv]
  })

  return result.flat(Infinity)  // flatten the nested list

}