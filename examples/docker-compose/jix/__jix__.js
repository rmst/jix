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


let redisService = () => {
	let name = `${NAME}.redis`
	let image = jix.container.imageFromDockerfile`
		FROM redis:alpine
	`

	return jix.service({
		name,
		exec: jix.container.run({
			name,
			args: [
				"--network", network,
				"--hostname", "redis",
			],
			image
		})
	})
}



let webService = () => {
	let name = NAME
	let image = jix.container.imageFromDockerfile`
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
	
	return jix.service({
		name,
		exec: jix.container.run({
			name,
			args: [
				"--network", network,
				"-p", "8000:5000",
			],
			image
		}),
		dependencies: [redisService]
	})
	
}


/*
	In this directory run
		jix install
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