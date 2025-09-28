

import { installJsConfig } from "./jsconfig.js";
import process from "node:process";
import { sh } from "../util.js";
import { LOCAL_NUX_PATH } from "../../nux/context.js";


export default () => {
	let wd = process.cwd()
	installJsConfig(wd)  // TODO: this function seems way to complicated
	sh`mkdir -p '${wd}/nux_modules'`
	sh`grep '^nux_modules$' .gitignore >/dev/null 2>&1 || { echo; echo 'nux_modules'; } >> .gitignore`
	sh`ln -sfn '${LOCAL_NUX_PATH}/nux/lib' '${wd}/nux_modules/nux'`
}
