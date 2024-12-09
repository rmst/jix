// This is the root of the nux API
// see ./api/ for implementations
// see ../nlib for more implementations that eventually should make their way into ./api/

import * as os from 'os';
import { sh, dirname, dedent } from './util.js'

import * as fs from './node/fs.js';
// import { createHash } from './shaNext.js';
import { TargetedEffect, Effect } from './effect.js';
import { AbstractEffect } from "./effectUtil.js";

import context, { HOME_PLACEHOLDER, NUX_DIR } from './context.js';
import base from './api/base.js'
import macos from './api/macos.js'
import { nixosConfig } from './api/nixosConfig.js';
import db from './api/db.js';


let nux = {
  dedent,
  sh,

  nixosConfig,

  Effect,
  TargetedEffect,
  // AbstractEffect,

  ...base,
  ...macos,

  ...db,
  
  get REPO() { return context.repo },
  dirname,

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