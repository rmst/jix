
// Simple test for jix.experimental.container API
// Note: Using exact hashes (like in debianSlim) is recommended for reproducibility.
// When the hash is updated, the image will be rebuilt. This doesn't happen with :latest tags.

let alpine = () => jix.experimental.container.imageFromDockerfile`
	FROM alpine:latest
	RUN echo "Hello from Jix container test"
`

let debianSlim = () => jix.experimental.container.imageFromDockerfile`
	# bookworm-slim 2025-09-30
	FROM debian@sha256:7e490910eea2861b9664577a96b54ce68ea3e02ce7f51d89cb0103a6f9c386e0
`

export const run = {
	'alpine': () => {
		let testScript = jix.script`
			#!/bin/sh
			echo "Running inside container!"
			echo "Args: $@"
			uname -a
		`
		return jix.experimental.container.run({
			exe: testScript,
			args: [`${alpine}`]
		})
	},
	'debian': () => {
		let testScript = jix.script`
			#!/bin/sh
			echo "Running inside container!"
			echo "Args: $@"
			uname -a
		`
		return jix.experimental.container.run({
			exe: testScript,
			args: [`${debianSlim}`]
		})
	}
}
