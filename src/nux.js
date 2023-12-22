import * as std from 'std';
import * as os from 'os';
import * as util from './util.js'
import { dedent, sh } from './util.js'

export const NUX_PATH=`${std.getenv('HOME')}/.nux`
export const CUR_PATH=`${std.getenv('HOME')}/.nux/cur`
export const TMP_PATH=`${std.getenv('HOME')}/.nux/tmp`
export const BIN_PATH=`${std.getenv('HOME')}/.nux/bin`
export const STORE_PATH=`${std.getenv('HOME')}/.nux/store`

// -----

export const file = (path, content, permissions='-w') => {
  path = path.replace('~', util.getEnv().HOME)

  return {
    install: ["writeFileV1", path, content, permissions],
    uninstall: ["deleteFileV1", path],
  }
}

export const script = (name, contents) => {
  return file(`${BIN_PATH}/${name}`, contents, "+x-w")
}

export const scripts = (c) => {
  return Object.keys(c).map(k => script(k, c[k]))
}

export const copy = (origin, path, permissions='-w') => {
  let content = util.fileRead(origin)
  return file(path, content, permissions)
}

export const link = (origin, path) => {
  // TODO: use builtin link functions
  return {
    install: ["symlinkV1", origin, path],
    uninstall: ["deleteFileV1", path],
  }
}

export const alias = (origin, name) => {

  return link(origin, `${BIN_PATH}/${name}`)
}


export const globalConfigFile = (path, content, original, reloadScript=null) => {
  return {
    install: ["writeConfSudoV1", path, content, reloadScript],
    uninstall: ["writeConfSudoV1", path, original, reloadScript],
  }
}


// -----

export const bash = (...args) => dedent`
  #!/bin/bash
  ${dedent(...args)}
`

export const python = (...args) => dedent`
  #!/usr/bin/python3
  ${dedent(...args)}
`

export {
  dedent,
  sh,
}