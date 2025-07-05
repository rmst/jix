// export const getRandomString = (len) => Array.from({ length: len }, () => 
//     'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
//     .charAt(Math.floor(Math.random() * 62))
// ).join('');
/**
		gets the path of the directory for a file path or url, works with e.g.
		```
		dirname(import.meta.url)
		```
 */


export function dirname(path) {
	const isFileURL = path.startsWith('file://');
	if (isFileURL) path = path.slice(7); // Remove 'file://' prefix
	if (path.endsWith('/')) path = path.slice(0, -1); // Handle trailing slash
	const parts = path.split('/');
	parts.pop(); // Remove the last segment (assumed to be file or empty)
	return parts.join('/') || '/';
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
