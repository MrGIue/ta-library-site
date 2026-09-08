"""Thin GoHighLevel v2 client for the Library purchase flow.

Auth is the location Private Integration Token used by the lead-magnet-system
scripts. Nothing here prints the token.

Every call this module makes is one the Make scenario will make too, as a plain
HTTP request. Proving them here first means the Make blueprint encodes a known
shape instead of a guess.
"""
import json, pathlib, urllib.error, urllib.request

SECRET = pathlib.Path(r"C:\Users\jloeb\Projects\onboarding-agent\secrets\ghl-ta-loc-pit.json")
_d = json.loads(SECRET.read_text(encoding="utf-8"))
TOKEN, LOCATION = _d["LOC_PIT"], _d["location_id"]

API = "https://services.leadconnectorhq.com"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ta-library"
HEAD = {
    "Authorization": f"Bearer {TOKEN}",
    "Version": "2021-07-28",
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": UA,
}


def call(method: str, path: str, payload=None, version: str | None = None):
    """Returns (status, parsed_body). Never raises on an HTTP error status."""
    head = dict(HEAD)
    if version:
        head["Version"] = version
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(API + path, data=data, method=method, headers=head)
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            raw = r.read().decode("utf-8", "replace")
            return r.status, (json.loads(raw) if raw.strip() else {})
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "replace")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"raw": raw[:900]}


def upsert_contact(email, first="", last="", phone=None, tags=None, source=None):
    body = {"locationId": LOCATION, "email": email, "firstName": first, "lastName": last}
    if phone:
        body["phone"] = phone
    if tags:
        body["tags"] = tags
    if source:
        body["source"] = source
    return call("POST", "/contacts/upsert", body)


def add_tags(contact_id, tags):
    return call("POST", f"/contacts/{contact_id}/tags", {"tags": tags})


def send_email(contact_id, subject, html, text=None, email_from=None):
    body = {
        "type": "Email",
        "contactId": contact_id,
        "subject": subject,
        "html": html,
        "emailTo": None,
    }
    if text:
        body["message"] = text
    if email_from:
        body["emailFrom"] = email_from
    body = {k: v for k, v in body.items() if v is not None}
    return call("POST", "/conversations/messages", body)
