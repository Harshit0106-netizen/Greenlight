"""Step 1. Split a draft into sentences and pull out structure (headings, images + alt text, links).

Every segment keeps exact character offsets into the original draft, so a finding can point at exact text.
"""
import re

from app.pipeline import Segment

_SENTENCE_END = re.compile(r"[.!?]+[\"”’)\]]*(?=\s|$)|\n+")
_HEADING = re.compile(r"^(#{1,6})[ \t]+(.+?)[ \t]*$", re.MULTILINE)
_IMAGE = re.compile(r"!\[(?P<alt>[^\]]*)\]\((?P<url>[^)\s]*)[^)]*\)")
_LINK = re.compile(r"(?<!!)\[(?P<label>[^\]]*)\]\((?P<url>[^)\s]*)[^)]*\)")
HEX_COLOUR = re.compile(r"#[0-9a-fA-F]{6}\b")


def split_sentences(text: str) -> list[Segment]:
    out: list[Segment] = []
    pos = 0

    def emit(a: int, b: int) -> None:
        chunk = text[a:b]
        lead = len(chunk) - len(chunk.lstrip())
        trimmed = chunk.strip()
        if trimmed:
            out.append(Segment("sentence", trimmed, a + lead, a + lead + len(trimmed)))

    for m in _SENTENCE_END.finditer(text):
        is_newline = text[m.start()] == "\n"
        emit(pos, m.start() if is_newline else m.end())
        pos = m.end()
    emit(pos, len(text))
    return out


def extract_structure(text: str) -> list[Segment]:
    out: list[Segment] = []
    for m in _HEADING.finditer(text):
        out.append(Segment("heading", m.group(0).strip(), m.start(), m.end(), {"level": len(m.group(1))}))
    for m in _IMAGE.finditer(text):
        out.append(Segment("image", m.group(0), m.start(), m.end(),
                           {"alt": m.group("alt"), "url": m.group("url"), "alt_start": m.start("alt"), "alt_end": m.end("alt")}))
    for m in _LINK.finditer(text):
        out.append(Segment("link", m.group(0), m.start(), m.end(),
                           {"label": m.group("label"), "url": m.group("url"), "label_start": m.start("label"), "label_end": m.end("label")}))
    return sorted(out, key=lambda s: s.start)


def split(text: str) -> tuple[list[Segment], list[Segment]]:
    """Returns (sentences, structure)."""
    return split_sentences(text), extract_structure(text)
