import * as util from '../util.js';
import { dedent } from '../util.js';
import { sha256 } from '../sha256.js';
import { effect } from '../effect.js';



export const nixosConfig = (host, configPath) => effect(target => {
  // TODO: move this function to a separate file / directory
  // TODO: use sshSyncDir instead??
  // TODO: should this be root protected?
  let { dirs, files } = util.traverseFileSystem(configPath);

  dirs.sort();
  files.sort();

  let contents = files.map(f => [f, util.fileRead(configPath + '/' + f)]);

  let hash = sha256(JSON.stringify([dirs, contents]));

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
  `;

  let installScript = dedent`
    # hash: ${hash} (included to force update if files change)
    start=$(date +%s)
    ssh ${host} nixos-rebuild switch
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
