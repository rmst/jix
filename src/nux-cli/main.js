import process from 'node:process'


import * as util from './util.js'
util.monkeyPatchObjectToString()

import apply from './core/apply.js';
import { install } from './apply/index.js';
import { forceRemove } from './forceRemove.js';
import { queryHostInfo, queryUserInfo } from './core/hosts.js';



const main = async () => {

  if(true) {
    let operator = scriptArgs[1]

    if(operator === "apply"){
      let path = scriptArgs[2]
      // if(path === "_") {
      //   path = fs.readFileSync(`${LOCAL_NUX_PATH}/last_update_name`, 'utf8')
      // }
      // fs.writeFileSync(`${LOCAL_NUX_PATH}/last_update_name`, path)
      await install(path)
      return

    }
    
    else if (operator === "delete") {
      // TODO: this shouldn't create a dummy effect
      // TODO: this should remove the reference to the nux root from .nux
      let nuxId = scriptArgs[2]
      apply({nuxId})
      return

    }
    
    else if (operator === "force-remove") {
      let drvs = scriptArgs[2]
      forceRemove(drvs);
    }

    else if (operator === "host-info") {
      
      console.log(JSON.stringify(queryHostInfo(scriptArgs[2] || null, scriptArgs[3] || null), null, 2))

      console.log(JSON.stringify(queryUserInfo(scriptArgs[2] || null, scriptArgs[3] || null), null, 2))

    }

  }

}


main().then(null, e => {
  console.log(`Error: ${e.message}`)
  console.log(e.stack)
  process.exit(1)
})



