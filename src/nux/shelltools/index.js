

import nux from "../base"

const all = {
	watch: nux.importScript(`${nux.dirname(import.meta.url)}/watch`)
}

export default {
	...all,
	aliasAll: nux.alias(all),
} 





