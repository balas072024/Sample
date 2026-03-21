#!/bin/bash
# Arivumaiyam AI — Linux/macOS Uninstall Script
# Run: bash scripts/uninstall.sh

echo ""
echo "======================================"
echo "  Arivumaiyam AI — Uninstall"
echo "======================================"
echo ""

read -p "Remove Arivumaiyam AI completely? (y/N): " confirm
if [ "$confirm" != "y" ]; then
    echo "Cancelled."
    exit 0
fi

# Remove config directories
for dir in ~/.arivumaiyam ~/.arivuclaw .arivumaiyam .arivuclaw; do
    if [ -d "$dir" ]; then
        echo "  Removing $dir ..."
        rm -rf "$dir"
    fi
done

# Remove .env
[ -f ".env" ] && rm -f .env && echo "  Removed .env"

# Remove node_modules
[ -d "node_modules" ] && rm -rf node_modules && echo "  Removed node_modules"

# Remove dist
[ -d "dist" ] && rm -rf dist && echo "  Removed dist"

# npm global uninstall
npm uninstall -g arivumaiyam 2>/dev/null

echo ""
echo "  Done! Arivumaiyam AI has been removed."
echo "  To fully remove, delete this folder: $(pwd)"
echo ""
