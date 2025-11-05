

const hellojix = jix.script`
	echo "Hello from Jix!"
`

const hellojix2 = jix.script`
	#!${jix.nix.pkgs.python3.python}
	print("Hello from Jix/Nix/Python!")
`

export const run = {
	hellojix,
	hellojix2,
}


export const install = () => {
	jix.alias({ hellojix })
}