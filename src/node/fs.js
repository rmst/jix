import * as std from 'std';
import * as os from 'os';
import { sh } from '../util.js'

// TODO: replace sh with the proper node api that we implmented

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
export const readFileSync = (path, options=null) => {
  let encoding = options;  // Assuming options can be directly the encoding string

  const file = std.open(path, 'r');
  if (!file) {
    throw new Error(`Failed to open file: ${path}`);
  }

  try {
    // If the encoding is explicitly set to 'utf8', read the file as a UTF-8 string
    if (encoding === "utf8") {
      return file.readAsString()
    } else {
      // Determine the total file size to allocate a buffer of appropriate size
      file.seek(0, std.SEEK_END); // Move to the end of the file
      let fileSize = Number(file.tello()); // Get the file size
      file.seek(0, std.SEEK_SET); // Reset position to the beginning of the file for reading

      // Initialize a buffer for reading the entire file content
      let buffer = new ArrayBuffer(fileSize);
      let bytesRead = file.read(buffer, 0, fileSize);

      if (bytesRead !== fileSize) {
        throw new Error("Failed to read the entire file");
      }

      return new Uint8Array(buffer); // Returning Uint8Array for consistency
    }
  } finally {
    file.close();
  }
}

// Mimic fs.readdirSync in Node.js
export const readdirSync = (path) => {
  const [files, error] = os.readdir(path);
  if (error !== 0) {
    throw new Error(`Failed to read directory: ${path}`);
  }
  return files;
}



// Helper function to create a Stats object from stat or lstat results
function createStatsObject(statResult) {
  const { dev, ino, mode, nlink, uid, gid, rdev, size, atime, mtime, ctime } = statResult;
  return {
    dev,
    ino,
    mode,
    nlink,
    uid,
    gid,
    rdev,
    size,
    // Assuming blocks and blksize are not directly available, omit or set to undefined
    blocks: undefined,
    blksize: undefined,
    atimeMs: atime,
    mtimeMs: mtime,
    ctimeMs: ctime,
    // birthtime is not provided by QuickJS os.stat, so we'll use ctime as a fallback
    birthtimeMs: ctime,
    atime: new Date(atime),
    mtime: new Date(mtime),
    ctime: new Date(ctime),
    birthtime: new Date(ctime),
    isDirectory: function() { return (this.mode & os.S_IFMT) === os.S_IFDIR; },
    isFile: function() { return (this.mode & os.S_IFMT) === os.S_IFREG; },
    isBlockDevice: function() { return (this.mode & os.S_IFMT) === os.S_IFBLK; },
    isCharacterDevice: function() { return (this.mode & os.S_IFMT) === os.S_IFCHR; },
    isSymbolicLink: function() { return (this.mode & os.S_IFMT) === os.S_IFLNK; },
    isFIFO: function() { return (this.mode & os.S_IFMT) === os.S_IFIFO; },
    isSocket: function() { return (this.mode & os.S_IFMT) === os.S_IFSOCK; },
  };
}

// Function to mimic fs.statSync in Node.js using QuickJS's os.stat
export const statSync = (path) => {
  const [statResult, err] = os.stat(path);
  if (err !== 0) {
    throw new Error(`Failed to stat file: ${path}`);
  }
  return createStatsObject(statResult);
}

// Function to mimic fs.lstatSync in Node.js using QuickJS's os.lstat
export const lstatSync = (path) => {
  const [statResult, err] = os.lstat(path);
  if (err !== 0) {
    throw new Error(`Failed to lstat file: ${path}`);
  }
  return createStatsObject(statResult);
}


export function existsSync(path) {
	try {
		statSync(path)
		return true;
	} catch (e) {
		return false;
	}
}