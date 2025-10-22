import process from 'node:process'


import * as util from './util.js'
util.monkeyPatchObjectToString()

import installCmd from './install'
import runCmd from './run/index.js'
import initCmd from './init/index.js'
import showCmd from './show.js'
import forceRemoveCmd from './forceRemove.js'
import uninstallCmd from './uninstall.js'
import hostInfoCmd from './host-info.js'
import gcCmd from './gc.js'


const main = async () => {
	// Parse argv via node:process
	const argv = process.argv.slice(1)

	const printOverview = () => {
		console.log('Usage:\n')
		console.log('  jix <command> [arguments...]\n')
		console.log('Commands:')
		Object.values(commands).forEach(c => {
			console.log(`  ${c.name.padEnd(13)} ${c.description}`)
		})
		console.log('\nRun `jix <command> --help` for details')
	}

	const commands = {
		install: installCmd,
		uninstall: uninstallCmd,
		'force-remove': forceRemoveCmd,
		gc: gcCmd,
		'host-info': hostInfoCmd,
		show: showCmd,
		run: runCmd,
		init: initCmd,
			help: {
			name: 'help',
			description: 'Show help for a command.',
			usage: 'jix help [command]',
			run(a) {
				const which = a[0]
				if (which && commands[which]) {
					const c = commands[which]
					console.log(`${c.name}\n\n${c.description}\n\nUsage:\n  ${c.usage}`)
					if (c.help) console.log(`\n${c.help}`)
				} else {
					printOverview()
				}
			}
		}
	}

	const cmd = argv[0]
	const args = argv.slice(1)

	if (!cmd || cmd === '--help' || cmd === '-h') {
		printOverview()
		return
	}

	const entry = commands[cmd]
	if (!entry) {
		console.log(`Unknown command: ${cmd}\n`)
		printOverview()
		process.exitCode = 1
		return
	}

	await entry.run(args)
}



main().then(null, e => {
	console.log(`Error: ${e.message}`)
	// Only show stack trace for unexpected errors, not user validation errors
	if (e.name !== 'UserError') {
		console.log(e.stack)
	}
	process.exit(1)
})
