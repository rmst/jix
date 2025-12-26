// This is the root of the jix API

import { Effect, withTarget, getTarget } from './effect.js'
import base, { HASH, scriptWithTempdir, dirWith, writeFile } from './base.js'
import service from './service/index.js'

import nixos from './nixos'
import nix from './nix'
import git from './git'
import { appendToFile } from './appendToFile.js'
import shelltools from './shelltools'
import { Host, User } from './targets.js'
import container from './container'
import importDir from './importDir.js'

let jix = {

  ...base,

  service,

  nix,

  git,

  container,

  Effect,
  Host,
  User,

  // NOTE: do not list this in docs

  experimental: {
    nixos,
    shelltools,

    appendToFile,
    scriptWithTempdir,

    importDir,

    withTarget,
    getTarget,
  },

  // NOTE: do not list this in docs
  _internal: {
    HASH,
    writeFile,
  },

}


// quickjs module caching workaround
if(globalThis._jix_modules_jix)
  jix = globalThis._jix_modules_jix
else
  globalThis._jix_modules_jix = jix


globalThis.jix = jix

export default jix
