#!/bin/bash
# Fix gcloud Python version issue

echo "Fixing gcloud Python configuration..."

# Find Python 3.12 path
PYTHON_PATH=$(which python)

if [ -z "$PYTHON_PATH" ]; then
    echo "❌ Python not found in PATH"
    exit 1
fi

echo "Found Python at: $PYTHON_PATH"

# Set environment variable for gcloud
export CLOUDSDK_PYTHON="$PYTHON_PATH"

# Make it permanent for this session
echo "export CLOUDSDK_PYTHON=\"$PYTHON_PATH\"" >> ~/.bashrc

echo "✅ Fixed! gcloud will now use: $PYTHON_PATH"
echo ""
echo "Run this command to apply the fix:"
echo "source ~/.bashrc"
echo ""
echo "Or run this in your current terminal:"
echo "export CLOUDSDK_PYTHON=\"$PYTHON_PATH\""
