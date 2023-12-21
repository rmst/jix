import * as std from 'std';
import * as os from 'os';



// Function to write content to a file
export const fileWrite = (path, content) => {
  // std is the standard module in QuickJS that contains the file system functions
  const file = std.open(path, 'w');
  if (!file) {
    throw new Error(`Unable to open file for writing, ${path}`);
  }
  try {
    file.puts(content); // Write the content to the file
  } finally {
    file.close(); // Always close the file handle
  }
}

export const fileWriteWithPermissions = (path, content, permissions) => {
  fileWrite(path, content)
  sh`chmod ${permissions} ${path}`
}

// Function to read content from a file
export const fileRead = (path) => {
  const file = std.open(path, 'r');
  if (!file) {
    throw new Error(`Unable to open file for reading, ${path}`);
  }
  try {
    return file.readAsString(); // Read the content as a string
  } finally {
    file.close(); // Always close the file handle
  }
}

export const fileDelete = (path) => {
  try {
    os.remove(path); // Remove the file at the given path
  } catch (e) {
    throw new Error(`Unable to delete file: ${e.message}`);
  }
}

export const exists = (path) => {
	return os.stat(path)[0] != null
}


export const mkdir = (path, ignoreExists=false) => {
  if (!ignoreExists || !exists(path)) {
    os.mkdir(path);
  }
}


export const withCwd = (cwd, f) => {
  let oldCwd = os.getcwd()[0]
  os.chdir(cwd)
  let result = f()
  os.chdir(oldCwd)
  return result
}

export const withEnv = (env, f) => {
  let oldEnv = std.getenviron()
  setEnv(env)
  let result = f()
  setEnv(oldEnv)
  return result
}

export const getEnv = std.getenviron

export const setEnv = (env) => {
  Object.keys(std.getenviron()).map(k => std.unsetenv(k))
  Object.keys(env).map(k => std.setenv(k, env[k]))
}

// export const system = (...command) => {
//     // TODO: delete
//     // Join the command and its arguments into a single string
//     const commandWithArgs = command.join(' ');
    
//     let error = {}

//     // Open the command for reading
//     let process = std.popen(commandWithArgs, "r", error);
//     xw

//     // Read the output
//     let output = process.readAsString();

//     // Close the process
//     process.close();

//     if(error.errno != 0)
//       throw Error(`Error: ${error.errno}, Output: ${output}`)


//     return output;
// }


export const sh = (template, ...args) => {
  // TODO: automatically escape the arguments
  let cmd = dedent(template, ...args)

  // make everything fail if one command fails, TODO: is this a good default?
  // redirect stderr to stdout
  let wrappedCmd = dedent`
    {
      set -e
      ${cmd}
    } 2>&1
  `

  let process = std.popen(wrappedCmd, "r")
  let output = process.readAsString().trim()
  let code = process.close()

  if(code != 0) {
    throw Error(dedent`
      Command:
      ${cmd}
      failed with error code ${code}. Output:
      ${output}
    `)
  }

  return output
}


export const time = () => {
  return Math.floor(Date.now() / 1000)
}



export const dedent = (templateStrings, ...values) => {
  // https://github.com/MartinKolarik/dedent-js/blob/master/src/index.ts
  // TODO: simplify
  // TODO: allow for properly indented multiline values

  templateStrings = templateStrings.raw

	let matches = [];
	let strings = typeof templateStrings === 'string' ? [ templateStrings ] : templateStrings.slice();

	// 1. Remove trailing whitespace.
	strings[strings.length - 1] = strings[strings.length - 1].replace(/\r?\n([\t ]*)$/, '');

	// 2. Find all line breaks to determine the highest common indentation level.
	for (let i = 0; i < strings.length; i++) {
		let match;

		if (match = strings[i].match(/\n[\t ]+/g)) {
			matches.push(...match);
		}
	}

	// 3. Remove the common indentation from all strings.
	if (matches.length) {
		let size = Math.min(...matches.map(value => value.length - 1));
		let pattern = new RegExp(`\n[\t ]{${size}}`, 'g');

		for (let i = 0; i < strings.length; i++) {
			strings[i] = strings[i].replace(pattern, '\n');
		}
	}

	// 4. Remove leading whitespace.
	strings[0] = strings[0].replace(/^\r?\n/, '');

	// 5. Perform interpolation.
	let string = strings[0];

	for (let i = 0; i < values.length; i++) {
		string += values[i] + strings[i + 1];
	}

	return string;
}


