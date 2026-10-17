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

GitHub Pages cannot run the Node.js backend. Server-side JSON synchronization, shared persistent widget configuration, authentication, and scheduled sync will be enabled later when the backend is deployed to a server.

## Publish on GitHub Pages

Repository Settings → Pages → Build and deployment:

- Source: Deploy from a branch
- Branch: main
- Folder: /(root)

Then open:

https://nkuchenov-hash.github.io/reviews-widget/
