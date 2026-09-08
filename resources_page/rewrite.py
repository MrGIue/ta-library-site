"""Rewrite trainedadvisor.com/resources so the eleven Library guides stop being free.

Reads current.html (the exact HTML widget pulled out of page 5801's _elementor_data
on 2026-09-07) and writes new.html. It never touches the live site; publish.py does
that, separately and only on Joe's go.

WHY THIS EXISTS
The 2026-09-04 decision put eleven of the thirteen guides inside a $27 bundle and
kept two free: get-found-fast-guide and 3-linkedin-headlines. The redirects were
never applied, so today /resources links all thirteen as free opt-ins and the paid
page has not launched. This script closes the eleven doors on the hub itself. The
301s on the eleven guide URLs are a separate job — Rank Math's REST endpoint is
firewalled, so they go in through its Redirections screen.

WHAT IT CHANGES
  hero        the page no longer promises everything free
  #guides     a Library panel with the price, then the same thirteen cards, with
              the eleven pointing at the sales page and the two free ones tagged
  faq         three answers that recommended now-paid guides
  headings    Title Case on h1..h4, per the standing rule. FAQ <summary> text is
              left alone: those are search queries, and Title Case on a question
              reads wrong and helps nobody.

WHAT IT DELIBERATELY DOES NOT CHANGE
  The layout, the CSS, the covers, the stage sequencing, the tools band, the book
  band, the closing CTA. Every class used below already exists in the page. This is
  an offer change, not a design round.
"""
import json
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).parent
SRC = HERE / "current.html"
OUT = HERE / "new.html"

# The sales page. /library is a 404 today and is the slug the earlier build already
# assumed, so nothing else on the site has to move when it goes up.
SALES = "/library"
PRICE = "$27"

# The two magnets that stay free, named in the 2026-09-04 decision. Everything else
# under /resources/ is inside the Library.
FREE = ("/resources/get-found-fast-guide", "/resources/3-linkedin-headlines")

edits: list[tuple[str, str, str]] = []


def swap(html: str, old: str, new: str, label: str) -> str:
    """Replace exactly one occurrence, or fail loudly.

    A silent no-op here would ship a page that still sells nothing, so a missing
    anchor is an error rather than a warning.
    """
    n = html.count(old)
    if n != 1:
        sys.exit(f"ANCHOR {label!r} matched {n} times, expected 1")
    edits.append((label, old, new))
    return html.replace(old, new)


# The widget came out of Elementor with CRLF line endings. Normalise on read so the
# multi-line anchors below match; nothing downstream cares which style it gets.
html = SRC.read_text(encoding="utf-8").replace("\r\n", "\n")

# ─── hero ────────────────────────────────────────────────────────────────────
html = swap(
    html,
    '<p class="eyebrow">Free Resources · For Life Insurance &amp; Annuity Advisors</p>',
    '<p class="eyebrow">Tools And Guides · For Life Insurance &amp; Annuity Advisors</p>',
    "hero eyebrow",
)
html = swap(
    html,
    "<h1>Every Free Tool and Guide We Have. <em>In One Place.</em></h1>",
    "<h1>Every Tool And Guide We Have. <em>In One Place.</em></h1>",
    "hero h1",
)
html = swap(
    html,
    "Trained Advisor builds client acquisition systems for life insurance and annuity "
    "advisors. Everything below is free, works on its own, and takes minutes rather "
    "than months.",
    "Trained Advisor builds client acquisition systems for life insurance and annuity "
    "advisors. The tools, the trainings and the book are free. The eleven-guide "
    "Library is " + PRICE + ", and everything here takes minutes rather than months.",
    "hero sub",
)
html = swap(
    html,
    "If you want one specific problem solved today, pick the matching guide from the "
    "13 below.",
    "If you want one specific problem solved today, the Library below covers eleven "
    "of them in the order they actually get solved.",
    "hero short-version close",
)
html = swap(
    html,
    '<a href="#guides">The 13 Guides</a>',
    '<a href="#guides">The Library</a>',
    "jump nav label",
)

# ─── #guides heading ─────────────────────────────────────────────────────────
html = swap(
    html,
    '      <p class="eyebrow">The Guide Library</p>\n'
    "      <h2>Thirteen Guides, <em>Four Stages, One Order.</em></h2>\n"
    "      <p>This is the sequence a pipeline actually gets built in. Start at the "
    "stage where you are stuck. You will not need the ones after it until you clear "
    "the one you are on.</p>",
    '      <p class="eyebrow">The Trained Advisor Library</p>\n'
    "      <h2>Eleven Guides, <em>One Sequence, One Price.</em></h2>\n"
    "      <p>Most advisors collect guides and read them out of order, which is why "
    "the advice never compounds. These are numbered: profile, then content, then "
    "engagement, then prospecting, then offers, then objections, then proof. Two of "
    "the thirteen stay free and are marked below.</p>",
    "guides shead",
)

