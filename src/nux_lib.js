import * as std from 'std';
import * as os from 'os';
import * as util from './util.js'
import { dedent, sh } from './util.js'

export const NUX_PATH=`${std.getenv('HOME')}/.nux`
export const CUR_PATH=`${std.getenv('HOME')}/.nux/cur`
export const TMP_PATH=`${std.getenv('HOME')}/.nux/tmp`
export const BIN_PATH=`${std.getenv('HOME')}/.nux/bin`

export {
  dedent,
  sh,
}

export const file = (path, content, permissions='-w') => {
  path = path.replace('~', util.getEnv().HOME)

  return {
    install: (c=content) => util.fileWriteWithPermissions(path, c, permissions),
    uninstall: () => util.fileDelete(path, true),
  }
}

export const script = (name, contents) => {
  contents = dedent`
    #!/bin/bash
    ${contents}
  `
  return file(`${BIN_PATH}/${name}`, contents, "+x-w")
}

export const copy = (origin, path, permissions='-w') => {
  let {install, uninstall} = file(path, null, permissions)
  return {
    install: () => install(util.fileRead(origin)),
    uninstall,
  }
}

export const link = (origin, path) => {
  // TODO: use builtin link functions
  return {
    install: () => sh`ln -s ${origin} ${path}`,
    uninstall: () => sh`rm -f ${path}`,
  }
}

export const alias = (origin, name) => {

  return link(origin, `${BIN_PATH}/${name}`)
}