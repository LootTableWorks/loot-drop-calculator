from __future__ import annotations

import hashlib
import json
import zipfile
from pathlib import Path

from PIL import Image
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parent
PRODUCT = ROOT / "gullwatch-harbor"
MANIFEST = PRODUCT / "MANIFEST.json"
PDF = PRODUCT / "downloads" / "Gullwatch-Harbor-Sample-v1.pdf"
EPUB = PRODUCT / "downloads" / "Gullwatch-Harbor-Sample-v1.epub"
COVER = PRODUCT / "assets" / "gullwatch-harbor-cover-v1.jpg"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


checks = 0


def require(condition: bool, message: str) -> None:
    global checks
    checks += 1
    if not condition:
        raise AssertionError(message)


manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
reader = PdfReader(PDF)
require(len(reader.pages) == 12, "PDF sample must contain 12 pages.")
require(reader.metadata.title == "Gullwatch Harbor: Preview Edition", "PDF title drift.")
require(reader.metadata.author == "Loot Table Works", "PDF author drift.")
require(reader.is_encrypted is False, "PDF sample must not be encrypted.")
for index, page in enumerate(reader.pages, start=1):
    require(page.mediabox.width == 432, f"PDF page {index} width drift.")
    require(page.mediabox.height == 648, f"PDF page {index} height drift.")
    require("/Annots" not in page, f"PDF page {index} contains annotations.")

with zipfile.ZipFile(EPUB) as archive:
    names = archive.namelist()
    require(names[0] == "mimetype", "EPUB mimetype must be first.")
    require(archive.read("mimetype") == b"application/epub+zip", "EPUB mimetype drift.")
    require("META-INF/container.xml" in names, "EPUB container missing.")
    require(len(names) == 12, "EPUB entry count drift.")

with Image.open(COVER) as image:
    require(image.size == (1600, 2560), "Cover dimensions drift.")
    require(image.mode == "RGB", "Cover color mode drift.")

expected = {entry["path"]: entry for entry in manifest["files"]}
for relative, path in {
    "assets/gullwatch-harbor-cover-v1.jpg": COVER,
    "downloads/Gullwatch-Harbor-Sample-v1.epub": EPUB,
    "downloads/Gullwatch-Harbor-Sample-v1.pdf": PDF,
}.items():
    require(path.stat().st_size == expected[relative]["bytes"], f"{relative} byte drift.")
    require(sha256(path) == expected[relative]["sha256"], f"{relative} hash drift.")

print(f"Validated Gullwatch Harbor funnel binary assets: {checks} checks.")
