#!/bin/sh
# Test installation instructions from README

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

printf "%b\n" "${BLUE}Testing nux installation...${NC}"

# Create temporary directory and fake HOME
TESTDIR=$(mktemp -d)
trap "rm -rf $TESTDIR" EXIT

FAKEHOME="$TESTDIR/fake-home"
NUXCOPY="$TESTDIR/nux"
mkdir -p "$FAKEHOME"

printf "%b\n" "${BLUE}Test directory: $TESTDIR${NC}"
printf "%b\n" "${BLUE}Fake HOME: $FAKEHOME${NC}"

# Copy nux repo to temp directory
printf "%b\n" "${BLUE}Copying nux repository...${NC}"
cp -r /wd/nux-pub "$NUXCOPY"
cd "$NUXCOPY"

# Install nux to fake HOME
printf "%b\n" "${BLUE}Running make install...${NC}"
HOME="$FAKEHOME" make install > /dev/null 2>&1

# Check that nux binary exists
if [ ! -f "$FAKEHOME/.nux/bin/nux" ]; then
	printf "%b\n" "${RED}❌ Nux binary not found at $FAKEHOME/.nux/bin/nux${NC}"
	exit 1
fi

# Test applying a minimal manifest
printf "%b\n" "${BLUE}Testing manifest application...${NC}"

# Create a minimal test manifest
TESTMANIFEST="$TESTDIR/test-manifest"
mkdir -p "$TESTMANIFEST"
cat > "$TESTMANIFEST/__nux__.js" << 'EOF'
const script = nux.script`
	#!/bin/sh
	echo "Hello from test"
`

export default nux.alias({
	test_cmd: script
})
EOF

# Apply the manifest
if ! HOME="$FAKEHOME" USER="testuser" "$FAKEHOME/.nux/bin/nux" apply "$TESTMANIFEST" > /dev/null 2>&1; then
	printf "%b\n" "${RED}❌ Failed to apply test manifest${NC}"
	exit 1
fi

# Verify db files were created
if [ ! -f "$FAKEHOME/.nux/active.json" ]; then
	printf "%b\n" "${RED}❌ active.json not created${NC}"
	exit 1
fi

if [ ! -f "$FAKEHOME/.nux/existing.json" ]; then
	printf "%b\n" "${RED}❌ existing.json not created${NC}"
	exit 1
fi

if [ ! -d "$FAKEHOME/.nux/store" ]; then
	printf "%b\n" "${RED}❌ store directory not created${NC}"
	exit 1
fi

# Verify effect files exist in store
if [ -z "$(ls -A "$FAKEHOME/.nux/store" 2>/dev/null)" ]; then
	printf "%b\n" "${RED}❌ No effect files in store${NC}"
	exit 1
fi

# Verify command was installed
if [ ! -f "$FAKEHOME/.nux/bin/test_cmd" ]; then
	printf "%b\n" "${RED}❌ test_cmd not created in bin${NC}"
	exit 1
fi

# Verify command works
if ! HOME="$FAKEHOME" "$FAKEHOME/.nux/bin/test_cmd" | grep -q "Hello from test"; then
	printf "%b\n" "${RED}❌ test_cmd does not produce expected output${NC}"
	exit 1
fi

# Clean up test command
HOME="$FAKEHOME" USER="testuser" "$FAKEHOME/.nux/bin/nux" delete "$TESTMANIFEST" > /dev/null 2>&1

printf "%b\n" "${GREEN}✅ Installation test passed!${NC}"
printf "%b\n" "${GREEN}   - Nux installs successfully${NC}"
printf "%b\n" "${GREEN}   - Manifest application works${NC}"
printf "%b\n" "${GREEN}   - DB files (active.json, existing.json, store/) created${NC}"
printf "%b\n" "${GREEN}   - Effects installed and executable${NC}"

# TODO: Add back full installation test from git clone
