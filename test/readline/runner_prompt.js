import { promptLine } from '../../src/jix-cli/readline.js'

const main = async () => {
	const v = await promptLine('')
	console.log(`RESULT:${v}`)
}

main()
