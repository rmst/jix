import quickjs from './build-quickjs'

export const run = {
	"hello-quickjs": `
		${quickjs.qjs} --eval 'console.log("Hello from Quickjs!")'
	`
}

