

import { installJsConfig } from "./jsconfig.js"
import process from "node:process"
import { sh } from "../util.js"
import { LOCAL_JIX_PATH, JIX_DIR } from "../../jix/context.js"
import { dedent } from "../../jix/dedent.js"
import { writeFileSync, existsSync, readFileSync } from "node:fs"


function setupVSCodeTasks(wd) {
	const vscodeDir = `${wd}/.vscode`
	const tasksPath = `${vscodeDir}/tasks.json`
	const existed = existsSync(tasksPath)

    const tasksContent = {
		version: "2.0.0",
		tasks: [
			{
				label: 'jix install',
				type: "shell",
				command: 'jix install ${file}',
				group: { kind: "build" }
			},
			{
				label: 'jix install --dry-run',
				type: "shell",
				command: 'jix install --dry-run ${file}',
				group: { kind: "build" }
			},
			{
				label: 'jix run',
				type: "shell",
				command: 'jix run -f ${file}',
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

	const jixDirExisted = existsSync(`${wd}/${JIX_DIR}`)
	sh`mkdir -p '${wd}/${JIX_DIR}/modules'`
	const gitignoreContent = `modules/jix\nmodules/jix-cli\n.DS_Store\n`
	writeFileSync(`${wd}/${JIX_DIR}/.gitignore`, gitignoreContent)
	sh`ln -sfn '${LOCAL_JIX_PATH}/jix/modules/jix' '${wd}/${JIX_DIR}/modules/jix'`
	sh`ln -sfn '${LOCAL_JIX_PATH}/jix/modules/jix-cli' '${wd}/${JIX_DIR}/modules/jix-cli'`
	if (!jixDirExisted) created.push(`${JIX_DIR}/`)

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
	description: 'Initialize a new jix environment.',
	usage: 'jix init [--vscode]',
	help: dedent`
	Initialize jix support in the current working directory.

	This creates ${JIX_DIR}/modules directory, sets up editor hints, and links the jix libs locally.

	Options:
	  --vscode    Create .vscode/tasks.json with jix commands

	Examples:
	  jix init
	  jix init --vscode
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
