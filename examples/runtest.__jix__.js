export const run = {
	longrunning: jix.script`
		echo "Starting with PID: $$"
		sleep 15
		echo "Finished with PID: $$"
	`
}
