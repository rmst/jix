


let sd = () => jix.stateDir("simon.test1")

export const run = {
	default: () => `echo ${sd()}`,
}

export default () => {


	let d = jix.script`
		echo 'jfjf33333f'
	`

	// let installFail = jix.customEffect({
	// 	install: "exit 1"
	// })

	// let uninstallFail = jix.customEffect({
	// 	uninstall: "exit 1"
	// })


	let sd = jix.stateDir("simon.test1")

	console.log(sd)

	return jix.alias({
		ga123: jix.script`
			echo '710f08jj'
			${d}
		`	
	})
}