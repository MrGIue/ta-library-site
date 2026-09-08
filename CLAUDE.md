# TA Library Site — The $27 Pay Page

## Purpose
The sales page for the **$27 Trained Advisor Library** (11 LinkedIn guides sold as one sequence).
This is TA's first self-serve pay page: someone buys without Joe involved. Audience is life insurance
and annuity advisors. It is pasted into trainedadvisor.com as one self-contained block.

## Status
active — 2026-09-07. Joe approved the current build: *"okay this is fucking GREAT."*

**Live:** https://claude.ai/code/artifact/1c27dada-0ee4-449f-b536-9ad891b08856
**Repo:** `MrGIue/ta-library-site` (public), branch `master`.

## Key Files
- `build.py` — the generator and EVERY constant. Change it and re-run.
- `site/_template.html` — the source. `site/_comet.js` — the graphic, spliced in at an anchor comment.
- `site/index.html` — **GENERATED. Never hand-edit** (a hand fix is reverted by the next build).
- `site/covers/` — the 11 covers, downscaled to 460px JPEG and embedded as data URIs.
- `test/shot.mjs` — render + horizontal overflow at 320/390/1024/1440.
- `test/audit.mjs` — contrast against the real painted ancestor, plus a geometry-based grid check.
- `test/imgs.mjs` — scrolls the page so lazy images load before capture.
- `test/clip.mjs` — screenshots one selector; takes a settle argument in ms.
- `concepts/` — the three rendered directions Joe picked from. History; not the deliverable.

## Decisions & Context
- **Fork A + E** (sell asset on a TA surface): full design pipeline AND Brand Bible tokens.
- **NO header, footer or logo.** Joe: *"this cant have a header bc itd be on our website."* The
  Elementor header (70px) and footer (428px) already wrap it. Container 1240px, sections 140px,
  everything scoped under `.ta-lib` so nothing leaks into the page builder.
- **LIGHT ground, overriding the Brand Bible's dark-by-law rule**, on Joe's instruction. Measured
  consequence: no cyan clears 3:1 on light (CTA `#00A1D3` is 2.88:1), so **cyan carries SHAPES only and
  all text is navy**. Headline emphasis is italic plus an electric underline.
- **White on the `#00A1D3` CTA measures 2.98:1 and STAYS.** Joe ruled on that number on 2026-09-01 and
  caught a previous attempt to dull the fill. Do not re-raise it, do not "fix" it.
- **The graphic is an ASSEMBLY, not a collection.** Eleven arc segments float apart; a comet seats each
  in order until the ring closes and reads *One Complete System*. Joe rejected the collecting metaphor
  himself. The earlier rocket is retired — do not re-propose it.
- **The comet needs a DARK viewport** inside the light page. A coma and a tail are additive light and do
  not exist on white.
- Every number on the page is counted: 11 PDFs, **143 pages**, ~19¢ a page. Every proof quote is verbatim
  from `trainedadvisor.com/testimonials`, re-verified 2026-09-07.
- **The free fallback must point OUTSIDE the eleven.** `FREE_URL` is `get-found-fast-guide`, one of the
  two magnets the 2026-09-04 decision keeps free. It pointed at `linkedin-profile-update` until
  2026-09-07, which gave away guide one of the eleven on the page selling all eleven.
- **The sales page must never be opened in Elementor.** It is published as plain post_content. Elementor
  renders `_elementor_data` and ignores post_content the moment a page becomes a builder page, which is
  exactly why `/resources` had to be edited through its meta instead.

## Known Gotchas
- **The render loop must NEVER be gated on `prefers-reduced-motion`.** Windows "Animation effects: off"
  reports `reduce` — that is Joe's own machine — and it froze an earlier build on one frame. Headless
  Chrome also reports `reduce` BY DEFAULT, so `test/shot.mjs` forces `no-preference`.
- **The first rAF timestamp can precede the seeded `performance.now()`**, so `dt` arrives negative.
  Clamp both ends and derive any wrap-around index with a double modulo.
- **A `<canvas>` is a replaced element:** `position:absolute; inset:0` leaves it at 300x150 and its
  width attribute then overflows the viewport. Set `width:100%; height:100%`.
- **The cdnjs path is `three.js/r128/`, not `three/r128/`.** The wrong one 404s silently.
- **`puppeteer-core` 25.x entry is `lib/puppeteer/puppeteer-core.js`.**
- **Every POST to `/wp-json/rankmath/*` returns a bare 403 from the host firewall.** GET works. It is
  not the user agent and not the body — an empty body 403s too. So Rank Math redirections and the
  noindex checkbox cannot be set from a script; `wp/v2` POST is unaffected.
- **`rank_math_robots` is registered in `wp/v2` as a STRING but Rank Math reads an ARRAY.** A string
  write returns 200, stores, and is then ignored at render. There is no REST path to noindex.
- **Judge a particle emitter only after one full particle lifetime.** A capture at 1.5s shows no tail.
- **Vercel refuses every deploy on `team_2MUsZZ5m8D4xst2FfKm2UjXg`** (`BLOCKED`, four days, plan reads
  `hobby`), and the `gh` token has no Pages scope. Hosting is the artifact URL until Joe fixes one.

## Next Steps
1. **Publish, in this order.** Each step assumes the one before it.
   `python publish_sales.py --write` puts the sales page at `/library`; then the eleven 301s from
   `resources_page/REDIRECTS.md`; then `python resources_page/publish.py --write` points the hub
   at it. Both scripts dry-run by default and print what they would change.
2. **Joe rules on the `GUARANTEE` constant** — a 30-day refund line is live on the page. Keep or kill.
3. **`ta-guide-bundle.vercel.app` is still live** and its buy button points at
   `trainedadvisor.com/pay/guide-bundle`, a 404. It is the older build of this same offer. Kill it
   or redirect it before the new page goes up.
4. **Stripe receipts reply to tyson@trainedadvisor.com**, so refund requests land with him.
5. Wire analytics. A conversion page that cannot be measured cannot be optimised.
6. The remaining items from the original brief: privacy, terms, sitemap, robots, custom 404, form
   validation, spam protection.
