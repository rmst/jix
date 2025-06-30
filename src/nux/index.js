// This is the root of the nux API

import { dirname } from './util.js';
import { dedent } from './dedent.js';

import { TargetedEffect, Effect } from './effect.js';
import { AbstractEffect } from "./effectUtil.js";

import context, { HOME_PLACEHOLDER, NUX_DIR } from './context.js';
import base from './base.js'
import macos from './macos.js'
import { nixosConfig } from './nixosConfig.js';
import db from './db.js';
import { loadRepo } from './repo.js'

let nux = {
  loadRepo,
  
  dedent,
  dirname,
  // sh,

  nixosConfig,

  Effect,
  TargetedEffect,
  AbstractEffect,

  ...base,
  ...macos,

  ...db,
  
  get REPO() { return context.repo },

  // get HOME() { return context.HOME },
  HOME: HOME_PLACEHOLDER,
  // get USER() { return context.user },
  NUX_PATH: HOME_PLACEHOLDER + "/" + NUX_DIR,
  // scope: context.scope,
  // remote: context.remote,
  // context,  // TODO: remove
}


// this is to work around a severe quickjs bug whereas different modules are created for the same file when using dynamic imports (i.e. await import(...))
// TODO: find a minimal example and report this bug to https://github.com/bellard/quickjs
if(globalThis._nux_modules_nux)
  nux = globalThis._nux_modules_nux
else
  globalThis._nux_modules_nux = nux


export default nux 