#!/bin/bash

# PR Size Guard - Build Script
# Creates a production-ready ZIP for Chrome Web Store submission

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Read version from manifest.json
VERSION=$(grep '"version"' "$ROOT_DIR/manifest.json" | sed 's/.*: *"\([^"]*\)".*/\1/')

if [ -z "$VERSION" ]; then
    echo -e "${RED}Error: Could not read version from manifest.json${NC}"
    exit 1
fi

# Output filename
OUTPUT_FILE="pr-size-guard-v${VERSION}.zip"
OUTPUT_PATH="$ROOT_DIR/$OUTPUT_FILE"

echo -e "${YELLOW}Building PR Size Guard v${VERSION}...${NC}"
echo ""

# Remove old ZIP if exists
if [ -f "$OUTPUT_PATH" ]; then
    rm "$OUTPUT_PATH"
    echo -e "Removed old ${OUTPUT_FILE}"
fi

# Change to root directory
cd "$ROOT_DIR"

# Files to include
FILES=(
    "manifest.json"
    "content.js"
    "content.css"
    "background.js"
    "popup/"
    "icons/"
)

# Create ZIP
echo -e "Creating ${OUTPUT_FILE}..."
zip -r "$OUTPUT_FILE" "${FILES[@]}" -x "*.DS_Store" -x "*/.DS_Store"

# Get file size
SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')

echo ""
echo -e "${GREEN}✅ Build successful!${NC}"
echo ""
echo -e "Output: ${OUTPUT_PATH}"
echo -e "Size: ${SIZE}"
echo ""

# List contents
echo -e "${YELLOW}ZIP contents:${NC}"
unzip -l "$OUTPUT_FILE" | tail -n +4 | head -n -2

echo ""
echo -e "${GREEN}Ready for Chrome Web Store submission!${NC}"
