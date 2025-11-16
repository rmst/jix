# Jix vs. Process Compose

Here, we are comparing between Jix and Process Compose (https://github.com/F1bonacc1/process-compose).

Both examples demonstrate a simple data processing pipeline with two services where one depends on the other, with restart policies and dependency management.

**Note:** This is a made-up example because we couldn't find a suitable example in the Process Compose repo at the time this was created.

### Jix version

Run in background (actually creates persistent services)
```bash
jix install
```

Or run in foreground:
```bash
jix run
```

<br>

File: [`./jix/__jix__.js`](./jix/__jix__.js)
```javascript
// ...

const dataProcessor = () => jix.service({
	name: "data-processor",
	exec: jix.script`#!/bin/sh
		echo "Starting data processor"
		while true; do
			echo "[PROCESSOR] Processing data at $(date)"
			sleep 10
		done
	`,
})

const dataWriter = () => jix.service({
	name: "data-writer",
	exec: jix.script`#!/bin/sh
		echo "Starting writer"
		while true; do
			echo "[WRITER] Writing processed data at $(date)"
			sleep 10
		done
	`,
	dependencies: [dataProcessor],
})

// ...
```


### Process Compose version

In `./process-compose/` to run in background, do
```bash
process-compose up
```

To run in foreground, do
```bash
process-compose run
```

<br>

File: [`./process-compose/process-compose.yml`](./process-compose/process-compose.yml)

```yaml
version: "0.5"

processes:
  data_processor:
    command: |
      echo "Starting data processor"
      while true; do
        echo "[PROCESSOR] Processing data at $(date)"
        sleep 10
      done
    availability:
      restart: "always"
      backoff_seconds: 5

  data_writer:
    command: |
      echo "Starting writer"
      while true; do
        echo "[WRITER] Writing processed data at $(date)"
        sleep 10
      done
    availability:
      restart: "always"
    depends_on:
      data_processor:
        condition: process_started
```


