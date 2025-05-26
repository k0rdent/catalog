#!/bin/bash
set -euo pipefail

input_dir=mkdocs
echo "⏳ Running spell check for *.md files in 'mkdocs' folder"
for file in apps/*/data.yaml; do
  echo "$file"
  yq '.summary, .description' "$file" | tr '[:space:][:punct:]' '\n' | hunspell -d en_US -p ./hunspell_dict.txt -l | sort | uniq > spellcheck_detected.txt
  if grep -rnwFf spellcheck_detected.txt $file; then
    echo "=========="
    echo "❌ Some unknown words detected in spell check ($file):"
    cat spellcheck_detected.txt
    echo "Fix them or add to 'hunspell_dict.txt' - spell check dictionary."
    echo "=========="
    exit 1
  fi
done
echo "✅ Spell check OK"
