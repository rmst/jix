import { promptLine } from '../../src/nux-cli/readline.js'

const main = async () => {
	const v = await promptLine('')
	console.log(`RESULT:${v}`)
}

main()

