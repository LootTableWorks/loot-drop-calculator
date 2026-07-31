import datetime
import json
import re
import sys
import xml.etree.ElementTree as ET
from html import unescape
from html.parser import HTMLParser

ATOM = "{http://www.w3.org/2005/Atom}"
ORIGIN = "https://loottableworks.github.io/loot-drop-calculator/"
ATTRIBUTION = (
    "utm_source=loot_table_works_feed"
    "&utm_medium=organic_feed"
    "&utm_campaign=ltw_updates_v1"
    "&utm_content=updates_feed"
)

EXPECTED_ENTRIES = [
    {
        "title": "Gullwatch Harbor: preview the complete four-session campaign",
        "id": f"{ORIGIN}gullwatch-harbor/#campaign-book-v1",
        "path": "gullwatch-harbor/",
        "updated": "2026-07-31T03:54:57Z",
        "summary": "Preview a 61-page system-neutral coastal fantasy campaign with four linked sessions, nineteen playable scenes, and free PDF and EPUB samples.",
    },
    {
        "title": "One-Shot Forge: reproducible adventures and shareable settings",
        "id": f"{ORIGIN}one-shot-forge/#v1.1.3",
        "path": "one-shot-forge/",
        "updated": "2026-07-30T14:56:13Z",
        "summary": "Generate a system-neutral one-shot from a reproducible seed, share the exact settings, and choose an optional production-data module only when it fits the result.",
    },
    {
        "title": "Gullwatch Beacon: a complete free one-shot for tonight",
        "id": f"{ORIGIN}gullwatch-beacon/#play-tonight-v1",
        "path": "gullwatch-beacon/",
        "updated": "2026-07-30T13:33:35Z",
        "summary": "Run a system-neutral coastal one-shot with four playable scenes, maps, tokens, handouts, and a compact GM run sheet.",
    },
    {
        "title": "Free RPG Tools: choose a workflow, not a feature list",
        "id": f"{ORIGIN}free-rpg-tools/#outcome-directory-v1",
        "path": "free-rpg-tools/",
        "updated": "2026-07-30T13:00:00Z",
        "summary": "Find twelve no-login tools by the job you need to finish: start, run, record, continue, build, or validate.",
    },
    {
        "title": "Connected Record Proof: audit one six-module relationship trace",
        "id": f"{ORIGIN}connected-record-proof/#v1",
        "path": "connected-record-proof/",
        "updated": "2026-07-29T23:04:22Z",
        "summary": "Inspect one source-locked trace across six bounded World Foundry records and eight exact joins before choosing any standalone module.",
    },
    {
        "title": "Press and Creator Kit: source-checked facts and artwork",
        "id": f"{ORIGIN}press-kit/#v1",
        "path": "press-kit/",
        "updated": "2026-07-29T21:00:00Z",
        "summary": "Use source-checked product facts, original editorial artwork, product limits, and direct links for coverage or independent review.",
    },
    {
        "title": "Gullwatch Aftermath: carry the ending into three linked sessions",
        "id": f"{ORIGIN}gullwatch-aftermath/#preview-v1",
        "path": "gullwatch-aftermath/",
        "updated": "2026-07-28T17:35:32Z",
        "summary": "Preview four ending-specific branches, three linked sessions, and fifteen ready-to-run scenes for continuing Gullwatch Beacon.",
    },
    {
        "title": "Campaign Workspace: save the consequence and prepare the return",
        "id": f"{ORIGIN}campaign-workspace/#v1.3.0",
        "path": "campaign-workspace/",
        "updated": "2026-07-24T18:00:00Z",
        "summary": "Turn a session result into a local save, a return checkpoint, and a focused next-session brief without background analytics.",
    },
]

EXPECTED_DIRECTORY_PAID_ROUTES = [
    "https://loot-table-works.itch.io/original-fantasy-item-data-pack?utm_source=free_rpg_tools&utm_medium=catalog&utm_campaign=standalone_modules&utm_content=item_catalog",
    "https://loot-table-works.itch.io/fantasy-merchant-shop-generator-kit?utm_source=free_rpg_tools&utm_medium=catalog&utm_campaign=standalone_modules&utm_content=merchant_shop",
    "https://loot-table-works.itch.io/fantasy-crafting-alchemy-recipe-kit?utm_source=free_rpg_tools&utm_medium=catalog&utm_campaign=standalone_modules&utm_content=crafting_recipes",
    "https://loot-table-works.itch.io/enemy-loot-table-drop-profile-kit?utm_source=free_rpg_tools&utm_medium=catalog&utm_campaign=standalone_modules&utm_content=enemy_loot",
    "https://loot-table-works.itch.io/fantasy-quest-contract-reward-data-kit?utm_source=free_rpg_tools&utm_medium=catalog&utm_campaign=standalone_modules&utm_content=quest_contracts",
    "https://loot-table-works.itch.io/fantasy-encounter-room-data-kit?utm_source=free_rpg_tools&utm_medium=catalog&utm_campaign=standalone_modules&utm_content=encounter_threats",
]

