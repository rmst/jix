// https://chatgpt.com/c/670d658f-1c78-8013-8a87-3cc260ac8795
import * as std from 'std';
import * as os from 'os';

/**
 * Execute a command synchronously and return its output, similar to Node.js's execFileSync.
 *
 * @param {string} file - The command or executable file to run.
 * @param {Array} [args=[]] - The list of arguments to pass to the command.
 * @param {Object} [options={}] - Optional parameters.
 * @param {Object} [options.env] - Environment variables for the command.
 * @param {string} [options.cwd] - Working directory for the command.
 * @param {string} [options.stdout] - Redirect stdout (can be 'inherit').
 * @param {string} [options.stderr] - Redirect stderr (can be 'inherit').
 *
 * @returns {string} - The stdout output of the command (if not forwarded).
 *
 * @throws {Error} - Throws an error if the command exits with a non-zero status.
 *
 * Example usage:
 *
 * 1. Basic call:
 * ```js
 * const output = execFileSync('echo', ['Hello, World!']);
 * console.log(output);  // Outputs: Hello, World!
 * ```
 *
 * 2. Call with custom environment and working directory:
 * ```js
 * const output = execFileSync('printenv', [], { env: { CUSTOM_ENV: 'myvalue' }, cwd: '/tmp' });
 * console.log(output);  // Outputs: CUSTOM_ENV=myvalue
 * ```
 *
 * 3. Call with stdout and stderr forwarded (no capture, direct display):
 * ```js
 * execFileSync('your_command', ['arg1', 'arg2'], { stdout: 'inherit', stderr: 'inherit' });
 * ```
 */
export const execFileSync = (file, args = [], options = {}) => {
	let env = options.env || std.getenv();  // Use the provided environment or current one
	let cwd = options.cwd || undefined;    // Optional working directory

	// Create pipes for stdout and stderr unless 'inherit' is specified
	let [stdoutRead, stdoutWrite] = os.pipe();
	let [stderrRead, stderrWrite] = os.pipe();
	
	let stdout = (options.stdout === 'inherit') ? std.out : stdoutWrite;
	let stderr = (options.stderr === 'inherit') ? std.err : stderrWrite;

	// Prepare the process execution
	let execOptions = {
		// file: file,
		env: env,
		cwd: cwd,
		stdout: stdout,
		stderr: stderr,
	};

	let exitCode = os.exec([file, ...args], execOptions);

  // Read stdout and stderr from pipes if not forwarded
	let output = "";
	if (options.stdout !== 'inherit') {
    os.close(stdoutWrite);
		output = readFromFd(stdoutRead);  // Capture stdout
		os.close(stdoutRead);  // Close the read-end of stdout pipe
	}

  let errorOutput = "";
  if (options.stderr !== 'inherit') {
    os.close(stderrWrite);
		errorOutput = readFromFd(stderrRead);  // Capture stderr
		os.close(stderrRead);  // Close the read-end of stderr pipe
  }

	// Handle error case if exit code is non-zero
	if (exitCode !== 0) {
		let errorMsg = `CMD: [${file}, ${args.join(', ')}]\nCOD: ${exitCode}\n`;

		// Add environment variables to the error message if any non-standard environment was provided
		if (options.env) {
			let envVars = Object.entries(options.env).map(([key, value]) => `${key}=${value}`).join('\n');
			errorMsg += `ENV: ${envVars}\n`;
		}

		// Add working directory if specified
		if (options.cwd) {
			errorMsg += `CWD: ${options.cwd}\n`;
		}

    // errorMsg += `Stdout Output:\n${output}\n`

		// Append error output from stderr if it was captured
    errorMsg += `ERR: ${errorOutput}\n`;

		throw new Error(errorMsg);
	}

	// Return stdout output (trimmed) if captured
	return output.trim();
};

/**
 * Reads the entire contents from a file descriptor (fd) using std.fdopen.
 * 
 * @param {number} fd - The file descriptor to read from.
 * @returns {string} - The string contents of the file descriptor.
 */
function readFromFd(fd) {
  // Open a FILE object from the file descriptor for reading
  let file = std.fdopen(fd, 'r');

  // Read all the contents as a string
if(file === null) 
  return ''

let output = file.readAsString();

  // Close the FILE object to release resources
  file.close();

  return output;
}