"""Build site/index.html from site/_template.html.

Every constant lives here. Change it and re-run; never hand-edit index.html.
Covers are embedded as data URIs so the output is ONE self-contained block that
can be pasted straight into the trainedadvisor.com page builder.
"""
import base64, os, pathlib, re, sys

ROOT = pathlib.Path(__file__).parent
COVERS = ROOT / "site" / "covers"
TEMPLATE = ROOT / "site" / "_template.html"
OUT = ROOT / "site" / "index.html"

PRICE = "$27"
CHECKOUT = "https://trainedadvisor.com/pay/guide-bundle"   # 404 until Joe makes the Stripe product
CALL_URL = "https://trainedadvisor.com/book-a-call"
PROOF_URL = "https://trainedadvisor.com/testimonials"

# slug, title, stage, the line that earns the click
GUIDES = [
    ("linkedin-profile-update", "The LinkedIn Profile Update Guide", "Profile",
     "Everything downstream lands here. Fix the page a stranger judges in four seconds."),
    ("polished-linkedin-growth-playbook", "The Polished LinkedIn Growth Playbook", "Profile",
     "The header, the featured section and the proof placement that make them stay."),
    ("content-creation", "The Content Creation Playbook", "Content",
     "What to write once the profile can hold the attention it earns."),
    ("30-day-linkedin-content-plan", "The 30-Day LinkedIn Content Plan", "Content",
     "Thirty days already decided, so the daily question stops being what to post."),
    ("ai-prompt-guide", "The AI Prompt Guide", "Content",
     "Turn one idea into a week of posts without flattening your own voice."),
    ("linkedin-engagement-flywheel", "The LinkedIn Engagement Flywheel", "Engagement",
     "Where the twenty minutes go that decide whether the next post reaches anyone."),
    ("modern-prospecting-playbook", "The Modern Prospecting Playbook", "Prospecting",
     "Who to reach and in what order, now that the profile and the content carry their share."),
    ("making-offers-on-linkedin", "Making Offers On LinkedIn", "Offers",
     "The move from conversation to offer, without the pivot everyone sees coming."),
    ("linkedin-offer-scorecard", "The LinkedIn Offer Scorecard", "Offers",
     "Score the offer you already have before you write another word of copy for it."),
    ("objection-handling-guide", "The Objection Handling Guide", "Objections",
     "The four answers that come back most, and the language that survives them."),
    ("5-testimony-questions", "5 Questions To Ask Your Happy Clients", "Proof",
     "Turn a satisfied client into the asset that shortens every conversation after it."),
]

def data_uri(slug: str) -> str:
    p = COVERS / f"{slug}.jpg"
    if not p.exists():
        sys.exit(f"missing cover: {p}")
    return "data:image/jpeg;base64," + base64.b64encode(p.read_bytes()).decode()

def cards() -> str:
    out = []
    for i, (slug, title, stage, line) in enumerate(GUIDES, 1):
        out.append(f'''      <article class="gcard">
        <div class="shot"><img src="{data_uri(slug)}" alt="Cover of {title}" width="460" height="595" loading="lazy" decoding="async"></div>
        <div class="meta">
          <span class="tag">{stage}</span>
          <h3>{title}</h3>
          <p>{line}</p>
          <span class="idx">Guide {i:02d} Of 11</span>
        </div>
      </article>''')
    # a twelfth cell completes the three-column grid, so no card is ever stranded
    out.append(f'''      <article class="gcard gcard--buy">
        <div class="meta">
          <span class="tag tag--solid">All Eleven</span>
          <h3>Take The Whole Run For {PRICE}</h3>
          <p>Bought one at a time these would be eleven decisions. Bought together they are one, and the order comes with them.</p>
          <a class="btn" href="{CHECKOUT}">Get The Library — {PRICE}</a>
        </div>
      </article>''')
    return "\n".join(out)

def main() -> None:
    html = TEMPLATE.read_text(encoding="utf-8")
    html = html.replace("<!--GUIDE_CARDS-->", cards())
    html = (html.replace("{{PRICE}}", PRICE)
                .replace("{{CHECKOUT}}", CHECKOUT)
                .replace("{{CALL_URL}}", CALL_URL)
                .replace("{{PROOF_URL}}", PROOF_URL))
    left = re.findall(r"\{\{[A-Z_]+\}\}|<!--[A-Z_]+-->", html)
    if left:
        sys.exit(f"unreplaced placeholders: {sorted(set(left))}")
    OUT.write_text(html, encoding="utf-8")
    print(f"built {OUT}  {OUT.stat().st_size // 1024} KB  ({len(GUIDES)} guides embedded)")

if __name__ == "__main__":
    main()
