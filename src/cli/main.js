
// TODO: migrate this entire file to cli.js (and install.js, etc)
import process from 'node:process'
import * as fs from 'node:fs';

// import nux from 'nux'
import { TMP_PATH, LOCAL_NUX_PATH } from "../nux/context.js";

import * as util from './util.js'
util.monkeyPatchObjectToString()

import { install_raw } from './core/apply.js';
import { install } from './apply/index.js';





const main = async () => {
  // TODO: add help improve this

  if(true) {
    let operator = scriptArgs[1]

    if(operator === "i"){
      let path = scriptArgs[2]
      // if(path === "_") {
      //   path = fs.readFileSync(`${LOCAL_NUX_PATH}/last_update_name`, 'utf8')
      // }
      // fs.writeFileSync(`${LOCAL_NUX_PATH}/last_update_name`, path)
      await install(path)
      return

    } else if (operator === "uninstall") {
      let nuxId = scriptArgs[2]
      install_raw({nuxId})
      return

    } else if (operator === "force-remove") {
      let nuxId = scriptArgs[2]
      let drvs = scriptArgs[3]
      // Split and trim the input string into lines
      const lines = drvs.split('\n').map(line => line.trim()).filter(line => line !== '');
      // console.log(lines)
      // Load the existing JSON file
      const jsonPath = `${LOCAL_NUX_PATH}/cur-${nuxId}`;
      let jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      console.log('Before:', jsonData.length, "derivations")

      // Remove each line from the JSON list
      jsonData = jsonData.filter(item => !lines.includes(item));
      console.log('After:', jsonData.length, "derivations")
      // Save the updated list back to the JSON file
      fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');
    }

  }


}



main().then(null, e => {
  console.log(`Error: ${e.message}`)
  console.log(e.stack)
  process.exit(1)
})
