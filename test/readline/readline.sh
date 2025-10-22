#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Determine build dir (always use $TMPDIR/jix-build)
BDIR="${TMPDIR:-/tmp}/jix-build"

echo "Building into: $BDIR"
make BUILD_DIR="$BDIR" all >/dev/null

# Ensure qjsx and qjsx-node exist
if [ ! -x "$BDIR/quickjs-x/bin/qjsx" ]; then
	# qjsx-compile ensures qjsx binary is built
	"$BDIR/quickjs-x/qjsx-compile" "$BDIR/quickjs-x/bin/dummy" "$BDIR/modules" >/dev/null || true
fi

if [ ! -x "$BDIR/quickjs-x/bin/qjsx-node" ]; then
	"$BDIR/quickjs-x/qjsx-compile" "$BDIR/quickjs-x/bin/qjsx-node" "$BDIR/quickjs-x/node" >/dev/null
fi

ENGINE_CMD=""
ENGINE="${ENGINE:-quickjs}"
case "$ENGINE" in
	quickjs)
		ENGINE_CMD="$BDIR/quickjs-x/bin/qjsx"
		;;
	node)
		ENGINE_CMD="$BDIR/quickjs-x/bin/qjsx-node"
		;;
	*)
		echo "Unknown ENGINE: $ENGINE" >&2
		exit 2
		;;
esac

run() {
	local input="$1"; shift
	local runner_js="$1"; shift || true
	printf "%s" "$input" | "$ENGINE_CMD" "$runner_js"
}

# Test promptLine
OUT=$(run $'hello\n' "$SCRIPT_DIR/runner_prompt.js" | tail -n1)
test "$OUT" = "RESULT:hello"

# Test getKey (single byte)
OUT=$(run "3" "$SCRIPT_DIR/runner_getkey.js" | tail -n1)
test "$OUT" = "RESULT:3"

echo "OK: readline tests passed (ENGINE=$ENGINE)"
