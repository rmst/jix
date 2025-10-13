import * as fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import process from 'node:process'

import { EXISTING_HASHES_PATH, LOCAL_STORE_PATH, NUX_DIR } from '../../nux/context.js'
import * as actions from './actions.js'
import set from './set.js'
import context from '../../nux/context.js'
import { prettyPrintEffect } from '../prettyPrint.js'
import { UserError } from './UserError.js'
import db from '../db/index.js'


export const executeCmd = (c, host, user) => {
  
  if(c === null)  // noop
    return

  let options = c.verbose ? { stdout: 'inherit', stderr: 'inherit' } : {}
  let { cmd, args } = c

  if(host !== null) {
    if(!host)
      throw new UserError(`Invalid host: ${host}`)

    if(!user)
      throw new UserError(`User must be specified when connecting to remote host: ${host}`)

    // TODO: also switch to stdin-based approach for ssh, should be cleaner

    // console.log("RC", host, user)
    // TODO: add a check here on first ssh connection whether the user home matches context.hosts
    host = context.hosts?.[host]?.address ?? host
    args = [cmd, ...args]

    // TODO: maybe use nux/util.js shellEscape, both are correct though
    args = args.map(s => `'` + s.replaceAll(`'`, `'"'"'`) + `'`)  // escape all args

    cmd = "ssh"
    args = [`${user}@${host}`, "--", ...args]
  }

  else if ( user && user != process.env.USER ) {
    args = [cmd, ...args]
    args = args.map(s => `'` + s.replaceAll(`'`, `'"'"'`) + `'`)  // escape all args
    options.input = args.join(' ')

    cmd = "sudo"
    args = [ "-i", "-u", user, "--", "/bin/sh" ]
  }

  return execFileSync(cmd, args, options)
}



export const tryInstallEffect = (hash) => {
  let effectData = db.store.read(hash)

  var { install = null, build = null, host, user, debug = {} } = effectData

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
        console.log(`Error with ${hash}:`)
        prettyPrintEffect(effectData)
        console.log(`\n${e.message}`)

        console.log("\n...uninstall continuing...\n")
        return e
      }
    }
  }

  if (install) {
    var [f, ...args] = install;
    let cmd = actions[f](...args, hash);
    try {
      executeCmd(cmd, host, user)
    } catch (e) {
      console.log(`Error with ${hash}:`)
      prettyPrintEffect(effectData)
      console.log(`\n${e.message}`)

      console.log("\n...uninstall continuing...\n")
      return e
    }
  }


  // success - immedately add effect hash to .nux/applied
  db.existing.write([...set(
    db.existing.exists()
    ? db.existing.read()
    : []
  ).plus([hash])])

  return null
}


export const tryUninstallEffect = (hash) => {
  let effectData = db.store.read(hash)

  let { uninstall = null, host, user } = effectData

  if (uninstall) {
    let [f, ...args] = uninstall;

    try {
      let cmd = actions[f](...args, hash)
      executeCmd(cmd, host, user)

    } catch (e) {
      console.log(`Error with ${hash}:`)
      prettyPrintEffect(effectData)
      console.log(`\n${e.message}`)

      console.log("\n...uninstall continuing...\n")
      return e
    }
  }


  // success - immedately remove effect hash from .nux/applied
  db.existing.write([...set(
    db.existing.read()
  ).minus([hash])])

  return null
}
