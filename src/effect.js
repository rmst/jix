import { sha256 } from './sha256.js';
import { symlink, link, copyFile } from './base.js';
import context from './context.js';
import { HASH_PLACEHOLDER } from './context.js';

export const effectPlaceholderMap = new Map()


/*
TODO: split into two types of Effects:
- effect (side effects, install and uninstall functions)
- build/derivation/artifact (no side effects all outputs in ~/nux/out/${hash}, build function)
*/
/**

  An Effect is a basic recipe to take actions, i.e. build, install and uninstall

  Basic form:
  ```js
  let effect = Effect({
    install: ["installActionV2", installArg0, installArg2],
    uninstall: ["uninstallActionV0", uninstallArg0],
    build: ["buildActionV1", buildArg0],
    dependencies: [otherEffect0, otherEffect1],
  })
  ```

  Basic effect functions are defined under base.js and nux.js
*/
export function Effect (eff={}) {
  if(!(this instanceof Effect))
    return new Effect(eff)
  
  // let obj = this
  // let obj = {}
  
  // process dependencies  
  this.dependencies = (eff.dependencies?.flat(Infinity) ?? []).map(x => {
    return x instanceof Effect ? x : Effect(x)
  })

  // process values in the arguments to install, uninstall, etc
  var { install, uninstall, build } = eff
  var [install, uninstall, build] = [install, uninstall, build].map(x => {
    if(!x) return x

    let {values, dependencies} = parseEffectValues(x)
    this.dependencies.push(...dependencies)

    return values
  })

  
  Object.assign(this, {
    install,
    uninstall,
    build,
    host: context.host,
    user: context.user,
  })

  
  this.normalize = () => ({
    install: this.install,
    uninstall: this.uninstall,
    build: this.build,
    dependencies: this.dependencies.map(d => d.hash),
    host: this.host,
    user: this.user,
  })


  this.hash = sha256(JSON.stringify(this.normalize()))

  this.serialize = () => {
    return JSON.stringify(this.normalize()).replaceAll(HASH_PLACEHOLDER, this.hash)
  }

  let outPath = `${context.NUX_PATH}/out/${this.hash}`;

  this.path = eff.path
    ? eff.path.replaceAll(HASH_PLACEHOLDER, this.hash)
    : (this.build ? outPath : undefined)

  this.str = eff.str
    ? eff.str.replaceAll(HASH_PLACEHOLDER, this.hash)
    : this.path


  this.toString = () => {
    let key = `_effect_${this.hash}_`
    effectPlaceholderMap.set(key, this)
    return key
  },

  this.flatten = () => {
    let deps = this.dependencies.map(d => d.flatten())
    return [...deps, this].flat()  // flatten the nested list
  }

  this.symlinkTo = path => symlink(this, path)
  this.linkTo = (path, symbolic=false) => link(this, path, symbolic)
  this.copyTo = path => copyFile(this, path)

}



export const parseEffectValues = (values) => {
  let dependencies = [];
  values = values.map(v => {
    if (typeof v === "string") {
      // parse regular strings for placeholders, so we can track the dependencies, etc
      // this way we can avoid using nux.str to construct strings while tracking dependencies
      [...effectPlaceholderMap.keys()].map(k => {
        if(v.includes(k)) {
          let drv = effectPlaceholderMap.get(k)

          // console.log(`Found drv in string ${v}`)
          // console.log(`${k} will be replaced by ${drv.str}`)
          dependencies.push(drv)
          v = v.replaceAll(k, drv.str)
        }
      })
      
      return v

    } else if (v instanceof Effect) {
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

