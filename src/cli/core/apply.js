
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';

import nux from 'nux'
import { ACTIVE_HASHES_PATH, LOCAL_NUX_PATH, LOCAL_STORE_PATH } from "../../nux/context.js";
import context from '../../nux/context.js';
import { effect, TargetedEffect, Effect } from '../../nux/effect.js';
import { dedent } from '../../nux/dedent.js';

import * as util from '../util.js'
import { tryInstallEffect, tryUninstallEffect } from './installEffect.js';
import { EXISTING_HASHES_PATH } from '../../nux/context.js';
import set from './set.js';


// export const updateHosts = (hosts) => {
//   fs.writeFileSync(`${LOCAL_NUX_PATH}/hosts.json`, JSON.stringify(hosts, null, 2), 'utf8');
//   loadHosts();
// };

export const loadHosts = () => {
  let hosts = JSON.parse(fs.readFileSync(`${LOCAL_NUX_PATH}/hosts.json`, 'utf8'));
  // console.log("LOAD HOSTS", hosts)
  context.hosts = hosts;
};



export default async function apply({
  sourcePath = null,
  // name="default", 
  nuxId = null
}) {
  // console.log("install-raw")
  // TODO: UPDATE HOSTS if the path is hosts.nux.js or sth
  // let hosts = (await import(`${util.dirname(sourcePath)}/hosts.js`)).default
  // if(hosts)
  //   updateHosts(hosts)
  loadHosts();


  let module;

  if (nuxId === null) {
    module = await import(sourcePath);
    nuxId = module.ID;
  }



  let activeHashesById = util.exists(ACTIVE_HASHES_PATH)
    ? JSON.parse(fs.readFileSync(ACTIVE_HASHES_PATH, 'utf8'))
    : {};

  let activeHashes = set(Object.values(activeHashesById).flat()).list()
  
  let existingHashes = util.exists(EXISTING_HASHES_PATH)
    ? set(JSON.parse(fs.readFileSync(EXISTING_HASHES_PATH, 'utf8'))).list()
    : [];


  // TODO: IMPORTANT: first we should ensure that there is no difference between activeHashes and existingHashes, and offer interactively to remove them
  if(activeHashes.length != existingHashes.length) {
    console.log(dedent`
      🚨 Warning: active = ${activeHashes.length} != existing = ${existingHashes.length}
    `)
    // process.exit(1)
  }


  let drvs = nux.target(); // create empty TargetedEffect

  if (sourcePath) {

    // let obj = module.default[name]
    let obj = module.default;

    if (obj === undefined)
      throw new Error(`${sourcePath} is missing "export default ..."`);

    else if (obj instanceof Promise)
      drvs = await obj;

    else if (typeof obj === 'function')
      drvs = await obj();


    else
      drvs = obj;

    // console.log(drvs)
    if (!(drvs instanceof TargetedEffect)) {
      // drvs can e.g be a list of Effects
      drvs = nux.target(null, drvs);

      // console.log(`\n${drvs.toDebugString()}\n`)
    }
  }

  drvs = drvs.flatten();

  // write derivations to disk
  drvs.map(d => {
    let p = `${LOCAL_STORE_PATH}/${d.hash}`;
    if (!util.exists(p))
      util.fileWrite(p, d.serialize());
  });

  let desiredForId = set(drvs.map(d => d.hash)).list()

  let activeForId = activeHashesById[nuxId] ?? []
  let activeOtherThanId = set(Object.values({...activeHashesById, [nuxId]: []}).flat())

  let hashesToUninstall = set(activeForId)  // "old" effects
    .intersect(existingHashes)  // only uninstall actually existing
    .minus(desiredForId) // new effects (shouldn't be removed if they already exist)
    .minus(activeOtherThanId)  // other effects that shouldn't be removed
    .list()
    
  let hashesToInstall = set(desiredForId)  // new effects
    .minus(existingHashes)  // we shouldn't re-install anything
    .list()


  console.log(dedent`
    Uninstalling ${hashesToUninstall.length} of ${activeForId.length}:
      ${[...hashesToUninstall].join('\n  ')}
  `);


  var failedUninstalls = hashesToUninstall
    .slice().reverse()
    .map(hash => [hash, tryUninstallEffect(hash)])
    .filter(([h, e]) => e !== null)
    .map(([h, e]) => h)


  if (failedUninstalls.length > 0) {
    console.log(dedent`
      ❌ ${failedUninstalls.length} out of ${hashesToUninstall.length} uninstalls failed.
      Uninstall them manually, then delete them via
      
        nux force-remove ${nuxId} '
        ${failedUninstalls.join('\n  ')}
        '
    `)

    process.exit(1)
  }
  
  console.log(`Installing ${hashesToInstall.length} of ${desiredForId.length}`);

  let installedHashes = [...(function*(){
    for (const hash of hashesToInstall) {
      let e = tryInstallEffect(hash)
      if(e)
        return  // return early on error
      yield hash
    }
  })()]

  if (installedHashes.length != hashesToInstall.length) {
    console.log(dedent`
      ❌ Partial install: ${installedHashes.length} out of ${hashesToInstall.length} installed

      🧹 Trying to clean up partial install...
      
    `)

    var failedUninstalls = installedHashes
      .slice().reverse()
      .map(hash => [hash, tryUninstallEffect(hash)])
      .filter(([h, e]) => e !== null)
      .map(([h, e]) => h);

    if (failedUninstalls.length != 0) {
      console.log(dedent`
        ❌ Leftover installed hashes ${failedUninstalls}/${installedHashes.length} 🤷‍♂️:
          ${failedUninstalls.join('\n  ')}

      `)
    }

    console.log(`⏮️ Trying to restore old install...\n`);

    let reinstalledHashes = [...(function*(){
      for (const hash of hashesToUninstall) {
        let e = tryInstallEffect(hash)   // continue despite errors this time
        yield hash
      }
    })()]

    if (reinstalledHashes.length != hashesToUninstall.length) {

      let missingHashes = set(hashesToUninstall)
        .minus(reinstalledHashes)
        .list()

      console.log(dedent`
        ❌ Partial re-install: ${reinstalledHashes.length} of the removed ${hashesToUninstall.length} re-installed. Missing ${missingHashes.length}:
          ${missingHashes.join('\n  ')}
      `)   

    } else {

      console.log(`Successfully restored previous install`)
    }

    process.exit(1)  // exit with error

  }


  // success - desired hashes were installed
  // console.log("✅")

  // now we write to disk to remember to keep these hashes
  activeHashesById[nuxId] = desiredForId
  util.fileWrite(ACTIVE_HASHES_PATH, JSON.stringify(activeHashesById))

}


