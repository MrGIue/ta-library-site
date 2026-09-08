"""Build delivery/index.html — the post-purchase download page.

Published to trainedadvisor.com via the WordPress REST API by publish_delivery.py.
Every constant lives here. Change it and re-run; never hand-edit the output.

The FILE URLs are the live GoHighLevel media CDN links, pulled from the GHL
trigger-link API on 2026-09-07 and each verified 200. Five of them had drifted
from our local records after the 2026-07-29 anti-fabrication rebuild repointed
them, so NEVER take these from rollback-triggerlinks.json — re-pull them.

Design fork: C (mirror an approved reference). This page carries the tokens of
the approved pay page verbatim: light ground, navy text, cyan on shapes only,
no header/footer/logo because trainedadvisor.com already wraps it.
"""
import base64, pathlib, sys

ROOT = pathlib.Path(__file__).parent
COVERS = ROOT / "site" / "covers"
OUT = ROOT / "delivery" / "index.html"

CDN = "https://assets.cdn.filesafe.space/VjPMR5l6zfpGcEwYuq7E/media"
SUPPORT = "support@trainedadvisor.com"
# The single canonical CTA per the 2026-08-12 decision "Nothing is self-serve
# except the guides; every lead books one call". It adapts its headline to the
# source magnet, which /book-a-call does not.
CALL_URL = "https://trainedadvisor.com/free-strategy-session"
PAGES = 143

# slug, title, stage, GHL media id, the line that tells them why to open it
GUIDES = [
    ("linkedin-profile-update", "The LinkedIn Profile Update Guide", "Profile",
     "0998c58f-2097-4acf-bda8-25f6626d4d60",
     "Start here. Everything downstream lands on this page."),
    ("polished-linkedin-growth-playbook", "The Polished LinkedIn Growth Playbook", "Profile",
     "9a0d2ba4-4181-495d-8665-4edcb7556dbe",
     "The header, the featured section and the proof placement that make them stay."),
    ("content-creation", "The Content Creation Playbook", "Content",
     "671a8079-9180-4aef-9d56-72823aba97ef",
     "What to write once the profile can hold the attention it earns."),
    ("30-day-linkedin-content-plan", "The 30-Day LinkedIn Content Plan", "Content",
     "208359f0-5c5f-482c-823c-b2c7b8fea541",
     "Thirty days already decided, so the daily question stops being what to post."),
    ("ai-prompt-guide", "The AI Prompt Guide", "Content",
     "67c9dac1120e79426407f988",
     "Turn one idea into a week of posts without flattening your own voice."),
    ("linkedin-engagement-flywheel", "The LinkedIn Engagement Flywheel", "Engagement",
     "6967e4e48ed9374650f896d8",
     "Where the twenty minutes go that decide whether the next post reaches anyone."),
    ("modern-prospecting-playbook", "The Modern Prospecting Playbook", "Prospecting",
     "6a68f3858219a56ed3378c58",
     "Who to reach and in what order, now that the profile and content carry their share."),
    ("making-offers-on-linkedin", "Making Offers On LinkedIn", "Offers",
     "977ee77e-04a5-4f86-90ce-e21e8a6d02b3",
     "The move from conversation to offer, without the pivot everyone sees coming."),
    ("linkedin-offer-scorecard", "The LinkedIn Offer Scorecard", "Offers",
     "6a68f31fb7fe5a8e31f1fb11",
     "Score the offer you already have before you write another word of copy for it."),
    ("objection-handling-guide", "The Objection Handling Guide", "Objections",
     "6a68f360ce3f1b19d58e8f73",
     "The four answers that come back most, and the language that survives them."),
    ("5-testimony-questions", "5 Questions To Ask Your Happy Clients", "Proof",
     "67fe7edd58e70739293ebe45",
     "Turn a satisfied client into the asset that shortens every conversation after it."),
]


def data_uri(slug: str) -> str:
    p = COVERS / f"{slug}.jpg"
    if not p.exists():
        sys.exit(f"missing cover: {p}")
    return "data:image/jpeg;base64," + base64.b64encode(p.read_bytes()).decode()


