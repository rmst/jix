



let nixImage = () => jix.container.imageFromDockerfile`
	FROM nixos/nix@\
	sha256:04abdb9c74e0bd20913ca84e4704419af31e49e901cd57253ed8f9762def28fd

	RUN nix-env -iA nixpkgs.gcc
	RUN nix-env -iA nixpkgs.gnumake
	RUN nix-env -iA nixpkgs.gnupatch

`

let dockerVolumes = () => ({
	// NOTE: any of these can be reset by commenting them and then running
	//   jix install dev
	build: jix.container.volume("jix-dev.jido.jix-build"),
	"/nix": jix.container.volume("jix-dev.jido.nix"),
	"/root/.jix": jix.container.volume("jix-dev.jido.jix"),
})


let jido = ({volumes={}, env={}}={}) => {

	volumes = {
		...volumes,
		wd: "$(pwd)",
		jix: `"$(realpath "${import.meta.dirname}/..")"`, // root of this repo
		...dockerVolumes(),
	}

	
	return jix.script`
		${jix.container.run({workdir:"/wd", volumes, env})} ${nixImage} bash -c '
			export PATH=~/.jix/bin:$PATH
			export BUILD_DIR=/build
			make install-dev
			exec bash
		'
	`
}


export default {
	jido,
	install: () => {
		dockerVolumes()
	},
}