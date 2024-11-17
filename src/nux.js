import * as os from 'os';
import * as util from './util.js'
import { dedent, sh, dirname } from './util.js'
import { sha256 } from './sha256.js';
import * as fs from './node/fs.js';
import { createHash } from './shaNext.js';
import { effect, TargetedEffect, Effect } from './effect.js';
import { AbstractEffect } from "./effectUtil.js";

import context, { HOME_PLACEHOLDER, NUX_DIR } from './context.js';
import base from './base.js'
import macos from './macos.js'



const mkdirRemote = (host, path) => ({
  install: ["execShV1", `ssh '${host}' mkdir '${path}'`],
  uninstall: ["execShV1", `ssh '${host}' rm -rf '${path}'`],  // this looks pretty dangerous but it's acceptable because it should only be called if mkdir succeeds (i.e. not if the dir already exists)
})


// TODO: is this used???
export const sshSyncDir = (root, host, destination, ignore="") => {
  /*
  This makes a lot of separate ssh and scp calls. They will be greatly sped up if we reuse connections, i.e. make a dir `~/.ssh/master-socket` and then put this in your ~/.ssh/config:

  	Host *
  	ControlMaster auto
		ControlPersist 3s
		ControlPath ~/.ssh/master-socket/%r@%h:%p

  */

    
  let { dirs, files } = util.traverseFileSystem(root, ignore)

  // dirs and files are paths relative to root
  dirs.sort()
  files.sort()

  // let fileHashes = files.map(f => {
  //   let data = fs.readFileSync(root + '/' + f)
  //   return createHash().update(data).digest("hex")
  // })

  // TODO: replace with createHash
  // let hash = sha256(JSON.stringify([dirs, files, fileHashes]))

  let mkRoot = mkdirRemote(host, destination)

  let mkdirActions = dirs.map(path => mkdirRemote(host, destination + '/' + path))

  let scpActions = files.map(path => {
    let hashPath = base.file(root + '/'  + path)
    
    let drv = effect({
      install: ["execShV1", `scp '${hashPath}' '${host}:${destination}/${path}'`], 
      uninstall: ["execShV1", `ssh '${host}' rm -f '${destination}/${path}'`],
    })

    return drv
  })
  
  return effect({
    dependencies: [mkRoot, ...mkdirActions, ...scpActions]
  }) 
}


export const nixosConfig = (host, configPath) => effect(target => {
  // TODO: move this function to a separate file / directory
  // TODO: use sshSyncDir instead??
  // TODO: should this be root protected?


  let { dirs, files } = util.traverseFileSystem(configPath)

  dirs.sort()
  files.sort()

  let contents = files.map(f => [f, util.fileRead(configPath + '/' + f)])
  
  let hash = sha256(JSON.stringify([dirs, contents]))
  
  // console.log(dirs)
  // console.log(files)

  let mkdirActions = dirs.map(path => effect({
    install: ["execShV1", `ssh ${host} mkdir -p /etc/nixos/${path}`],
    uninstall: ["execShV1", `ssh ${host} rm -rf /etc/nixos/${path}`]
  }))

  let scpActions = contents.map(([path, content]) => effect({
    install:  ["writeScpV2", host, "/etc/nixos/" + path, content], 
    uninstall: ["execShV1", `ssh ${host} rm -f /etc/nixos/${path}`]
  }))


  let prepareScript = dedent`
    # hash: ${hash} (included to force update if files change)
    ssh ${host} rm -rf /etc/nixos.backup
    ssh ${host} cp -r /etc/nixos /etc/nixos.backup
  `

  let installScript = dedent`
    # hash: ${hash} (included to force update if files change)
    start=$(date +%s)
    ssh ${host} nixos-rebuild switch
    echo nixos-rebuild switch ran for $(($(date +%s)-start)) seconds
  `

  return [
    effect({
      install: ["execShV1", prepareScript], 
      uninstall: ["noop"]
    }),
    ...mkdirActions,
    ...scpActions,
    effect({install: ["execShVerboseV1", installScript], uninstall: ["noop"]}),
  ]
})

// -----

// export const bash = (...args) => dedent`
//   #!/usr/bin/env bash
//   ${dedent(...args)}
// `

// export const python = (...args) => dedent`
//   #!/usr/bin/env python3
//   ${dedent(...args)}
// `

let nux = {
  dedent,
  sh,

  nixosConfig,

  Effect,
  TargetedEffect,
  // AbstractEffect,

  ...base,
  ...macos,

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