import * as os from 'os';
import * as util from './util.js'
import { dedent, sh } from './util.js'
import { sha256 } from './sha256.js';

export * from './base.js'
export * from './macos.js'


export const nuxRemote = (host, derivations) => {
  // TODO: implement
}


const copy = (path, remote, destination) => {

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