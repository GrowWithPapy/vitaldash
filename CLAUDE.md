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
- Homepage is built from src/ snippets. Rebuild index.html with: cat src/01-head.html src/02-form.html src/03-results.html src/04-script-calc.js src/05-script-render.js src/page-footer.html src/cookie-banner.html > index.html
- Secondary pages (privacy, terms, cookies, about, methodology, contact) are written as standalone HTML files in the project root. They inline the same head, header, footer, and cookie-banner markup. Don't refactor to a build step until repetition pain demands it.
- src/page-header.html, src/page-footer.html, src/cookie-banner.html are the canonical snippets. When a snippet changes, propagate it across the secondary pages by hand.
- All calculations stay client-side. No backend calls without explicit approval.
- Comments in code only when logic is non-obvious.

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
