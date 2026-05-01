#!/usr/bin/env bash
# Build script for VitalDash.
# Rebuilds the homepage and any standalone calculator pages listed in SLUGS.
# Run from project root: bash scripts/build.sh

set -euo pipefail

cd "$(dirname "$0")/.."

# ============================================================================
# Homepage build
# ============================================================================
cat src/01-head.html \
    src/02-form.html \
    src/03-results.html \
    src/04-script-calc.js \
    src/05-script-render.js \
    src/shared/page-footer.html \
    src/shared/cookie-banner.html \
  > index.html

BUILT_PAGES=("index.html")

# ============================================================================
# Calculator pages
# Add a slug here once src/pages/{slug}-head.html, src/pages/{slug}-main.html,
# and src/calcs/{slug}.js all exist. Output filename: {slug}-calculator.html
# ============================================================================
SLUGS=("body-fat" "calorie-deficit")
# Add slugs as their pages and JS files land in src/pages/ and src/calcs/.

for slug in "${SLUGS[@]}"; do
  head_file="src/pages/${slug}-head.html"
  main_file="src/pages/${slug}-main.html"
  calc_file="src/calcs/${slug}.js"
  out_file="${slug}-calculator.html"

  for f in "$head_file" "$main_file" "$calc_file"; do
    if [[ ! -f "$f" ]]; then
      echo "ERROR: missing $f for slug '$slug'" >&2
      exit 1
    fi
  done

  cat "$head_file" \
      src/shared/calc-page-head.html \
      src/shared/page-header.html \
      "$main_file" \
      src/shared/calc-page-footer.html \
      src/shared/formulas.js \
      "$calc_file" \
      src/shared/cookie-banner.html \
    > "$out_file"

  BUILT_PAGES+=("$out_file")
done

echo "Done. Rebuilt: ${BUILT_PAGES[*]}"
