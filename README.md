# Universal Reviews Widget

Universal configurable reviews widget with a browser-based builder.

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
