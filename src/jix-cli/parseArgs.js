// Simple argument parser for CLI commands
// Returns { flags: {}, positionals: [] }
export function parseArgs(args, schema = {}) {
	const flags = {}
	const positionals = []
	let i = 0

	while (i < args.length) {
		const arg = args[i]

		// Stop parsing flags after --
		if (arg === '--') {
			positionals.push(...args.slice(i + 1))
			break
		}

		// --flag=value
		if (arg.startsWith('--') && arg.includes('=')) {
			const [key, ...valueParts] = arg.slice(2).split('=')
			flags[key] = valueParts.join('=')
			i++
			continue
		}

		// --flag or -f
		if (arg.startsWith('-')) {
			const key = arg.startsWith('--') ? arg.slice(2) : arg.slice(1)

			// Check if it expects a value
			const expectsValue = schema[key] === 'value' || schema[key] === true

			if (expectsValue && i + 1 < args.length && !args[i + 1].startsWith('-')) {
				flags[key] = args[i + 1]
				i += 2
			} else {
				flags[key] = true
				i++
			}
			continue
		}

		// Positional argument
		positionals.push(arg)
		i++
	}

	return { flags, positionals }
}
