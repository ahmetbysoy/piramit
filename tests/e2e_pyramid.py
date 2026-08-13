"""Headless: coin değişimi, pencere tutarlılığı, konsol hatası yok."""

from __future__ import annotations

import os
import re
import sys

from playwright.sync_api import sync_playwright

BASE = os.environ.get("E2E_BASE", "http://127.0.0.1:5173")


def tick_count(page) -> int:
    txt = page.locator("[data-testid=tick-count]").inner_text()
    m = re.search(r"([\d.]+)", txt.replace(".", ""))
    return int(m.group(1)) if m else -1


def main() -> int:
    errors: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.on("pageerror", lambda err: errors.append(f"pageerror: {err}"))
        page.on(
            "console",
            lambda msg: errors.append(f"console.{msg.type}: {msg.text}")
            if msg.type == "error"
            else None,
        )
        page.goto(BASE, wait_until="domcontentloaded", timeout=60_000)
        page.wait_for_selector("[data-testid=symbol-input]", timeout=30_000)
        page.wait_for_selector("[data-testid=win-60]", timeout=15_000)

        assert page.locator("nav.nav").is_visible(), "alt nav yok"
        page.click("[data-testid=tab-radar]")
        page.wait_for_timeout(200)
        page.click("nav.nav button:has-text('Piramit')")

        page.click("[data-testid=win-60]")
        assert "1dk" in page.locator("[data-testid=win-label]").inner_text()
        page.click("[data-testid=win-300]")
        assert "5dk" in page.locator("[data-testid=win-label]").inner_text()
        page.click("[data-testid=win-900]")
        assert "15dk" in page.locator("[data-testid=win-label]").inner_text()
        page.click("[data-testid=win-3600]")
        assert "1sa" in page.locator("[data-testid=win-label]").inner_text()
        page.click("[data-testid=win-oturum]")
        assert "AÇILIŞTAN" in page.locator("[data-testid=win-label]").inner_text()
        page.click("[data-testid=win-60]")

        inp = page.locator("[data-testid=symbol-input]")
        inp.click()
        inp.fill("ETHUSDT")
        page.keyboard.press("Enter")
        page.wait_for_timeout(80)
        assert page.locator("[data-testid=symbol-input]").input_value().upper().startswith("ETH")
        after = tick_count(page)
        assert after == 0, f"coin değişince tick sıfır değil: {after}"

        page.wait_for_timeout(2500)
        later = tick_count(page)
        assert later >= 0

        inp.click()
        inp.fill("BTCUSDT")
        page.keyboard.press("Enter")
        page.wait_for_timeout(80)
        assert page.locator("[data-testid=symbol-input]").input_value().upper().startswith("BTC")
        reset2 = tick_count(page)
        assert reset2 == 0, f"BTC'ye dönünce sıfırlanmalı, görülen: {reset2}"

        ignore = (
            "Failed to load resource",
            "exchangeInfo",
            "Access-Control-Allow-Origin",
            "CORS",
            "net::ERR_",
        )
        fatal = [e for e in errors if not any(x in e for x in ignore)]
        browser.close()
        if fatal:
            print("HATALAR:")
            for e in fatal:
                print(" -", e)
            return 1
        print("e2e OK")
        return 0


if __name__ == "__main__":
    sys.exit(main())
