import * as std from 'std';
import * as os from 'os';
import * as x from './util.js'
import {dedent} from './util.js'

export const NUX_PATH=`${std.getenv('HOME')}/.nux`
export const CUR_PATH=`${std.getenv('HOME')}/.nux/cur`
export const TMP_PATH=`${std.getenv('HOME')}/.nux/tmp`
export const BIN_PATH=`${std.getenv('HOME')}/.nux/bin`


export const file = (path, content, permissions='-w') => ({
  install: () => x.fileWriteWithPermissions(path, content, permissions),
  uninstall: () => x.fileDelete(path),
})

export const script = (name, contents) => {
  contents = dedent`
    #!/bin/bash
    ${contents}
  `
  return file(`${BIN_PATH}/${name}`, contents, "+x-w")
}

