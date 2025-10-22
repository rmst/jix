#!/bin/sh
# Test installation instructions from README

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

printf "%b\n" "${BLUE}Testing jix installation...${NC}"

# Create temporary directory and fake HOME
TESTDIR=$(mktemp -d)
trap "rm -rf $TESTDIR" EXIT

FAKEHOME="$TESTDIR/fake-home"
JIXCOPY="$TESTDIR/jix"
mkdir -p "$FAKEHOME"

printf "%b\n" "${BLUE}Test directory: $TESTDIR${NC}"
printf "%b\n" "${BLUE}Fake HOME: $FAKEHOME${NC}"

# Copy jix repo to temp directory
printf "%b\n" "${BLUE}Copying jix repository...${NC}"
cp -r /wd/jix-pub "$JIXCOPY"
cd "$JIXCOPY"

# Install jix to fake HOME
printf "%b\n" "${BLUE}Running make install...${NC}"
HOME="$FAKEHOME" make install > /dev/null 2>&1

# Check that jix binary exists
if [ ! -f "$FAKEHOME/.jix/bin/jix" ]; then
	printf "%b\n" "${RED}❌ Jix binary not found at $FAKEHOME/.jix/bin/jix${NC}"
	exit 1
fi

# Test applying a minimal manifest
printf "%b\n" "${BLUE}Testing manifest application...${NC}"

# Create a minimal test manifest
TESTMANIFEST="$TESTDIR/test-manifest"
mkdir -p "$TESTMANIFEST"
cat > "$TESTMANIFEST/__jix__.js" << 'EOF'
const script = jix.script`
	#!/bin/sh
	echo "Hello from test"
`

export default jix.alias({
	test_cmd: script
})
EOF

# Apply the manifest
if ! HOME="$FAKEHOME" USER="testuser" "$FAKEHOME/.jix/bin/jix" apply "$TESTMANIFEST" > /dev/null 2>&1; then
	printf "%b\n" "${RED}❌ Failed to apply test manifest${NC}"
	exit 1
fi

# Verify db files were created
if [ ! -f "$FAKEHOME/.jix/active.json" ]; then
	printf "%b\n" "${RED}❌ active.json not created${NC}"
	exit 1
fi

if [ ! -f "$FAKEHOME/.jix/existing.json" ]; then
	printf "%b\n" "${RED}❌ existing.json not created${NC}"
	exit 1
fi

if [ ! -d "$FAKEHOME/.jix/store" ]; then
	printf "%b\n" "${RED}❌ store directory not created${NC}"
	exit 1
fi

# Verify effect files exist in store
if [ -z "$(ls -A "$FAKEHOME/.jix/store" 2>/dev/null)" ]; then
	printf "%b\n" "${RED}❌ No effect files in store${NC}"
	exit 1
fi

# Verify command was installed
if [ ! -f "$FAKEHOME/.jix/bin/test_cmd" ]; then
	printf "%b\n" "${RED}❌ test_cmd not created in bin${NC}"
	exit 1
fi

# Verify command works
if ! HOME="$FAKEHOME" "$FAKEHOME/.jix/bin/test_cmd" | grep -q "Hello from test"; then
	printf "%b\n" "${RED}❌ test_cmd does not produce expected output${NC}"
	exit 1
fi

# Clean up test command
HOME="$FAKEHOME" USER="testuser" "$FAKEHOME/.jix/bin/jix" delete "$TESTMANIFEST" > /dev/null 2>&1

printf "%b\n" "${GREEN}✅ Installation test passed!${NC}"
printf "%b\n" "${GREEN}   - Jix installs successfully${NC}"
printf "%b\n" "${GREEN}   - Manifest application works${NC}"
printf "%b\n" "${GREEN}   - DB files (active.json, existing.json, store/) created${NC}"
printf "%b\n" "${GREEN}   - Effects installed and executable${NC}"

# TODO: Add back full installation test from git clone
