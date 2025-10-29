

const { watchfs } = jix.experimental.shelltools
const { imageFromDockerfile, docker, aptInstall } = jix.container


const docs = () => {
	let debianSlim = () => imageFromDockerfile`
		# bookworm-slim 2025-09-30
		FROM debian@\
		sha256:7e490910eea2861b9664577a96b54ce68ea3e02ce7f51d89cb0103a6f9c386e0
	`

	let jekyll = () => imageFromDockerfile`
		FROM ${debianSlim}

		# aptInstall just returns a "RUN apt ..." string for us
		${aptInstall("make", "build-essential", "ruby", "ruby-dev")}

		RUN gem install bundler jekyll

		RUN addgroup --system jekyll && adduser --system --group jekyll
		USER jekyll
		WORKDIR /srv/jekyll
	`

	// in this case we could also just use the pre-built jekyll image but our custom image is a good jix demo and allows for more control
	let jekyll2 = () => imageFromDockerfile`
		FROM jekyll/jekyll@sha256:400b8d1569f118bca8a3a09a25f32803b00a55d1ea241feaf5f904d66ca9c625
	`

	return jix.script`
		${docker} run -it --rm \
			-v "$PWD/docs:/srv/jekyll" \
			-e BUNDLE_PATH=/srv/jekyll/vendor/bundle \
			-p 4000:4000 \
			${jekyll} \
			bash -c "bundle install && bundle exec jekyll serve --host 0.0.0.0"
	`
}


export const run = {

	default: "echo hello from jix",

	"watch-install": () => `${watchfs} -r --wait . make install`,

	docs,
}


export const install = {
	
}