# ─── the Library panel, inserted between the heading and stage one ───────────
PANEL = f'''    <div class="tool" style="margin-bottom:clamp(3.4rem,5.5vw,5rem)">
      <div class="tool-body">
        <span class="tag">Eleven Guides · 143 Pages</span>
        <h3>The Trained Advisor Library</h3>
        <p>The eleven guides marked below, in the order a pipeline actually gets built, downloaded the moment you pay. One price, no subscription, yours to keep.</p>
        <div class="tool-foot">
          <a class="btn" href="{SALES}">Get The Library — {PRICE} <span class="ar">&rarr;</span></a>
          <p class="tool-note">Instant download. 143 pages, about nineteen cents each.</p>
        </div>
      </div>
    </div>
'''
html = swap(html, '    <div class="stage" id="stage-1">', PANEL + '    <div class="stage" id="stage-1">',
            "library panel insert")

# ─── the cards ───────────────────────────────────────────────────────────────
# Split on the card boundary so each card can be judged on its own href.
parts = re.split(r'(?=<a class="card" href=")', html)
rebuilt, paid, freed = [], 0, 0
for part in parts:
    m = re.match(r'<a class="card" href="([^"]+)"', part)
    if not m:
        rebuilt.append(part)
        continue
    href = m.group(1)
    if href in FREE:
        # Mark it, so a reader can see at a glance which two cost nothing.
        part = part.replace('<div class="card-body">',
                            '<div class="card-body"><span class="tag">Free</span>', 1)
        # Match the Title Case the eleven now carry, so the two CTAs read as a pair.
        part = part.replace('<span class="card-cta">Get the Guide ',
                            '<span class="card-cta">Get The Guide ', 1)
        freed += 1
    else:
        # Point it at the sales page, retire the free-download language, and drop
        # the word "free" from the alt text so the image stops advertising it.
        part = part.replace(f'<a class="card" href="{href}"',
                            f'<a class="card" href="{SALES}"', 1)
        part = part.replace('<span class="card-cta">Get the Guide ',
                            '<span class="card-cta">In The Library ', 1)
        part = part.replace("a free Trained Advisor guide", "a Trained Advisor guide", 1)
        paid += 1
    rebuilt.append(part)
html = "".join(rebuilt)
if (paid, freed) != (11, 2):
    sys.exit(f"card pass touched {paid} paid and {freed} free, expected 11 and 2")
edits.append(("cards", "13 cards", f"{paid} -> {SALES}, {freed} tagged Free"))


# ─── faq ─────────────────────────────────────────────────────────────────────
# One answer per question, used for BOTH the visible <details> and the FAQPage
# schema. Google wants those two to match, and keeping one source here is the only
# way they stay matched through the next edit.
FAQ_NEW = {
    "What should I use first if I am starting from scratch?":
        "Run the Profile Analyzer. It is free, it takes two minutes, and it tells "
        "you what is broken right now. The order to fix things in is The Polished "
        "LinkedIn Growth Playbook, which opens the Library.",
    "Are these resources really free, and what is the catch?":
        "Most of it is free. The Profile Analyzer, the training library, the "
        "newsletter, the CRM comparison, the 155-page book and two of the guides "
        "cost nothing, and the ones delivered by email ask for an address rather "
        "than a card. The eleven guides in the Library are $27 together, paid once. "
        "Nothing here is a trial that starts billing.",
    "I already post on LinkedIn and nothing happens. Which one helps?":
        "Usually it is the profile. Traffic to a profile that does not name who you "
        "help converts badly no matter how good the post was, so start with the "
        "Profile Analyzer. If your profile scores well, the offer is the next "
        "suspect, and that is what Making Offers On LinkedIn and The LinkedIn Offer "
        "Scorecard cover inside the Library.",
    "What is Trained Advisor?":
        "Trained Advisor runs done-for-you client acquisition on LinkedIn for life "
        "insurance and annuity advisors, and builds Advisor Nexus, the CRM and "
        "marketing platform those advisors run their practice on. Everything on this "
        "page works whether or not you ever become a client.",
}

