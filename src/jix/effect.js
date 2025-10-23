import { HOME_PLACEHOLDER, HASH_PLACEHOLDER, MAGIC_STRING } from './context.js';
import { JIX_DIR, LOCAL_USER } from './context.js';
import { AbstractEffect } from './effectUtil.js';
import { dedent } from './dedent.js';

export const effectPlaceholderMap = new Map()

import { createHash } from 'node:crypto';
import { createContext, useContext } from './useContext.js';
import { Host, User } from './targets.js';

// import { createHash } from 'node/crypto';

/*
TODO: split into two types of effects:
- effect (side effects, install and uninstall functions)
- build/derivation/artifact (no side effects; all outputs in ~/.jix/out/${hash}, build function)
*/

const TARGET_CONTEXT = createContext(null)

/**
 * @template T
 * @param {{host: Host, user: User}} target 
 * @param {() => T} fn 
 * @returns {T}
 */
export const withTarget = (target, fn=null) => {
  if(!(target.host.constructor.name === 'Host'))
    throw TypeError(`${target.host}`)
  
  if(!(target.user.constructor.name === 'User'))
    throw TypeError(`${target.user}`)

  if(fn)
    return TARGET_CONTEXT.provide(target, fn)
  else
    TARGET_CONTEXT.defaultValue = target
}

/**
 * @returns {{host: Host, user: User}}
 */
export const getTarget = () => {
  let tgt = useContext(TARGET_CONTEXT)

  if(tgt === null) {
    throw Error("Missing target context. NOTE: You can't define effects at the top-level of a file!")
  }

  return tgt
}


const EFFECT_CONTEXT = createContext(null)

/**
 * @param {*} fn 
 * @returns {TargetedEffect[]}
 */
export const collectEffects = (fn) => {
  let allEffects = []
  EFFECT_CONTEXT.provide(allEffects, fn)
  return allEffects
}

/**
 * @param {TargetedEffect} e
 */
const addEffect = (e) => {
  /** @type {TargetedEffect[] | null} */
  let allEffects = useContext(EFFECT_CONTEXT)
  if(allEffects === null)
    return
  allEffects.push(e)
}


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

  @param {EffectProps | Array} obj
  @returns {TargetedEffect}
 */
export function effect (obj) {
  if(typeof obj === "function") {
    throw TypeError(`Cannot pass function as argument: ${obj}`)
  }

  let props = Array.isArray(obj)
    ? { dependencies: obj }
    : obj

  let e = new TargetedEffect(props)

  addEffect(e)
  return e
}



// NOTE: This is invasive. We're patching toString for all functions!
globalThis._fnPlaceholderId = 0

/** @type {Map<string,Function>} */
globalThis._fnPlaceholderMap = new Map()

// @ts-ignore
Function.prototype.toStringOriginal = Function.prototype.toString
Function.prototype.toString = function() {
  // TODO: we should save stack trace here, otherwise it'll be impossible to track down errors
  let key = `_function_${globalThis._fnPlaceholderId}_${MAGIC_STRING}_`
  globalThis._fnPlaceholderMap.set(key, this)
  globalThis._fnPlaceholderId += 1
  return key
}
// -----


export class TargetedEffect extends AbstractEffect {

  /** 
   * @type {TargetedEffect[]} 
   */
  dependencies

  /**
   * @param {EffectProps} [props] - Effect properties
   */
  constructor(props={}) {
    super()

    if(typeof props !== "object")
      throw TypeError(`Expected object, got: ${typeof props}`)

    const tgt = getTarget()

    /** @private */
    this._stack = (new Error()).stack.split('\n').slice(2).join("\n")

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

      let {values, dependencies: newDeps} = parseEffectValues(x)
      dependencies.push(...newDeps)

      return values
    })
    

    // process dependencies  
    this.dependencies = dependencies.map(x => {
      if(x instanceof TargetedEffect)
        return x

      else {
        let t = `${typeof x} || ${x?.constructor?.name}`
        throw Error(`Effect: ${x} of type ${t} is not a proper dependency`)
      }
    })


    this.install = install
    this.uninstall = uninstall
    this.build = build
    this.host = tgt.host.machineId
    this.user = tgt.user.name

    
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

    let outPath = `${tgt.user.home}/${JIX_DIR}/out/${this.hash}`

    this.path = path
      ? targetizeString(path.replaceAll(HASH_PLACEHOLDER, this.hash))
      : (this.build ? outPath : undefined)

    this.str = str
      ? targetizeString(str.replaceAll(HASH_PLACEHOLDER, this.hash))
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

    this.toDebugString = () => {
      return JSON.stringify({
        path: this.path,
        deps: this.dependencies.map(x => x.hash.slice(0, 5)),
        host: tgt.host.address,
        user: this.user,
        str: this.str,
        hash: this.hash.slice(0, 5),
      })  
    }
  }
}

/**
 * @param {string} str 
 * @returns {string}
 */
const targetizeString = (str) => {
  const tgt = getTarget()
  if (!tgt.user.home)
    throw Error(`Fatal: ${tgt}`)

  return str
    .replaceAll(HOME_PLACEHOLDER, tgt.user.home)
    // .replaceAll(USER_PLACEHOLDER, tgt.user)
}

/**
 * @param {any[]} values 
 * @returns {{values: any[], dependencies: TargetedEffect[]}}
 */
export const parseEffectValues = (values) => {

  let dependencies = []
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
      v = targetizeString(v)

      if(v.includes(MAGIC_STRING)) {
        // search for dependencies, this is not the most efficient way to do this, but it's okay for now
        ;[...effectPlaceholderMap.keys()].map(k => {
          if(v.includes(k)) {
            let eff = effectPlaceholderMap.get(k)
            dependencies.push(eff)
            v = v.replaceAll(k, eff.str)
          }
        })

        ;[...globalThis._fnPlaceholderMap.keys()].map(k => {
          if(v.includes(k)) {
            let fn = globalThis._fnPlaceholderMap.get(k)
            let eff = fn()
            if(!(eff instanceof TargetedEffect)) {
              throw TypeError(`Expected TargetedEffect, got: ${eff}`)
            }
            dependencies.push(eff)
            v = v.replaceAll(k, eff.str)
          }
        })
      }

      if(v.includes(MAGIC_STRING)) {
        throw Error(`Fatal error: The following value contains an unresolvable effect reference: ${v}`)
      }

      return v

    }

    else if (typeof v === "function") {
      const x = v()
      if(!(x instanceof TargetedEffect)) {
        throw TypeError(`Expected TargetedEffect, got: ${x}`)
      }
      dependencies.push(x)
      return x.str
    }

    else if (v instanceof TargetedEffect) {
      // add it to the dependencies array
      // and replace the object with it's out path
      dependencies.push(v)
      return v.str
    }

    else
      return v;
  })

  return { values, dependencies };
};
