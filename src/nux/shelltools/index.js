

import nux from "../base"

const all = {
	watch: nux.importScript(`${nux.dirname(import.meta.url)}/watch`),
	watchfile: nux.importScript(`${nux.dirname(import.meta.url)}/watchfile`),

	watchdir: nux.importScript(`${nux.dirname(import.meta.url)}/watchdir`),

}

export default {
	...all,
	aliasAll: nux.alias(all),
} 





