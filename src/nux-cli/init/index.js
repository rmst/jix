

import { installJsConfig } from "./jsconfig.js"
import process from "node:process"
import { sh } from "../util.js"
import { LOCAL_NUX_PATH } from "../../nux/context.js"
import { dedent } from "../../nux/dedent.js"
import { writeFileSync, existsSync, readFileSync } from "node:fs"


function setupVSCodeTasks(wd) {
	const vscodeDir = `${wd}/.vscode`
	const tasksPath = `${vscodeDir}/tasks.json`
	const existed = existsSync(tasksPath)

	const tasksContent = {
		version: "2.0.0",
		tasks: [
			{
				label: "nux install",
				type: "shell",
				command: "nux install ${file}",
				group: { kind: "build" }
			},
			{
				label: "nux install --dry-run",
				type: "shell",
				command: "nux install --dry-run ${file}",
				group: { kind: "build" }
			},
			{
				label: "nux run",
				type: "shell",
				command: "nux run -f ${file}",
				group: { kind: "build" }
			}
		]
	}

	const newContent = JSON.stringify(tasksContent, null, '\t') + '\n'

	if (existed) {
		const existingContent = readFileSync(tasksPath, 'utf8')
		if (existingContent === newContent) {
			return null
		}
	}

	sh`mkdir -p '${vscodeDir}'`
	writeFileSync(tasksPath, newContent)
	return existed ? 'updated' : 'created'
}

function initCmd(options = {}) {
	let wd = process.cwd()
	const created = []
	const updated = []

	const jsconfigStatus = installJsConfig(wd)  // TODO: this function seems way to complicated
	if (jsconfigStatus === 'created') {
		created.push('jsconfig.json')
	} else if (jsconfigStatus === 'updated') {
		updated.push('jsconfig.json')
	}

	const nuxDirExisted = existsSync(`${wd}/.nux`)
	sh`mkdir -p '${wd}/.nux/modules'`
	const gitignoreContent = `modules/nux\nmodules/nux-cli\n.DS_Store\n`
	writeFileSync(`${wd}/.nux/.gitignore`, gitignoreContent)
	sh`ln -sfn '${LOCAL_NUX_PATH}/nux/modules/nux' '${wd}/.nux/modules/nux'`
	sh`ln -sfn '${LOCAL_NUX_PATH}/nux/modules/nux-cli' '${wd}/.nux/modules/nux-cli'`  // TODO: remove this once nux doesn't depend on nux-cli anymore (search for ../nux-cli/core/hosts.js)
	if (!nuxDirExisted) created.push('.nux/')

	if (options.vscode) {
		const tasksStatus = setupVSCodeTasks(wd)
		if (tasksStatus === 'created') {
			created.push('.vscode/')
		} else if (tasksStatus === 'updated') {
			updated.push('.vscode/tasks.json')
		}
	}

	if (created.length > 0) console.log('Created ' + created.join(' '))
	if (updated.length > 0) console.log('Added to ' + updated.join(' '))
}

export default {
	name: 'init',
	description: 'Initialize a new nux environment.',
	usage: 'nux init [--vscode]',
	help: dedent`
	Initialize nux support in the current working directory.

	This creates .nux/modules directory, sets up editor hints, and links the nux libs locally.

	Options:
	  --vscode    Create .vscode/tasks.json with nux commands

	Examples:
	  nux init
	  nux init --vscode
	`,
	run(a) {
		if (a.length > 0 && (a.includes('--help') || a.includes('-h'))) {
			console.log(`Usage:\n  ${this.usage}\n\n${this.help}`)
			return
		}
		const options = {
			vscode: a.includes('--vscode')
		}
		return initCmd(options)
	}
}
