#!/bin/bash
set -euo pipefail

echo "⏳ Running spell check configs validation.."
for file in apps/*/hunspell_dict.txt; do
  if grep -qvE '^[[:alnum:]_]*$' "$file"; then
    echo "Error: Some lines in '$file' have spaces or invalid characters."
    exit 1
  fi

  # 2. Check file ends with a newline (empty line at the end)
  if [ -n "$(tail -c1 "$file")" ]; then
    echo "Error: File '$file' does not end with a newline."
    exit 1
  fi
done
echo "✅ Spell check configs OK"
