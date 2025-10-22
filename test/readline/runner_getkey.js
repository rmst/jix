import { getKey } from '../../src/jix-cli/readline.js'

const main = async () => {
	const k = await getKey()
	console.log(`RESULT:${k}`)
}

main()
