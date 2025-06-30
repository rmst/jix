
import base from "./base.js";
import { dedent } from './dedent.js';
import { NUX_DIR } from "./context.js";

const stateDir = (id, owner=null) => base.effect(target => {

	let db = `${target.home}/${NUX_DIR}/db`
	let dbInactive = `${target.home}/${NUX_DIR}/db-inactive`
	let state = `${db}/${id}`
	let stateInactive = `${dbInactive}/${id}`

	let maybeChangeOwner = owner
		? `chown -R ${owner} "${state}"`
		: ""
		
	return base.run({
		install: dedent`
			mkdir -p "${db}"

			# check if target state dir already is a directory
			if [ -d "${state}" ]; then
				exit 0  # we'll just accept that as the correct state dir
			else
				rm -f "${state}"  # no error even if it doesn't exist
				if [ -d "${stateInactive}" ]; then
					mv -f "${stateInactive}" "${state}"  # reactivate old state dir
				else
					mkdir -p "${state}"  # new empty directory
				fi
			fi

			${maybeChangeOwner}
		`,
		uninstall: dedent`
			mkdir -p "${dbInactive}"

			if [ -d "${state}" ]; then
				if [ -d "${stateInactive}" ]; then
					rm -rf "${stateInactive}"  # dir exists, remove it
				fi

				rm -f "${stateInactive}"  # file exists, remove it

				mv -f "${state}" "${stateInactive}"  # move state dir to inactive
			else 
				exit 0  # nothing to be done
			fi
		`,

		path: state,
	})

})




export default {
	stateDir,
}