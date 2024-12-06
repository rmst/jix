import * as util from '../util.js';
import { effect } from '../effect.js';
import base from './base.js';
import { mkdirRemote } from '../nux.js';

// TODO: is this used at all???


export const sshSyncDir = (root, host, destination, ignore = "") => {
  /*
  This makes a lot of separate ssh and scp calls. They will be greatly sped up if we reuse connections, i.e. make a dir `~/.ssh/master-socket` and then put this in your ~/.ssh/config:
 
    Host *
    ControlMaster auto
        ControlPersist 3s
        ControlPath ~/.ssh/master-socket/%r@%h:%p
 
  */
  let { dirs, files } = util.traverseFileSystem(root, ignore);

  // dirs and files are paths relative to root
  dirs.sort();
  files.sort();

  // let fileHashes = files.map(f => {
  //   let data = fs.readFileSync(root + '/' + f)
  //   return createHash().update(data).digest("hex")
  // })
  // TODO: replace with createHash
  // let hash = sha256(JSON.stringify([dirs, files, fileHashes]))
  let mkRoot = mkdirRemote(host, destination);

  let mkdirActions = dirs.map(path => mkdirRemote(host, destination + '/' + path));

  let scpActions = files.map(path => {
    let hashPath = base.file(root + '/' + path);

    let drv = effect({
      install: ["execShV1", `scp '${hashPath}' '${host}:${destination}/${path}'`],
      uninstall: ["execShV1", `ssh '${host}' rm -f '${destination}/${path}'`],
    });

    return drv;
  });

  return effect({
    dependencies: [mkRoot, ...mkdirActions, ...scpActions]
  });
};
