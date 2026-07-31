from __future__ import annotations

import hashlib
import json
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, urljoin, urlparse


ROOT = Path(__file__).resolve().parent
PACKET = ROOT / "gullwatch-harbor-acquisition-v1.json"
SITE_BASE = "https://loottableworks.github.io/loot-drop-calculator/"
DESTINATION = f"{SITE_BASE}gullwatch-harbor/"
ATOM = {"atom": "http://www.w3.org/2005/Atom"}


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.hrefs: list[str] = []
        self.images: list[str] = []

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        values = dict(attrs)
        if tag == "a" and values.get("href"):
            self.hrefs.append(values["href"] or "")
        if tag == "img" and values.get("src"):
            self.images.append(values["src"] or "")


checks = 0


def require(condition: bool, message: str) -> None:
    global checks
    checks += 1
    if not condition:
        raise AssertionError(message)


def committed_bytes(path: Path) -> bytes:
    return path.read_bytes().replace(b"\r\n", b"\n")


def sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def page_url(relative_path: str) -> str:
    if relative_path == "index.html":
        return SITE_BASE
    return urljoin(SITE_BASE, relative_path.removesuffix("index.html"))


packet = json.loads(PACKET.read_text(encoding="utf-8"))
require(packet["status"] == "approved_for_deployment", "Release status drift.")
require(packet["deployment_allowed"] is True, "Deployment gate is closed.")
require(packet["canonical_destination"] == DESTINATION, "Destination drift.")
require(len(packet["owned_routes"]) == 5, "Owned route count drift.")

parsed_pages: dict[str, tuple[str, LinkParser]] = {}
for route in packet["owned_routes"]:
    relative_path = route["path"]
    if relative_path not in parsed_pages:
        text = (ROOT / relative_path).read_text(encoding="utf-8")
        parser = LinkParser()
        parser.feed(text)
        parsed_pages[relative_path] = (text, parser)

    _, parser = parsed_pages[relative_path]
    href = route["href"]
    require(parser.hrefs.count(href) == 1, f"Exact route drift: {route['surface']}.")

    resolved = urljoin(page_url(relative_path), href)
    parsed = urlparse(resolved)
    require(
        f"{parsed.scheme}://{parsed.netloc}{parsed.path}" == DESTINATION,
        f"Canonical destination drift: {route['surface']}.",
    )
    query = parse_qs(parsed.query, keep_blank_values=True)
    require(set(query) == {"utm_source", "utm_medium", "utm_campaign", "utm_content"},
            f"UTM field drift: {route['surface']}.")
    require(all(len(value) == 1 and value[0] for value in query.values()),
            f"UTM value drift: {route['surface']}.")
    require(query["utm_campaign"] == [packet["campaign"]],
            f"Campaign drift: {route['surface']}.")

beacon_parser = parsed_pages["gullwatch-beacon/index.html"][1]
require(
    beacon_parser.images.count(
        "../gullwatch-harbor/assets/gullwatch-harbor-cover-v1.jpg"
    ) == 1,
    "Gullwatch Harbor campaign cover drift.",
)

all_page_text = "\n".join(text.lower() for text, _ in parsed_pages.values())
for claim in ("61 pages", "4 linked sessions", "19 playable scenes", "12-page sample"):
    require(claim in all_page_text, f"Campaign claim missing: {claim}.")

feed = ET.parse(ROOT / packet["feed_route"]["path"]).getroot()
entries = feed.findall("atom:entry", ATOM)
matching = [
    entry for entry in entries
    if entry.findtext("atom:id", default="", namespaces=ATOM)
    == packet["feed_route"]["entry_id"]
]
require(len(matching) == 1, "Feed campaign entry count drift.")
entry = matching[0]
links = [
    element.get("href", "")
    for element in entry.findall("atom:link", ATOM)
    if element.get("rel") == "alternate"
]
require(links == [packet["feed_route"]["href"]], "Feed destination drift.")
require(
    entry.findtext("atom:updated", default="", namespaces=ATOM)
    == packet["feed_route"]["updated"],
    "Feed timestamp drift.",
)
summary = entry.findtext("atom:summary", default="", namespaces=ATOM)
for claim in ("61-page", "four linked sessions", "nineteen playable scenes"):
    require(claim in summary, f"Feed claim missing: {claim}.")

product_manifest = json.loads(
    (ROOT / "gullwatch-harbor" / "MANIFEST.json").read_text(encoding="utf-8")
)
require(
    product_manifest["verified_public_storefronts"] == [],
    "Unverified storefront exposed in product manifest.",
)
require(
    product_manifest["checkout_links_exposed"] == 0,
    "Product checkout boundary drift.",
)
require(
    packet["commerce_boundary"]["verified_public_storefronts"] == [],
    "Acquisition contract contains an unverified storefront.",
)
require(
    packet["commerce_boundary"]["checkout_links_exposed"] == 0,
    "Acquisition contract exposes checkout links.",
)

checkout_fragments = (
    "gumroad.com/l/",
    "ko-fi.com/s/",
    "payhip.com/b/",
    "amazon.com/dp/",
    "play.google.com/store/books/details",
    "books.apple.com/",
    "barnesandnoble.com/w/",
)
for fragment in checkout_fragments:
    require(fragment not in all_page_text, f"Unverified checkout found: {fragment}.")

for manifest_path, expected_paths in (
    ("gullwatch-aftermath/MANIFEST.json", ("index.html", "README.md")),
    ("free-rpg-tools/MANIFEST.json", ("index.html", "README.md")),
):
    manifest_file = ROOT / manifest_path
    manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
    manifest_entries = {entry["path"]: entry for entry in manifest["files"]}
    for relative_path in expected_paths:
        content_path = manifest_file.parent / relative_path
        content = committed_bytes(content_path)
        require(relative_path in manifest_entries,
                f"Manifest entry missing: {manifest_path} -> {relative_path}.")
        require(
            len(content) == manifest_entries[relative_path]["bytes"],
            f"Manifest byte drift: {manifest_path} -> {relative_path}.",
        )
        require(
            sha256(content) == manifest_entries[relative_path]["sha256"],
            f"Manifest hash drift: {manifest_path} -> {relative_path}.",
        )

for entry_contract in packet["files"]:
    path = ROOT / entry_contract["path"]
    require(path.exists(), f"Contract file missing: {entry_contract['path']}.")
    content = committed_bytes(path)
    require(
        len(content) == entry_contract["bytes"],
        f"Byte drift: {entry_contract['path']}.",
    )
    require(
        sha256(content) == entry_contract["sha256"],
        f"Hash drift: {entry_contract['path']}.",
    )

demand = packet["demand_integrity"]
for field in (
    "qualified_external_sessions",
    "attributed_paid_listing_visits",
    "legitimate_external_downloads",
    "verified_paid_sales",
    "verified_gross_revenue_usd",
):
    require(demand[field] == 0, f"Unverified demand recorded: {field}.")
require(
    demand["owner_or_qa_activity_counted_as_demand"] is False,
    "Owner or QA activity is being counted as demand.",
)

print(
    "Validated Gullwatch Harbor acquisition v1: "
    f"{checks} checks, 5 attributed owned routes, 1 feed entry, "
    "0 public checkout URLs, and 0 unverified demand."
)
