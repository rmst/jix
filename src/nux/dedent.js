


export const dedent = (templateStrings, ...values) => {
	// https://github.com/MartinKolarik/dedent-js/blob/master/src/index.ts
	// TODO: simplify
	// TODO: allow for properly indented multiline values
	// TODO: we have to be careful with raw because it doesn't seem to escape anything, e.g. \` will be \` and not `, I don't remember why we're even doing this...
	templateStrings = templateStrings.raw ?? templateStrings;

	let matches = [];
	let strings = typeof templateStrings === 'string' ? [templateStrings] : templateStrings.slice();


	// TODO: maybe just do this for shell/bash?
	strings = strings.map(x => x.replaceAll(String.raw`\$`, "$"));
	strings = strings.map(x => x.replaceAll(String.raw`\``, "`"));


	// 1. Remove trailing whitespace.
	strings[strings.length - 1] = strings[strings.length - 1].replace(/\r?\n([\t ]*)$/, '');

	// 2. Find all line breaks to determine the highest common indentation level.
	for (let i = 0; i < strings.length; i++) {
		let match;

		if (match = strings[i].match(/\n[\t ]+/g)) {
			matches.push(...match);
		}
	}

	// 3. Remove the common indentation from all strings.
	if (matches.length) {
		let size = Math.min(...matches.map(value => value.length - 1));
		let pattern = new RegExp(`\n[\t ]{${size}}`, 'g');

		for (let i = 0; i < strings.length; i++) {
			strings[i] = strings[i].replace(pattern, '\n');
		}
	}

	// 4. Remove leading whitespace.
	strings[0] = strings[0].replace(/^\r?\n/, '');

	// 5. Perform interpolation.
	let string = strings[0];

	for (let i = 0; i < values.length; i++) {
		string += values[i] + strings[i + 1];
	}

	return string;
};
