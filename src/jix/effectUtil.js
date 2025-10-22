import { symlink, link, copy } from './base.js';
import { LOCAL_HOME, MAGIC_STRING } from './context.js';
import { effectPlaceholderMap, effect } from './effect.js';


export class AbstractEffect {
  static nextId = 0; // static property to keep track of the next id to be assigned

  constructor() {
    this.id = AbstractEffect.nextId;
    AbstractEffect.nextId += 1;
  }

  toString() {
    // if(!this instanceof TargetedEffect && !this.target)
    //   throw Error(`Fatal: ${super.toString()}`)
    let key = `_effect_${this.id}_${MAGIC_STRING}_`;
    effectPlaceholderMap.set(key, this);
    return key
  }

  // convenience functions
  symlinkTo(path) { return symlink(this, path); }
  linkTo(path, symbolic = false) { return link(this, path, symbolic); }
  copyTo(path) { return copy(this, path); }
}


// export const userHome = (host, user) => {
//   let c = globalThis.jixContext;
//   if (host === null) {
//     if (user === null)
//       return LOCAL_HOME;

//     else {
//       return sh`sudo -i -u ${user} -- echo '$HOME'`
//     }
//   }
//   let defaultHome = user === "root" ? "/root" : "/home/" + user;
//   let h = c?.hosts?.[host]?.users?.[user]?.home ?? defaultHome;
//   return h;
// };
