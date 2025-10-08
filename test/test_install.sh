#!/bin/sh
# Test installation instructions from README

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

printf "%b\n" "${BLUE}Testing installation instructions...${NC}"

# Create temporary directory and fake HOME
TESTDIR=$(mktemp -d)
trap "rm -rf $TESTDIR" EXIT

FAKEHOME="$TESTDIR/fake-home"
mkdir -p "$FAKEHOME"

printf "%b\n" "${BLUE}Test directory: $TESTDIR${NC}"
printf "%b\n" "${BLUE}Fake HOME: $FAKEHOME${NC}"

# Clone repository (following README instructions)
cd "$TESTDIR"
printf "%b\n" "${BLUE}Cloning repository...${NC}"
git clone --recurse-submodules "git@github.com:rmst/nux.git" nux

# Install (following README instructions)
cd nux
printf "%b\n" "${BLUE}Running make install...${NC}"
HOME="$FAKEHOME" make install

# Verify installation
printf "%b\n" "${BLUE}Verifying installation...${NC}"

# Check that nux binary exists
if [ ! -f "$FAKEHOME/.nux/bin/nux" ]; then
	printf "%b\n" "${RED}❌ Nux binary not found at $FAKEHOME/.nux/bin/nux${NC}"
	exit 1
fi

# Check that nux runs
if ! HOME="$FAKEHOME" "$FAKEHOME/.nux/bin/nux" help > /dev/null 2>&1; then
	printf "%b\n" "${RED}❌ Nux binary failed to run${NC}"
	exit 1
fi

# Check that shell integration file exists
if [ ! -f "$FAKEHOME/.nux/nux/shell_integration" ]; then
	printf "%b\n" "${RED}❌ Shell integration file not found${NC}"
	exit 1
fi

# Test that PATH integration works
if ! HOME="$FAKEHOME" sh -c '. "${HOME}/.nux/nux/shell_integration" && which nux' > /dev/null 2>&1; then
	printf "%b\n" "${RED}❌ PATH integration failed${NC}"
	exit 1
fi

printf "%b\n" "${GREEN}✅ Installation test passed!${NC}"
printf "%b\n" "${GREEN}   - Nux binary created successfully${NC}"
printf "%b\n" "${GREEN}   - Nux CLI works correctly${NC}"
printf "%b\n" "${GREEN}   - Shell integration file created${NC}"
printf "%b\n" "${GREEN}   - PATH integration works${NC}"
