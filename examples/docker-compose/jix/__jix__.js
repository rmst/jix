/*
	Here, we're demonstrating how to use Jix to set up containerized services
	similar to Docker Compose.

	This provides the equivalent functionality as the docker-compose example
	from https://docs.docker.com/compose/gettingstarted/
*/


// Optional - This allows us to specify our docker-cli implementation
jix.container.with({
	dockerCli: () => {
		return `${jix.target().user.home}/.docker/bin/docker`  // Docker Desktop
		// return jix.nix.podman.podman  // Podman via Nix
		// return jix.nix.docker.docker  // Docker via Nix
	}
})


let NAME = "myapp"

let network = jix.container.network(NAME)


let redisService = () => jix.service({
	name: `${NAME}.redis`,
	exec: jix.container.run({
		args: [
			"--network", network,
			"--hostname", "redis",
		],
		image: jix.container.imageFromDockerfile`
			FROM redis:alpine
		`
	})
})


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


/*
	In this directory run
		jix install

	Then, to get status of both services you can run
		jix service  # (overview)
		jix service status myapp  # (detailed info for the web service)
		jix service logs myapp.redis  # (full logs for the redis service)
*/
export const install = () => {
	webService()
}


export const run = {
	dev: () => {
		webService()

		/*
			This is mimicking docker-compose's watch+sync feature.
			Alternatively you could also just re-run `jix install`.
		*/
		let { watchfs } = jix.experimental.shelltools
		let dir = import.meta.dirname
		return jix.script`
			${watchfs} -r ${dir} ${jix.container.docker} cp ${dir}/. ${NAME}:/code/
		`
	}
}