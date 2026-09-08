"""The five Library buyer emails, as HTML.

Copy is governed by 08 Learned Patterns/Joe Voice V7 - Canonical Writing Spec.md
because Joe's name is on them. Source of the prose: emails/library-buyer-sequence.md.
Change the prose THERE first, then mirror it here, so the two never drift.

Deliberately plain HTML. These read as a person typing, not as a designed campaign,
which is the whole point of a sequence signed by Joe. No images, no header bar,
no template chrome.
"""

LIBRARY = "https://trainedadvisor.com/library-access"
GUIDE01 = ("https://assets.cdn.filesafe.space/VjPMR5l6zfpGcEwYuq7E/media/"
           "0998c58f-2097-4acf-bda8-25f6626d4d60.pdf")
CALL = "https://trainedadvisor.com/free-strategy-session"
MATRIX = None  # $47 checkout does not exist yet; Email 3 stays inactive until it does.

_STYLE = (
    "font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;"
    "font-size:16px;line-height:1.62;color:#1a2230;max-width:560px;"
)


def _wrap(paragraphs: list[str]) -> str:
    body = "".join(f'<p style="margin:0 0 16px">{p}</p>' for p in paragraphs)
    return f'<div style="{_STYLE}">{body}</div>'


def _a(href: str, text: str) -> str:
    return f'<a href="{href}" style="color:#0369a1;font-weight:600">{text}</a>'


def email_1(first: str = "") -> tuple[str, str]:
    hi = f"Thanks for picking this up, {first}." if first else "Thanks for picking this up."
    return "Your library is ready", _wrap([
        hi,
        f'Everything is here: {_a(LIBRARY, "your library page")}',
        "That page has all eleven guides on it. Bookmark it. It does not expire and I am not "
        "going to move it.",
        "If you do one thing today, open the LinkedIn Profile Update Guide. It is first for a "
        "reason. Every other guide in the library assumes your profile can hold the attention "
        "you send to it, and most of them fall apart if it cannot. It takes about twenty minutes.",
        _a(GUIDE01, "Open the Profile Update Guide"),
        "After that the order is content, engagement, prospecting, offers, objections, proof. "
        "Read them that way and each one is standing on the one before it. Read them in whatever "
        "order you feel like and you have eleven separate opinions.",
        "Broken link or a question, just reply to this. It comes to us.",
        "Joe",
    ])


def email_2(first: str = "") -> tuple[str, str]:
    return "The name-tag test", _wrap([
        "Quick one on the profile guide, in case it is still sitting unopened.",
        'There is a section in it called the name-tag test. Picture yourself at a networking '
        'event wearing a name tag that says "Insurance Agent." You blend into the room. Now '
        'picture the same person wearing one that says "Retirement Strategy Specialist for '
        'Gov Employees."',
        "Your headline and your cover photo are that name tag. Most of the advisor profiles we "
        "take over are wearing the generic one.",
        "Those are sections one and three of the guide, and you can fix both this afternoon.",
        _a(GUIDE01, "Open the Profile Update Guide"),
        "Then the About section, which is where the Thumbprint Framework comes in. That one takes "
        "longer and it is the part people feel the difference from.",
        "Joe",
    ])


def email_3(first: str = "") -> tuple[str, str]:
    """HELD. Do not enable until the Content Matrix is gated; it is a free public app today."""
    if not MATRIX:
        raise RuntimeError("Email 3 is held: the $47 Content Matrix checkout does not exist yet.")
    return "Guides three through five are the hard part", _wrap([
        "Five days in. If you kept the order you are somewhere around the Content Creation "
        "Playbook, the 30-Day Content Plan and the AI Prompt Guide.",
        "This is where people stall. The profile takes twenty minutes. Content takes forever. "
        "The 30-Day Plan answers what to post today for a month, and then the month ends and you "
        "are deciding again.",
        "That is the job the Content Matrix does. You answer four questions about your practice "
        "and it builds 195 content ideas, thirteen angles across three themes, plus a PDF you can "
        "hand to ChatGPT so what comes back sounds like your practice instead of everyone's.",
        "$47, once.",
        _a(MATRIX, "Get the Content Matrix"),
        "If you would rather work the 30-Day Plan first, do that instead. It is already yours.",
        "Joe",
    ])


def email_4(first: str = "") -> tuple[str, str]:
    return "What this looks like when someone else runs it", _wrap([
        "Two things advisors have said about the done-for-you version of this.",
        'One: "you have added an additional half a million dollars to my revenue in the time '
        'that I\'ve worked with you."',
        'Another, on why they had stopped trusting agencies: "we have hired countless social '
        'media groups that were always a letdown… with him we have never had this problem."',
        "Both of those came out of the program we run, not out of the library. I am not going to "
        "tell you eleven PDFs did that. The guides are the same method written down so you can "
        "run it yourself.",
        "Running it yourself is real work. The profile is an afternoon. The content is a habit. "
        "The prospecting is a daily block that has to survive the weeks where nothing comes back.",
        "If you would rather we ran it, that is a conversation.",
        _a(CALL, "Book a strategy call"),
        "Joe",
    ])


def email_5(first: str = "") -> tuple[str, str]:
    return "Two weeks", _wrap([
        "Two weeks since you picked up the library.",
        "A call is worth thirty minutes if you want one. We look at what you actually have now, "
        "and we tell you what we would do next. If that turns into us running it, good. If it "
        "does not, you have the plan either way.",
        _a(CALL, "Book a strategy call"),
        "Before you decide, three questions.",
        "Is your profile rewritten?",
        "Have you posted in the last seven days?",
        "Did you send one connection request this week to somebody who genuinely fits the client "
        "you want?",
        "Three yeses and you do not need the call. Keep going, work down the sequence, and "
        "ignore me.",
        "Joe",
    ])


# step number -> (days after purchase, builder). Step 3 is absent on purpose.
SEQUENCE = {
    1: (0, email_1),
    2: (2, email_2),
    4: (9, email_4),
    5: (14, email_5),
}
