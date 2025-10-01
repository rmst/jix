import { getKey } from '../../src/nux-cli/readline.js'

const main = async () => {
	const k = await getKey()
	console.log(`RESULT:${k}`)
}

main()

