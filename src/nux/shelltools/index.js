

import nux from "../base"

const all = {
	watch: nux.importScript(`${nux.dirname(import.meta.url)}/watch`),
	watchfile: nux.importScript(`${nux.dirname(import.meta.url)}/watchfile`),

}

export default {
	...all,
	aliasAll: nux.alias(all),
} 





