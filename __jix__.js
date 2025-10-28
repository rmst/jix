

const { watchfs } = jix.experimental.shelltools


export const run = {
	default: "echo hello from jix",
	watch: () => `${watchfs} -r --wait . make install`,
	docs: `docker run --rm -v "$PWD/docs:/srv/jekyll" -p 4000:4000 -it jekyll/jekyll bash -c "bundle install && jekyll serve --host 0.0.0.0"`,
}

export const install = [

]


export default () => {

}