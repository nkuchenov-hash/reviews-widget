# Universal Reviews Widget

Universal configurable reviews widget with a browser-based builder.

## Current display modes and data refresh (2026-10-17)

The builder supports **native Yandex iframe mode** and **custom-designed review cards**. In custom mode, project JSON data is refreshed by `.github/workflows/sync-yandex.yml` (scheduled every three hours when GitHub Actions runs successfully), not by a live browser API call. Actual data freshness must be verified; a scheduled workflow alone is not a freshness guarantee. See `docs/DOCUMENTATION_PARITY_2026-10-17.md`.

## GitHub Pages mode

The static GitHub Pages version supports:

- Yandex Maps Live reviews via the official Yandex reviews widget
- live preview
- design settings
- local browser persistence
- embed-code generation for any website

Yandex Live content is refreshed by Yandex automatically.

GitHub Pages cannot execute the Node.js backend. However, `.github/workflows/sync-yandex.yml` already refreshes static project review JSON on a schedule using GitHub Actions, subject to workflow success and upstream availability. A separate persistent server-backed configuration/authentication layer remains future work.

## Publish on GitHub Pages

Repository Settings → Pages → Build and deployment:

- Source: Deploy from a branch
- Branch: main
- Folder: /(root)

Then open:

https://nkuchenov-hash.github.io/reviews-widget/
