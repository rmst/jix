let state = { verbose: true }

export const withLogger = async ({ verbose }, fn) => {
	const prev = state.verbose
	state.verbose = !!verbose
	try {
		return await fn()
	} finally {
		state.verbose = prev
	}
}

export const log = (...args) => {
	if (state.verbose) console.log(...args)
}

export const error = (...args) => {
	console.log(...args)
}

export const isVerbose = () => state.verbose
