
let sd = () => jix.stateDir("simon.test1")


// run these via, e.g. `jix run -f test/simple`
export const run = {
	default: () => `echo ${sd()}`,
	test: () => `echo ${sd}`,  // this will work fine, too
	test2: `echo ${sd}`,  // this will work fine, too
}


export default () => {
	let d = jix.script`
		echo 'a'
	`

	jix.customEffect({
		install: `echo "Error: test error" >&2;  exit 1`
	})

	// let uninstallFail = jix.customEffect({
	// 	uninstall: "exit 1"
	// })


	let sd = jix.stateDir("simon.test1")  // correct usage
	// let sd = () => jix.stateDir("simon.test1")  // will work fine
	// let sd = () => null  // will cause error

	// console.log(`${sd}`)

	return jix.alias({
		ga123: jix.script`
			echo ${sd}
			echo 'b'
			${d}
		`	
	})
}