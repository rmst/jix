


import * as std from 'std';


// Function to write content to a file
function fileWrite(path, content) {
  // std is the standard module in QuickJS that contains the file system functions
  const file = std.open(path, 'w');
  if (!file) {
    throw new Error('Unable to open file for writing');
  }
  try {
    file.puts(content); // Write the content to the file
  } finally {
    file.close(); // Always close the file handle
  }
}

// Function to read content from a file
function fileRead(path) {
  const file = std.open(path, 'r');
  if (!file) {
    throw new Error('Unable to open file for reading');
  }
  try {
    return file.readAsString(); // Read the content as a string
  } finally {
    file.close(); // Always close the file handle
  }
}

function fileDelete(path) {
  try {
    std.remove(path); // Remove the file at the given path
  } catch (e) {
    throw new Error(`Unable to delete file: ${e.message}`);
  }
}


function rs(...command) {
    // Join the command and its arguments into a single string
    const commandWithArgs = command.join(' ');

    // Open the command for reading
    let process = std.popen(commandWithArgs, "r");

    // Read the output
    let output = process.readAsString();

    // Close the process
    process.close();

    return output;
}

// Usage
// let output = rs('ls', '-lh', '~');
// console.log(output);

let nux = {}


let log = str => {
	console.log(str)
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

// nux.cronAdd = (cronConfig) => {
// 	let writeConfig = (conf) => {

// 		// Open a process to write to crontab and capture standard error
// 		let process = std.popen('crontab -', 'w');
		
// 		// Write the cron configuration to the crontab
// 		process.puts(conf);
		
// 		// Close the writing end to send EOF to the process
// 		process.close();

// 		// Read the standard error stream which is redirected to stdout
// 		let output = process.readAsString();

// 		// Check the exit code. Non-zero indicates an error.
// 		if (process.exitCode !== 0) {
// 				throw new Error(`Failed to update crontab. Exit code: ${process.exitCode}, Output: ${output}`);
// 		}

// 		log(output)
// 	}

// 	return {
// 		key: "cronAdd",
// 		write: (conf) => {
// 			let newConf = conf ?? "" + "\n" + cronConfig
// 			writeConfig(newConf)
// 			return newConf
// 		},
// 		check: (conf) => {
// 			let output = rs("crontab", "-l")
// 			// TODO: assertEqual(output, conf)
// 		},
// 		clean: () => writeConfig("")
// 	}
// }

nux.fileAppend = (path, str) => {
	return {
		key: "fileAppend:" + path,
		write: conf => {
			let newConf = conf ?? "" + str
			fileWrite(path, newConf)
			return newConf
		},
		check: conf => {
			let content = fileRead(path)
			// TODO: assertEqual(content, conf[path])
		},
		clean: () => {
			fileDelete(path)
		}
	}
}





const configure = arg => {
	let c = arg[0]
	c.conf.map(a => {
		
	})
}

function runc(arg) {

}


// configure([
// 	{
// 		name: "macbook",
// 		conf: [
// 				// nux.cron``,

// 				// nux.zsh(extensions=[]),
// 				nux.fileAppend("~/test12", "blablabla")
// 		]
// 	},
// ])



// import * as std from 'std';
import * as os from 'os';

function printHelp() {
    console.log(`
Usage: nux [options]
--help     Display this help message
`)
}

function main(args) {
    if (args.includes('--help')) {
        printHelp();
    } else {
        // Your main program logic here
        std.out.puts("Hello from main.js!\n");
    }
}

main(scriptArgs);