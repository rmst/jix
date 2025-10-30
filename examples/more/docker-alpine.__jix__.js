/**
	Here, we're building our own Jekyll image using Alpine to show how jix.container works.

*/


/**
	We use Alpine as our base image
*/
let alpine = () => jix.container.imageFromDockerfile`
	# alpine 3.20 2025-05-23
	FROM alpine@\
	sha256:beefdbd8a1da6d2915566fde36db9db0b524eb737fc57cd1367effd16dc0d06d
`

/**
	Create image
*/
let jekyll = () => jix.container.imageFromDockerfile`
	FROM ${alpine}

	RUN apk add --no-cache make gcc g++ libc-dev linux-headers ruby ruby-dev git

	RUN gem install bundler jekyll

	RUN addgroup -S jekyll && adduser -S -G jekyll jekyll
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
		/bin/sh -c "bundle install && bundle exec jekyll serve --host 0.0.0.0"
`

/**
	From the root of this repo run via:
	jix run -f examples/more/docker-alpine.__jix__.js`
*/
export const run = {
	default: previewDocs,
}
