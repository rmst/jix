// This is the root of the jix API

import { Effect, withTarget, getTarget } from './effect.js'

import { HOME_PLACEHOLDER, JIX_DIR } from './context.js'
import base, { HASH, scriptWithTempdir, writeFile } from './base.js'
import service from './service/index.js'

import nixos from './nixos'
import nix from './nix'
import git from './git'
import { appendToFile } from './appendToFile.js'
import shelltools from './shelltools'
import { Host, User } from './targets.js'

let jix = {

  ...base,

  service,

  nix,

  git,

  HOME: HOME_PLACEHOLDER,

  // NOTE: do not list experimental in the documentation
  experimental: {
    nixos,
    shelltools,

    appendToFile,
    scriptWithTempdir,

    withTarget,
    getTarget,
  },

  // NOTE: do not list _internal in the documentation
  _internal: {
    Effect,
    JIX_PATH: HOME_PLACEHOLDER + "/" + JIX_DIR,  // TODO: this should be independent of the user home
    HASH,

    writeFile,
  },

  Host,
  User,
}


// quickjs module caching workaround
if(globalThis._jix_modules_jix)
  jix = globalThis._jix_modules_jix
else
  globalThis._jix_modules_jix = jix


globalThis.jix = jix

export default jix
