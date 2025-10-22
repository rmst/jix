import { HOME_PLACEHOLDER, HASH_PLACEHOLDER, MAGIC_STRING } from './context.js';
import { JIX_DIR, LOCAL_USER } from './context.js';
import { AbstractEffect } from './effectUtil.js';
import { dedent } from './dedent.js';

export const effectPlaceholderMap = new Map()

import process from 'node:process';
import { createHash } from 'node:crypto';
import { hostInfoWithUser } from '../jix-cli/core/hosts.js';  // TODO: we shouldn't import cli from core; consider eventing later
import { createContext, useContext } from './useContext.js';

// import { createHash } from 'node/crypto';


/*
TODO: split into two types of effects:
- effect (side effects, install and uninstall functions)
- build/derivation/artifact (no side effects; all outputs in ~/.jix/out/${hash}, build function)
*/


const TARGET_CONTEXT = createContext(null)
export const withTarget = (target, fn=null) => {
  if(fn)
    TARGET_CONTEXT.provide(target, fn)
  else
    TARGET_CONTEXT.defaultValue = target
}
export const getTarget = () => useContext(TARGET_CONTEXT)

/**
 * @typedef {Object} EffectProps
 * @property {Array} [install]
 * @property {Array} [uninstall]
 * @property {Array} [build]
 * @property {string} [path]
 * @property {string} [str]
 * @property {string} [hash]
 * @property {Array} [dependencies]
 */



// TODO: this type is super cursed, clean it up

/**
 * @typedef {Object} TargetInfo - Detailed information about the target host and user.
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

  Basic effect functions are defined under base.js and index.js

  @param {EffectProps | Array | TargetFn} obj
  @returns {AbstractEffect}
*/
export function effect (obj) {    
  let tgt = getTarget()
  let e = new Effect(obj)
  return tgt === null
    ? e
    : e.target(tgt)
}


/**
  @deprecated
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
    : new Effect(obj)

  let teff = eff.target({ host, user })
  return teff
}


export class TargetingError extends Error {}

export class Effect extends AbstractEffect {
  /**
    @param {EffectProps | Array | TargetFn} obj
  */
  constructor (obj) {
    super()
    this.obj = obj
    this._stack = (new Error()).stack.split('\n').slice(2).join("\n")
  }

  /**

    NOTE: exclude this from the documenation

    Returns copy with additional dependencies

    This is ugly and shouldn't be used (it's only used in one place right now)

    TODO: remove this function and maybe replace with a withDependencies context provider

    @param {...(AbstractEffect)} others
    @returns {Effect}
  */
  dependOn(...others) {
    if(typeof this.obj === 'function')
      throw Error("effect.dependingOn works only with simple effects like `jix.effect({ install, uninstall, dependencies })`")
    
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
  @param {
      {address: string, user: string}
    | {machineId: string, user: string}
    | {host: string|null, user: string|null}
  } x
  @returns {TargetedEffect}
  */
  target(x) {
    // TODO: decide if this function should be publically exposed at all. If so, we should have a cleaner signature.` 

    try {
      
      let host, user

      if ("address" in x) {
        host = { address: x.address}
        user = x.user
      }
      else if("machineId" in x) {
        host = { machineId: x.machineId }
        user = x.user
      } 
      else {
        // Require user to be explicitly set for remote targets
        if (!x.user && x.host !== null && x.host !== undefined) {
          throw new Error("user must be specified for remote targets")
        }
        host = { friendlyName: x.host ?? "localhost" }
        user = x.user ?? process.env.USER
      }

      if (!user)
        throw new Error(`User missing in ${x}`)

      let info = hostInfoWithUser(host, user)

       // sanity check
       if(!info.users)
        throw Error(`${info}`)

      if(!info.users[user])
        throw Error(`${user} not a registered user in: ${Object.keys(info.users)}`)



      // TODO: this type is super cursed
      let r = (typeof this.obj === 'function')
        ? this.obj({
          ...info,
          // host: info.friendlyName,  // TODO: we expect this in some legacy user space code, but this is wrong
          // host: info.machineId,  // NOTE: this would currently break legacy userspace, because it is passed on to other target calls (in a few cases)
          user,
          users: info.users,
          ...info.users[user],
        })
        : this.obj

      if(r instanceof TargetedEffect)
        return r

      else if(r instanceof Effect)
        return r.target(x)

      else {
        if (Array.isArray(r))
          r = { dependencies: r }

        return new TargetedEffect({
          machineId: info.machineId,
          user: user,
          home: info.users[user].home,
        }, r)
      }

    } catch (e) {
      if(e instanceof TargetingError)
        throw e

      let stack = e.stack

      if(stack.split("\n").length > 400) {
        stack = stack.split("\n")
        stack = [
          stack[0], 
          "    ...", 
          ...stack.slice(-4)
        ].join("\n")
      }

      if(stack.endsWith("\n"))
        stack = stack.slice(0, -1)

      throw new TargetingError(dedent`
        ${e.message}
        ${stack}
          ----------------------------
          with effect created
        ${this._stack}
      `)

    }
  }
}


