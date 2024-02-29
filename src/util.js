import * as std from 'std';
import * as os from 'os';
import { sha256 } from './sha256.js';


// TODO: move away from these functions towards the node/fs functions


// Function to write content to a file
export const fileWrite = (path, content) => {
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
  fileDelete(path, true)
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

export const dirRead = (path) => {
  // TODO: is this the correct way to handle errors?
  let [files, err] = os.readdir(path)
  if(err)
    throw new Error(`Unable to read dir ${path}`)

  return files
}


export function traverseFileSystem(rootPath) {
  // Recursive function to traverse the file system

	let dirs = [];
	let files = [];

	// Inner function to handle recursion
	function traverse(currentPath) {
		let entries = dirRead(currentPath)

		entries.forEach(entry => {

      if([".", "..", ".DS_Store"].includes(entry)) {
        // TODO: support .gitignore or sth?
        return
      }
        
			let fullPath = currentPath + "/" + entry
			let [stat, err] = os.stat(fullPath)  // os.stat follows symlinks (as opposed to os.lstat)
      if(err)
        throw new Error(`Unable to stat ${fullPath}`)

			let relativePath = fullPath.substring((rootPath + "/").length);

      let isDir = stat.mode & 0o040000   // directory
      let isFile = stat.mode & 0o100000  // fegular file

			if (isDir) { 
				dirs.push(relativePath)
        // console.log(fullPath)
				traverse(fullPath)
			} else if (isFile) {  
				files.push(relativePath)
			}
		});
	}

	traverse(rootPath);
	return { dirs, files };
}



export const fileDelete = (path, ignoreNonexisting=false) => {
  if(ignoreNonexisting && !exists(path))
    return

  if(os.remove(path) != 0)
    throw new Error(`Unable to delete file: ${path}`);
}

export const exists = (path) => {
	return os.lstat(path)[0] != null
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



// TODO: this code has been moved to node/child_process.js execSync, replace this function with a call to that
export const execShFunction = ({verbose=false, env={}}) => (template, ...args) => {
  let cmd = dedent(template, ...args)

  // make everything fail if one command fails, TODO: is this a good default?
  // redirect stderr to stdout

  // TODO: this is a hack, we don't escape env values properly
  let env_setup = Object.entries(env).map(([k, v]) => `export ${k}="${v}"`).join("\n")

  let wrappedCmd = dedent`
    {
      set -e
      ${env_setup}
      ${cmd}
    } 2>&1
  `

  let process = std.popen(wrappedCmd, "r")
  // let output = process.readAsString().trim()
  let output = ""

  while (true) {
    let line = process.getline()
    if (line === null) {
      break;
    }
    output = output + line + '\n'
    // Print the line, getline() does not include the trailing line feed
    if (verbose)
      console.log(line)
  }


  let code = process.close()

  if(code != 0) {
    throw Error(dedent`
      Command:
      ${cmd}
      failed with error code ${code}. Output:
      ${verbose ? "see above" : output}
    `)
  }

  return output
}

export const sh = execShFunction({verbose: false})
export const shVerbose = execShFunction({verbose: true})


export const time = () => {
  return Math.floor(Date.now() / 1000)
}



export const dedent = (templateStrings, ...values) => {
  // https://github.com/MartinKolarik/dedent-js/blob/master/src/index.ts
  // TODO: simplify
  // TODO: allow for properly indented multiline values

  templateStrings = templateStrings.raw ?? templateStrings

	let matches = [];
	let strings = typeof templateStrings === 'string' ? [ templateStrings ] : templateStrings.slice();


  // TODO: maybe just do this for shell/bash?
  strings = strings.map(x => x.replace(String.raw`\$`, "$"))


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




  
function toStr(x) {
  // Handle null and undefined
  if (x === null || x === undefined) {
      return String(x);
  }

  // Handle primitives (numbers, booleans, strings)
  if (typeof x !== 'object') {
      return String(x);
  }

  // Handle arrays
  if (Array.isArray(x)) {
      return '[' + x.map(item => toStr(item)).join(', ') + ']';
  }

  // Handle objects
  let result = [];
  for (let key in x) {
      try {
          // Attempt to stringify value, if not possible use placeholder
          const value = typeof x[key] === 'object' ? toStr(x[key]) : String(x[key]);
          result.push(`${key}: ${value}`);
      } catch (e) {
          result.push(`${key}: [${typeof x[key]}]`);
      }
  }
  return '{' + result.join(', ') + '}';
}


export const monkeyPatchConsoleLog = () => {
  // TODO: maybe patch globalThis.console ?
  console.log_old = console.log
  console.log = (...args) => {
    args = args.map(x => toStr(x))
    console.log_old(...args)
  }
  return console
}

