"""Push new.html into trainedadvisor.com/resources (page 5801). NOT run automatically.

ORDER MATTERS. Every card on the rewritten page points at /library, which is a 404
until the sales page is published. Publish the sales page FIRST, then run this.

/resources is an Elementor builder page: `_elementor_edit_mode` is "builder" and the
whole hand-built block lives in ONE html widget inside `_elementor_data`. The
`post_content` field holds a stripped mirror with every class attribute removed, so
writing post_content changes nothing a visitor sees. This writes the meta.

Two caches sit in front of the result: Elementor's generated CSS, flushed here, and
NitroPack, which is not reachable from this script. If the live page still shows the
old copy after this runs, purge NitroPack from wp-admin.

    python publish.py            # dry run: writes nothing, prints the diff shape
    python publish.py --write    # writes, verifies, flushes Elementor's cache
"""
import base64
import datetime
import json
import pathlib
import re
import sys
import urllib.error
import urllib.request

SITE = "https://trainedadvisor.com"
PAGE_ID = 5801
HERE = pathlib.Path(__file__).parent
NEW = HERE / "new.html"
# A browser UA is required. The host's firewall answers a bare one with a bare 403,
# and it blocks every POST to /wp-json/rankmath/* whatever the UA.
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36")


def auth() -> str:
    s = pathlib.Path(r"C:\Users\jloeb\.claude\settings.local.json").read_text(encoding="utf-8")
    return "Basic " + base64.b64encode(
        re.search(r"WP_CREDS='([^']+)'", s).group(1).encode()).decode()


def call(method: str, url: str, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("User-Agent", UA)
    req.add_header("Authorization", auth())
    if data:
        req.add_header("Content-Type", "application/json")
    try:
        raw = urllib.request.urlopen(req, timeout=180).read().decode("utf-8", "replace")
        return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        sys.exit(f"HTTP {e.code} on {method} {url}\n{body[:600]}")


def main() -> None:
    write = "--write" in sys.argv

    with open(NEW, encoding="utf-8", newline="") as fh:
        replacement = fh.read()

    page = call("GET", f"{SITE}/wp-json/wp/v2/pages/{PAGE_ID}?context=edit")
    stored = page["meta"]["_elementor_data"]

    stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = HERE / f"elementor-5801-{stamp}.json"
    backup.write_text(stored, encoding="utf-8")

    tree = json.loads(stored)
    widgets = [w for section in tree for w in section.get("elements", [])
               if w.get("widgetType") == "html"]
    if len(widgets) != 1:
        sys.exit(f"expected one html widget, found {len(widgets)}")
    widget = widgets[0]

    before = widget["settings"]["html"]
    widget["settings"]["html"] = replacement
    body = json.dumps(tree, ensure_ascii=False)

    print(f"page {PAGE_ID}  widget {widget['id']}")
    print(f"  backup        {backup.name}")
    print(f"  widget html   {len(before):,} -> {len(replacement):,} chars")
    print(f"  /library links  {before.count('href=\"/library\"')} -> "
          f"{replacement.count('href=\"/library\"')}")
    print(f"  /resources/ links {len(re.findall(r'href=.{1}/resources/', before))} -> "
          f"{len(re.findall(r'href=.{1}/resources/', replacement))}")

    if not write:
        print("\nDRY RUN. Nothing written. Re-run with --write once /library is live.")
        return

    call("POST", f"{SITE}/wp-json/wp/v2/pages/{PAGE_ID}", {"meta": {"_elementor_data": body}})

    # Read it back rather than trusting the 200. A registered meta field that is not
    # writable returns 200 and stores nothing, which is the failure this catches.
    check = call("GET", f"{SITE}/wp-json/wp/v2/pages/{PAGE_ID}?context=edit")
    saved = check["meta"]["_elementor_data"]
    if 'href=\\"/library\\"' not in saved and 'href="/library"' not in saved:
        sys.exit("WROTE NOTHING: _elementor_data came back without the sales links. "
                 "The meta field is not writable over REST; edit the widget in "
                 "Elementor instead and paste new.html into it.")
    print("  stored and verified")

    call("DELETE", f"{SITE}/wp-json/elementor/v1/cache")
    print("  elementor css cache flushed")
    print("\nNow purge NitroPack from wp-admin, then load /resources in a private window.")


if __name__ == "__main__":
    main()
