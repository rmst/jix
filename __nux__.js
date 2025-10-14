

const { watchfs } = nux.experimental.shelltools

export const run = {
	default: "echo hello from nux",
	watch: `${watchfs} -r --wait . make install`,
}

export const install = [

]