"""Build site/index.html from site/_template.html.

Every constant lives here. Change it and re-run; never hand-edit index.html.
Covers are embedded as data URIs so the output is ONE self-contained block that
can be pasted straight into the trainedadvisor.com page builder.
"""
import base64, os, pathlib, re, sys

ROOT = pathlib.Path(__file__).parent
COVERS = ROOT / "site" / "covers"
TEMPLATE = ROOT / "site" / "_template.html"
RING = ROOT / "site" / "_ring.js"
OUT = ROOT / "site" / "index.html"

PRICE = "$27"

# LIVE Stripe payment link, created 2026-09-07 on Trained Advisor Primary
# (acct_1B4bLYKuIVbq8ZJv, plink_1UD97CKuIVbq8ZJvQd1ZVgmw). $27 one-off, active.
# It redirects on success to the delivery page with the session id attached.
# The branded /pay/guide-bundle URL from the offer ladder is a nice-to-have
# redirect, not a dependency — this link works on its own.
CHECKOUT = "https://buy.stripe.com/00w5kE4Fw1P1gBS6ad3Nm2V"
CALL_URL = "https://trainedadvisor.com/book-a-call"
PROOF_URL = "https://trainedadvisor.com/testimonials"

# The free fallback door, so the ~97% who do not buy today still leave an address.
# It MUST point at a guide that is OUTSIDE the eleven. The 2026-09-04 decision names
# Get Found Fast and 3 LinkedIn Headlines as the two magnets that stay free; every
# other guide on /resources is inside the $27 Library. A previous build pointed this
# at /resources/linkedin-profile-update, which IS one of the eleven — the page was
# selling a bundle and giving away its own stage one on the same screen.
FREE_URL = "https://trainedadvisor.com/resources/get-found-fast-guide"

# Counted from the eleven shipped PDFs on 2026-09-07, not estimated.
PAGES = 143
PER_PAGE = "19¢"          # 27 / 143

# JOE'S CALL. TA has never published a refund policy on a digital product. A $27
# impulse buy converts better with one, and it is cheap risk reversal. Set to None
# to remove it everywhere on the page.
GUARANTEE = ("Read it. If it does not earn its $27, reply to your receipt within "
             "30 days and we refund it. No form, no questions.")

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
    graphic = "\n".join(["<script>", RING.read_text(encoding="utf-8"), "</script>"])
    html = html.replace("<!--COMET-->", graphic)
    guarantee_block = "" if not GUARANTEE else (
        f'<p class="grt"><b>Our Guarantee.</b> {GUARANTEE}</p>')
    guarantee_faq = "" if not GUARANTEE else (
        '<div class="q"><button type="button" aria-expanded="false">'
        'What If It Is Not For Me?<span class="pm" aria-hidden="true"></span></button>'
        f'<div class="a"><div><p>{GUARANTEE}</p></div></div></div>')
    html = (html.replace("{{PRICE}}", PRICE)
                .replace("{{CHECKOUT}}", CHECKOUT)
                .replace("{{CALL_URL}}", CALL_URL)
                .replace("{{PROOF_URL}}", PROOF_URL)
                .replace("{{FREE_URL}}", FREE_URL)
                .replace("{{PAGES}}", str(PAGES))
                .replace("{{PER_PAGE}}", PER_PAGE)
                .replace("<!--GUARANTEE-->", guarantee_block)
                .replace("<!--GUARANTEE_FAQ-->", guarantee_faq))
    left = re.findall(r"\{\{[A-Z_]+\}\}|<!--[A-Z_]+-->", html)
    if left:
        sys.exit(f"unreplaced placeholders: {sorted(set(left))}")
    OUT.write_text(html, encoding="utf-8")
    print(f"built {OUT}  {OUT.stat().st_size // 1024} KB  ({len(GUIDES)} guides embedded)")

if __name__ == "__main__":
    main()
