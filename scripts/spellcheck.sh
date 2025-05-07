#!/bin/bash
set -euo pipefail

input_dir=mkdocs
echo "⏳ Running spell check for *.md files in 'mkdocs' folder"
find $input_dir -type f -name "*.md" -exec hunspell -d en_US -p ./hunspell_dict.txt -l {} \; | sort | uniq > spellcheck_detected.txt
if grep -rnwFf spellcheck_detected.txt $input_dir --include="*.md"; then
  echo "=========="
  echo "❌ Some unknown words detected in spell check:"
  cat spellcheck_detected.txt
  echo "Fix them or add to 'hunspell_dict.txt' - spell check dictionary."
  echo "=========="
  exit 1
fi
echo "✅ Spell check OK"
