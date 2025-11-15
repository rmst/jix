# Jix vs. Docker Compose

Here, we are comparing between Jix and Docker Compose.

While our Jix example here is slightly more verbose, it uses standard components such as `jix.service` that allow for composition with non-docker scripts/services/dependencies.

### Jix version

In `./jix/` run

```bash
jix install
```

To run with file watching (similar to `docker compose watch`):

```bash
jix run dev
```

<br>

File: [`./jix/__jix__.js`](./jix/__jix__.js)
```javascript
// ...

let webService = () => jix.service({
	name: NAME,
	exec: jix.container.run({
		name: NAME,
		args: [
			"--network", network,
			"-p", "8000:5000",
		],
		image: jix.container.imageFromDockerfile`
			FROM python:3.10-alpine
			WORKDIR /code
			ENV FLASK_APP=app.py
			ENV FLASK_RUN_HOST=0.0.0.0
			RUN apk add --no-cache gcc musl-dev linux-headers
			COPY ${jix.importTextfile(import.meta.dirname+"/requirements.txt")} /code/requirements.txt
			RUN pip install -r requirements.txt
			EXPOSE 5000
			COPY ${jix.importTextfile(import.meta.dirname+"/app.py")} /code/app.py
			CMD ["flask", "run", "--debug"]
		`
	}),
	dependencies: [redisService]
})

export const install = () => {
	webService()
}

// ...
```



### Docker Compose version

In `./docker-compose/` run
```bash
docker compose up --build
```

To run with file watching:
```bash
docker compose up --build --watch
```

<br>

File: [`./docker-compose/Dockerfile`](./docker-compose/Dockerfile)

```dockerfile
# syntax=docker/dockerfile:1
FROM python:3.10-alpine
WORKDIR /code
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
RUN apk add --no-cache gcc musl-dev linux-headers
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt
EXPOSE 5000
COPY . .
CMD ["flask", "run", "--debug"]
```


File: [`./docker-compose/compose.yaml`](./docker-compose/compose.yaml)

```yaml
services:
  redis:
    image: "redis:alpine"
  web:
    build: .
    ports:
      - "8000:5000"
    develop:
      watch:
        - action: sync
          path: .
          target: /code
```


For all files see [`./docker-compose`](./docker-compose).

This Docker Compose example was adapted from https://docs.docker.com/compose/gettingstarted/.
