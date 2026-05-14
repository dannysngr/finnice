/* lib/tg-prices.ts
 *
 * Price overrides from partner Telegram channel @mistore095.
 * Map: product.id  →  price (in rubles, already including +1000₽ markup).
 *
 * Per-product rule: if the channel lists the same model in multiple colors
 * with different prices, we take the MAX (we don't track color tiers on the
 * site).  This file is updated manually as new TG-channel batches arrive;
 * later an auto-parser will rewrite it.
 *
 * Display: lib/data.ts applies these overrides on top of base PRODUCTS at
 * module init; UI shows everything with «≈» prefix via fmtRubApprox().
 */
export const TG_PRICES: Record<string, number> = {
  // ── Apple Watch ─────────────────────────────────────────────
  "casy-apple-watch-se-3-44-mm-aluminij-cveta-temnaa-noc-remesok-sport-band-temnaa-noc-2025":     29_500,  // SE 3 44mm   (max 28500 + 1000)
  "casy-apple-watch-series-11-42-mm-aluminij-cveta-rozovoe-zoloto-remesok-sport-band-cveta-svetlye-rumana": 35_500,  // S11 42mm (34500 + 1000)
  "casy-apple-watch-series-11-46-mm-aluminij-serebristogo-cveta-remesok-sport-band-cveta-fioletovyj-tuman": 39_500,  // S11 46mm (38500 + 1000)
  "apple-watch-ultra-2-49mm-korpus-iz-titana-remesok-ocean-sinego-cveta":                          69_500,  // Ultra 2 49mm (68500 + 1000)
  "casy-apple-watch-ultra-3-49-mm-titan-svetlogo-cveta-remesok-trail-cveta-sinijarko-sinij-2025":  70_500,  // Ultra 3 49mm (69500 + 1000)
};
