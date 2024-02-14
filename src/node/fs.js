import * as std from 'std';
import * as os from 'os';
import {sh} from '../util.js'

// https://chat.openai.com/g/g-YyyyMT9XH-chatgpt-classic/c/ad71352b-e93f-4fe0-9e92-05e3b7d25622

// Mimic fs.writeFileSync in Node.js
export const writeFileSync = (path, data, options) => {
  const mode = (options && options.mode) || 'w';
  const file = std.open(path, mode);
  if (!file) {
    throw new Error(`Failed to open file: ${path}`);
  }
  try {
    file.puts(data);
  } finally {
    file.close();
  }
}

// Mimic fs.chmodSync in Node.js
export const chmodSync = (path, mode) => {
  // const result = os.chmod(path, mode);  // doesn't exist in os
	let result = sh`chmod ${mode} ${path}`
}


// Mimic fs.readFileSync in Node.js
export const readFileSync = (path, options) => {
  const file = std.open(path, 'r');
  if (!file) {
    throw new Error(`Failed to open file: ${path}`);
  }
  try {
    return file.readAsString(); // Assuming the default encoding is 'utf-8'
  } finally {
    file.close();
  }
}

// Mimic fs.readdirSync in Node.js
export const readdirSync = (path) => {
  const [files, error] = os.readdir(path);
  if (error !== undefined) {
    throw new Error(`Failed to read directory: ${path}`);
  }
  return files;
}
