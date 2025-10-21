// This is the root of the nux API

import { TargetedEffect, Effect, withTarget, getTarget } from './effect.js'
import { AbstractEffect } from "./effectUtil.js"

import { HOME_PLACEHOLDER, NUX_DIR } from './context.js'
import base, { HASH, scriptWithTempdir, writeFile } from './base.js'
import service from './service/index.js'

import nixos from './nixos'
import nix from './nix'
import git from './git'
import { appendToFile } from './appendToFile.js'
import shelltools from './shelltools'
import { Host, User } from './targets.js'

let nux = {

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
    TargetedEffect,
    AbstractEffect,
    NUX_PATH: HOME_PLACEHOLDER + "/" + NUX_DIR,  // TODO: this should be independent of the user home
    HASH,

    writeFile,
  },

  Host,
  User,
}


// this is to work around a severe quickjs bug whereas different modules are created for the same file when using dynamic imports (i.e. await import(...))
// TODO: find a minimal example and report this bug to https://github.com/bellard/quickjs
if(globalThis._nux_modules_nux)
  nux = globalThis._nux_modules_nux
else
  globalThis._nux_modules_nux = nux


globalThis.nux = nux

export default nux
