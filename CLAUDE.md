# VitalDash project rules

## Writing style — avoid AI tells
- Never use em dashes (—). Use commas, colons, periods, or parentheses instead.
- Banned phrases: delve, tapestry, navigate the landscape, in today's world, ever-evolving, leverage, robust, seamless, moreover, furthermore.
- Don't start consecutive sentences with the same connective.
- Mix sentence lengths. Sound like a person wrote it, not a model.
- Active voice. Specific nouns. No filler.

## SEO rules
- Each calculator page targets one specific long-tail query.
- Every page needs FAQ schema (JSON-LD) for AI Overview visibility.
- Internal-link between related calculators.
- Show a "last updated" date on every page.
- Original info beats rephrased common knowledge. Our percentile chips, BMI reality check, and goal projection are the moat.

## Code rules
- 5-file homepage src/ structure stays. Source of truth.
- Calculator pages use the modular structure: src/pages/{slug}-head.html, src/pages/{slug}-main.html, src/calcs/{slug}.js
- Shared code lives in src/shared/. Never duplicate formulas, footer, or cookie banner.
- All calculations are pure functions in src/shared/formulas.js. New formulas go there.
- Secondary pages (privacy, terms, cookies, about, methodology, contact) are still written as standalone HTML files in the project root. They inline the same head, header, footer, and cookie-banner markup. When a shared snippet in src/shared/ changes, propagate it across the secondary pages by hand.
- All calculations stay client-side. No backend calls without explicit approval.
- Comments in code only when logic is non-obvious.
- To rebuild everything, run: bash scripts/build.sh
- To add a new calculator: see scripts/calculator-template.html for the structure, then add the slug to SLUGS in scripts/build.sh.

## Calculator slugs and conventions
- Slug = kebab-case keyword (e.g., "body-fat", not "bodyfat")
- Output filename: {slug}-calculator.html (e.g., body-fat-calculator.html)
- URL: /{slug}-calculator (nginx try_files removes the .html)
- Each calculator gets its own H1 matching the keyword exactly
- Each calculator must have: methodology section with citations + FAQ section + FAQ JSON-LD schema + 3-5 related-calculator links

## Git workflow
- After modifying any src/ file, run `bash scripts/build.sh` before committing.

## Top-level pages
- index.html (homepage, the calculator)
- privacy.html
- terms.html
- cookies.html
- about.html
- methodology.html
- contact.html (form delivery via Web3Forms; access key configured)

## Data sources
- Percentile tables (BMI and weight, by sex and age band) come from CDC NHANES 2015-2018, published as Vital Health Stat 3(46), 2021. URL: https://www.cdc.gov/nchs/data/series/sr_03/sr03-046-508.pdf
- When updating these tables, cite the table number and the survey cycle in a comment next to the data so future edits can verify against the same source.

## GEO (Generative Engine Optimization)
- llms.txt, robots.txt, and sitemap.xml live at project root
- Update sitemap.xml lastmod dates when content materially changes
- All FAQ answers must be direct, 2-4 sentences, citation-friendly
- Don't bury answers in marketing language; LLMs prefer "X is Y because Z" phrasing
- Whenever a new top-level page is created, add it to sitemap.xml AND llms.txt
