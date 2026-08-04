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
- An activation-gated privacy loader can count fixed paid-intent, storefront-exit,
  and checkout-redirect events without storing raw query strings or purchase data.
- Automatic routing waits no more than 600 ms for the fixed redirect event and
  proceeds even when measurement is unavailable.

A checkout event is funnel evidence only. It never counts as a verified sale;
sales and gross revenue come only from the storefront payment record.