def cards() -> str:
    """The eleven covers, WITHOUT download links.

    Deliberate: no guide URL appears anywhere in this page's HTML. The page is a
    receipt, so forwarding it hands the recipient nothing. Delivery happens in the
    email, which goes to the address that paid. Joe, 2026-09-07: "what i dont want
    is someone to buy, land on the link with all the guides, then just forward that
    link." The fix is not to guard the page, it is to empty it.
    """
    out = []
    for i, (slug, title, stage, media, line) in enumerate(GUIDES, 1):
        first = ' dcard--first' if i == 1 else ''
        out.append(f'''      <article class="dcard{first}">
        <div class="shot"><img src="{data_uri(slug)}" alt="Cover of {title}"
             width="460" height="595" loading="lazy" decoding="async"></div>
        <div class="meta">
          <span class="idx">{i:02d}</span>
          <span class="tag">{stage}</span>
          <h3>{title}</h3>
          <p>{line}</p>
        </div>
      </article>''')
    # a twelfth cell completes the three-column grid so no card is ever stranded
    out.append(f'''      <article class="dcard dcard--help">
        <div class="meta">
          <span class="tag">Support</span>
          <h3>Email Not There?</h3>
          <p>Give it a couple of minutes, then check spam. Still nothing and we
             will send the whole library straight to you by hand.</p>
          <a class="btn2 dl" href="mailto:{SUPPORT}">Email {SUPPORT}</a>
        </div>
      </article>''')
    return "\n".join(out)


