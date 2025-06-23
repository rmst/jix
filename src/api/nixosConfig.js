
import { createHash } from 'node:crypto';

import * as util from '../util.js';
import { dedent } from '../util.js';
import { effect } from '../effect.js';
import base from './base.js';


// TODO: remove the -v flag from rsync to make it less verbose
export const nixosRebuild2 = base.script`
  #!/bin/sh
  mkdir -p /root/.systemd
  rm -rf /root/.systemd/diff
  rsync -avc --compare-dest=/etc/static/systemd/system /etc/systemd/system/ /root/.systemd/diff
  rm -rf /etc/systemd/system
  ln -s /etc/static/systemd/system /etc/systemd/system  # restore original symlink

  /run/current-system/sw/bin/nixos-rebuild "$@"
  return_code=$?

  rm -rf /etc/systemd/system
  cp -rp $(realpath /etc/static/systemd/system) /etc/systemd/system

  rsync -a /root/.systemd/diff/ /etc/systemd/system/

  exit $return_code
`

export const nixosRebuild = base.script`
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

export const nixosConfig = (host, configPath) => effect(target => {
  // TODO: move this function to a separate file / directory
  // TODO: use sshSyncDir instead??
  // TODO: should this be root protected?
  let { dirs, files } = util.traverseFileSystem(configPath);

  dirs.sort();
  files.sort();

  let contents = files.map(f => [f, util.fileRead(configPath + '/' + f)]);

  let hash = createHash('sha256')
    .update(JSON.stringify([dirs, contents]))
    .digest('hex')

  // console.log(dirs)
  // console.log(files)
  let mkdirActions = dirs.map(path => effect({
    install: ["execShV1", `ssh ${host} mkdir -p /etc/nixos/${path}`],
    uninstall: ["execShV1", `ssh ${host} rm -rf /etc/nixos/${path}`]
  }));

  let scpActions = contents.map(([path, content]) => effect({
    install: ["writeScpV2", host, "/etc/nixos/" + path, content],
    uninstall: ["execShV1", `ssh ${host} rm -f /etc/nixos/${path}`]
  }));


  let prepareScript = dedent`
    # hash: ${hash} (included to force update if files change)
    ssh ${host} rm -rf /etc/nixos.backup
    ssh ${host} cp -r /etc/nixos /etc/nixos.backup
    scp ${nixosRebuild} ${host}:/etc/nixos/nixos-rebuild
  `;

  let installScript = dedent`
    # hash: ${hash} (included to force update if files change)
    start=$(date +%s)
    # ssh ${host} nixos-rebuild switch
    ssh ${host} /etc/nixos/nixos-rebuild switch
    echo nixos-rebuild switch ran for $(($(date +%s)-start)) seconds
  `;

  return [
    effect({
      install: ["execShV1", prepareScript],
      uninstall: ["noop"]
    }),
    ...mkdirActions,
    ...scpActions,
    effect({ install: ["execShVerboseV1", installScript], uninstall: ["noop"] }),
  ];
});
