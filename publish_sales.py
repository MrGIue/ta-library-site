"""Publish site/index.html to trainedadvisor.com/library. NOT run automatically.

Same mechanism as publish_delivery.py: a plain WordPress page whose post_content is
the whole self-contained block. It must NOT be an Elementor builder page — Elementor
renders _elementor_data and ignores post_content, which is the trap /resources sits
in. Creating the page over REST like this leaves _elementor_edit_mode empty, so
post_content is what renders. Do not open this page in Elementor afterwards.

    python publish_sales.py            # dry run
    python publish_sales.py --write    # creates or updates the page

After it is live, run resources_page/publish.py --write to point the resource hub at
it, and add the eleven 301s in Rank Math.
"""
import base64
import json
import pathlib
import re
import sys
import urllib.error
import urllib.request

SITE = "https://trainedadvisor.com"
SLUG = "library"
TITLE = "The Trained Advisor Library"
SRC = pathlib.Path(__file__).parent / "site" / "index.html"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36")


def auth() -> str:
    s = pathlib.Path(r"C:\Users\jloeb\.claude\settings.local.json").read_text(encoding="utf-8")
    return "Basic " + base64.b64encode(
        re.search(r"WP_CREDS='([^']+)'", s).group(1).encode()).decode()


def call(method, url, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("User-Agent", UA)
    req.add_header("Authorization", auth())
    if data:
        req.add_header("Content-Type", "application/json")
    try:
        raw = urllib.request.urlopen(req, timeout=300).read().decode("utf-8", "replace")
        return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code} on {method} {url}\n{e.read().decode('utf-8','replace')[:600]}")


def wp_safe(html: str) -> str:
    """Neutralise wpautop, which otherwise injects stray <p> as grid children.

    Proven on the delivery page 2026-09-07. Collapsing newlines is safe here: the
    block has no <pre>, and its inline JS is inside a single-line spliced bundle.
    """
    one_line = re.sub(r"\s*\n\s*", " ", html)
    one_line = re.sub(r"  +", " ", one_line)
    return f"<!-- wp:html -->{one_line}<!-- /wp:html -->"


def main() -> None:
    write = "--write" in sys.argv
    html = wp_safe(SRC.read_text(encoding="utf-8"))

    found = call("GET", f"{SITE}/wp-json/wp/v2/pages?slug={SLUG}"
                        f"&status=publish,draft,private&context=edit")

    print(f"source  {SRC.name}  {SRC.stat().st_size:,} bytes")
    print(f"payload {len(html.encode('utf-8')):,} bytes")
    print(f"target  {SITE}/{SLUG}  ->  " +
          (f"UPDATE id={found[0]['id']}" if found else "CREATE"))
    if not write:
        print("\nDRY RUN. Nothing written.")
        return

    body = {
        "title": TITLE,
        "slug": SLUG,
        "content": html,
        "status": "publish",
        "comment_status": "closed",
        "ping_status": "closed",
        # Keeps the site header and footer, drops the theme's title band and its
        # narrow wrapper. The block brings its own 1240px container.
        "template": "elementor_header_footer",
    }
    if found:
        page = call("POST", f"{SITE}/wp-json/wp/v2/pages/{found[0]['id']}", body)
    else:
        page = call("POST", f"{SITE}/wp-json/wp/v2/pages", body)

    stored = len(page.get("content", {}).get("raw", "").encode("utf-8"))
    print(f"\nid={page['id']}  {page.get('link')}")
    print(f"stored {stored:,} bytes")
    if stored < len(html.encode("utf-8")) * 0.9:
        print("WARNING: stored content is much smaller than what was sent. "
              "Check for a sanitiser stripping markup.")


if __name__ == "__main__":
    main()
