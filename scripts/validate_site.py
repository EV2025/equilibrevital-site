#!/usr/bin/env python3
"""Checks that the static site is safe and internally coherent before deployment."""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import posixpath
import sys

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {".git", ".github", "_site"}
SKIP_FILES = {"FIRESTORE_ADMIN_A_CREER.json", "firebase-config.js", "avis.html", "dispositifs.html", "du-sport-au-monde-professionnel.html", "ecoles-atl.html", "formulaire-ecoles-atl.html", "inscription.html", "mentions-legales.html", "pssr.html", "remboursement-mutuelle.html"}
FORBIDDEN = ("ev2025.github.io/pssr", "https://equilibrevital.be/pssr/")
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"}
VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov"}
errors = []


class ReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in {"src", "href", "poster"} and value:
                self.references.append(value.strip())


def tracked_files():
    for path in ROOT.rglob("*"):
        if path.is_file() and path.name not in SKIP_FILES and not any(part in SKIP_DIRS for part in path.relative_to(ROOT).parts):
            yield path


for path in tracked_files():
    relative = path.relative_to(ROOT).as_posix()
    if path.suffix.lower() in {".html", ".xml", ".yml", ".yaml", ".js", ".json"} or path.name == "robots.txt":
        text = path.read_text(encoding="utf-8", errors="replace")
        for forbidden in FORBIDDEN:
            if forbidden in text:
                errors.append(f"{relative}: ancienne adresse interdite: {forbidden}")

    size = path.stat().st_size
    if path.suffix.lower() in IMAGE_EXTENSIONS and size > 10 * 1024 * 1024:
        errors.append(f"{relative}: image supérieure à 10 Mo")
    if path.suffix.lower() in VIDEO_EXTENSIONS and size > 25 * 1024 * 1024:
        errors.append(f"{relative}: vidéo supérieure à 25 Mo")

for html_path in ROOT.rglob("*.html"):
    if any(part in SKIP_DIRS for part in html_path.relative_to(ROOT).parts):
        continue
    parser = ReferenceParser()
    parser.feed(html_path.read_text(encoding="utf-8", errors="replace"))
    page_dir = html_path.relative_to(ROOT).parent.as_posix()
    for reference in parser.references:
        if (
            not reference
            or reference.startswith(("#", "mailto:", "tel:", "data:", "javascript:", "blob:"))
            or "{{" in reference
            or "{%" in reference
        ):
            continue
        parsed = urlsplit(reference)
        if parsed.scheme or parsed.netloc:
            continue
        clean = unquote(parsed.path)
        if not clean:
            continue
        if clean.startswith("/"):
            target = clean.lstrip("/")
        else:
            target = posixpath.normpath(posixpath.join(page_dir, clean))
        candidate = ROOT / target
        if candidate.is_dir():
            candidate = candidate / "index.html"
        if not candidate.exists():
            errors.append(
                f"{html_path.relative_to(ROOT).as_posix()}: référence locale absente: {reference}"
            )

if errors:
    print("Validation du site échouée:")
    for error in sorted(set(errors)):
        print(f"- {error}")
    sys.exit(1)

print("Validation du site réussie.")
