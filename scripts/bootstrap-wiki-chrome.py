#!/usr/bin/env python3
"""Bootstrap GitHub Wiki Home via Chrome front tab (sessão já logada)."""
from __future__ import annotations

import base64
import json
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HOME_MD = (ROOT / "docs" / "wiki" / "Home.md").read_text(encoding="utf-8")
WIKI = "https://github.com/KleilsonSantos/ai-operating-system/wiki"
WIKI_NEW = WIKI + "/_new"


def osa(source: str) -> str:
    r = subprocess.run(
        ["osascript", "-"],
        input=source,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        raise RuntimeError(r.stderr.strip() or r.stdout.strip() or "osascript failed")
    return (r.stdout or "").strip()


def chrome_js(js: str) -> str:
    b64 = base64.b64encode(js.encode("utf-8")).decode("ascii")
    return osa(
        f'''
tell application "Google Chrome"
  activate
  if (count of windows) is 0 then error "Nenhuma janela Chrome aberta"
  set t to active tab of front window
  set r to execute t javascript "eval(atob('{b64}'))"
  return r as string
end tell
'''
    )


def chrome_goto(url: str) -> None:
    osa(
        f'''
tell application "Google Chrome"
  activate
  if (count of windows) is 0 then error "Nenhuma janela Chrome aberta"
  set URL of active tab of front window to "{url}"
end tell
'''
    )


def wait_ready(seconds: int = 25) -> bool:
    for _ in range(seconds):
        ready = chrome_js(
            "String(!!(document.getElementById('gollum-editor-body') || document.querySelector(\"textarea[name='wiki[body]']\")))"
        )
        if ready == "true":
            return True
        time.sleep(1)
    return False


def main() -> int:
    loc = chrome_js("location.href")
    print("front:", loc)

    # Stay on current tab if already wiki/editor; else navigate
    if "/wiki" not in loc:
        chrome_goto(WIKI)
        time.sleep(4)
        loc = chrome_js("location.href")
        print("after goto wiki:", loc)

    snip = chrome_js(
        "(document.body && document.body.innerText || '').replace(/\\s+/g,' ').slice(0,220)"
    )
    print("snip:", snip)
    if "Sign in" in snip and "Sign up" in snip and "avatar" not in snip.lower():
        # soft check — still try if Create the first page exists
        pass

    has_editor = chrome_js(
        "String(!!(document.getElementById('gollum-editor-body') || document.querySelector(\"textarea[name='wiki[body]']\")))"
    )
    if has_editor != "true":
        clicked = chrome_js(
            """(() => {
              const a = Array.from(document.querySelectorAll('a'))
                .find(x => /Create the first page/i.test(x.textContent || ''));
              if (a) { a.click(); return 'clicked'; }
              return 'none';
            })()"""
        )
        print("click:", clicked)
        if clicked == "none":
            chrome_goto(WIKI_NEW)
            print("navigated-_new")
        time.sleep(4)

    if not wait_ready():
        print("fail loc:", chrome_js("location.href + ' | ' + document.title"))
        print(
            "fail snip:",
            chrome_js(
                "(document.body && document.body.innerText || '').replace(/\\s+/g,' ').slice(0,400)"
            ),
        )
        return 1

    body_json = json.dumps(HOME_MD)
    fill_js = f"""(() => {{
      const body = {body_json};
      const titleEl = document.getElementById('gollum-editor-page-name')
        || document.querySelector(\"input[name='wiki[name]']\");
      const bodyEl = document.getElementById('gollum-editor-body')
        || document.querySelector(\"textarea[name='wiki[body]']\");
      const msgEl = document.getElementById('gollum-editor-message')
        || document.querySelector(\"input[name='wiki[message]']\");
      if (titleEl) {{
        titleEl.value = 'Home';
        titleEl.dispatchEvent(new Event('input', {{ bubbles: true }}));
      }}
      if (bodyEl) {{
        bodyEl.value = body;
        bodyEl.dispatchEvent(new Event('input', {{ bubbles: true }}));
      }}
      if (msgEl) msgEl.value = 'docs: Wiki Home mapa de links';
      const btn = document.getElementById('gollum-editor-submit')
        || document.querySelector('button[type=submit]');
      if (btn) {{ btn.click(); return 'submitted'; }}
      return 'no-submit';
    }})()"""
    step2 = chrome_js(fill_js)
    print("step2:", step2)
    time.sleep(6)
    print("final:", chrome_js("location.href + ' | ' + document.title"))
    return 0 if step2 == "submitted" else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        raise SystemExit(1)
