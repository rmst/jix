import nux from 'nux';
import git from '../../nlib/git/index.js';


let repo = git.cloneShallow({
	repo: "https://github.com/saghul/txiki.js", 
	commit: "832b0d302bac21eeba4f25443baf0bcd3e1a482e",
})


export const tjs = nux.build`

	# brew install cmake autoconf automake libtool texinfo
	cp -r "${repo}" ./repo
	cd repo
	make
	# mkdir -p "$out"
	# cp -r . "$out"
	cp ./build/tjs "$out"

	# echo "build txiki.js at $out"

`;



const scriptA = nux.textfile`
	console.log("A")
	export default []
`

const scriptB = nux.textfile`
	import a from "./a"
	console.log("B")
`

const test1 = nux.build`
	mkdir a
	cp ${scriptA} a/index.js
	cp ${scriptB} scriptB.js
	ls
	"${tjs}" run scriptB.js
`

export default {
	tjs,
	test1,
}