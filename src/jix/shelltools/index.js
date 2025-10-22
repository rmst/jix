import jix from "../base.js"

export const watch = () => jix.importScript(`${import.meta.dirname}/watch`)
export const watchfs = () => jix.importScript(`${import.meta.dirname}/watchfs`)

export default {
	watch,
	watchfs,
} 




