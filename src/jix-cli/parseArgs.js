// Simple argument parser for CLI commands
// Returns { flags: {}, positionals: [], sawDoubleDash: boolean }
export function parseArgs(args, schema = {}, options = {}) {
	const flags = {}
	const positionals = []
	let sawDoubleDash = false
	let i = 0

	while (i < args.length) {
		const arg = args[i]

		// Stop parsing flags after -- (don't include -- itself in positionals)
		if (arg === '--') {
			sawDoubleDash = true
			i++
			positionals.push(...args.slice(i))
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

		// If stopAtPositional is set, treat everything after the first positional as positionals
		// (but only if we actually found a real positional, not via the -- path above)
		if (options.stopAtPositional) {
			positionals.push(...args.slice(i))
			break
		}
	}

	return { flags, positionals, sawDoubleDash }
}
