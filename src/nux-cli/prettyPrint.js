import process from 'node:process'

let colors = {
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
}

if (!process.stdout?.isTTY) {
	Object.keys(colors).forEach(key => colors[key] = "")
}

export const style = {
	key: (text) => `${colors.bold}${colors.cyan}${text}:${colors.reset}`,
	command: (text) => `${colors.yellow}${text}${colors.reset}`,
	path: (text) => `${colors.dim}${text}${colors.reset}`,
	title: (text) => `${colors.bold}${text}${colors.reset}`,
	success: (text) => `${colors.green}${text}${colors.reset}`,
	failure: (text) => `${colors.red}${text}${colors.reset}`,
	info: (text) => `${colors.blue}${text}${colors.reset}`,
	hash: (text) => `${colors.magenta}${text}${colors.reset}`,
	red: (text) => `${colors.red}${text}${colors.reset}`,
	green: (text) => `${colors.green}${text}${colors.reset}`,
};
export function prettyPrintEffect(effect) {
	const indent = (str, amount = 1) => str.split('\n').map(line => `${'  '.repeat(amount)}${line}`).join('\n');

	const printKeyValue = (key, value) => {
		console.log(`${style.key(key)} ${value}`);
	};

	Object.entries(effect).forEach(([key, value]) => {
		if (key === 'install' || key === 'uninstall') {
			if (value) {
				const [command, ...args] = value;
				console.log(style.key(key));
				console.log(indent(style.command(command)));
				args.forEach(arg => console.log(indent(arg, 2)));
			}
		} else if (key === 'dependencies' && Array.isArray(value) && value.length > 0) {
			console.log(style.key('dependencies'));
			value.forEach(dep => console.log(indent(style.hash(dep))));
		} else if (key === 'debug' && typeof value === 'object' && value !== null) {
			console.log(style.key('debug'));
			Object.entries(value).forEach(([dKey, dValue]) => {
				if (dKey === 'stack') {
					console.log(indent(style.key('stack')));
					console.log(indent(dValue, 2));
				} else {
					console.log(indent(`${style.key(dKey)} ${dValue}`));
				}
			});
		} else if (value !== null && value !== undefined) {
			printKeyValue(key, value);
		}
	});
}
