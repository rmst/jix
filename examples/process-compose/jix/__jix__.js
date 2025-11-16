/*
	Here, we're demonstrating how to use Jix to set up services
	similar to process-compose.
*/

const dataProcessor = () => jix.service({
	name: "data-processor",
	exec: jix.script`
		#!/bin/sh
		echo "Starting data processor"
		while true; do
			echo "[PROCESSOR] Processing data at $(date)"
			sleep 10
		done
	`,
})

const dataWriter = () => jix.service({
	name: "data-writer",
	exec: jix.script`
		#!/bin/sh
		echo "Starting writer"
		while true; do
			echo "[WRITER] Writing processed data at $(date)"
			sleep 10
		done
	`,
	dependencies: [dataProcessor],
})


export const install = () => {
	dataWriter()
}


export const run = {
	default: () => {
		dataWriter()

		return jix.script`
			echo "Services started. Press Ctrl+C to stop."
			${jix.experimental.shelltools.watch} -n 5 "jix service"
		`
	}
}
