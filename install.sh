#!/bin/sh

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Build directory (passed from Makefile or default to bin)
BUILD_DIR="${BUILD_DIR:-bin}"

echo "📦 Installing to ~/.nux/nux..."
mkdir -p "${HOME}/.nux/nux"
mkdir -p "${HOME}/.nux/bin"

# Copy qjsx binary
cp "$BUILD_DIR/quickjs-x/bin/qjsx" "${HOME}/.nux/nux/qjsx"
chmod +x "${HOME}/.nux/nux/qjsx"

# Copy modules
rm -rf "${HOME}/.nux/nux/modules"
mkdir -p "${HOME}/.nux/nux/modules"
cp -R "$SCRIPT_DIR/quickjs-x/node" "${HOME}/.nux/nux/modules/node"
cp -R "$SCRIPT_DIR/src/nux" "${HOME}/.nux/nux/modules/nux"
cp -R "$SCRIPT_DIR/src/nux-cli" "${HOME}/.nux/nux/modules/nux-cli"

# Create wrapper script
cat > "${HOME}/.nux/nux/nux" << 'EOF'
#!/bin/sh
# Nux CLI wrapper

set -e

# Run qjsx with module path set
QJSXPATH="${HOME}/.nux/nux/modules" exec "${HOME}/.nux/nux/qjsx" --unhandled-rejection "${HOME}/.nux/nux/modules/nux-cli/main.js" "$@"
EOF

chmod +x "${HOME}/.nux/nux/nux"

# Create symlink in bin
rm -f "${HOME}/.nux/bin/nux"
ln -sf "${HOME}/.nux/nux/nux" "${HOME}/.nux/bin/nux"

# Create shell integration file
cat > "${HOME}/.nux/nux/shell_integration" << 'EOF'
export PATH="${HOME}/.nux/bin:${PATH}"
EOF

echo "✅ Installation complete!"
echo ""
echo "Nux installed to: ${HOME}/.nux/nux/nux"
echo "Symlink created: ${HOME}/.nux/bin/nux"
echo ""

# Check if ~/.nux/bin is already in PATH
case ":${PATH}:" in
	*:"${HOME}/.nux/bin":*)
		;;
	*)
		echo "To use nux, add this to your shell rc file:"
		echo ""
		echo "  . \"\${HOME}/.nux/nux/shell_integration\""
		echo ""
		;;
esac
