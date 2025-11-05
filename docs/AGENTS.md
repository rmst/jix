These docs contain both hand-written as well as auto/AI-generated docs. Specifically the `cli` and `api` directories are AI generated.


## generate-docs-123
When the user says "generate-docs-123" check the file `./last-updated` in this directory. If you find a commit hash in there you know that this is the last commit that this procedure has been applied to. If you find it empty, then it has never been applied.

Use git to determine which files have changed in the target source directory since the last doc update. Then, read though all the relevant changes/files and create or update the respective docs. **Do not change things that don't have to be changed!**

After you're finished write the latest commit hash into `./last-updated`

In `api` we want to maintain comprehensive docs for every function and property of the `jix` object as definied in `src/jix/index.js`. Make absolutely sure only to include those functions/objects/classes that are actually part of the `jix` object!

In `cli` we want to document every available subcommand and possible args.

The docs you write should be in markdown and read as if they were auto-generated from the code. IMPORTANT: They should only contain information that you can infer from the code with absolute certainty.

The entrypoint should be a `index.md`. In `api`, properties should be split into subsections for classes, namespaces, functions, etc.

Only for classes/namespaces/objects maintain a separate file where their functions/properties are documented.

Always use of Markdown links to link to the file/section whenever you reference something.

Provide links to the source files on Github at the last-updated commit and using the correct line numbers, e.g. `./my/file.js#L53`.

When including line numbers always make sure you always look at the relevant files including the line number (e.g. using `cat -n`). For every code file that changed make sure you re-check all the associated line number in the documentation.