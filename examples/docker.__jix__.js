/**

	In the main __jix__.js of this repo we use the image

	```js
	let jekyll = () => jix.container.imageFromDockerfile`
		FROM jekyll/jekyll@sha256...
	`
	```

	Here, we're building our own Jekyll image to show how jix.container works.

*/


/**
	We use Debian Slim as our base image
*/
let debianSlim = () => jix.container.imageFromDockerfile`
	# bookworm-slim 2025-09-30
	FROM debian@\
	sha256:7e490910eea2861b9664577a96b54ce68ea3e02ce7f51d89cb0103a6f9c386e0
`

/**
	Here, jix.container.aptInstall just returns a string, e.g.:
	`RUN apt ...`
*/
let jekyll = () => jix.container.imageFromDockerfile`
	FROM ${debianSlim}

	${jix.container.aptInstall("make", "build-essential", "ruby", "ruby-dev")}

	RUN gem install bundler jekyll

	RUN addgroup --system jekyll && adduser --system --group jekyll
	USER jekyll
	WORKDIR /srv/jekyll
`

/**
	Here, jix.container.docker basically just defaults to the string "docker" but we could configure it via context manager to default to, e.g. jix.nix.pkgs.podman.podman instead if we wanted.
*/
let previewDocs = () => jix.script`
	${jix.container.docker} run -it --rm \
		-v "$PWD/docs:/srv/jekyll" \
		-e BUNDLE_PATH=/srv/jekyll/vendor/bundle \
		-p 4000:4000 \
		${jekyll} \
		bash -c "bundle install && bundle exec jekyll serve --host 0.0.0.0"
`

/**
	From the root of this repo run via:
	jix run -f examples/docker.__jix__.js`
*/
export const run = {
	default: previewDocs,
}
