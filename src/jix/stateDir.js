
import { effect } from "./effect.js";
import { JIX_DIR } from "./context.js";

/**
 * @param {string} id
 */
export default (id) => effect(target => {

	if(typeof id !== 'string' || id.length === 0)
		throw Error(`Need non-empty string, got: ${id}`)

	let path = `${target.home}/${JIX_DIR}/db/${id}`

	return {
		install: ["stateDirInstallV1", id],
		uninstall: ["stateDirUninstallV1", id],
		path,
	}
})
