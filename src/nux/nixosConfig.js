
import * as fs from 'node:fs'
import { createHash } from 'node:crypto';

import * as traverseFileSystemJs from './traverseFileSystem.js';
import { dedent } from './dedent.js';
import { effect } from './effect.js';
import nux from './base.js';


// TODO: remove the -v flag from rsync to make it less verbose
// export const nixosRebuild2 = nux.script`
//   #!/bin/sh
//   mkdir -p /root/.systemd
//   rm -rf /root/.systemd/diff
//   rsync -avc --compare-dest=/etc/static/systemd/system /etc/systemd/system/ /root/.systemd/diff
//   rm -rf /etc/systemd/system
//   ln -s /etc/static/systemd/system /etc/systemd/system  # restore original symlink

//   /run/current-system/sw/bin/nixos-rebuild "$@"
//   return_code=$?

//   rm -rf /etc/systemd/system
//   cp -rp $(realpath /etc/static/systemd/system) /etc/systemd/system

//   rsync -a /root/.systemd/diff/ /etc/systemd/system/

//   exit $return_code
// `


// NOTE: This is a hack to work around nixos-rebuild deleting our custom files in /etc/systemd/system/. We first save then, then rebuild, then restore them
export const nixosRebuild = nux.script`
  #!/bin/sh
  mkdir -p /root/.systemd

  rm -rf /root/.systemd/diff
  rsync -avc --compare-dest=/etc/static/systemd/system /etc/systemd/system/ /root/.systemd/diff
  # rm -rf /etc/systemd/system
  # ln -s /etc/static/systemd/system /etc/systemd/system  # restore original symlink

  /run/current-system/sw/bin/nixos-rebuild "$@"
  return_code=$?

  rm -rf /etc/systemd/system
  cp -rp $(realpath /etc/static/systemd/system) /etc/systemd/system

  rsync -a /root/.systemd/diff/ /etc/systemd/system/

  exit $return_code
`

export const nixosConfig = (configPath) => effect(target => {

  if(target.os != "nixos")
    throw Error(`nixosConfig target operating sytstem must be "nixos" but is ${target.os}`)

  if(target.user != "root")
    throw Error(`nixosConfig target user must be "root" but is ${target.user}`)

  let { dirs, files } = traverseFileSystemJs.traverseFileSystem(configPath);

  dirs.sort();
  files.sort();

  let contents = files.map(f => [f, fs.readFileSync(configPath + '/' + f, 'utf8')]);

  let hash = createHash('sha256')
    .update(JSON.stringify([dirs, contents]))
    .digest('hex')

  // console.log(dirs)
  // console.log(files)
  // let mkdirActions = dirs.map(path => effect({
  //   install: ["execShV1", `ssh ${host} mkdir -p /etc/nixos/${path}`],
  //   uninstall: ["execShV1", `ssh ${host} rm -rf /etc/nixos/${path}`]
  // }));

  // let scpActions = contents.map(([path, content]) => effect({
  //   install: ["writeScpV2", host, "/etc/nixos/" + path, content],
  //   uninstall: ["execShV1", `ssh ${host} rm -f /etc/nixos/${path}`]
  // }));


  let mkdirActions = dirs.map(path => nux.mkdir(`/etc/nixos/${path}`));

  let scpActions = contents.map(([path, content]) => nux.textfile(content).copyTo(`/etc/nixos/${path}`));



  return {
    install: ["execShVerboseV1", dedent`
      # hash: ${hash} (included to force update if files change)
      start=$(date +%s)
      ${nixosRebuild} switch
      echo nixos-rebuild switch ran for $(($(date +%s)-start)) seconds
    `],
    
    dependencies: [
      nux.run({
        install: dedent`
          # hash: ${hash} (included to force update if files change)
          rm -rf /etc/nixos.backup
          cp -r /etc/nixos /etc/nixos.backup
        `
      }),
  
      ...mkdirActions,
      ...scpActions,
    ]
  }

});
