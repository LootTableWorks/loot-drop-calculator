# Fantasy Shop Inventory Generator

Public v1 release of a free, deterministic shop inventory generator that demonstrates the validated Merchant & Shop Kit data model.

## Product Boundary

- Uses only the 15 merchants, 150 stock records, and 34 unique items from the public free demo.
- Generates 5-12 item inventories with stable IDs, prices, quantities, market conditions, JSON inspection, shareable configuration links, and CSV export.
- Links only to the public `$3` Merchant & Shop Kit with source attribution.
- Includes no tracking script, account requirement, external runtime, private bundle link, or paid-only merchant record.

## Build

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build.ps1
```

The build stages the public release at `../dist/github-pages-root/shop-inventory-generator/` and creates `../dist/shop-inventory-generator-static-site-v1.zip`. Public deployment was approved after review.
