import * as fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import process from 'node:process'

import { EXISTING_HASHES_PATH, LOCAL_STORE_PATH, JIX_DIR } from '../../jix/context.js'
import * as actions from './actions.js'
import set from './set.js'
import context from '../../jix/context.js'
import { prettyPrintEffect, style } from '../prettyPrint.js'
import { UserError } from './UserError.js'
import db from '../db/index.js'
import { resolveEffectTarget } from './hosts.js'
import { shellEscape } from '../../jix/util.js'
import * as logger from '../logger.js'


/**
 * @param {*} command
 * @param {*} address
 * @param {*} user 
 * @returns {string} the stdout of the command
 */
export const executeCmd = (command, address, user) => {
  
  if(command === null)  // noop
    return

  let options = (command.verbose && logger.isVerbose()) ? { stdout: 'inherit', stderr: 'inherit' } : {}
  let { cmd, args } = command

  if(address !== "localhost") {
    if(!address)
      throw new UserError(`Invalid host: ${address}`)

    if(!user)
      throw new UserError(`User must be specified when connecting to remote host: ${address}`)

    // TODO: also switch to stdin-based approach for ssh, should be cleaner

    // console.log("RC", host, user)
    // TODO: add a check here on first ssh connection whether the user home matches context.hosts
    args = [cmd, ...args]

    // TODO: maybe use jix/util.js shellEscape, both are correct though
    args = args.map(s => `'` + s.replaceAll(`'`, `'"'"'`) + `'`)  // escape all args

    cmd = "ssh"
    args = [`${user}@${address}`, "--", ...args]
  }

  else if ( user && user != process.env.USER ) {
    args = [cmd, ...args]
    args = args.map(s => `'` + s.replaceAll(`'`, `'"'"'`) + `'`)  // escape all args
    options.input = args.join(' ')

    cmd = "sudo"
    args = [ "-i", "-u", user, "--", "/bin/sh" ]
  }
  
  // console.log(style.red("C:"), [cmd, ...args].map(x => shellEscape(x)).join(" "))

  return execFileSync(cmd, args, options)
}



export const tryInstallEffect = (hash, manifestId) => {
  let effectData = db.store.read(hash)

  var { install = null, build = null, host, user, debug = {} } = effectData

  var { address: host, user } = resolveEffectTarget(host, user)

  if (build) {
    // check if the out file exists (works both locally and over ssh)
    const existsString = executeCmd({
      cmd: "/bin/sh",
      args: ["-c", `[ -e "$HOME/${JIX_DIR}/out/${hash}" ] && echo "y" || echo "n"`],
    }, host, user);

    const exists = (existsString === "y");

    if (!exists) {
      var [f, ...args] = build;
      let cmd = actions[f](...args, hash);

			try {
				executeCmd(cmd, host, user)

			} catch (e) {
				console.log(`Error with ${hash}:`)
				prettyPrintEffect(effectData)
				console.log(`\n${e.message}`)

				const trace = db.stackTrace.read()[manifestId][hash]
        console.log(`\nStack trace:\n${trace}\n`)
   
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

      const trace = db.stackTrace.read()[manifestId][hash]
      console.log(`\nStack trace:\n${trace}\n`)

      return e
    }
  }


  // success - immedately add effect hash to .jix/applied
  db.existing.write([...set(
    db.existing.exists()
    ? db.existing.read()
    : []
  ).plus([hash])])

  return null
}


export const tryUninstallEffect = (hash) => {
  let effectData = db.store.read(hash)

  var { uninstall = null, host, user } = effectData
  var { address: host, user } = resolveEffectTarget(host, user)

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


  // success - immedately remove effect hash from .jix/applied
  db.existing.write([...set(
    db.existing.read()
  ).minus([hash])])

  return null
}
