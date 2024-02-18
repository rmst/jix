import { NUX_PATH } from './const.js';
import { sha256 } from './sha256.js';
import { symlink } from './base.js';
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

export const drvMap = new Map()

// export const derivation_old = (drv) => {
//   let hash = drvhash(drv)
//   let str = `${NUX_PATH}/out/${hash}`;
//   drv = {
//     hash,
//     str: drv.build ? str : undefined,
//     toString: () => {
//       let key = drv.build ? str : hash
//       drvMap.set(key, drv)
//       return key
//     },
//     ...drv,
//   }

//   drv.symlinkTo = path => symlink(drv, path)
//   return drv
// };


export function derivation (drv) {
  
  let obj = {}

  // process dependencies  
  obj.dependencies = (drv.dependencies ?? []).map(d => d.hash ? d : derivation(d))

  // process values in the arguments to install, uninstall, etc
  var { install, uninstall, build } = drv
  var [install, uninstall, build] = [install, uninstall, build].map(x => {
    if(!x) return x

    let {values, dependencies} = parseDrvValues(x)
    obj.dependencies.push(...dependencies)

    return values
  })

  Object.assign(obj, {
    install,
    uninstall,
    build
  })

  
  obj.serialize = () => {
    return JSON.stringify({
      install: obj.install,
      uninstall: obj.uninstall,
      build: obj.build,
      dependencies: obj.dependencies.map(d => d.hash)
    })
  }

  obj.hash = sha256(obj.serialize())

  let str = `${NUX_PATH}/out/${obj.hash}`;

  obj.str = drv.str ? drv.str : (obj.build ? str : undefined)

  obj.toString = () => {
    let key = `_derivation_${obj.hash}_`
    drvMap.set(key, obj)
    return key
  },

  obj.flatten = () => {
    let deps = obj.dependencies.map(d => d.flatten())
    return [...deps, obj].flat()  // flatten the nested list
  }

  obj.symlinkTo = path => symlink(obj, path)

  return obj
}


export const parseDrvValues = (values) => {
  let dependencies = [];
  values = values.map(v => {
    if (typeof v === "string") {
      // parse regular strings for hashes, so we can track the dependencies
      // this way we can avoid using nux.str to construct strings while tracking dependencies

      [...drvMap.keys()].map(k => {
        if(v.includes(k)) {
          let drv = drvMap.get(k)
          // console.log(`Found drv in string ${v}`)
          // console.log(`${k} will be replaced by ${drv.str}`)
          dependencies.push(...(drv.dependencies ?? []))
          v = v.replaceAll(k, drv.str)
        }
      })
      
      return v

    } else if (v?.str) {
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

