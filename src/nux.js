import * as os from 'os';
import * as util from './util.js'
import { dedent, sh } from './util.js'
import { sha256 } from './sha256.js';
import * as fs from './node/fs.js';
import { createHash } from './shaNext.js';
import { Effect } from './effect.js';

import context from './context.js';
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
    
    let drv = Effect({
      install: ["execShV1", `scp '${hashPath}' '${host}:${destination}/${path}'`], 
      uninstall: ["execShV1", `ssh '${host}' rm -f '${destination}/${path}'`],
    })

    return drv
  })
  
  return Effect({
    dependencies: [mkRoot, ...mkdirActions, ...scpActions]
  }) 
}


export const nixosConfig = (host, configPath) => {
  // TODO: use sshSyncDir instead

  // TODO: should this be root protected?


  let { dirs, files } = util.traverseFileSystem(configPath)

  dirs.sort()
  files.sort()

  let contents = files.map(f => [f, util.fileRead(configPath + '/' + f)])
  
  let hash = sha256(JSON.stringify([dirs, contents]))
  
  // console.log(dirs)
  // console.log(files)

  let mkdirActions = dirs.map(path => Effect({
    install: ["execShV1", `ssh ${host} mkdir -p /etc/nixos/${path}`],
    uninstall: ["execShV1", `ssh ${host} rm -rf /etc/nixos/${path}`]
  }))

  let scpActions = contents.map(([path, content]) => Effect({
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
    Effect({
      install: ["execShV1", prepareScript], 
      uninstall: ["noop"]
    }),
    ...mkdirActions,
    ...scpActions,
    Effect({install: ["execShVerboseV1", installScript], uninstall: ["noop"]}),
  ]
}

// -----

// export const bash = (...args) => dedent`
//   #!/usr/bin/env bash
//   ${dedent(...args)}
// `

// export const python = (...args) => dedent`
//   #!/usr/bin/env python3
//   ${dedent(...args)}
// `

export default {
  dedent,
  sh,

  nixosConfig,

  ...base,
  ...macos,

  get REPO() { return context.repo },
  get HOME() { return context.HOME },
  get USER() { return context.user },
  get NUX_PATH() { return context.NUX_PATH },
  // scope: context.scope,
  remote: context.remote,
  context,
}