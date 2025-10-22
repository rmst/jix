#!/bin/sh

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Build directory (passed from Makefile or default to bin)
BUILD_DIR="${BUILD_DIR:-bin}"

echo "📦 Installing to ~/.jix/jix..."
mkdir -p "${HOME}/.jix/jix"
mkdir -p "${HOME}/.jix/bin"

# Copy qjsx binary (use -c on macOS to preserve code signature)
if [ "$(uname)" = "Darwin" ]; then
	cp -c "$BUILD_DIR/quickjs-x/bin/qjsx" "${HOME}/.jix/jix/qjsx"
else
	cp "$BUILD_DIR/quickjs-x/bin/qjsx" "${HOME}/.jix/jix/qjsx"
fi
chmod +x "${HOME}/.jix/jix/qjsx"

# Copy modules
rm -rf "${HOME}/.jix/jix/modules"
mkdir -p "${HOME}/.jix/jix/modules"
cp -R "$SCRIPT_DIR/quickjs-x/qjsx-node/node" "${HOME}/.jix/jix/modules/node"

# TODO: use copy not symlink in prod
# cp -R "$SCRIPT_DIR/src/jix" "${HOME}/.jix/jix/modules/jix"
# cp -R "$SCRIPT_DIR/src/jix-cli" "${HOME}/.jix/jix/modules/jix-cli"
ln -s "$SCRIPT_DIR/src/jix" "${HOME}/.jix/jix/modules/jix"
ln -s "$SCRIPT_DIR/src/jix-cli" "${HOME}/.jix/jix/modules/jix-cli"


# Create wrapper script for jix
cat > "${HOME}/.jix/jix/jix" << 'EOF'
#!/bin/sh
# Jix CLI wrapper

set -e

# Run qjsx with module path set
QJSXPATH="${HOME}/.jix/jix/modules" exec "${HOME}/.jix/jix/qjsx" --no-unhandled-rejection "${HOME}/.jix/jix/modules/jix-cli/main.js" "$@"
EOF

chmod +x "${HOME}/.jix/jix/jix"

# Create symlink in bin
rm -f "${HOME}/.jix/bin/jix"
ln -sf "${HOME}/.jix/jix/jix" "${HOME}/.jix/bin/jix"

# Create shell integration file
cat > "${HOME}/.jix/jix/shell_integration" << 'EOF'
export PATH="${HOME}/.jix/bin:${PATH}"
EOF

echo "✅ Installation complete!"
echo ""
echo "Jix installed to: ${HOME}/.jix/jix/jix"
echo "Symlink created: ${HOME}/.jix/bin/jix"
echo ""

# Check if ~/.jix/bin is already in PATH
case ":${PATH}:" in
	*:"${HOME}/.jix/bin":*)
		;;
	*)
		echo "To use jix, add this to your shell rc file:"
		echo ""
		echo "  . \"\${HOME}/.jix/jix/shell_integration\""
		echo ""
		;;
esac
