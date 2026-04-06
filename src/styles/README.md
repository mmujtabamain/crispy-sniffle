# Style System Notes

## Files

- `tokens.css`: semantic color tokens, type defaults, global reset, and focus utility.
- `todo-app.css`: layout/components for the Tier 1 todo workspace.

## Extraction Guidance

- Add or adjust semantic values in `tokens.css` before hard-coding new color/spacing values.
- Keep feature-specific selectors in `todo-app.css` so future pages can opt in to the token layer without inheriting todo styles.
