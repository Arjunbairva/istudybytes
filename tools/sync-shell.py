#!/usr/bin/env python3
"""
iStudyBytes - sync the shared site shell into every page.

The site is plain static HTML, so the header and footer would normally be
copy-pasted into ~80 files and slowly drift apart. This script keeps ONE source
of truth instead:

    tools/shell/header.html          the site header (nav, auth buttons, user menu)
    tools/shell/footer.html          the full footer
    tools/shell/footer-compact.html  slim footer used on sign-in / checkout pages

Edit those files, then run from the project root:

    python tools/sync-shell.py            # apply to every page
    python tools/sync-shell.py --check    # report pages that are out of sync (no writes)

It also keeps each page <head> consistent (canonical Poppins font link,
css/site.css loaded last) and adds js/site.js. Running it twice changes nothing.
"""
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHELL = os.path.join(ROOT, "tools", "shell")

SKIP = {"invoice.html"}  # printable invoice: intentionally has no site chrome
COMPACT_FOOTER = {
    "login.html", "register.html", "forgot-password.html",
    "reset-password.html", "checkout.html",
}
POPPINS = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"

H_START, H_END = "<!-- SHELL:HEADER:START -->", "<!-- SHELL:HEADER:END -->"
F_START, F_END = "<!-- SHELL:FOOTER:START -->", "<!-- SHELL:FOOTER:END -->"


def read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def active_key(page):
    """Which top-level nav item a page belongs to."""
    if page == "index.html":
        return "home"
    if page == "about.html":
        return "about"
    if page == "ncert-solutions.html":
        return "ncert"
    if page == "quiz.html":
        return "quiz"
    if page in ("store.html", "dashboard.html", "checkout.html") or re.match(
        r"(product|course)-class\d+\.html$|class(9|10)-", page
    ):
        return "store"
    return None


def render_header(template, page):
    key = active_key(page)
    return re.sub(
        r"\{\{cur:(\w+)\}\}",
        lambda m: ' aria-current="page"' if m.group(1) == key else "",
        template,
    )


def replace_block(html, start, end, legacy_re, block):
    """Swap the marked block; on first run swap the legacy element instead."""
    wrapped = f"{start}\n{block.strip()}\n{end}"
    marked = re.compile(re.escape(start) + r".*?" + re.escape(end), re.S)
    if marked.search(html):
        return marked.sub(lambda _m: wrapped, html, count=1), True
    m = re.search(legacy_re, html, re.S | re.I)
    if m:
        return html[: m.start()] + wrapped + html[m.end():], True
    return html, False


def insert_footer(html, block):
    """Pages that never had a footer: place it right after </main>."""
    wrapped = f"{F_START}\n{block.strip()}\n{F_END}"
    m = re.search(r"</main>", html, re.I)
    if m:
        return html[: m.end()] + "\n" + wrapped + html[m.end():]
    m = re.search(r"</body>", html, re.I)
    return html[: m.start()] + wrapped + "\n" + html[m.start():]


def fix_head(html):
    # 1. one canonical Poppins stylesheet (same weights on every page)
    html = re.sub(
        r'href="https://fonts\.googleapis\.com/css2\?family=Poppins[^"]*"',
        f'href="{POPPINS}"', html)
    if "fonts.googleapis.com/css2?family=Poppins" not in html:
        html = html.replace(
            "</head>",
            '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
            '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
            f'<link rel="stylesheet" href="{POPPINS}">\n</head>', 1)
    # 2. css/site.css must be the LAST stylesheet so it wins the cascade
    html = re.sub(r'\s*<link[^>]+href="css/site\.css"[^>]*>', "", html)
    links = list(re.finditer(r'<link[^>]+rel="stylesheet"[^>]*>', html))
    tag = '<link rel="stylesheet" href="css/site.css">'
    if links:
        end = links[-1].end()
        html = html[:end] + "\n" + tag + html[end:]
    else:
        html = html.replace("</head>", tag + "\n</head>", 1)
    # 3. mobile viewport + brand theme colour
    if 'name="viewport"' not in html:
        html = html.replace(
            "<head>", '<head>\n<meta name="viewport" content="width=device-width,initial-scale=1">', 1)
    if 'name="theme-color"' not in html:
        html = html.replace("</head>", '<meta name="theme-color" content="#2563eb">\n</head>', 1)
    return html


def fix_scripts(html):
    # Chapter pages loaded supabase-js + supabase-config.js twice, which throws
    # "Identifier 'SUPABASE_URL' has already been declared". Keep the first copy.
    for src in (
        r'<script src="https://cdn\.jsdelivr\.net/npm/@supabase/supabase-js@2"></script>',
        r'<script src="js/supabase-config\.js"></script>',
    ):
        seen = []

        def keep_first(m, seen=seen):
            seen.append(1)
            return m.group(0) if len(seen) == 1 else ""

        html = re.sub(src, keep_first, html)
    # site.js (defer) - added once, right before </body>
    html = re.sub(r'\s*<script src="js/site\.js"[^>]*></script>\s*', "", html)
    html = re.sub(r"</body>", '\n<script src="js/site.js" defer></script>\n</body>', html, count=1, flags=re.I)
    return html


def main():
    check = "--check" in sys.argv
    header_tpl = read(os.path.join(SHELL, "header.html"))
    footer_tpl = read(os.path.join(SHELL, "footer.html"))
    compact_tpl = read(os.path.join(SHELL, "footer-compact.html"))

    changed, unchanged = [], 0
    for path in sorted(glob.glob(os.path.join(ROOT, "*.html"))):
        page = os.path.basename(path)
        if page in SKIP:
            continue
        html = orig = read(path)

        html, ok = replace_block(html, H_START, H_END, r"<header\b.*?</header>", render_header(header_tpl, page))
        if not ok:
            print(f"  ! {page}: no <header> found")
        ftpl = compact_tpl if page in COMPACT_FOOTER else footer_tpl
        html, ok = replace_block(html, F_START, F_END, r"<footer\b.*?</footer>", ftpl)
        if not ok:
            html = insert_footer(html, ftpl)

        html = fix_head(html)
        html = fix_scripts(html)

        if html != orig:
            changed.append(page)
            if not check:
                with open(path, "w", encoding="utf-8", newline="") as fh:
                    fh.write(html)
        else:
            unchanged += 1

    verb = "would update" if check else "updated"
    print(f"{verb} {len(changed)} page(s); {unchanged} already in sync.")
    if check and changed:
        sys.exit(1)


if __name__ == "__main__":
    main()
