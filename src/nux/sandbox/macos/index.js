
import nux from "../../base.js"


// TODO: probably instead of `base` system.sb can be used, or at least we can look at system.sb to create a more minimal version of `base`.
/*
export const base = nux.dedent`
	;(allow default) (deny file* file-write* file-read*)
	
	(allow process*)  ; shell immediately crashes if this is missing
	(allow sysctl-read)  ; shell in interactive mode immediately silently crashes if this is missing
	
	; order according to ls -a / | sort
	(
		allow
		; file*  ; WARNING: this allows write!!! needed to e.g. read links apparently
		file-read*
		file-map-executable
		file-ioctl  ; https://en.wikipedia.org/wiki/Ioctl
		(literal "/")
		; (subpath "/.vol")
		; (subpath "/Applications")
		(subpath "/Library")
		(subpath "/System")  ; needed for pip install (to determine MacVersion)
		; (subpath "/Users")
		; (subpath "/Volumes")
		(subpath "/bin")
		; (subpath "/cores")
		; (subpath "/dev")
		(literal "/dev/urandom")
		(literal "/dev/zero")
		(subpath "/etc")  ; symlinks to /private/etc
		; (subpath "/home")  ; symlinks to /System/Volumes/Data/home
		; (subpath "/opt")
		; (subpath "/private")
		(subpath "/private/var")
		(subpath "/private/etc")
		(subpath "/sbin")
		; (subpath "/tmp") ; symlinks to /private/tmp
		(subpath "/usr")
		(subpath "/var")  ; symlinks to /private/var  | needed for network resolution
	)
	(allow file-read* file-write* (literal "/dev/null"))
	(allow file* file-write* (regex "^/dev/tty"))  ; necessary for zsh terminal interaction
`;
*/


export const network = nux.dedent`
	(allow network*)
`;

export const dirReadWrite = path => nux.dedent`
	(allow file* (subpath "${path}"))
`;

export const dirRead = path => nux.dedent`
	(allow file-map-executable file-read* (subpath "${path}"))
`;

export const tempfiles = nux.dedent`
	(allow file* (subpath "/var/folders/pq"))  ; necessary for tmp directories
	(allow file* (subpath "/private/var/folders/pq"))  ; necessary for tmp directories
`;



export const sandboxed = nux.importScript(`${import.meta.dirname}/sandboxed`)
