import * as os from 'os';
import * as util from './util.js'
import { dedent, sh } from './util.js'
import { sha256 } from './sha256.js';
import * as fs from './node/fs.js';
import { createHash } from './shaNext.js';
import { derivation } from './drv.js';
import * as base from './base.js'

export * from './base.js'
export * from './macos.js'


export const nuxRemote = (host, derivations) => {
  // TODO: implement
}


export const sshSyncDir = (root, host, destination) => {

  let { dirs, files } = util.traverseFileSystem(root)  // TODO: replace with a function from node/fs

  // dirs and files are paths relative to root
  dirs.sort()
  files.sort()

  // let fileHashes = files.map(f => {
  //   let data = fs.readFileSync(root + '/' + f)
  //   return createHash().update(data).digest("hex")
  // })

  // TODO: replace with createHash
  // let hash = sha256(JSON.stringify([dirs, files, fileHashes]))


  let mkdirActions = dirs.map(path => ({
    install: ["execShV1", `ssh '${host}' mkdir -p '${destination}/${path}'`],
    uninstall: ["execShV1", `ssh '${host}' rm -rf '${destination}/${path}'`],  // TODO: could this be dangerous?
  }))

  let scpActions = files.map(path => {
    let hashPath = base.file(root + '/'  + path)
    
    let drv = derivation({
      install: ["execShV1", `scp '${hashPath}' '${host}:${destination}/${path}'`], 
      uninstall: ["execShV1", `ssh '${host}' rm -f '${destination}/${path}'`],
    })

    console.log(`DEPS ${hashPath}`)
    console.log("DEPS", drv.dependencies)
    console.log("DEPS", drv)

    return drv
  })
  
  return derivation({
    dependencies: [...mkdirActions, ...scpActions]
  }) 
}


export const nixosConfig = (host, configPath) => {
  // TODO: this should be root protected
	// TODO: dependency on scp
  
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