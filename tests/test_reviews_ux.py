#!/usr/bin/env python3
"""Real Chromium regression coverage for ETNIKA's interactive reviews carousel."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def run():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, args=["--no-sandbox"])
        page = browser.new_page(viewport={"width": 1280, "height": 850}, reduced_motion="reduce")
        errors = []
        page.on("pageerror", lambda err: errors.append(str(err)))
        page.set_content('<main><div id="reviews-test" style="width:900px"></div></main>')
        page.add_script_tag(path=str(ROOT / "widget.js"))
        page.evaluate("""() => {
          const reviews = [
            {id:'5',rating:5,author:'Five',date:'2026-11-13',text:'Long story. '.repeat(130),
             businessResponse:{text:'Detailed organization answer. '.repeat(95)}},
            {id:'3',rating:3,author:'LowRating',date:'2026-11-12',text:'Must not be visible'},
            {id:'4',rating:4,author:'Four',date:'2026-11-11',text:'Short review.'},
            {id:'1',rating:1,author:'LowRating2',date:'2026-11-10',text:'Also hidden'},
            {id:'6',rating:5,author:'AnotherFive',date:'2026-11-09',text:'Another short review.'}
          ];
          window.reviewInstance = UniversalReviews.mount('#reviews-test', {
            mode:'managed',reviews,design:{
              layout:'slider',columns:1,tabletColumns:1,mobileColumns:1,
              minRating:4,maxTextLines:3,showBusinessResponse:true,
              showControls:true,showReactions:false,showMedia:false,
              showSummary:false,autoplay:true,autoplayDelay:1300,transitionMs:100
            },content:{showHeader:false}
          });
        }""")
        page.wait_for_function("() => window.reviewInstance?.track?.children.length === 3")
        assert page.locator(".urw-card").count() == 3, "minimum 4-star filter must work"
        assert page.locator(".urw-card").first.inner_text().find("Five") >= 0
        assert "LowRating" not in page.locator(".urw").inner_text()
        assert not errors, errors

        # The viewport MUST resize to the current card, not the tallest card in
        # the entire off-screen track. The widget must automatically advance.
        initial = page.locator(".urw-viewport").evaluate("(el) => el.offsetHeight")
        assert initial > 80
        page.wait_for_function("() => window.reviewInstance.i > 0", timeout=4500)
        page.evaluate("() => {window.reviewInstance.go(0);window.reviewInstance.start()}")
        page.mouse.move(400, 230)
        page.wait_for_timeout(1600)
        assert page.evaluate("() => window.reviewInstance.i") == 0, "hover pauses carousel"

        # Opening full text freezes the carousel even after mouse leaves.
        page.locator(".urw-more").first.click()
        page.mouse.move(1120, 730)
        page.wait_for_timeout(1500)
        assert page.evaluate("() => window.reviewInstance.i") == 0, "expanded review pauses autoplay"
        assert page.locator(".urw-viewport").evaluate("(e) => e.offsetHeight") > initial + 100
        page.locator(".urw-more").first.click()
        page.mouse.move(1120, 730)

        # Organization answer is more expansive than the original review.
        page.locator(".urw-response summary").first.click()
        page.wait_for_timeout(100)
        expanded = page.locator(".urw-viewport").evaluate("(e) => e.offsetHeight")
        assert expanded > initial + 100, f"expanded response height {expanded} vs {initial}"
        page.mouse.move(1120, 730)
        page.wait_for_timeout(1550)
        assert page.evaluate("() => window.reviewInstance.i") == 0, "open response pauses autoplay"

        # Manual arrow overrides the pause, collapses the abandoned answer and
        # reduces the viewport height to the card that is ACTUALLY visible.
        page.locator("[data-next]").click()
        page.wait_for_timeout(150)
        assert page.evaluate("() => window.reviewInstance.i") == 1
        assert not page.locator(".urw-response").first.evaluate("(e) => e.open")
        next_height = page.locator(".urw-viewport").evaluate("(e) => e.offsetHeight")
        assert next_height < expanded - 120, f"old response height leaked: {next_height}, {expanded}"
        page.mouse.move(1120, 730)
        page.wait_for_function("() => window.reviewInstance.i === 2", timeout=4500)
        assert not errors, errors
        page.evaluate("() => window.reviewInstance.destroy()")
        browser.close()
        print("PASS: rating filter, hover, reading pause, manual nav, dynamic viewport shrink, resume")


if __name__ == "__main__":
    run()
