import * as os from 'os';
import * as util from './util.js'
import { dedent, sh } from './util.js'
import { sha256 } from './sha256.js';
import * as fs from './node/fs.js';
import { createHash } from './shaNext.js';
import { derivation } from './drv.js';
import * as base from './base.js'
import { NUX_PATH } from './const.js';

export * from './base.js'
export * from './macos.js'


export const nuxRemote = (host, configDir) => {
  // TODO: this doesn't work yet
  
  // TODO: maybe don't rely on .nux/bootstrap/qjs binary

  let REMOTE_NUX_PATH = '~/.nux'
  let ensureNuxDir = {
    install: ["execShV1", `ssh '${host}' mkdir -p '${REMOTE_NUX_PATH}/bootstrap'`],
  }

  let qjsBin = base.file(`${NUX_PATH}/bootstrap/qjs`)

  let ensureQjsBin = {
    install: ["execShV1", `scp '${qjsBin}' '${host}:${REMOTE_NUX_PATH}/bootstrap/qjs'`], 
  }

  return derivation({
    dependencies: [ensureNuxDir, ensureQjsBin]
  }) 
}

const mkdirRemote = (host, path) => ({
  install: ["execShV1", `ssh '${host}' mkdir '${path}'`],
  uninstall: ["execShV1", `ssh '${host}' rm -rf '${path}'`],  // this looks pretty dangerous but it's acceptable because it should only be called if mkdir succeeds (i.e. not if the dir already exists)
})

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
    
    let drv = derivation({
      install: ["execShV1", `scp '${hashPath}' '${host}:${destination}/${path}'`], 
      uninstall: ["execShV1", `ssh '${host}' rm -f '${destination}/${path}'`],
    })

    return drv
  })
  
  return derivation({
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

  let mkdirActions = dirs.map(path => ({
    install: ["execShV1", `ssh ${host} mkdir -p /etc/nixos/${path}`],
    uninstall: ["execShV1", `ssh ${host} rm -rf /etc/nixos/${path}`]
  }))

  let scpActions = contents.map(([path, content]) => ({
    install:  ["writeScpV1", host, "/etc/nixos/" + path, content], 
    uninstall: ["execShV1", `ssh ${host} rm -f /etc/nixos/${path}`]
  }))


  let prepareScript = dedent`
    # hash: ${hash} (included to trigger updates if files change)
    ssh ${host} rm -rf /etc/nixos.backup
    ssh ${host} cp -r /etc/nixos /etc/nixos.backup
  `


  return [
    {install: ["execShV1", prepareScript], uninstall: ["noop"]},
    ...mkdirActions,
    ...scpActions,
    {install: ["remoteNixosRebuildSwitchV1", host, hash], uninstall: ["noop"]},
  ]
}

// -----

export const bash = (...args) => dedent`
  #!/usr/bin/env bash
  ${dedent(...args)}
`

export const python = (...args) => dedent`
  #!/usr/bin/env python3
  ${dedent(...args)}
`

export {
  dedent,
  sh,
}