/**
	Basic service usage.

	Run via:
		jix run -f examples/service.__jix__.js      # creates transient service
		jix install -f examples/service.__jix__.js  # creates persistent service
*/

const helloService = () => jix.service({
	name: "hello-service",
	exec: jix.script`
		#!/bin/sh
		while true; do
			echo "Hello from service at $(date)"
			sleep 5
		done
	`,
})

export const run = {
	default: jix.script`
		# ${helloService} (adds helloService as a dependency)
		echo "Service started. Press Ctrl+C to stop. Logs:"
		tail -f ~/.jix/db/jix.user-services/hello-service/log
	`,
}

export const install = () => {
	helloService()
}
