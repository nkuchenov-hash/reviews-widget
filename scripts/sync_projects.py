#!/usr/bin/env python3
import json, os, subprocess, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
PROJECTS=ROOT/'projects'
OUT_DIR=ROOT/'data'/'projects'
OUT_DIR.mkdir(parents=True,exist_ok=True)

configs=[]
for path in sorted(PROJECTS.glob('*.json')):
    try:
        cfg=json.loads(path.read_text(encoding='utf-8'))
    except Exception as e:
        print(f'Skip {path.name}: {e}',file=sys.stderr)
        continue
    if cfg.get('status')!='active':
        continue
    if (cfg.get('source') or {}).get('provider')!='yandex':
        continue
    configs.append((path,cfg))

if not configs:
    raise SystemExit('No active projects found')

failed=[]
for path,cfg in configs:
    pid=str(cfg.get('id') or path.stem).strip()
    src=cfg.get('source') or {}
    bid=str(src.get('businessId') or '').strip()
    slug=str(src.get('slug') or '').strip()
    if not pid or not bid or not slug:
        failed.append((pid or path.stem,'missing source settings'))
        continue
    env=os.environ.copy()
    env['YANDEX_BUSINESS_ID']=bid
    env['YANDEX_SLUG']=slug
    env['OUT']=str(OUT_DIR/f'{pid}.json')
    print(f'== Sync {pid}: {slug}/{bid} ==')
    p=subprocess.run([sys.executable,str(ROOT/'scripts'/'sync_yandex.py')],cwd=ROOT,env=env)
    if p.returncode!=0:
        failed.append((pid,f'exit {p.returncode}'))

if failed:
    print('Failed projects:',failed,file=sys.stderr)
    raise SystemExit(1)
print(f'Synced {len(configs)} project(s)')
