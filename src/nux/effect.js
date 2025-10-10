import { HOME_PLACEHOLDER, HASH_PLACEHOLDER } from './context.js';
import { NUX_DIR, LOCAL_USER } from './context.js';
import { AbstractEffect } from './effectUtil.js';
import { dedent } from './dedent.js';

export const effectPlaceholderMap = new Map()

import process from 'node:process';
import { createHash } from 'node:crypto';
import { hostInfo } from '../nux-cli/core/hosts.js';  // TODO: we shouldn't import nux-cli from nux (api), instead, maybe we should trigger an event or sth

// import { createHash } from 'node/crypto';


/*
TODO: split into two types of effects:
- effect (side effects, install and uninstall functions)
- build/derivation/artifact (no side effects all outputs in ~/nux/out/${hash}, build function)
*/


/**
 * @typedef {Object} EffectProps
 * @property {Array} [install]
 * @property {Array} [uninstall]
 * @property {string} [path]
 * @property {string} [str]
 * @property {Array} [dependencies]
 */

/**
 * @typedef {Object} TargetInfo - Detailed information about the target host and user.
 * @property {string} host - The target hostname or IP address.
 * @property {string} user - The user to connect as.
 * @property {string} home - The absolute path to the user's home directory.
 * @property {'macos' | 'nixos' | 'linux'} os - The operating system identifier.
 * @property {string} os_version - The specific version of the OS.
 * @property {'Linux' | 'Darwin'} kernel_name - The kernel name (from `uname -s`).
 * @property {string} hostname - The network hostname.
 * @property {string} architecture - The system architecture (e.g., 'x86_64', 'arm64').
 * @property {string} uid - The user ID.
 * @property {string} gid - The group ID.
 * @property {string} shell - The user's default shell path.
 * @property {Object.<string, {uid: string, gid: string, home: string, shell: string}>} users - A map of user-specific information on the host.
 */

/**
  @callback TargetFn
  @param {TargetInfo} target
  @returns {EffectProps | Array | Effect | TargetedEffect}
*/

/**

  An effect is a basic recipe to take actions, i.e. build, install and uninstall

  Basic form:
  ```js
  let x = effect({
    install: ["installActionV2", installArg0, installArg2],
    uninstall: ["uninstallActionV0", uninstallArg0],
    build: ["buildActionV1", buildArg0],
    dependencies: [otherEffect0, otherEffect1],
  })
  ```

  Basic effect functions are defined under base.js and nux.js

  @param {EffectProps | Array | TargetFn} obj
  @returns {Effect}
*/
export function effect (obj) {    
  return new Effect(obj)
}


/** 
  @param {string | Array | {host: string, user: string} | null} tgt - e.g. `root@home`
  @param {TargetFn | Effect | Array} obj
  @returns {TargetedEffect}
*/
export function target(tgt, obj) {
  let user, host
  
  if (!tgt)
    [host, user] = [null, null]

  else if (typeof tgt === "string")
    [user, host] = tgt.split("@")
  
  else if (Array.isArray(tgt))
    [host, user] = tgt
  
  else
    [host, user] = [tgt.host, tgt.user]


  let eff = (obj instanceof Effect) 
    ? obj 
    : effect(obj)
  
  return eff.target({ host, user })

}
  

export class Effect extends AbstractEffect {
  /**
    @param {EffectProps | Array | TargetFn} obj
  */
  constructor (obj) {
    super()
    this.obj = obj
  }

  /**
    Returns copy with additional dependencies
    @param {...(AbstractEffect)} others
    @returns {Effect}
  */
  dependOn(...others) {
    if(typeof this.obj === 'function')
      throw Error("effect.dependingOn works only with simple effects like `nux.effect({ install, uninstall, dependencies })`")
    
    if(Array.isArray(this.obj)) {
      return new Effect([...this.obj, ...others])
    }

    else {
      return new Effect({
        ...this.obj, 
        dependencies: [ ...(this.obj.dependencies ?? []), ...others ]
      })
    }
  }

  /** 
    @param {{ host: string, user: string, home?: string }} x
    @returns {TargetedEffect}
  */
  target (x) {
    // TODO: assert host, user
    if(!x.host) {
      if(!x.user) {
        // x.user = LOCAL_USER  // TODO: we should do this but this will trigger mass rebuilds
        // throw Error("Not a valid target")
      }
      else {
        // throw Error("Alternative local users are not supported yet")
      }
    }
    
    let info = hostInfo(x.host, x.user)

    x = {
      ...x,
      ...info,
      ...info.users[x.user ?? process.env.USER],
    }
    
    let r = (typeof this.obj === 'function')
      ? this.obj(x)
      : this.obj
    
    if(r instanceof TargetedEffect)
      return r
    
    else if(r instanceof Effect)
      return r.target(x)
    
    else {
      if (Array.isArray(r))
        r = { dependencies: r }

      return new TargetedEffect(x, r)
    }
  
  }
}


