
import jix from "../base"
import { TargetedEffect } from "../effect"
import stateDir from "../stateDir"
import systemdBase from "./systemdBase"

const unitDir = () => stateDir("jix.systemd")

/**
	This generates/copies systemd unit files at system startup and enables them

	WARNING: Generated services aren't automatically enabled, and can't be enabled using systemctl enable. This seems to be a well-known problem, see https://github.com/systemd/systemd/issues/28006. Instead, we have to simulate systemctl enable ourselves
*/
const bootstrapGeneratorScript = () => jix.script`
	#!/bin/sh
	export PATH="/run/current-system/sw/bin:$PATH"

	# The output directory is the first argument provided by systemd.
	output_dir="$1"
	source_dir="${unitDir}"

	if [ ! -d "$source_dir" ]; then
		echo "Unit directory '$source_dir' not found. Nothing to do."
		exit 0
	fi

	# cp -r "$source_dir"/. "$output_dir/"

	# Use find to safely iterate over all files in the source directory
	find -L "$source_dir" -type f -print0 | while IFS= read -r -d '' source_file; do
		unit_name=$(basename "$source_file")

		# 1. Copy the unit file to the generator output directory
		cp -f "$source_file" "$output_dir/$unit_name"

		# 2. Check for an [Install] section and parse WantedBy=
		# This uses grep to find the line and sed to extract the value
		wanted_by=$(grep -E '^WantedBy=' "$source_file" | sed 's/WantedBy=//')

		# 3. If WantedBy= exists, create the necessary symlinks
		if [ -n "$wanted_by" ]; then
			# A unit can be wanted by multiple targets (space-separated)
			for target in $wanted_by; do
				echo "Enabling '$unit_name' for target '$target'"
				wants_dir="$output_dir/$target.wants"
				mkdir -p "$wants_dir"
				ln -sf "../$unit_name" "$wants_dir/$unit_name"
			done
		fi
	done

`

let bootstrapGenerator = () => systemdBase.generator({
	name: "bootstrap",
	file: bootstrapGeneratorScript,
})

/**
 * @param {{name: string, file: TargetedEffect, runOnInstall?: boolean, noUninstall?: boolean, dependencies?: Array<TargetedEffect>}} param0
 * @returns {TargetedEffect}
 */
export const enableUnit = ({
	name,
	file,
	runOnInstall=false,
	noUninstall=false,
	dependencies=[],
})=> {
	if(!name)
		throw Error(`name can't be be empty`)

	if(!file?.symlinkTo)
		throw TypeError(`File has to be of type TargetedEffect, got ${file}`)

	file = file.symlinkTo(`${unitDir}/${name}`)

	let install = jix.customEffect({
		install: jix.dedent`
			${bootstrapGeneratorScript} /run/systemd/generator
			systemctl daemon-reload
			${runOnInstall ? `systemctl restart ${name}` : ""}
		`,
		uninstall: noUninstall ? null : `systemctl stop ${name} || true`,
		dependencies: [ ...dependencies, file, bootstrapGenerator ]
	})

	return install
}
