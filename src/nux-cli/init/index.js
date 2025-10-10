

import { installJsConfig } from "./jsconfig.js"
import process from "node:process"
import { sh } from "../util.js"
import { LOCAL_NUX_PATH } from "../../nux/context.js"
import { dedent } from "../../nux/dedent.js"


function initCmd() {
	let wd = process.cwd()
	installJsConfig(wd)  // TODO: this function seems way to complicated
	sh`mkdir -p '${wd}/.nux/modules'`
	sh`echo 'modules' > '${wd}/.nux/.gitignore'`
	sh`ln -sfn '${LOCAL_NUX_PATH}/nux/lib' '${wd}/.nux/modules/nux'`
}

export default {
	name: 'init',
	description: 'Initialize a new nux environment.',
	usage: 'nux init',
	help: dedent`
	Initialize nux support in the current working directory.

	This creates .nux/modules directory, sets up editor hints, and links the nux libs locally.

	Example:
	  nux init
	`,
	run(a) {
		if (a.length > 0 && (a.includes('--help') || a.includes('-h'))) {
			console.log(`Usage:\n  ${this.usage}\n\n${this.help}`)
			return
		}
		return initCmd()
	}
}
