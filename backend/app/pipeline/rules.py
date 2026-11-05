"""Step 2. Deterministic checks: exact, fast, no AI.

Evidence or silence: a rule only produces a finding when it can cite an approved Brand Kit source
(or, for built-in accessibility checks, the rule itself with the exact span).
Claim rules say "unsupported", never "false".
"""
import re

from app.pipeline import Candidate, Segment, SourceView
from app.pipeline.splitter import HEX_COLOUR

I = re.IGNORECASE

CLAIMS = re.compile(
    r"#\s?1\b|\bno\.?\s?1\b|\bnumber[\s-]+one\b|\b(?:the\s+)?best(?:-selling)?\b|\bfastest\b|\bcheapest\b|"
    r"\bunbeatable\b|\bunmatched\b|\bguaranteed?\b|\b100\s?%|\bzero[- ]risk\b|\bclinically\s+proven\b|"
    r"\bcarbon[- ]neutral\b|\bmarket[- ]leader(?:s)?\b|\bmarket[- ]leading\b|\bindustry[- ]leader(?:s)?\b|"
    r"\bindustry[- ]leading\b|\bleading\s+(?:the\s+field|in\s+the\s+field|producer(?:s)?|manufacturer(?:s)?|"
    r"provider(?:s)?|brand(?:s)?|supplier(?:s)?)\b|\bleader\s+in\s+the\s+field\b|\btop[- ]ranked\b",
    I,
)
URGENCY = re.compile(r"!{2,}|\b(?:don['’]t miss out|miss out|act now|hurry|last chance|limited time only)\b", I)
SHOUTING = re.compile(r"\b[A-Z]{5,}\b")
PLAIN_IMAGE_REF = re.compile(r"\b[\w-]+\.(?:png|jpe?g|gif|webp)\b|\[image\]", I)
VAGUE_LINK = {"click here", "here", "read more", "learn more", "link", "this link", "more"}
VAGUE_ALT = {"image", "photo", "picture", "img", "graphic", "logo"}
_NEGATION = re.compile(r"\b(?:not|never|no|without|cannot|can't|isn't|aren't)\b", I)

_USE = re.compile(
    r"^\s*use\s*[:\-–]?\s*[\"“'‘]?(?P<use>[^\"”'’.;—–]+?)[\"”'’]?\s*(?:[.;—–]\s*(?P<note>.*))?$", I | re.S
)
CONTRAST_ON = re.compile(r"(?P<fg>#[0-9a-fA-F]{6})\s+(?:text\s+)?on\s+(?P<bg>#[0-9a-fA-F]{6})", I)
CONTRAST_LABELLED = re.compile(
    r"(?:text|font|foreground)\s*colou?r\s*(?:is|:)?\s*(?P<fg>#[0-9a-fA-F]{6}).{0,60}?"
    r"background\s*(?:colou?r)?\s*(?:is|:)?\s*(?P<bg>#[0-9a-fA-F]{6})",
    I | re.S,
)


# ---- helpers --------------------------------------------------------------------------------------
def _ref(src: SourceView | None) -> dict | None:
    return None if src is None else {"kind": src.kind, "id": src.id, "version": src.version}


def _guideline(kit: list[SourceView], keywords: tuple[str, ...]) -> SourceView | None:
    for s in kit:
        if s.kind != "guideline":
            continue
        blob = f"{s.title} {s.text}".lower()
        if any(k in blob for k in keywords):
            return s
    return None


def parse_term(src: SourceView) -> tuple[str, str | None, str]:
    """Term convention: title = wording to avoid; text = 'Use: <preferred>. <optional note>'."""
    m = _USE.match(src.text)
    if not m:
        return src.title.strip(), None, src.text.strip()
    return src.title.strip(), m.group("use").strip(), (m.group("note") or "").strip()


def palette(kit: list[SourceView]) -> tuple[set[str], SourceView | None]:
    colours: set[str] = set()
    holder: SourceView | None = None
    for s in kit:
        if s.kind != "asset":
            continue
        found = {c.lower() for c in HEX_COLOUR.findall(s.text)}
        if found:
            colours |= found
            holder = holder or s
    return colours, holder


def _luminance(hex_colour: str) -> float:
    h = hex_colour.lstrip("#")
    channels = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


def contrast_ratio(a: str, b: str) -> float:
    la, lb = _luminance(a), _luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def _overlaps(start: int, end: int, segs: list[Segment]) -> bool:
    return any(start < s.end and end > s.start for s in segs)


# ---- checks ---------------------------------------------------------------------------------------
def check_claims(text: str, sentences: list[Segment], kit: list[SourceView]) -> list[Candidate]:
    guideline = _guideline(kit, ("superlative", "unsupported", "substantiat", "claim"))
    if guideline is None:
        return []  # no approved source to cite, so no finding
    facts = [s for s in kit if s.kind == "fact"]
    out: list[Candidate] = []
    for seg in sentences:
        hits = [(m.start() + seg.start, m.end() + seg.start, m.group(0)) for m in CLAIMS.finditer(seg.text)]
        if not hits:
            continue
        merged: list[list] = []
        for a, b, phrase in hits:
            if merged and a - merged[-1][1] <= 25:
                merged[-1][1] = b
                merged[-1][2].append(phrase)
            else:
                merged.append([a, b, [phrase]])
        for a, b, phrases in merged:
            substantiated = any(
                p.lower() in f.text.lower() and not _NEGATION.search(f.text) for f in facts for p in phrases
            )
            if substantiated:
                continue
            quoted = ", ".join(f"“{p.strip()}”" for p in phrases)
            out.append(Candidate(
                type="unsupported_claim", severity="high", start=a, end=b, text=text[a:b], method="rule_based",
                certainty=0.88, source=_ref(guideline), rule_id="claims",
                reason=f"No approved fact substantiates the wording {quoted}. This marks the claim as unsupported, "
                       "not as false: a reviewer should check scope, source, date and comparison set.",
                segment_start=seg.start, segment_end=seg.end,
            ))
    return out