checks = 0


class DiscoveryParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.atom_links = []
        self.anchors = []
        self.text_chunks = []
        self.script_chunks = []
        self._anchor = None
        self._in_script = False

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "link" and (values.get("rel") or "").lower() == "alternate":
            if (values.get("type") or "").lower() == "application/atom+xml":
                self.atom_links.append(values)
        if tag == "a":
            self._anchor = {"attrs": values, "text": ""}
        if tag == "script":
            self._in_script = True

    def handle_data(self, data):
        self.text_chunks.append(data)
        if self._anchor is not None:
            self._anchor["text"] += data
        if self._in_script:
            self.script_chunks.append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self._anchor is not None:
            self.anchors.append(self._anchor)
            self._anchor = None
        if tag == "script":
            self._in_script = False


def require(condition, message):
    global checks
    checks += 1
    if not condition:
        raise ValueError(message)


def text(node, name):
    children = node.findall(f"{ATOM}{name}")
    require(len(children) == 1, f"Expected exactly one {name}")
    child = children[0]
    require(child.text is not None, f"Missing required {name}")
    require(child.attrib == {}, f"Unreviewed attributes on {name}")
    require(len(child) == 0, f"Unreviewed child content in {name}")
    value = child.text.strip()
    require(value, f"Empty required {name}")
    return value


def parse_timestamp(value):
    require(value.endswith("Z"), f"Timestamp must use UTC Z form: {value}")
    try:
        return datetime.datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise ValueError(f"Invalid timestamp: {value}") from error


def validate_container(node, name):
    require(node.attrib == {}, f"Unreviewed attributes on {name}")
    require(node.text is None or not node.text.strip(), f"Mixed text entered {name}")
    for child in node:
        require(
            child.tail is None or not child.tail.strip(),
            f"Mixed tail text entered {name}",
        )


def validate_prohibited_text(name, source):
    decoded_source = unescape(source)
    require(
        not re.search(r"\ball\s+faze\s+electric\b", decoded_source, re.I),
        f"Prohibited business name entered {name}",
    )
    require(
        not re.search(
            r"\b(?:D\s*&\s*D|DnD|Dungeons?\s+(?:and|&)\s+Dragons?|Pathfinder)\b",
            decoded_source,
            re.I,
        ),
        f"Protected game branding entered {name}",
    )


def validate_page(name, source, expected_href, expected_paid_routes):
    parser = DiscoveryParser()
    parser.feed(source)
    require(len(parser.atom_links) == 1, f"{name} must expose one Atom autodiscovery link")
    atom = parser.atom_links[0]
    require(
        atom
        == {
            "rel": "alternate",
            "type": "application/atom+xml",
            "title": "Loot Table Works Updates",
            "href": expected_href,
        },
        f"{name} autodiscovery contract changed",
    )
    visible = [
        anchor
        for anchor in parser.anchors
        if anchor["text"].strip() == "Updates feed"
    ]
    require(len(visible) == 1, f"{name} must expose one visible feed link")
    require(
        visible[0]["attrs"]
        == {"href": expected_href, "type": "application/atom+xml"},
        f"{name} visible feed contract changed",
    )
    paid_routes = [
        anchor["attrs"].get("href")
        for anchor in parser.anchors
        if (anchor["attrs"].get("href") or "").startswith(
            "https://loot-table-works.itch.io/"
        )
    ]
    require(len(paid_routes) == expected_paid_routes, f"{name} direct paid-route count changed")
    expected_routes = [] if name == "homepage" else EXPECTED_DIRECTORY_PAID_ROUTES
    require(paid_routes == expected_routes, f"{name} direct paid-route destinations changed")
    decoded_source = unescape(source)
    all_paid_routes = re.findall(
        r"https://loot-table-works\.itch\.io/[^\s\"'<>`]+",
        decoded_source,
        re.I,
    )
    require(
        all_paid_routes == expected_routes,
        f"{name} contains an unreviewed paid URL surface",
    )
    require(
        len(re.findall(r"loot-table-works\.itch\.io", decoded_source, re.I))
        == expected_paid_routes,
        f"{name} contains an unreviewed paid host reference",
    )
    for script in parser.script_chunks:
        compact_script = re.sub(r"[\s'\"+`]+", "", unescape(script)).lower()
        require(
            "itch.io" not in compact_script
            and "loot-table-works" not in compact_script,
            f"{name} script contains an unreviewed commerce redirect",
        )
    require(not re.search(r"https://loot-table-works\.itch\.io/[^\"']*bundle", source, re.I), f"{name} exposes a bundle route")
    validate_prohibited_text(name, f"{source}\n{''.join(parser.text_chunks)}")


