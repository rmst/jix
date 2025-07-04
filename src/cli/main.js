
// TODO: migrate this entire file to cli.js (and install.js, etc)
import process from 'node:process'
import * as fs from 'node:fs';

// import nux from 'nux'
import { TMP_PATH, LOCAL_NUX_PATH, EXISTING_HASHES_PATH } from "../nux/context.js";

import * as util from './util.js'
util.monkeyPatchObjectToString()

import apply from './core/apply.js';
import { install } from './apply/index.js';





const main = async () => {
  // TODO: add help improve this

  if(true) {
    let operator = scriptArgs[1]

    if(operator === "i"){
      // TODO: this should be named "apply"
      let path = scriptArgs[2]
      // if(path === "_") {
      //   path = fs.readFileSync(`${LOCAL_NUX_PATH}/last_update_name`, 'utf8')
      // }
      // fs.writeFileSync(`${LOCAL_NUX_PATH}/last_update_name`, path)
      await install(path)
      return

    } else if (operator === "uninstall") {
      // TODO: this should be named "delete" and ideally remove the reference to the nux root from .nux
      let nuxId = scriptArgs[2]
      apply({nuxId})
      return

    } else if (operator === "force-remove") {
      let nuxId = scriptArgs[2]
      let drvs = scriptArgs[3]

      // Split and trim the input string into lines
      const lines = drvs.split('\n').map(line => line.trim()).filter(line => line !== '');
      // console.log(lines)
      let existing = JSON.parse(fs.readFileSync(EXISTING_HASHES_PATH, 'utf8'));
      console.log('Before:', existing.length, "derivations")

      // Remove each line from the JSON list
      existing = existing.filter(item => !lines.includes(item));
      console.log('After:', existing.length, "derivations")
      
      fs.writeFileSync(
        EXISTING_HASHES_PATH, 
        JSON.stringify(existing, null, 2), 
        'utf8'
      )

    }

  }


}



main().then(null, e => {
  console.log(`Error: ${e.message}`)
  console.log(e.stack)
  process.exit(1)
})