export class TargetedEffect extends AbstractEffect {

  /** 
   * @type {TargetedEffect[]} 
   */
  dependencies

  /**
   * 
   * @param {{ host: string, user: string}} tgt 
   * @param {EffectProps}} [props]
   */
  constructor(tgt, props={}) {
    super()

    this.dependencies = props.dependencies?.flat(Infinity) ?? []
    
    // TODO: delete this, instead we're doing assert x instanceof AbstractEffect 
    // this.dependencies =  this.dependencies.map(x => {
    //   return x instanceof AbstractEffect ? x : Effect(x)
    // })

    // process values in the arguments to install, uninstall, etc
    var { install, uninstall, build, str, path } = props
    var [install, uninstall, build, [str, path]]
      = [install, uninstall, build, [str, path]].map(x => {
      if(!x) return x

      let {values, dependencies} = parseEffectValues(tgt, x)
      this.dependencies.push(...dependencies)

      return values
    })
    

    // process dependencies  
    this.dependencies = this.dependencies.map(x => {
      if(x instanceof TargetedEffect)
        return x

      else if(x instanceof Effect)
        return x.target(tgt)  // TODO: maybe pass tgt copy instead?

      else {
        // console.log(x)
        let t = `${typeof x} || ${x?.constructor?.name}`
        throw Error(`Effect: ${x} of type ${t} is not a proper dependency`)
      }
    })


    Object.assign(this, {
      install,
      uninstall,
      build,
      host: tgt.host,
      user: tgt.user,
    })

    
    this.normalize = () => ({
      install: this.install,
      uninstall: this.uninstall,
      build: this.build,
      dependencies: this.dependencies.map(d => d.hash),
      host: this.host,
      user: this.user,
    })


    this.hash = props.hash ?? createHash('sha256')
      .update(JSON.stringify(this.normalize()))
      .digest('hex')

    // debug information
    // TODO: this is a massive hack: debug info isn't part of the hash calculation (and shouldn't be) so therefore it will only be captured the first time an effect with a certain hash is defined. It might still be temporarily useful since usually newly defined effects fail (though of course not exclusively).
    let debugInfo = {
      debug: {
        date: (new Date()).toString(),
        stack: (new Error()).stack,
      }
    }

    this.serialize = () => {
      return JSON.stringify(
        {
          ...this.normalize(),
          ...debugInfo,
        }
      ).replaceAll(HASH_PLACEHOLDER, this.hash)
    }

    let outPath = `${tgt.home}/${NUX_DIR}/out/${this.hash}`

    this.path = path
      ? targetizeString(tgt, path.replaceAll(HASH_PLACEHOLDER, this.hash))
      : (this.build ? outPath : undefined)

    this.str = str
      ? targetizeString(tgt, str.replaceAll(HASH_PLACEHOLDER, this.hash))
      : this.path

    this.flatten = () => {
      let deps = this.dependencies.map(d => d.flatten())
      return [...deps, this].flat()  // flatten the nested list
    }

    // console.log(`\n${this.toDebugString()}\n`)
  }

  toDebugString() {
    return dedent`
      path: ${this.path}
      deps: ${this.dependencies.map(x => x.hash.slice(0, 5))}
      host: ${this.host}
      user: ${this.user}
      str: ${this.str}
      hash: ${this.hash.slice(0, 5)}
    `
  }
}


const targetizeString = (tgt, str) => {
  if (!tgt.home)
    throw Error(`Fatal: ${tgt}`)

  return str
    .replaceAll(HOME_PLACEHOLDER, tgt.home)
    // .replaceAll(USER_PLACEHOLDER, tgt.user)
}


export const parseEffectValues = (tgt, values) => {

  let dependencies = [];
  values = values.map((v, i) => {

    if (typeof v === "string") {
      // parse regular strings for placeholders, so we can track the dependencies, etc
      // this way we can avoid using nux.str to construct strings while tracking dependencies

      // replace simple constants
      // TODO: this shouldn't be necessary but especially nux.HOME is used a lot
      v = targetizeString(tgt, v);

      // search for dependencies
      [...effectPlaceholderMap.keys()].map(k => {
        if(v.includes(k)) {
          let eff = effectPlaceholderMap.get(k)

          // console.log(`Found drv in string ${v}`)
          // console.log(`${k} will be replaced by ${drv.str}`)
          
          if (! (eff instanceof AbstractEffect)) {
            throw Error(`Fatal: ${eff}`)
          }

          if (! (eff instanceof TargetedEffect)) {
            eff = eff.target(tgt)
          }

          dependencies.push(eff)
          v = v.replaceAll(k, eff.str)
        }
      })
      
      return v

    } else if (v instanceof AbstractEffect) {
      
      if (! (v instanceof TargetedEffect))
        v = v.target(tgt)

      // add it to the dependencies array
      // and replace the object with it's out path
      dependencies.push(v)
      return v.str
    }

    else
      return v;
  });

  return { values, dependencies };
};
