
let repo = jix.git.checkout({
	repo: "https://github.com/bellard/quickjs", 
	commit: "fa628f8c523ecac8ce560c081411e91fcaba2d20",  // release 2025-09-13
})

const bin = jix.build`
	cp -r "${repo}" ./repo
	cd repo
	make
	mkdir -p "$out"
	# Copy useful top-level executables only
	for f in qjs qjsc; do
		if [ -x "./$f" ]; then
			cp "./$f" "$out/"
		fi
	done

	echo "built qjs at $out"
	ls -la $out
`

export default {
	qjs: jix.str`${bin}/qjs`,
	qjsc: jix.str`${bin}/qjsc`,
}