export class TargetedEffect extends AbstractEffect {

  /** 
   * @type {TargetedEffect[]} 
   */
  dependencies

  /**
   * @param {Object} tgt - Target specification
   * @param {string} tgt.machineId - Machine ID (required, never null)
   * @param {string} tgt.user - User name (required, never null)
   * @param {string} tgt.home - User home directory (required for path resolution)
   * @param {EffectProps} [props] - Effect properties
   */
  constructor(tgt, props={}) {
    super()

    const dependencies = props.dependencies?.flat(Infinity) ?? []
    
    // TODO: delete this, instead we're doing assert x instanceof AbstractEffect 
    // this.dependencies =  this.dependencies.map(x => {
    //   return x instanceof AbstractEffect ? x : Effect(x)
    // })

    // process values in the arguments to install, uninstall, etc
    var { install, uninstall, build, str, path } = props

    // @ts-ignore  TODO: fix by adding type to parseEffectValues
    var [install, uninstall, build, [str], [path]]
      = [install, uninstall, build, [str], [path]].map(x => {

      if(x === undefined || x === null)
        return x

      if(!Array.isArray(x))
        throw Error(`Not an array: ${x} in Effect with props: ${props}`)

      if(x.length == 1 && x[0] === undefined)
        return x

      let {values, dependencies: newDeps} = parseEffectValues(tgt, x)
      dependencies.push(...newDeps)

      return values
    })
    

    // process dependencies  
    this.dependencies = dependencies.map(x => {
      if(x instanceof TargetedEffect)
        return x

      else if(x instanceof Effect)
        return x.target(tgt)  // TODO: maybe pass tgt copy instead?

      else {
        let t = `${typeof x} || ${x?.constructor?.name}`
        throw Error(`Effect: ${x} of type ${t} is not a proper dependency`)
      }
    })


    this.install = install
    this.uninstall = uninstall
    this.build = build
    this.host = tgt.machineId
    this.user = tgt.user

    
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

    let outPath = `${tgt.home}/${JIX_DIR}/out/${this.hash}`

    this.path = path
      ? targetizeString(tgt, path.replaceAll(HASH_PLACEHOLDER, this.hash))
      : (this.build ? outPath : undefined)

    this.str = str
      ? targetizeString(tgt, str.replaceAll(HASH_PLACEHOLDER, this.hash))
      : this.path

    this.serialize = () => {
      return JSON.stringify(
        {
          ...this.normalize(),
          path: this.path,  // TODO: this is basically debugging information and should be stored externally, maybe together with a stack trace
        },
        null,
        2
      ).replaceAll(HASH_PLACEHOLDER, this.hash)
    }

    this.flatten = () => {
      let deps = this.dependencies.map(d => d.flatten())
      return [...deps, this].flat()  // flatten the nested list
    }

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
    if(v === undefined)
      throw Error("received undefined value")

    // if(v === null)
    //   console.log("Warning: received null value")  // TODO: either remove or make this a proper error

    if (typeof v === "string") {
      // parse regular strings for placeholders, so we can track the dependencies, etc
      // this way we can avoid using jix.str to construct strings while tracking dependencies

      // replace simple constants
      // TODO: this shouldn't be necessary but especially jix.HOME is used a lot
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

      if(v.includes(MAGIC_STRING)) {
        throw Error(`Fatal error: The following value contains an unresolvable effect reference: ${v}`)
      }

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
