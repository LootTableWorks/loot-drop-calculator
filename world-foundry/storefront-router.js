(function initStorefrontRouter(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
    return;
  }

  root.LTWStorefrontRouter = api;
  api.enhance(root.document, root.LTWStorefrontRegistry);
})(typeof window !== "undefined" ? window : globalThis, function createStorefrontRouter() {
  "use strict";

  function priceLabel(priceUsd) {
    const price = Number(priceUsd);
    return `$${price.toFixed(Number.isInteger(price) ? 0 : 2)}`;
  }

  function setSingleStoreLink(link, offer, store) {
    link.hidden = false;
    link.removeAttribute("aria-hidden");
    link.removeAttribute("aria-disabled");
    link.href = store.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.dataset.storefrontState = "single-public";
    link.dataset.storeId = store.id;
    link.setAttribute(
      "aria-label",
      `Buy ${offer.label} on ${store.label} for ${priceLabel(store.priceUsd)}`
    );

    link.replaceChildren();
    const price = link.ownerDocument.createElement("span");
    price.textContent = priceLabel(store.priceUsd);
    const label = link.ownerDocument.createTextNode(` Buy on ${store.label} `);
    const arrow = link.ownerDocument.createElement("b");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "\u2197";
    link.append(price, label, arrow);
  }

  function createStorePicker(documentRef, offerId, offer, stores) {
    const picker = documentRef.createElement("details");
    picker.className = "storefront-picker";
    picker.dataset.offerId = offerId;
    picker.dataset.storefrontState = "multiple-public";

    const summary = documentRef.createElement("summary");
    summary.setAttribute(
      "aria-label",
      `Choose a verified store for ${offer.label}, ${priceLabel(offer.priceUsd)}`
    );
    const price = documentRef.createElement("span");
    price.textContent = priceLabel(offer.priceUsd);
    const label = documentRef.createElement("strong");
    label.textContent = "Choose store";
    const count = documentRef.createElement("small");
    count.textContent = `${stores.length} verified`;
    summary.append(price, label, count);

    const menu = documentRef.createElement("div");
    menu.className = "storefront-menu";
    menu.setAttribute("aria-label", `${offer.label} storefronts`);

    for (const store of stores) {
      const link = documentRef.createElement("a");
      link.href = store.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.dataset.linkKind = "paid-module";
      link.dataset.offerId = offerId;
      link.dataset.storeId = store.id;
      link.setAttribute(
        "aria-label",
        `Buy ${offer.label} on ${store.label} for ${priceLabel(store.priceUsd)}`
      );

      const storeName = documentRef.createElement("strong");
      storeName.textContent = store.label;
      const storePrice = documentRef.createElement("span");
      storePrice.textContent = priceLabel(store.priceUsd);
      link.append(storeName, storePrice);
      menu.append(link);
    }

    picker.append(summary, menu);
    return picker;
  }

  function disableUnavailableLink(link, offer) {
    link.removeAttribute("href");
    link.removeAttribute("target");
    link.removeAttribute("rel");
    link.dataset.storefrontState = "unavailable";
    link.hidden = true;
    link.setAttribute("aria-hidden", "true");
    link.setAttribute("aria-disabled", "true");
    link.setAttribute("aria-label", `${offer.label} is not currently available`);

    link.replaceChildren();
    const label = link.ownerDocument.createElement("strong");
    label.textContent = "Not available";
    link.append(label);
  }

  function enhance(documentRef, registry) {
    if (!documentRef || !registry) return { enhanced: 0, fallback: 0 };

    try {
      registry.validateRegistry(registry.offers);
    } catch {
      for (const link of documentRef.querySelectorAll(".module-action[data-offer-id]")) {
        link.dataset.storefrontState = "static-fallback";
      }
      return {
        enhanced: 0,
        fallback: documentRef.querySelectorAll(".module-action[data-offer-id]").length
      };
    }

    let enhanced = 0;
    let fallback = 0;
    for (const link of documentRef.querySelectorAll(".module-action[data-offer-id]")) {
      const offerId = link.dataset.offerId;
      const offer = registry.offers[offerId];
      const stores = registry.resolvePublicStores(offerId);
      if (!offer) {
        link.dataset.storefrontState = "static-fallback";
        fallback += 1;
        continue;
      }
      if (stores.length === 0) {
        disableUnavailableLink(link, offer);
        enhanced += 1;
        continue;
      }

      if (stores.length === 1) {
        setSingleStoreLink(link, offer, stores[0]);
      } else {
        link.replaceWith(createStorePicker(documentRef, offerId, offer, stores));
      }
      enhanced += 1;
    }

    return { enhanced, fallback };
  }

  return Object.freeze({
    priceLabel,
    setSingleStoreLink,
    createStorePicker,
    disableUnavailableLink,
    enhance
  });
});
