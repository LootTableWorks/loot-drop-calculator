(function initCheckoutPage(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
    return;
  }

  root.LTWCheckoutPage = api;
  api.start(
    root.document,
    root.location,
    root.LTWStorefrontRegistry,
    root.setTimeout,
    root.LTWPrivacyMetrics
  );
})(typeof window !== "undefined" ? window : globalThis, function createCheckoutPage() {
  "use strict";

  const ATTRIBUTION_KEYS = Object.freeze([
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content"
  ]);

  function priceLabel(value) {
    const price = Number(value);
    return `$${price.toFixed(Number.isInteger(price) ? 0 : 2)}`;
  }

  function readRequest(locationRef) {
    const requestUrl = new URL(locationRef.href);
    const attribution = {};
    for (const key of ATTRIBUTION_KEYS) {
      const value = requestUrl.searchParams.get(key);
      if (value) attribution[key] = value;
    }
    return {
      offerId: requestUrl.searchParams.get("offer") || "",
      attribution
    };
  }

  function resolveRequest(locationRef, registry) {
    if (!registry) return { state: "blocked", reason: "Storefront registry unavailable." };

    try {
      registry.validateRegistry(registry.offers);
    } catch {
      return { state: "blocked", reason: "Storefront verification failed." };
    }

    const request = readRequest(locationRef);
    const offer = registry.offers[request.offerId];
    if (!offer) return { state: "blocked", reason: "Unknown product request." };

    const stores = registry.resolvePublicStores(
      request.offerId,
      undefined,
      undefined,
      request.attribution
    );
    if (stores.length === 0) {
      return {
        state: "unavailable",
        offerId: request.offerId,
        offer,
        stores,
        reason: "No verified public storefront is available for this product."
      };
    }

    return {
      state: stores.length === 1 ? "single" : "multiple",
      offerId: request.offerId,
      offer,
      stores
    };
  }

  function createStoreLink(documentRef, offerId, offer, store) {
    const link = documentRef.createElement("a");
    link.className = "store-option";
    link.href = store.url;
    link.rel = "noopener";
    link.dataset.storeId = store.id;
    link.dataset.offerId = offerId;
    link.setAttribute(
      "aria-label",
      `Continue to ${store.label} for ${offer.label}, ${priceLabel(store.priceUsd)}`
    );

    const copy = documentRef.createElement("span");
    const name = documentRef.createElement("strong");
    name.textContent = store.label;
    const detail = documentRef.createElement("small");
    detail.textContent = `Verified product page | ${priceLabel(store.priceUsd)}`;
    copy.append(name, detail);

    const arrow = documentRef.createElement("b");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "\u2197";
    link.append(copy, arrow);
    return link;
  }

  function render(documentRef, resolution) {
    const title = documentRef.querySelector("#checkout-title");
    const message = documentRef.querySelector("#checkout-message");
    const options = documentRef.querySelector("#store-options");
    const status = documentRef.querySelector("#checkout-status");

    options.replaceChildren();
    if (resolution.state === "blocked" || resolution.state === "unavailable") {
      title.textContent =
        resolution.state === "unavailable" && resolution.offer
          ? `${resolution.offer.label} is not available`
          : "Checkout request blocked";
      message.textContent = resolution.reason;
      status.textContent = "No destination was opened.";
      status.dataset.state = "blocked";
      return;
    }

    title.textContent = resolution.offer.label;
    message.textContent =
      resolution.state === "single"
        ? "One verified storefront is available. Opening its exact public product page."
        : "Choose a verified storefront. Prices shown are the current channel prices.";
    for (const store of resolution.stores) {
      options.append(
        createStoreLink(documentRef, resolution.offerId, resolution.offer, store)
      );
    }
    status.textContent = `${resolution.stores.length} verified storefront${
      resolution.stores.length === 1 ? "" : "s"
    } | attribution preserved`;
    status.dataset.state = "verified";
  }

  function completeRedirect(measurement, locationRef, destination, schedule) {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      locationRef.replace(destination);
    };
    const timeout = typeof schedule === "function" ? schedule : setTimeout;
    timeout(finish, 600);
    if (measurement && typeof measurement.then === "function") {
      measurement.then(finish, finish);
    } else {
      finish();
    }
  }

  function start(documentRef, locationRef, registry, schedule, metrics) {
    if (!documentRef || !locationRef) return { state: "blocked", reason: "Page unavailable." };
    const resolution = resolveRequest(locationRef, registry);
    render(documentRef, resolution);

    if (resolution.state === "single" && typeof locationRef.replace === "function") {
      const redirect = typeof schedule === "function" ? schedule : (callback) => callback();
      redirect(() => {
        const store = resolution.stores[0];
        const measurement = metrics && typeof metrics.recordCheckoutRedirect === "function"
          ? metrics.recordCheckoutRedirect(store.id, resolution.offerId, registry)
          : null;
        completeRedirect(measurement, locationRef, store.url, schedule);
      }, 180);
    }
    return resolution;
  }

  return Object.freeze({
    ATTRIBUTION_KEYS,
    priceLabel,
    readRequest,
    resolveRequest,
    createStoreLink,
    render,
    completeRedirect,
    start
  });
});
