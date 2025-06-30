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