HTML = f'''<div class="ta-lib ta-del">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,600;0,700;0,800;1,800&amp;family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&amp;display=swap" rel="stylesheet">
<style>
/* ═══ TRAINED ADVISOR CANONICAL TOKENS v1.0 — values verbatim from BRAND-BIBLE.md §7.
   Light ground per Joe 2026-09-07: no cyan clears 3:1 on light, so cyan carries
   SHAPES only and every piece of text is navy. Scoped under .ta-lib so nothing
   leaks into the page builder. No header, footer or logo — the site supplies them. */
.ta-lib {{
  --bg-deep:#0A1628; --cta:#00A1D3; --cta-hover:#0088B5; --accent:#44C7F4;
  --warm:#FAFBFD; --wash:#F0F8FC;
  --ink:#0F1724; --ink-body:#4A5568; --ink-muted:#5C6B7E;
  --hair:rgba(14,27,48,.10); --hair-soft:rgba(14,27,48,.06);
  --head:'Plus Jakarta Sans',-apple-system,'Segoe UI',sans-serif;
  --body:'DM Sans',-apple-system,'Segoe UI',sans-serif;
  --container:1240px; --ease:cubic-bezier(.16,1,.3,1);
  background: var(--warm); color: var(--ink-body);
  font-family: var(--body); line-height: 1.62; overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}}
.ta-lib *, .ta-lib *::before, .ta-lib *::after {{ box-sizing: border-box; }}
.ta-lib h1, .ta-lib h2, .ta-lib h3 {{ font-family: var(--head); color: var(--ink);
  margin: 0; font-weight: 800; line-height: 1.06; letter-spacing: -.03em; }}
.ta-lib h3 {{ font-weight: 700; letter-spacing: -.02em; }}
.ta-lib p {{ margin: 0; }}
.ta-lib img {{ display: block; max-width: 100%; height: auto; }}
.ta-lib .wrap {{ width: min(100% - 44px, var(--container)); margin-inline: auto; }}
.ta-lib section {{ padding: clamp(64px,7vw,116px) 0; }}

.ta-lib .eyebrow {{ font-family: var(--head); font-size: 11.5px; font-weight: 700;
  letter-spacing: .21em; text-transform: uppercase; color: var(--ink-muted);
  display: flex; align-items: center; gap: 11px; margin-bottom: 22px; }}
.ta-lib .eyebrow::before {{ content:''; width: 26px; height: 2px; background: var(--cta); flex: none; }}

.ta-lib .btn {{ display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  font-family: var(--head); font-size: 15.5px; font-weight: 700; padding: 15px 26px;
  border-radius: 11px; background: var(--cta); color: #fff; border: 1px solid var(--cta);
  text-decoration: none; box-shadow: 0 10px 26px rgba(0,161,211,.24);
  transition: background .2s var(--ease), transform .2s var(--ease), box-shadow .2s var(--ease); }}
.ta-lib .btn:hover {{ background: var(--cta-hover); transform: translateY(-2px);
  box-shadow: 0 14px 32px rgba(0,161,211,.32); }}
.ta-lib .btn2 {{ display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--head); font-size: 14.5px; font-weight: 600; padding: 15px 20px;
  border-radius: 11px; color: var(--ink); border: 1px solid var(--hair);
  background: #fff; text-decoration: none; transition: border-color .2s var(--ease); }}
.ta-lib .btn2:hover {{ border-color: var(--cta); }}
.ta-lib .btn:focus-visible, .ta-lib .btn2:focus-visible {{ outline: 2px solid var(--ink); outline-offset: 3px; }}
.ta-lib .wash {{ background: var(--wash); }}
.ta-lib .deep {{ background: var(--bg-deep); color: rgba(240,246,252,.78); }}
.ta-lib .deep h2 {{ color: #EFF1FF; }}

/* ══ hero ══ */
.ta-del .hero {{ position: relative; padding: clamp(48px,5vw,86px) 0 clamp(44px,4.6vw,74px); }}
.ta-del .hero::before {{ content:''; position: absolute; inset: 0; pointer-events: none; z-index: 0;
  background: radial-gradient(58% 62% at 78% 40%, var(--wash) 0%, rgba(240,248,252,0) 70%); }}
.ta-del .hero .wrap {{ position: relative; z-index: 1; display: grid;
  grid-template-columns: minmax(0,1.16fr) minmax(0,.84fr);
  gap: clamp(26px,3.6vw,64px); align-items: center; }}
@media (max-width: 900px) {{ .ta-del .hero .wrap {{ grid-template-columns: 1fr; }} }}
.ta-del .hero h1 {{ font-size: clamp(38px,4.4vw,62px); max-width: 16ch; }}

/* the receipt panel: what arrived, and the one action to take right now */
.ta-del .receipt {{ background: #fff; border: 1px solid var(--hair); border-radius: 18px;
  padding: clamp(24px,2.2vw,32px); box-shadow: 0 18px 46px rgba(10,22,40,.09); }}
.ta-del .receipt .rname {{ font-family: var(--head); font-size: 11.5px; font-weight: 700;
  letter-spacing: .19em; text-transform: uppercase; color: var(--ink-muted); }}
.ta-del .rrows {{ margin: 18px 0 0; padding: 18px 0 0; border-top: 1px solid var(--hair-soft);
  display: grid; grid-template-columns: 1fr auto; gap: 11px 16px; }}
.ta-del .rrows dt {{ font-size: 14.5px; color: var(--ink-body); margin: 0; }}
.ta-del .rrows dd {{ font-family: var(--head); font-size: 14.5px; font-weight: 700;
  color: var(--ink); margin: 0; text-align: right; }}
.ta-del .rstart {{ margin-top: 22px; padding-top: 20px; border-top: 1px solid var(--hair-soft); }}
.ta-del .rstart .rlab {{ font-family: var(--head); font-size: 11px; font-weight: 700;
  letter-spacing: .19em; text-transform: uppercase; color: var(--ink-muted); }}
.ta-del .rstart h2 {{ font-size: 21px; margin-top: 8px; letter-spacing: -.02em; }}
.ta-del .rstart .btn {{ width: 100%; margin-top: 16px; }}
.ta-del .rstart .rnote {{ font-size: 13px; color: var(--ink-muted); margin-top: 12px; }}
.ta-del .hero h1 em {{ font-style: italic; font-weight: 800; position: relative;
  display: inline-block; z-index: 0; }}
.ta-del .hero h1 em::after {{ content:''; position: absolute; left: 0; right: 0; bottom: .07em;
  height: .112em; background: var(--cta); opacity: .9; z-index: -1; border-radius: 2px; }}
.ta-del .hero .sub {{ font-size: clamp(16.5px,1.15vw,19px); color: var(--ink-body);
  max-width: 56ch; margin-top: 24px; }}
.ta-del .facts {{ display: flex; flex-wrap: wrap; gap: 10px 26px; margin-top: 28px;
  padding-top: 22px; border-top: 1px solid var(--hair-soft); }}
.ta-del .facts span {{ font-family: var(--head); font-size: 12.5px; font-weight: 700;
  color: var(--ink-muted); display: inline-flex; align-items: center; gap: 8px; }}
.ta-del .facts span::before {{ content:''; width: 6px; height: 6px; border-radius: 50%;
  background: var(--cta); flex: none; }}

/* ══ read-in-order band ══ */
.ta-del .order .wrap {{ display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1.25fr);
  gap: clamp(22px,3.4vw,58px); align-items: start; }}
.ta-del .order h2 {{ font-size: clamp(27px,2.5vw,38px); max-width: 14ch; }}
.ta-del .order p {{ font-size: 16.5px; }}
.ta-del .order p + p {{ margin-top: 15px; }}
@media (max-width: 860px) {{ .ta-del .order .wrap {{ grid-template-columns: 1fr; }} }}

/* ══ the twelve cells ══ */
.ta-del .files h2 {{ font-size: clamp(27px,2.5vw,38px); }}
.ta-del .grid {{ display: grid; grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 22px; align-items: stretch; margin-top: 42px; }}
@media (max-width: 980px) {{ .ta-del .grid {{ grid-template-columns: repeat(2, minmax(0,1fr)); }} }}
@media (max-width: 620px) {{ .ta-del .grid {{ grid-template-columns: 1fr; }} }}
.ta-del .dcard {{ display: flex; flex-direction: column; background: #fff;
  border: 1px solid var(--hair); border-radius: 16px; padding: 22px;
  transition: border-color .2s var(--ease), transform .2s var(--ease), box-shadow .2s var(--ease); }}
.ta-del .dcard:hover {{ border-color: rgba(0,161,211,.42); transform: translateY(-3px);
  box-shadow: 0 16px 38px rgba(10,22,40,.09); }}
.ta-del .dcard--first {{ border-color: var(--cta); box-shadow: 0 12px 30px rgba(0,161,211,.14); }}
.ta-del .shot {{ border-radius: 10px; overflow: hidden; background: var(--wash);
  border: 1px solid var(--hair-soft); margin-bottom: 18px; }}
.ta-del .shot img {{ width: 100%; }}
.ta-del .meta {{ display: flex; flex-direction: column; flex: 1; }}
/* The sequence marker is a cyan SHAPE carrying NAVY text (6.02:1). Cyan as text
   on this light ground measures 2.88:1 and is banned here — see BRAND-BIBLE
   and the 2026-09-07 light-ground decision. */
.ta-del .idx {{ align-self: flex-start; font-family: var(--head); font-size: 12px;
  font-weight: 800; color: var(--bg-deep); background: var(--cta);
  letter-spacing: .06em; padding: 4px 9px; border-radius: 6px; }}
.ta-del .tag {{ font-family: var(--head); font-size: 10.5px; font-weight: 700;
  letter-spacing: .17em; text-transform: uppercase; color: var(--ink-muted); margin-top: 6px; }}
.ta-del .dcard h3 {{ font-size: 19px; margin-top: 9px; }}
.ta-del .dcard p {{ font-size: 14.5px; color: var(--ink-body); margin-top: 10px; line-height: 1.56; }}
.ta-del .dl {{ margin-top: auto; width: 100%; }}
.ta-del .dcard .dl {{ margin-top: 20px; }}
.ta-del .dcard .meta .dl {{ margin-top: auto; }}
.ta-del .dcard--help {{ background: var(--wash); border-style: dashed; justify-content: center; }}

/* ══ close ══ */
.ta-del .close {{ text-align: left; }}
.ta-del .close h2 {{ font-size: clamp(27px,2.5vw,40px); max-width: 20ch; }}
.ta-del .close p {{ font-size: 16.5px; max-width: 58ch; margin-top: 18px;
  color: rgba(240,246,252,.78); }}
.ta-del .close .ctas {{ display: flex; flex-wrap: wrap; gap: 13px; margin-top: 30px; }}
.ta-del .close .btn2 {{ color: #EFF1FF; background: transparent; border-color: rgba(255,255,255,.18); }}
.ta-del .close .btn2:hover {{ border-color: var(--accent); }}
.ta-del .close .btn:focus-visible, .ta-del .close .btn2:focus-visible {{ outline-color: var(--accent); }}
@media (prefers-reduced-motion: reduce) {{
  .ta-lib *, .ta-lib *::before, .ta-lib *::after {{ transition: none !important; }}
}}
</style>

<section class="hero">
  <div class="wrap">
    <div>
      <div class="eyebrow">Order Confirmed</div>
      <h1>Check Your <em>Inbox</em>.</h1>
      <p class="sub">All eleven guides are on their way to the address you paid with.
        The email lands within a minute or two and carries every download link, so keep
        it. Everything below is what is in it.</p>
      <div class="facts">
        <span>11 Guides</span>
        <span>{PAGES} Pages</span>
        <span>Yours To Keep</span>
      </div>
    </div>
    <div class="receipt">
      <div class="rname">The Trained Advisor Library</div>
      <dl class="rrows">
        <dt>Guides</dt><dd>11</dd>
        <dt>Pages</dt><dd>{PAGES}</dd>
        <dt>Format</dt><dd>PDF</dd>
        <dt>Delivered To</dt><dd>Your Inbox</dd>
      </dl>
      <div class="rstart">
        <div class="rlab">Start Here</div>
        <h2>{GUIDES[0][1]}</h2>
        <p class="rnote">It is the first link in the email. About twenty minutes, and
          everything after it depends on this one.</p>
        <p class="rnote">Nothing after a couple of minutes? Check spam, then write to
          <a href="mailto:{SUPPORT}" style="color:inherit;text-decoration:underline">{SUPPORT}</a>.</p>
      </div>
    </div>
  </div>
</section>

<section class="order wash">
  <div class="wrap">
    <div>
      <div class="eyebrow">Before You Start</div>
      <h2>Read Them In Order.</h2>
    </div>
    <div>
      <p>Most advisors collect guides and read them out of order, which is exactly why the
        advice never compounds. These eleven are one sequence: the profile has to hold
        attention before content is worth writing, and content has to earn conversations
        before an offer has anywhere to land.</p>
      <p>Guide 01 is the one to open today. It takes about twenty minutes and it is the
        piece everything after it depends on.</p>
    </div>
  </div>
</section>

<section class="files">
  <div class="wrap">
    <div class="eyebrow">What Is In The Email</div>
    <h2>The Complete Library.</h2>
    <div class="grid">
{cards()}
    </div>
  </div>
</section>

<section class="close deep">
  <div class="wrap">
    <h2>When You Want The Version We Run For You.</h2>
    <p>These guides are the do-it-yourself path, and they work if you work them. If you
      would rather have the profile, the content and the outreach run for you, that is
      the conversation to book. No pitch on this page.</p>
    <div class="ctas">
      <a class="btn" href="{CALL_URL}">Book A Strategy Call</a>
      <a class="btn2" href="mailto:{SUPPORT}">Email Support</a>
    </div>
  </div>
</section>
</div>
'''

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(HTML, encoding="utf-8")
print(f"wrote {OUT}  ({len(HTML.encode('utf-8')):,} bytes)")
