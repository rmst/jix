
// import * as fs from "./fs.js"
import * as std from "std"
import { monkeyPatchConsoleLog } from "../util.js"  // TODO: move this into node/
import { monkeyPatchProcess } from "./util.js"
// import * as os from "os"

let qjspath = std.getenviron()['QJSPATH']
let qjsinteractive = std.getenviron()['QJSINTERACTIVE']

// let fs = (() => {
// 	std.loadScript(`${qjspath}/fs.js`)
// })()


monkeyPatchProcess()

globalThis.console = monkeyPatchConsoleLog()


// TODO: instead of this make node:fs, etc imports work properly!! 
globalThis.fs = await import(`${qjspath}/src/node/fs.js`)
globalThis.child_process = await import(`${qjspath}/src/node/child_process.js`)

// console.log(scriptArgs)

if(process.argv[1] == "-e") {

	process.argv.shift()
	process.argv.shift()
	console.log(eval(process.argv.shift()))

} else if (process.argv[1]) {
	
	process.argv.shift()
	await import(process.argv.shift())
}



