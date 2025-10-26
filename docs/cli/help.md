# jix help

Source: [`src/jix-cli/main.js`](../../src/jix-cli/main.js)

Show help for a command.

## Usage

```
jix help [command]
```

## Description

Display help information for a specific command or show an overview of all available commands.

## Arguments

- `[command]` - Optional command name to show help for

## Examples

```bash
jix help
jix help install
jix help run
```

## Behavior

- Without arguments: Shows an overview of all available commands
- With a command name: Shows detailed usage information for that specific command
