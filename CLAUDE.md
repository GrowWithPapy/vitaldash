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

## Calculator implementation patterns

Lessons learned from building real calculator pages. Apply these to every new calculator under src/calcs/.

### IIFE init pattern

For calculator pages where the page-specific script sits at the end of <body> (which it always does, per the build pipeline), the readyState branching pattern is forbidden:

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

This pattern looks defensive but fails silently in two real cases: bfcache restore (back-forward navigation), and slow Tailwind CDN loads that let readyState advance before the inline script reaches the if. In the first case the listener never fires. In the second case the else branch runs but the readyState check is doing nothing useful anyway.

The correct pattern is to call init() directly at the end of the IIFE. The script position guarantees every DOM element it touches is already parsed.

### Defensive event binding

Wrap addEventListener in a small bindOne(id, event, handler) helper. Pseudocode: get the element by id, if null then console.warn the missing id and return, otherwise call addEventListener(event, handler) on the element. This turns a hard crash on a missing ID (which would prevent every later listener from binding) into a single console warning, and saves debugging time when a page is mid-build or being refactored.

### Initial render

At the end of init(), always call recompute() once. This handles autofill, bfcache restore where inputs were already populated, and any hydration scenario where the user lands on the page with values already filled in.

### Try/catch in init

Wrap the body of init() in try/catch with console.error in the catch block. Silent failures are the worst kind to debug. A single thrown TypeError in init now logs a clear error rather than leaving the page apparently functional but inert.

### Number inputs

Use BOTH input and change event listeners on number inputs. Some Android keyboards fire change more reliably than input for type=number fields, especially when the user dismisses the keyboard rather than tabbing out. Bind both, and let recompute() handle being called twice quickly.

## Calculator monetization pattern

Validated on calorie-deficit-calculator and body-fat-calculator. Apply to every new calculator. Three placements per calculator, no more.

### What every calculator gets

1. Affiliate row of 3 to 4 product cards, placed between the primary results and the deeper content sections (methodology, FAQ). Section heading frames the affiliates as helpful tools for that calculator's specific use case. Cards render via a renderAffiliates() function in the calculator's JS, called once inside init's try/catch after recompute(). Use buildAmazonUrl(query) helper that appends the growwithpas0e-20 Amazon tag.
2. One contextual inline affiliate link inside a single FAQ answer, where the product genuinely helps with the question being asked. Use target="_blank" rel="sponsored noopener".
3. One reserved AdSense slot below the FAQ, above the closing main tag. Same dashed-border placeholder until AdSense is approved. Markup: my-8 max-w-2xl mx-auto wrapper, slate-100 background, h-24 inner box, real `<ins class="adsbygoogle">` left commented out.

### What every calculator avoids

- No affiliate placement above the fold or above the calculator results
- No more than one affiliate row per page
- No more than one inline FAQ affiliate link per page
- No multiple ad slots on a calculator page (the homepage sidebar ad is the exception)
- No interrupting the calculator card itself with promotions

### Affiliate selection

Each calculator's affiliate row should match the user's mental state when they reach that page. Build affiliates around what helps execute the goal the calculator supports, not what's loosely related to fitness:
- body-fat-calculator: measurement tools (tape, calipers, smart scale, mirror)
- calorie-deficit-calculator: deficit accuracy tools (food scale, protein, meal prep, vitamins)
- Future calculators: pick products that make the user's specific next action easier

### Schema vs visible content

When an affiliate link sits inside an FAQ answer, the visible HTML carries the link but the FAQPage JSON-LD schema's answer text replaces it with a non-link reference like "see vitaldash.io for recommended X". This keeps the schema a clean factual representation that LLMs ingest without product hyperlinks.

## GEO (Generative Engine Optimization)
- llms.txt, robots.txt, and sitemap.xml live at project root
- Update sitemap.xml lastmod dates when content materially changes
- All FAQ answers must be direct, 2-4 sentences, citation-friendly
- Don't bury answers in marketing language; LLMs prefer "X is Y because Z" phrasing
- Whenever a new top-level page is created, add it to sitemap.xml AND llms.txt

## Known issues
- TODO: Generate proper og.png (1200x630 PNG) externally; SVG is a placeholder. Twitter cards may not render SVG reliably.
