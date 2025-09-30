These docs contain both hand-written as well as auto/AI-generated docs. Specifically the `cli` and `api` directories are AI generated.


## generate-docs-123
When the user says "generate-docs-123" check the file `./last-updated` in this directory. If you find a commit hash in there you know that this is the last commit that this procedure has been applied to. If you find it empty, then it has never been applied.

Use git to determine which files have changed in the target source directory since the last doc update. Then, read though all the relevant changes/files and create or update the respective docs. **Do not change things that don't have to be changed!**

After you're finished write the latest commit hash into `./last-updated`

In `api` we want to maintain comprehensive docs for every function and property of the `nux` object as definied in `src/nux/index.js`.

In `cli` we want to document every available subcommand and possible args.

The docs you write should be in markdown and read as if they were auto-generated from the code. They should only contain information that you can infer from the code with absolute certainty.

Properties should be split into subsections for classes, namespaces, functions, etc.

For classes/namespaces/objects maintain a separate file where their functions/properties are documented.

Make use of links to point to the file/section whenever you reference something

Provide links to the source files as well.

The entry point in each dir should be named Readme.md.
