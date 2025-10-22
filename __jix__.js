

const { watchfs } = jix.experimental.shelltools

export const run = {
	default: "echo hello from jix",
	watch: () => `${watchfs} -r --wait . make install`,
}

export const install = [

]


export default () => {
	
}