// Cross-environment helpers
/**
	* Detect whether the current runtime is real Node.js (not qjsx-node).
	* Uses presence of `process.versions.node` and absence of `process.versions.quickjs`.
	* @returns {boolean}
	*/
export function isNode() {
	const p = globalThis.process
	return typeof p === 'object' && !!p?.versions?.node && !p?.versions?.quickjs
}

/**
	* Read a single interactive line from stdin until Enter, returning the line as a string.
	* - QuickJS: uses `std.in.getline()` and trims the trailing newline
	* - Node.js: uses `node:readline` and resolves on the first `line` event
	* @param {string} [prompt=''] Optional text to display before reading
	* @returns {Promise<string>} The entered line without trailing newline
	*/
export async function promptLine(prompt='') {
	// Detect non-Node first (QuickJS or similar)
	if (!isNode()) {
		// QuickJS: use std.in.getline()
		const std = await import('std')
		if (prompt) std.out.puts(String(prompt))
		const line = std.in.getline()
		return line ? line.replace(/\r?\n$/, '') : ''
	} else {
		// Node.js: use readline to capture a single line
		const readline = await import('node:readline')
		const { stdin, stdout } = await import('node:process')
		return await new Promise(resolve => {
			const rl = readline.createInterface({ input: stdin, output: stdout })
			if (prompt) stdout.write(String(prompt))
			rl.once('line', line => {
				rl.close()
				resolve(line)
			})
		})
	}
}

/**
	* Check whether stdin is attached to a TTY.
	* - QuickJS: `os.isatty(0)`
	* - Node.js: `process.stdin.isTTY`
	* @returns {Promise<boolean>} True if stdin is a TTY
	*/
export async function istty() {
	if (!isNode()) {
		const os = await import('os')
		return !!os.isatty(0)
	} else {
		return !!globalThis.process.stdin?.isTTY
	}
}

/**
	* Read a single keypress from stdin and return it as a one-character string.
	* - QuickJS: sets raw mode when available and reads 1 byte via `os.read`
	* - Node.js: enables `stdin.setRawMode(true)` temporarily and reads one chunk
	* Works with piped input by consuming the first available byte.
	* @returns {Promise<string>} The first character read, or empty string if none
	*/
export async function getKey() {
	if (!isNode()) {
		const os = await import('os')
		const std = await import('std')
		const fd = std.in.fileno()
		if (os.isatty(fd) && os.ttySetRaw) os.ttySetRaw(fd)
		const buf = new Uint8Array(1)
		const n = os.read(fd, buf.buffer, 0, 1)
		return n > 0 ? String.fromCharCode(buf[0]) : ''
	} else {
		const { stdin } = await import('node:process')
		return await new Promise(resolve => {
			const cleanup = () => {
				try { if (stdin.setRawMode) stdin.setRawMode(false) } catch {}
				try { stdin.pause() } catch {}
			}
			try { if (stdin.setRawMode) stdin.setRawMode(true) } catch {}
			stdin.resume()
			stdin.once('data', chunk => {
				cleanup()
				const s = typeof chunk === 'string' ? chunk : chunk.toString('utf8')
				resolve(s.length ? s[0] : '')
			})
		})
	}
}
