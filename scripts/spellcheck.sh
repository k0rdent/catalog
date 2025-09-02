#!/bin/bash
set -euo pipefail

input_dir=mkdocs
echo "⏳ Running spell check for *.md files in 'mkdocs' folder"
cat apps/*/hunspell_dict.txt hunspell_dict.txt > hunspell_dict_all.txt
for file in apps/*/data.yaml; do
  echo "$file"
  spell_file="${file/data.yaml/hunspell_dict.txt}"
  yq '.summary, .description' "$file" | tr '[:space:][:punct:]' '\n' | hunspell -d en_US -p ./hunspell_dict_all.txt -l | sort | uniq > spellcheck_detected.txt
  if grep -rnwFf spellcheck_detected.txt $file; then
    echo "=========="
    echo "❌ Some unknown words detected in spell check ($file):"
    cat spellcheck_detected.txt
    echo "Fix them or add to '$spell_file' - spell check dictionary."
    echo "=========="
    exit 1
  fi
done
echo "✅ Spell check OK"
