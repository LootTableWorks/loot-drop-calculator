import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const siteBase = "https://loottableworks.github.io/loot-drop-calculator/";

const requiredPreviews = [
  {
    page: "campaign-arc-forge/index.html",
    image: "campaign-arc-forge/assets/campaign-arc-forge-board-v1.png",
    width: 1672,
    height: 941,
  },
  {
    page: "world-seed-studio/index.html",
    image: "world-seed-studio/assets/world-seed-studio-preview-v2.png",
    width: 1400,
    height: 900,
  },
  {
    page: "shop-inventory-generator/index.html",
    image: "shop-inventory-generator/assets/loot-table-works-avatar-512.png",
    width: 512,
    height: 512,
  },
  {
    page: "one-shot-forge/index.html",
    image: "one-shot-forge/assets/one-shot-forge-six-region-atlas-v1.jpg",
    width: 1727,
    height: 911,
  },
];

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function meta(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(
    new RegExp(`<meta\\s+(?:property|name)="${escaped}"\\s+content="([^"]+)"`, "i"),
  );
  return match?.[1] ?? null;
}

function imageDimensions(buffer) {
  if (buffer.subarray(1, 4).toString("ascii") === "PNG") {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  check(buffer[0] === 0xff && buffer[1] === 0xd8, "Unsupported preview image format.");
  let offset = 2;
  while (offset < buffer.length) {
    check(buffer[offset] === 0xff, "Malformed JPEG marker.");
    const marker = buffer[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    const length = buffer.readUInt16BE(offset);
    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isStartOfFrame) {
      return {
        width: buffer.readUInt16BE(offset + 5),
        height: buffer.readUInt16BE(offset + 3),
      };
    }
    offset += length;
  }
  throw new Error("JPEG dimensions were not found.");
}

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === ".git") continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await htmlFiles(absolute)));
    if (entry.isFile() && entry.name.endsWith(".html")) files.push(absolute);
  }
  return files;
}

const pages = await htmlFiles(root);
for (const page of pages) {
  const html = await readFile(page, "utf8");
  const image = meta(html, "og:image");
  if (image) {
    check(
      image.startsWith(siteBase),
      `${path.relative(root, page)} has a non-absolute Open Graph image.`,
    );
  }
}

for (const preview of requiredPreviews) {
  const html = await readFile(path.join(root, preview.page), "utf8");
  const expectedUrl = `${siteBase}${preview.image}`;
  check(meta(html, "og:image") === expectedUrl, `${preview.page} image URL drift.`);
  check(meta(html, "og:image:width") === String(preview.width), `${preview.page} width drift.`);
  check(meta(html, "og:image:height") === String(preview.height), `${preview.page} height drift.`);
  check((meta(html, "og:image:alt") ?? "").length >= 50, `${preview.page} alt text is too weak.`);
  if (preview.page === "one-shot-forge/index.html") {
    check(
      meta(html, "robots")?.includes("max-image-preview:large"),
      `${preview.page} does not permit a large search preview.`,
    );
    check(
      meta(html, "twitter:card") === "summary_large_image",
      `${preview.page} Twitter card type drift.`,
    );
    check(
      meta(html, "twitter:title") === meta(html, "og:title"),
      `${preview.page} Twitter title drift.`,
    );
    check(
      (meta(html, "twitter:description") ?? "").length >= 80,
      `${preview.page} Twitter description is too weak.`,
    );
    check(
      meta(html, "twitter:image") === expectedUrl,
      `${preview.page} Twitter image URL drift.`,
    );
    check(
      (meta(html, "twitter:image:alt") ?? "").length >= 50,
      `${preview.page} Twitter image alt text is too weak.`,
    );
  }

  const bytes = await readFile(path.join(root, preview.image));
  const dimensions = imageDimensions(bytes);
  check(
    dimensions.width === preview.width && dimensions.height === preview.height,
    `${preview.image} dimensions do not match its metadata.`,
  );

  const response = await fetch(expectedUrl, { redirect: "follow" });
  check(response.ok, `${expectedUrl} returned HTTP ${response.status}.`);
  check(
    response.headers.get("content-type")?.startsWith("image/"),
    `${expectedUrl} did not return an image content type.`,
  );
}

console.log(
  `Validated ${pages.length} HTML pages for absolute Open Graph images and ${requiredPreviews.length} exact preview contracts.`,
);