for question, answer in FAQ_NEW.items():
    pattern = (re.escape(f"<summary>{question}</summary>")
               + r'\s*<div class="ans"><p>.*?</p></div>')
    found = re.findall(pattern, html, flags=re.S)
    if len(found) != 1:
        sys.exit(f"FAQ {question!r} matched {len(found)} visible blocks, expected 1")
    html = re.sub(pattern,
                  f'<summary>{question}</summary>\n'
                  f'        <div class="ans"><p>{answer}</p></div>',
                  html, count=1, flags=re.S)
edits.append(("faq", f"{len(FAQ_NEW)} answers", "rewritten"))

# ─── structured data ─────────────────────────────────────────────────────────
# Edited as data, not as text. The block claims the page is entirely free and
# lists all thirteen guides as separate free items; both stop being true.
ld_match = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', html, re.S)
if not ld_match:
    sys.exit("no JSON-LD block found")
graph = json.loads(ld_match.group(2))

LIBRARY_URL = "https://trainedadvisor.com/library"
KEEP = {
    "https://trainedadvisor.com/linkedin-profile-analyzer",
    "https://trainedadvisor.com/free-book-predictable-prospecting",
    "https://trainedadvisor.com/resources/get-found-fast-guide",
    "https://trainedadvisor.com/resources/3-linkedin-headlines",
}

for node in graph["@graph"]:
    kind = node.get("@type")

    if kind == "CollectionPage":
        node["name"] = "Tools And Guides For Financial Advisors"
        node["description"] = (
            "Trained Advisor's tools and guides in one place: a free LinkedIn Profile "
            "Analyzer for financial advisors, the Predictable Prospecting book, a "
            "25-video training library, two free guides, and the eleven-guide Trained "
            "Advisor Library at $27.")

    elif kind == "ItemList":
        node["name"] = "Trained Advisor Tools And Guides"
        kept = [i for i in node["itemListElement"] if i["url"] in KEEP]
        kept.insert(2, {"@type": "ListItem", "position": 0,
                        "name": "The Trained Advisor Library", "url": LIBRARY_URL})
        for i, item in enumerate(kept, 1):
            item["position"] = i
        node["itemListElement"] = kept
        node["numberOfItems"] = len(kept)

    elif kind == "FAQPage":
        for entry in node["mainEntity"]:
            if entry["name"] in FAQ_NEW:
                entry["acceptedAnswer"]["text"] = FAQ_NEW[entry["name"]]

# The thing the page now sells, declared once. No rating and no review count: the
# Library has not sold a copy yet, so there is nothing true to put there.
graph["@graph"].append({
    "@type": "Product",
    "@id": LIBRARY_URL + "#product",
    "name": "The Trained Advisor Library",
    "url": LIBRARY_URL,
    "description": ("Eleven LinkedIn guides for life insurance and annuity advisors, "
                    "143 pages, sequenced from profile through content, engagement, "
                    "prospecting, offers, objections and proof."),
    "brand": {"@type": "Organization", "name": "Trained Advisor"},
    "offers": {"@type": "Offer", "price": "27", "priceCurrency": "USD",
               "availability": "https://schema.org/InStock", "url": LIBRARY_URL},
})

html = (html[:ld_match.start()] + ld_match.group(1) + "\n"
        + json.dumps(graph, indent=2, ensure_ascii=False) + "\n"
        + ld_match.group(3) + html[ld_match.end():])
edits.append(("json-ld", "graph", "collection, item list, faq, product"))

# ─── Title Case pass on h1..h4 ───────────────────────────────────────────────
# Only the small connectors are touched. Every other word is already correct, and a
# blanket capitalise would wreck LinkedIn and the guide titles.
SMALL = {"a", "an", "the", "and", "or", "but", "of", "to", "in", "on", "at", "by",
         "for", "with", "from", "as", "is", "it", "your", "you", "not", "so", "into"}


def title_case_text(text: str) -> str:
    return re.sub(r"\b[A-Za-z']+\b",
                  lambda m: m.group(0)[0].upper() + m.group(0)[1:]
                  if m.group(0).lower() in SMALL else m.group(0),
                  text)


before = html
html = re.sub(r"(<h[1-4][^>]*>)(.*?)(</h[1-4]>)",
              lambda m: m.group(1) + "".join(
                  c if c.startswith("<") else title_case_text(c)
                  for c in re.split(r"(<[^>]+>)", m.group(2))) + m.group(3),
              before, flags=re.S)
changed = sum(1 for a, b in zip(before.split("<h"), html.split("<h")) if a != b)
edits.append(("title case", "h1-h4", f"{changed} headings touched"))

with open(OUT, "w", encoding="utf-8", newline="") as fh:
    fh.write(html)
print(f"wrote {OUT.name}  {len(html):,} chars")
for label, _, note in edits:
    print(f"  · {label}: {note}")
