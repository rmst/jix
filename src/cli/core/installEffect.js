import * as fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import process from 'node:process';

import { EXISTING_HASHES_PATH, LOCAL_STORE_PATH, NUX_DIR } from '../../nux/context';
import * as actions from './actions';
import set from './set'
import context from '../../nux/context.js';


const executeCmd = (c, host, user) => {
  
  if(c === null)  // noop
    return

  let options = c.verbose ? { stdout: 'inherit', stderr: 'inherit' } : {}
  let { cmd, args } = c
  if(host !== null) {
    // console.log("RC", host, user)
    // TODO: add a check here on first ssh connection whether the user home matches context.hosts
    host = context.hosts?.[host]?.address ?? host
    args = [cmd, ...args]

    // TODO: maybe use nux/util.js shellEscape, both are correct though
    args = args.map(s => `'` + s.replaceAll(`'`, `'"'"'`) + `'`)  // escape all args
    cmd = "ssh"
    args = [`${user}@${host}`, "--", ...args]
  }

  return execFileSync(cmd, args, options)
}



export const tryInstallEffect = (hash) => {
  let x = fs.readFileSync(`${LOCAL_STORE_PATH}/${hash}`, 'utf8');

  var { install = null, build = null, host, user, debug = {} } = JSON.parse(x);

  if (build) {
    // check if the out file exists (works both locally and over ssh)
    let exists = executeCmd({
      cmd: "/bin/sh",
      args: ["-c", `[ -e "$HOME/${NUX_DIR}/out/${hash}" ] && echo "y" || echo "n"`],
    }, host, user);

    exists = (exists === "y");

    if (!exists) {
      var [f, ...args] = build;
      let cmd = actions[f](...args, hash);

      try {
        executeCmd(cmd, host, user)

      } catch (e) {
        console.log(`Error: ${e.message}`)
        console.log(e.stack)
        return e
      }
    }
  }

  if (install) {
    var [f, ...args] = install;
    let cmd = actions[f](...args, hash);
    try {
      executeCmd(cmd, host, user);
    } catch (e) {
      console.log(`Error: ${e.message}`)
      console.log(e.stack)
      return e
    }
  }


  // success - immedately add effect hash to .nux/applied
  fs.writeFileSync(
    EXISTING_HASHES_PATH,
    JSON.stringify([...set(
      JSON.parse(fs.readFileSync(EXISTING_HASHES_PATH, "utf8"))
    ).plus([hash])]), 
    'utf8'
  )

  return null
}


export const tryUninstallEffect = (hash) => {
  let x = fs.readFileSync(`${LOCAL_STORE_PATH}/${hash}`, 'utf8');

  let { uninstall = null, host, user } = JSON.parse(x);

  if (uninstall) {
    let [f, ...args] = uninstall;

    try {
      let cmd = actions[f](...args, hash);
      executeCmd(cmd, host, user);

    } catch (e) {
      console.log(`Error with ${hash}, ${f}, ${args}:\n${e.message}`);
      console.log(e.stack);
      console.log("\n...uninstall continuing...\n");
      return e
    }
  }


  // success - immedately remove effect hash from .nux/applied
  fs.writeFileSync(
    EXISTING_HASHES_PATH,
    JSON.stringify([...set(
      JSON.parse(fs.readFileSync(EXISTING_HASHES_PATH, "utf8"))
    ).minus([hash])]),
    'utf8'
  )

  return null
};

