
import { LOCAL_NUX_PATH, LOCAL_BIN_PATH, LOCAL_STORE_PATH } from '../../nux/context';

import * as dirnameJs from '../../nux/util';
import * as util from '../util';
import { sh } from '../util';
import { git } from './git';
import { install_raw } from '../core/apply.js';
import { findNuxRoot, exportsID } from './util.js';


export const install = async (path) => {
  util.mkdir(LOCAL_NUX_PATH, true);
  util.mkdir(LOCAL_BIN_PATH, true);
  util.mkdir(LOCAL_STORE_PATH, true);
  util.mkdir(`${LOCAL_NUX_PATH}/logs`, true);

  // let path = process.env.NUX_REPO || os.getcwd()[0]
  // NOTE: path can be any path inside of a git repo and doesn't necessarily have to point to a root.nux.js file
  console.log("path", path);

  path = sh`realpath "${findNuxRoot(path)}"`.trim();
  console.log("nuxroot", path);

  if (!exportsID(path)) {
    // let id = util.uuidV4()
    let id = util.basename(dirnameJs.dirname(path));
    console.log(`new path assigning ID ${id}`);
    sh`echo '\n\n\nexport const ID = "${id}"' >> "${path}"`;
  }

  let gitRoot = git.root(path);
  console.log("gitroot", gitRoot);


  if (!git.isClean(gitRoot)) {
    // throw Error(`Uncommited changes in ${path}`)
    // console.log(`git not clean ${path}`)
    sh`
			cd ${gitRoot}
			git add .
			git commit -m nux_update
  	`;
  }

  let commit = git.latestCommitHash(gitRoot);
  // console.log(`Installing ${path} from ${gitRoot}:${commit}`)
  
  await install_raw({sourcePath: path})
}


