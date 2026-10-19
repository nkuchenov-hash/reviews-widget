# Universal Reviews Widget — code/doc parity (2026-10-17)

**Reviewed:** `main` at `e0fb8f409cc6`. Static source reading only; no browser, Yandex API or workflow test executed.

## Actual current paths
- `widget.js`: embed rendering, layout options, review cards and source handling; defaults include custom slider/grid/list styling.
- `builder.js`, `builder.html`: visual configuration builder. The builder explicitly distinguishes **native Yandex iframe** (`displayMode: native`) from **custom-designed review cards** (`displayMode: custom`). Its fallback preview reviews are not real synced customer data.
- `projects/*.json` and `data/projects/*.json`: source project definitions and published project review data.
- `.github/workflows/sync-yandex.yml`: `schedule` every three hours (cron `17 */3 * * *`), `workflow_dispatch`, and source-change triggers; runs `scripts/sync_projects.py` and may commit updated `data/projects/` to the repository.
- `README.md` describes only the official native Yandex embed and says server-side JSON sync is a later phase. **This is incomplete for the current custom-build mode and scheduled data sync.**

## Safe documentation correction
Document both display modes and the static data-refresh path. A scheduled GitHub Action is not a guarantee of fresh Yandex data: check successful Actions execution, review item freshness and end-user presentation before promising live sync. Do not remove fallback previews or cached project data without checking consumers, and do not expose client-specific credentials.

## Not performed
Live widget visual testing, Yandex policy review, source API availability, Action success/failure inspection, and live embedded-site checks.
