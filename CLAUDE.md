# TA Library Site — The $27 Bundle, Rebuilt To Beat The Current Page

## Purpose
A standalone, futuristic, motion-driven marketing site whose single call to action is the
$27 **Trained Advisor Library** (11 LinkedIn guides sold as one sequence). It replaces
`ta-guide-bundle.vercel.app` as the surface Joe shows people. Audience: life insurance and
annuity advisors.

## Status
active — 2026-09-07

## Key Files
- `concepts/` — three rendered visual directions + an always-visible switcher (the pick gate)
- `site/` — the built site (only after Joe picks a direction)
- `test/` — render, contrast, grid and mobile-viewport checks

## Decisions & Context
- **Fork A + E** (sell asset on a TA-branded surface): full design pipeline AND Brand Bible tokens.
- **Tokens pasted verbatim** from `Projects/fable-7-day-sprint/brand-bible/BRAND-BIBLE.md` §7.
  Dark by law. Fonts locked to Plus Jakarta Sans + DM Sans, so the three directions differ on
  substrate, layout axis and type TREATMENT, never on family or palette.
- `ui-ux-pro-max` returned "Organic Biophilic / IBM Plex Sans" for this brief. Rejected — an
  approved in-house system outranks the generator. Took its pre-delivery checklist only.
- Joe's four standing lead-magnet-page rules apply EXCEPT "no dark heroes", which was scoped to
  trainedadvisor.com because the WordPress header and footer are dark. This is standalone, so the
  dark hero is available — and it is the only surface where electric `#44C7F4` measures 9.31:1.

## Known Gotchas
- **Vercel refuses every deploy on `team_2MUsZZ5m8D4xst2FfKm2UjXg`.** Re-confirmed 2026-09-07:
  `dpl_5QtmEyG9SnuYTG3PYXtDj6koD1Eb` → `BLOCKED`. Team plan reads `hobby`. Four days, no self-clear,
  git-push deploys blocked too. → vault `08 Learned Patterns/Vercel - Deployments return BLOCKED...`
- **Hosting therefore runs on GitHub Pages** until Vercel is fixed. Pages needs a PUBLIC repo on a
  free account; the repo holds no credentials.
- `trainedadvisor.com/pay/guide-bundle` is still a 404 — nothing sells until Joe makes one Stripe
  product at $27.

## Next Steps
- Joe picks one of the three directions, then build it out.
