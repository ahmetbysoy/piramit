"""Phone-viewport snapshots: local HTML pyramid vs live Vercel canvas."""

from __future__ import annotations

import os
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path("/home/user/pyramid-flow/tests/snaps")
OUT.mkdir(parents=True, exist_ok=True)

PHONE = {"viewport": {"width": 390, "height": 844}, "device_scale_factor": 2, "is_mobile": True}


def shot(page, name: str) -> None:
    page.screenshot(path=str(OUT / name), full_page=True)
    print("wrote", name)


def inspect(page, label: str) -> None:
    info = page.evaluate(
        """() => {
          const rows = [...document.querySelectorAll('.py-row')].map((el) => ({
            name: el.querySelector('.py-name')?.textContent?.trim() || '',
            net: el.querySelector('.py-net')?.textContent?.trim() || '',
            w: el.getBoundingClientRect().width,
          }))
          const canvas = document.querySelector('canvas.py-canvas')
          const legend = document.querySelector('[data-testid=layer-legend]')
          return {
            title: document.title,
            rows,
            canvas: !!canvas && getComputedStyle(canvas).display !== 'none',
            legend: !!legend,
            headline: document.querySelector('[data-testid=headline]')?.textContent || '',
          }
        }"""
    )
    print(label, info)


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(**PHONE)

        page.goto("http://127.0.0.1:5173/#SOLUSDT", wait_until="domcontentloaded", timeout=60_000)
        page.wait_for_selector("[data-testid=symbol-input]", timeout=30_000)
        page.wait_for_timeout(4000)
        inspect(page, "LOCAL")
        shot(page, "local_sol.png")

        try:
            page.goto("https://piramit.vercel.app/#SOLUSDT", wait_until="domcontentloaded", timeout=45_000)
            page.wait_for_timeout(4000)
            inspect(page, "VERCEL")
            shot(page, "vercel_sol.png")
        except Exception as e:
            print("vercel skip", e)

        browser.close()


if __name__ == "__main__":
    main()
