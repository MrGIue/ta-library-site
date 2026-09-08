"""Publish delivery/index.html to trainedadvisor.com via the WordPress REST API.

Idempotent: finds the page by slug and UPDATES it, or creates it once. Never
makes a second page with the same slug.

Credentials come from the WP_CREDS entry in ~/.claude/settings.local.json, the
same mechanism the SEO audit project uses. Nothing is printed but the result.
"""
import base64, json, pathlib, re, sys, urllib.error, urllib.request

SITE = "https://trainedadvisor.com"
SLUG = "library-access"
TITLE = "Your Library Is Ready"
SRC = pathlib.Path(__file__).parent / "delivery" / "index.html"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ta-publish"


def auth() -> str:
    s = pathlib.Path(r"C:\Users\jloeb\.claude\settings.local.json").read_text(encoding="utf-8")
    return "Basic " + base64.b64encode(
        re.search(r"WP_CREDS='([^']+)'", s).group(1).encode()).decode()


def req(method, url, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header("User-Agent", UA)
    r.add_header("Authorization", auth())
    if data:
        r.add_header("Content-Type", "application/json")
    try:
        raw = urllib.request.urlopen(r, timeout=180).read().decode("utf-8", "replace")
        return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code} on {method} {url}\n{e.read().decode('utf-8','replace')[:900]}")


def wp_safe(html: str) -> str:
    """Neutralise wpautop.

    WordPress runs post content through wpautop, which turns a blank line into
    <p> and a single newline into <br>. That injected stray <p> elements as
    GRID CHILDREN, which collapsed the two-column sections, and put <br> inside
    the hero paragraph. Removing every newline leaves wpautop nothing to act on.
    The page has no <pre> and no inline JS, so collapsing whitespace is safe;
    CSS does not care. The wp:html wrapper belts-and-braces it for the block
    editor, which skips wpautop inside a Custom HTML block.
    """
    one_line = re.sub(r"\s*\n\s*", " ", html)
    one_line = re.sub(r"  +", " ", one_line)
    return f"<!-- wp:html -->{one_line}<!-- /wp:html -->"


def main():
    html = wp_safe(SRC.read_text(encoding="utf-8"))
    found = req("GET", f"{SITE}/wp-json/wp/v2/pages?slug={SLUG}&status=publish,draft,private&context=edit")

    body = {
        "title": TITLE,
        "slug": SLUG,
        "content": html,
        "status": "publish",
        "comment_status": "closed",
        "ping_status": "closed",
        # Elementor's full-width template keeps the site header and footer but
        # drops the theme's page-title band and its narrow content wrapper.
        "template": "elementor_header_footer",
    }

    if found:
        pid = found[0]["id"]
        page = req("POST", f"{SITE}/wp-json/wp/v2/pages/{pid}", body)
        action = "UPDATED"
    else:
        page = req("POST", f"{SITE}/wp-json/wp/v2/pages", body)
        pid = page["id"]
        action = "CREATED"

    print(f"{action}  id={pid}  {page.get('link')}")
    print(f"content bytes sent: {len(html.encode('utf-8')):,}")
    print(f"content bytes stored: {len(page.get('content', {}).get('raw', '').encode('utf-8')):,}")


if __name__ == "__main__":
    main()
