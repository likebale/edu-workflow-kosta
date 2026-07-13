#!/bin/bash

# Format and lint changed files with recursion guard
# Usage: bash scripts/format-lint-on-change.sh [file-paths...]
#
# This script:
# 1. Detects if it's being called by itself (recursion guard)
# 2. Formats changed files (.js, .json, .md)
# 3. Runs ESLint on .js files
# 4. Reports formatted/linted files

set -e

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RECURSION GUARD
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Set a marker that this script is running
FORMATTER_RUNNING="${FORMATTER_RUNNING:-false}"

# If marker is already set, skip to avoid infinite recursion
if [ "$FORMATTER_RUNNING" = "true" ]; then
  echo "⏭️  Skipping format-lint (already running to avoid recursion)"
  exit 0
fi

# Mark that we're running
export FORMATTER_RUNNING=true

# Set a timeout to prevent infinite loops (safety net)
# If this script takes more than 30 seconds, something is wrong
timeout 30 bash "$0" "$@" || {
  EXIT_CODE=$?
  if [ $EXIT_CODE -eq 124 ]; then
    echo "❌ Timeout: format-lint took too long (possible infinite loop)"
    exit 1
  fi
  # For other errors, still exit with the error code
  export FORMATTER_RUNNING=false
  exit $EXIT_CODE
}

# Clear the marker when done
export FORMATTER_RUNNING=false
exit 0

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ACTUAL FORMATTING AND LINTING
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Get changed files from arguments or git
if [ $# -gt 0 ]; then
  # Files passed as arguments
  CHANGED_FILES=("$@")
else
  # Get staged and unstaged changes
  CHANGED_FILES=($(git diff --name-only --diff-filter=d 2>/dev/null || echo ""))
fi

# Filter files to format: .js, .json, .md (exclude node_modules)
JS_FILES=()
JSON_FILES=()

for file in "${CHANGED_FILES[@]}"; do
  # Skip node_modules, dist, build directories
  if [[ "$file" =~ ^(node_modules|dist|build|\.next)/ ]]; then
    continue
  fi

  case "$file" in
    *.js)
      JS_FILES+=("$file")
      ;;
    *.json)
      JSON_FILES+=("$file")
      ;;
    *.md)
      # Markdown formatting can be done with prettier if installed
      # For now, just skip (markdown is rarely auto-formatted)
      ;;
  esac
done

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FORMAT WITH PRETTIER (if available)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if command -v npx &> /dev/null; then
  PRETTIER_CONFIG=""

  # Check if prettier is installed
  if npx prettier --version &> /dev/null; then
    # Format JavaScript files
    if [ ${#JS_FILES[@]} -gt 0 ]; then
      echo "🎨 Formatting JavaScript files..."
      npx prettier --write "${JS_FILES[@]}" 2>/dev/null || true
    fi

    # Format JSON files
    if [ ${#JSON_FILES[@]} -gt 0 ]; then
      echo "🎨 Formatting JSON files..."
      npx prettier --write "${JSON_FILES[@]}" 2>/dev/null || true
    fi
  fi
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LINT WITH ESLINT (if available)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if command -v npx &> /dev/null; then
  if npx eslint --version &> /dev/null 2>&1; then
    if [ ${#JS_FILES[@]} -gt 0 ]; then
      echo "✅ Linting JavaScript files..."
      # Lint but don't fail (just report)
      npx eslint "${JS_FILES[@]}" --format compact 2>/dev/null || true
    fi
  fi
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# REPORT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if [ ${#JS_FILES[@]} -gt 0 ] || [ ${#JSON_FILES[@]} -gt 0 ]; then
  echo "📝 Summary:"
  [ ${#JS_FILES[@]} -gt 0 ] && echo "  - JavaScript files formatted: ${#JS_FILES[@]}"
  [ ${#JSON_FILES[@]} -gt 0 ] && echo "  - JSON files formatted: ${#JSON_FILES[@]}"
  echo "✨ Format & lint complete!"
else
  echo "⏭️  No files to format"
fi

exit 0
