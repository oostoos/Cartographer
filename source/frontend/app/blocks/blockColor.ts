// @manualReviewRequested: 2026-07-07
/** The small categorical palette (see tokens.css's --color-block-* pairs) every block template on
 * the weekly grid is colored from, assigned by simple position in the template list — stable
 * enough within a session, and harmless to reassign if the list order changes.
 */
const PALETTE_SIZE = 6;

export function blockColorVar(index: number): string {
  return `var(--color-block-${(index % PALETTE_SIZE) + 1})`;
}

export function blockColorStrongVar(index: number): string {
  return `var(--color-block-${(index % PALETTE_SIZE) + 1}-strong)`;
}
