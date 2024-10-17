
import * as std from "std"
import * as os from "os"


export const monkeyPatchProcess = () => {
	
	if(globalThis.process)
		return

	globalThis.process = {
		argv: [...scriptArgs],
		env: std.getenviron(),  // TODO: make this function call (via getter / setter / proxy)
	}
}