def validate(payload):
    feed_source = payload["feed"]
    try:
        root = ET.fromstring(feed_source)
    except ET.ParseError as error:
        raise ValueError(f"Malformed XML: {error}") from error

    require(root.tag == f"{ATOM}feed", "Root must be an Atom feed")
    validate_container(root, "feed")
    require(
        [child.tag for child in root]
        == [
            f"{ATOM}title",
            f"{ATOM}subtitle",
            f"{ATOM}id",
            f"{ATOM}link",
            f"{ATOM}link",
            f"{ATOM}updated",
            f"{ATOM}author",
            *([f"{ATOM}entry"] * len(EXPECTED_ENTRIES)),
        ],
        "Feed child structure or order changed",
    )
    require(text(root, "title") == "Loot Table Works Updates", "Feed title changed")
    require(
        text(root, "subtitle")
        == "Free, system-neutral TTRPG tools, playable campaign material, and game-data workflows.",
        "Feed subtitle changed",
    )
    require(text(root, "id") == f"{ORIGIN}feed.xml", "Feed ID changed")
    feed_updated = text(root, "updated")
    parse_timestamp(feed_updated)
    require(feed_updated == "2026-07-31T03:54:57Z", "Feed updated timestamp changed")

    author = root.find(f"{ATOM}author")
    require(author is not None, "Feed author is missing")
    validate_container(author, "author")
    require(
        [child.tag for child in author] == [f"{ATOM}name", f"{ATOM}uri"],
        "Feed author child structure or order changed",
    )
    require(text(author, "name") == "Loot Table Works", "Feed author changed")
    require(text(author, "uri") == ORIGIN, "Feed author URI changed")

    links = root.findall(f"{ATOM}link")
    self_links = [
        link
        for link in links
        if link.attrib
        == {
            "rel": "self",
            "type": "application/atom+xml",
            "href": f"{ORIGIN}feed.xml",
        }
    ]
    alternate_links = [
        link
        for link in links
        if link.attrib == {"rel": "alternate", "type": "text/html", "href": ORIGIN}
    ]
    require(len(links) == 2, "Feed must contain exactly two reviewed links")
    for link in links:
        require(len(link) == 0, "Feed link contains unreviewed child content")
        require(link.text is None or not link.text.strip(), "Feed link contains text")
    require(len(self_links) == 1, "Canonical self link changed")
    require(len(alternate_links) == 1, "Canonical site link changed")

    entries = root.findall(f"{ATOM}entry")
    require(len(entries) == len(EXPECTED_ENTRIES), "Feed entry count changed")
    ids = []
    hrefs = []
    for node, expected in zip(entries, EXPECTED_ENTRIES):
        validate_container(node, "entry")
        require(
            [child.tag for child in node]
            == [
                f"{ATOM}title",
                f"{ATOM}id",
                f"{ATOM}link",
                f"{ATOM}updated",
                f"{ATOM}summary",
            ],
            "Entry child structure or order changed",
        )
        require(text(node, "title") == expected["title"], "Entry title or order changed")
        require(text(node, "id") == expected["id"], "Entry ID or order changed")
        require(text(node, "updated") == expected["updated"], "Entry timestamp changed")
        parse_timestamp(expected["updated"])
        require(text(node, "summary") == expected["summary"], "Entry summary or claim changed")
        entry_links = node.findall(f"{ATOM}link")
        require(len(entry_links) == 1, "Entry must contain one alternate link")
        require(len(entry_links[0]) == 0, "Entry link contains unreviewed child content")
        require(
            entry_links[0].text is None or not entry_links[0].text.strip(),
            "Entry link contains text",
        )
        expected_href = f"{ORIGIN}{expected['path']}?{ATTRIBUTION}"
        require(
            entry_links[0].attrib
            == {"rel": "alternate", "type": "text/html", "href": expected_href},
            "Entry destination or attribution changed",
        )
        ids.append(expected["id"])
        hrefs.append(expected_href)

    require(len(set(ids)) == len(ids), "Entry IDs must be unique")
    require(len(set(hrefs)) == len(hrefs), "Entry destinations must be unique")
    decoded_text = " ".join(root.itertext())
    require("loot-table-works.itch.io" not in feed_source, "Feed contains a direct paid route")
    require(not re.search(r"\bbundle\b", decoded_text, re.I), "Feed exposes a bundle")
    validate_prohibited_text("feed", feed_source)

    validate_page("homepage", payload["homepage"], "feed.xml", 0)
    validate_page("directory", payload["directory"], "../feed.xml", 6)
    return {
        "result": "PASS",
        "checks": checks,
        "entries": len(entries),
        "owned_destinations": len(hrefs),
        "autodiscovery_surfaces": 2,
        "existing_direct_paid_routes_unchanged": 6,
        "bundle_routes": 0,
    }


try:
    result = validate(json.load(sys.stdin))
    print(json.dumps(result))
except (KeyError, TypeError, ValueError) as error:
    print(str(error), file=sys.stderr)
    sys.exit(1)
