
// import * as fs from "./fs.js"
import * as std from "std"
import { monkeyPatchConsoleLog } from "../util.js"
// import * as os from "os"

let qjspath = std.getenviron()['QJSPATH']
let qjsinteractive = std.getenviron()['QJSINTERACTIVE']

// let fs = (() => {
// 	std.loadScript(`${qjspath}/fs.js`)
// })()


globalThis.process = {
	argv: [...scriptArgs],
	env: std.getenviron(),  // TODO: make this function call (via getter / setter / proxy)
}

globalThis.console = monkeyPatchConsoleLog()

globalThis.fs = await import(`${qjspath}/src/node/fs.js`)


// console.log(scriptArgs)

if(process.argv[1] == "-e") {

	process.argv.shift()
	process.argv.shift()
	console.log(eval(process.argv.shift()))

} else if (process.argv[1]) {
	
	process.argv.shift()
	await import(process.argv.shift())
}

