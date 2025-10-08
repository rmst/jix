// This is the root of the nux API

// import { dirname } from './util.js'
// import { dedent } from './dedent.js'

import { TargetedEffect, Effect } from './effect.js'
import { AbstractEffect } from "./effectUtil.js"

import { HOME_PLACEHOLDER, NUX_DIR } from './context.js'
import base from './base.js'
import { nixosConfig } from './nixos/nixosConfig.js'
import service from './service/index.js'

import nixos from './nixos'
import nix from './nix'
import git from './git'

let nux = {
  Effect,
  TargetedEffect,
  AbstractEffect,

  ...base,

  service,


  nix,
  nixosConfig,
  nixos,

  git,

  HOME: HOME_PLACEHOLDER,
  NUX_PATH: HOME_PLACEHOLDER + "/" + NUX_DIR,  // TODO: this should be independent of the user home

}


// this is to work around a severe quickjs bug whereas different modules are created for the same file when using dynamic imports (i.e. await import(...))
// TODO: find a minimal example and report this bug to https://github.com/bellard/quickjs
if(globalThis._nux_modules_nux)
  nux = globalThis._nux_modules_nux
else
  globalThis._nux_modules_nux = nux


globalThis.nux = nux

export default nux 