def check_tone(text: str, sentences: list[Segment], kit: list[SourceView]) -> list[Candidate]:
    guideline = _guideline(kit, ("tone", "voice", "pressure", "exclamation"))
    if guideline is None:
        return []
    out: list[Candidate] = []
    for seg in sentences:
        for m in URGENCY.finditer(seg.text):
            a, b = seg.start + m.start(), seg.start + m.end()
            out.append(Candidate(
                type="tone", severity="medium", start=a, end=b, text=text[a:b],
                method="rule_based", certainty=0.86, source=_ref(guideline), rule_id="urgency",
                reason="Urgency language or repeated exclamation marks may conflict with the approved voice and tone guidance.",
                segment_start=seg.start, segment_end=seg.end,
            ))
    known = " ".join(f"{s.title} {s.text}" for s in kit)
    for m in SHOUTING.finditer(text):
        if m.group(0) in known:  # brand names / approved acronyms written in capitals
            continue
        out.append(Candidate(
            type="tone", severity="low", start=m.start(), end=m.end(), text=m.group(0), method="rule_based",
            certainty=0.80, source=_ref(guideline), rule_id="shouting",
            reason="All-caps words read as shouting and may conflict with the approved voice and tone guidance.",
            suggestion={"text": m.group(0).capitalize(), "fact_id": None, "applied": False},
        ))
    return out


def check_terminology(text: str, kit: list[SourceView]) -> list[Candidate]:
    out: list[Candidate] = []
    for src in kit:
        if src.kind != "term":
            continue
        avoid, use, note = parse_term(src)
        if not avoid:
            continue
        pattern = re.compile(rf"(?<!\w){re.escape(avoid)}(?!\w)", I)
        for m in pattern.finditer(text):
            if use and m.group(0) == use:
                continue  # already the approved form
            tail = f" {note}" if note else ""
            out.append(Candidate(
                type="terminology", severity="medium", start=m.start(), end=m.end(), text=m.group(0),
                method="rule_based", certainty=0.97, source=_ref(src), rule_id=src.id,
                reason=f"“{m.group(0)}” does not match the approved terminology.{tail}".strip(),
                suggestion={"text": use, "fact_id": None, "applied": False} if use else None,
            ))
    return out


def check_accessibility(text: str, sentences: list[Segment], structure: list[Segment], kit: list[SourceView]) -> list[Candidate]:
    guideline = _guideline(kit, ("accessib", "alt text", "contrast", "wcag"))
    src = _ref(guideline)
    out: list[Candidate] = []

    def add(start, end, severity, certainty, reason, rule_id):
        out.append(Candidate(type="accessibility", severity=severity, start=start, end=end, text=text[start:end],
                             method="rule_based", certainty=certainty, source=src, reason=reason, rule_id=rule_id))

    for seg in structure:
        if seg.kind == "image":
            alt = seg.extra["alt"].strip()
            if not alt or alt.lower() in VAGUE_ALT or re.search(r"\.(?:png|jpe?g|gif|webp)$", alt, I):
                add(seg.start, seg.end, "medium", 0.94,
                    "This image has missing or non-descriptive alt text. Describe the meaningful content of the image.", "alt_text")
        elif seg.kind == "link" and seg.extra["label"].strip().lower() in VAGUE_LINK:
            add(seg.start, seg.end, "low", 0.90,
                "Link text such as “click here” is not meaningful out of context for screen-reader users.", "link_text")

    headings = [s for s in structure if s.kind == "heading"]
    for prev, cur in zip(headings, headings[1:]):
        if cur.extra["level"] > prev.extra["level"] + 1:
            add(cur.start, cur.end, "low", 0.90,
                f"Heading level jumps from H{prev.extra['level']} to H{cur.extra['level']}; keep heading order sequential.", "heading_order")

    if not re.search(r"alt\s*text\s*:", text, I):
        for m in PLAIN_IMAGE_REF.finditer(text):
            if not _overlaps(m.start(), m.end(), structure):
                add(m.start(), m.end(), "low", 0.80,
                    "An image is referenced without alternative text in the draft. The image itself is not inspected.", "image_ref")

    for pattern in (CONTRAST_ON, CONTRAST_LABELLED):
        for m in pattern.finditer(text):
            ratio = contrast_ratio(m.group("fg"), m.group("bg"))
            if ratio < 4.5:
                add(m.start("fg"), m.end("bg") if pattern is CONTRAST_ON else m.end("bg"), "medium", 0.95,
                    f"Colour contrast is {ratio:.1f}:1, below the WCAG AA minimum of 4.5:1 for body text.", "contrast")
    return out


def check_visual(text: str, kit: list[SourceView]) -> list[Candidate]:
    approved, holder = palette(kit)
    if not approved:
        return []
    out: list[Candidate] = []
    for m in HEX_COLOUR.finditer(text):
        if m.group(0).lower() not in approved:
            out.append(Candidate(
                type="visual", severity="low", start=m.start(), end=m.end(), text=m.group(0), method="rule_based",
                certainty=0.90, source=_ref(holder), rule_id="palette",
                reason=f"{m.group(0)} is not in the approved brand palette.",
            ))
    return out


def run_rules(text: str, sentences: list[Segment], structure: list[Segment], kit: list[SourceView]) -> list[Candidate]:
    return (
        check_claims(text, sentences, kit)
        + check_terminology(text, kit)
        + check_tone(text, sentences, kit)
        + check_accessibility(text, sentences, structure, kit)
        + check_visual(text, kit)
    )
