
export function dirname(path) {
	const isFileURL = path.startsWith('file://');
	if (isFileURL) path = path.slice(7); // Remove 'file://' prefix
	if (path.endsWith('/')) path = path.slice(0, -1); // Handle trailing slash
	const parts = path.split('/');
	parts.pop(); // Remove the last segment (assumed to be file or empty)
	return parts.join('/') || '/';
}

export function basename(path) {
	if (path.endsWith('/')) path = path.slice(0, -1); // Handle trailing slash
	const parts = path.split('/');
	return parts.pop()
}


/**
 * Escapes a string for use as a single-quoted argument in a POSIX shell.
 * This is crucial for handling paths with spaces, apostrophes, etc.
 * @param {string} str The string to escape.
 * @returns {string} The escaped and quoted string.
 */
export function shellEscape(str) {
	if (typeof str !== 'string')
    throw new Error("Input must be a string.")

  if (str.includes('\0')) 
    throw new Error("String contains null byte, which is not supported in shell arguments.")

  // Replaces every ' with '\'', which is the standard way to embed a
  // literal single quote within a single-quoted string in POSIX shells.
  return `'${str.replace(/'/g, "'\\''")}'`;
}
