import * as std from 'std';
import * as os from 'os';
import * as util from './util.js'
import { dedent, sh } from './util.js'



export const deleteFileV1 = path => util.fileDelete(path, true)

export const writeFileV1 = (path, content, permissions) => util.fileWriteWithPermissions(path, content, permissions)

export const symlinkV1 = (origin, path) => sh`ln -sf ${origin} ${path}`

export const writeFileSudoV1 = (path, content) => {
  sh`echo '${content}' | sudo tee ${path} > /dev/null`
}

export const writeConfSudoV1 = (path, content, reloadScript) => {
	writeFileSudoV1(path, content)
	if(reloadScript)
		sh`${reloadScript}`
}