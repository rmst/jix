
import { effect, getTarget } from "./effect.js";
import { JIX_DIR } from "./context.js";

/**
 * @param {string} id
 */
export default (id) => {

	let tgt = getTarget()
	
	if(typeof id !== 'string' || id.length === 0)
		throw Error(`Need non-empty string, got: ${id}`)

	let path = `${tgt.user.home}/${JIX_DIR}/db/${id}`

	return effect({
		install: ["stateDirInstallV1", id],
		uninstall: ["stateDirUninstallV1", id],
		path,
	})
}
