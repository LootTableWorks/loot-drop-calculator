(function initFrontDoor(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
    return;
  }

  root.lootTableWorksFrontDoor = api;
  api.preserveInboundUtmLinks(root.document, root.location);
})(typeof window !== "undefined" ? window : globalThis, function createFrontDoor() {
  const UTM_KEYS = Object.freeze([
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term"
  ]);

  function mergeInboundUtm(href, search, baseUrl) {
    const destination = new URL(href, baseUrl);
    const inbound = new URLSearchParams(search || "");

    for (const key of UTM_KEYS) {
      if (inbound.has(key)) {
        destination.searchParams.set(key, inbound.get(key));
      }
    }

    const base = new URL(baseUrl);
    if (destination.origin === base.origin) {
      return `${destination.pathname}${destination.search}${destination.hash}`;
    }

    return destination.toString();
  }

  function preserveInboundUtmLinks(documentRef, locationRef) {
    if (!documentRef || !locationRef) return;

    const links = documentRef.querySelectorAll("a[data-preserve-utm]");
    for (const link of links) {
      link.setAttribute(
        "href",
        mergeInboundUtm(link.getAttribute("href"), locationRef.search, locationRef.href)
      );
    }
  }

  return {
    UTM_KEYS,
    mergeInboundUtm,
    preserveInboundUtmLinks
  };
});
