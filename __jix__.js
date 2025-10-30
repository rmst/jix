const { watchfs } = jix.experimental.shelltools


// image will be cleaned up automatically when no longer used
let jekyll = () => jix.container.imageFromDockerfile`
	FROM jekyll/jekyll@\
	sha256:400b8d1569f118bca8a3a09a25f32803b00a55d1ea241feaf5f904d66ca9c625
`

export const run = {

	default: "echo Hello from Jix!",

	installAndWatch: () => `${watchfs} -r --wait . make install`,

	docs: () => jix.script`
		${jix.container.docker} run -it --rm \
			-v "$PWD/docs:/srv/jekyll" \
			-e BUNDLE_PATH=/srv/jekyll/vendor/bundle \
			-p 4000:4000 \
			${jekyll} \
			/bin/sh -c "bundle install && bundle exec jekyll serve --host 0.0.0.0"
	`,
}


export const install = {
	
}
