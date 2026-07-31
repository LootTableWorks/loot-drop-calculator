# Verified Checkout Router

The `/buy/` route is the single fail-closed handoff from owned Loot Table Works
pages to public marketplace listings.

- Only exact canonical URLs in `world-foundry/storefront-registry.js` can render.
- Pending and not-applicable storefronts contain no URL and cannot render.
- One verified store redirects directly after validation.
- Multiple verified stores render a buyer choice.
- The inbound `utm_source`, `utm_medium`, `utm_campaign`, and `utm_content`
  values are preserved; `utm_term` records the selected storefront.
- Unknown offers, invalid registries, and zero-store offers open no destination.
