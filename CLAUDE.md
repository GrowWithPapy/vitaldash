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
- Keep the 5-file src/ structure. Rebuild index.html with: cat src/01-head.html src/02-form.html src/03-results.html src/04-script-calc.js src/05-script-render.js > index.html
- All calculations stay client-side. No backend calls without explicit approval.
- Comments in code only when logic is non-obvious.
