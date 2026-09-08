# The Eleven 301s — One Rank Math Redirection

Rank Math's `updateRedirection` REST endpoint returns a bare `403` from the host's
firewall, and so does every other POST under `/wp-json/rankmath/`. GET works, POST does
not, whatever the user agent or content type. So these go in by hand. It is one entry,
not eleven: Rank Math's redirection editor takes multiple source rows for one
destination.

**WordPress → Rank Math → Redirections → Add New**

- **Redirection type:** 301 Permanent Move
- **Destination URL:** `https://trainedadvisor.com/library`
- **Source URLs** (add a row each, match type *Exact*):

```
/resources/polished-linkedin-growth-playbook
/resources/linkedin-profile-update-guide
/resources/linkedin-engagement-flywheel
/resources/content-creation-playbook
/resources/ai-prompt-guide
/resources/30-day-linkedin-content-plan
/resources/modern-prospecting-playbook
/resources/objection-handling-guide
/resources/making-offers-on-linkedin
/resources/linkedin-offer-scorecard
/resources/5-testimony-questions
```

## Do NOT redirect these two

They stay free. They are the top-of-funnel that keeps email capture alive for the
roughly ninety-seven percent who will not pay today, and the 2026-09-04 decision names
both by name.

```
/resources/get-found-fast-guide
/resources/3-linkedin-headlines
```

## Order

The sales page has to exist first, or all eleven redirect into a 404.

1. `python publish_sales.py --write` — puts the sales page at `/library`
2. These eleven redirects
3. `python resources_page/publish.py --write` — points the resource hub at `/library`

## What this does not fix

The eleven PDFs sit on GoHighLevel's public CDN at URLs that were emailed to every
free opt-in for years. Thousands of people hold working links, and no redirect on
this site touches them. The only cure is re-uploading all eleven to fresh URLs and
updating the delivery email. Offered, not done.

The eleven GHL opt-in workflows and their 55 nurture emails stay intact and dormant
behind the redirects, which was deliberate: rewriting 55 emails for a rung that
reverses in ninety days is work with a coin-flip attached.
