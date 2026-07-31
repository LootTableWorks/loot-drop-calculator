import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const excluded = new Set([
  path.join(root, "world-foundry", "index.html"),
  path.join(root, "gullwatch-beacon", "START-HERE.html")
]);
const offersByPath = new Map([
  ["/original-fantasy-item-data-pack", "item"],
  ["/fantasy-merchant-shop-generator-kit", "merchant"],
  ["/fantasy-crafting-alchemy-recipe-kit", "recipe"],
  ["/enemy-loot-table-drop-profile-kit", "loot"],
  ["/fantasy-quest-contract-reward-data-kit", "quest"],
  ["/fantasy-encounter-room-data-kit", "encounter"]
]);
const paidIntent = /\$3|paid|full kit|pack|module|inspect|shops/i;

function htmlFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...htmlFiles(absolute));
    if (entry.isFile() && entry.name.endsWith(".html")) files.push(absolute);
  }
  return files;
}

function plainText(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function checkoutHref(file, sourceUrl, offerId) {
  const source = new URL(sourceUrl.replaceAll("&amp;", "&"));
  const relativeBuy = path
    .relative(path.dirname(file), path.join(root, "buy"))
    .replaceAll("\\", "/");
  const params = new URLSearchParams({ offer: offerId });
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
    const value = source.searchParams.get(key);
    if (value) params.set(key, value);
  }
  return `${relativeBuy || "."}/?${params.toString().replaceAll("&", "&amp;")}`;
}

let updatedFiles = 0;
let updatedLinks = 0;

for (const file of htmlFiles(root)) {
  if (excluded.has(file)) continue;
  const original = fs.readFileSync(file, "utf8");
  const input = original
    .replace(/data-offer-id="([^"]+)"href=/g, 'data-offer-id="$1" href=')
    .replace(/<a {2,}/g, "<a ")
    .replace(/"\s{2,}(?=data-)/g, '" ');
  let fileLinks = 0;
  const output = input.replace(
    /<a\b([^>]*?)href="(https:\/\/loot-table-works\.itch\.io\/[^"]+)"([^>]*)>([\s\S]*?)<\/a>/gi,
    (match, before, href, after, body) => {
      const text = plainText(body);
      if (!paidIntent.test(text) || /free demo/i.test(text)) return match;

      const parsed = new URL(href.replaceAll("&amp;", "&"));
      const offerId = offersByPath.get(parsed.pathname.replace(/\/$/, ""));
      if (!offerId) return match;

      let attributes = `${before}${after}`;
      if (!/\bdata-link-kind=/.test(attributes)) {
        attributes += ' data-link-kind="marketplace-checkout"';
      }
      if (!/\bdata-offer-id=/.test(attributes)) {
        attributes += ` data-offer-id="${offerId}"`;
      }
      fileLinks += 1;
      updatedLinks += 1;
      return `<a ${attributes.trim()} href="${checkoutHref(file, href, offerId)}">${body}</a>`;
    }
  );

  if (output !== original) {
    fs.writeFileSync(file, output, "utf8");
    updatedFiles += 1;
  }
}

console.log(`Migrated ${updatedLinks} paid links across ${updatedFiles} HTML files.`);
