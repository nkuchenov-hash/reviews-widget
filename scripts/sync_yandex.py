#!/usr/bin/env python3
import json, os, re, time
from datetime import datetime, timezone
from html import unescape
from html.parser import HTMLParser
from urllib.request import Request, urlopen

BUSINESS_ID=os.getenv('YANDEX_BUSINESS_ID','136853819595')
SLUG=os.getenv('YANDEX_SLUG','studiya_avtoportreta_etnika')
BASE='https://yandex.com'
OUT='data/reviews.json'
MAX_PAGES=12
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

class Scripts(HTMLParser):
    def __init__(self):
        super().__init__(); self.on=False; self.buf=[]; self.blocks=[]
    def handle_starttag(self,tag,attrs):
        if tag=='script' and dict(attrs).get('type')=='application/json': self.on=True; self.buf=[]
    def handle_data(self,data):
        if self.on:self.buf.append(data)
    def handle_endtag(self,tag):
        if tag=='script' and self.on:
            self.blocks.append(''.join(self.buf)); self.on=False

def find_node(x):
    if isinstance(x,dict):
        rd=x.get('ratingData')
        if isinstance(rd,dict) and ('ratingCount' in rd or 'reviewCount' in rd): return x
        for v in x.values():
            z=find_node(v)
            if z is not None:return z
    elif isinstance(x,list):
        for v in x:
            z=find_node(v)
            if z is not None:return z
    return None

def fetch_page(page):
    path=f'/maps/org/{SLUG}/{BUSINESS_ID}/reviews/'
    url=BASE+path+(f'?page={page}' if page>1 else '')
    req=Request(url,headers={'User-Agent':UA,'Accept-Language':'ru-RU,ru;q=0.9','Accept':'text/html,application/xhtml+xml'})
    with urlopen(req,timeout=30) as r: html=r.read().decode('utf-8','replace')
    p=Scripts();p.feed(html)
    for block in sorted(p.blocks,key=len,reverse=True):
        for candidate in (block,unescape(block)):
            try:data=json.loads(candidate)
            except Exception:continue
            node=find_node(data)
            if node:return node
    raise RuntimeError(f'Yandex markup not recognized on page {page}')

def normalize(raw):
    rid=str(raw.get('reviewId') or '')
    if not rid:return None
    a=raw.get('author')
    author=a.get('name') if isinstance(a,dict) else a
    avatar=None
    if isinstance(a,dict): avatar=a.get('avatarUrl') or a.get('avatar') or a.get('photoUrl')
    return {
        'id':rid,'author':author or 'Пользователь Яндекса','avatar':avatar or '',
        'rating':int(raw.get('rating') or 0),'text':raw.get('text') or '',
        'date':raw.get('updatedTime') or raw.get('time') or '', 'source':'yandex',
        'url':f'https://yandex.com/maps/org/{SLUG}/{BUSINESS_ID}/reviews/'
    }

def main():
    old={}
    try:
        with open(OUT,'r',encoding='utf-8') as f:
            for r in json.load(f).get('reviews',[]): old[str(r.get('id'))]=r
    except Exception: pass
    by_id={}; summary={}
    for page in range(1,MAX_PAGES+1):
        node=fetch_page(page)
        rd=node.get('ratingData') or {}
        if page==1:
            summary={'name':node.get('name') or node.get('title'),'rating':rd.get('ratingValue'),'ratingsCount':rd.get('ratingCount'),'reviewsCount':rd.get('reviewCount')}
        raws=((node.get('reviewResults') or {}).get('reviews') or [])
        if not raws:break
        for raw in raws:
            if not isinstance(raw,dict):continue
            r=normalize(raw)
            if not r:continue
            prev=old.get(r['id'],{})
            for k in ('hidden','pinned','pinOrder'):
                if k in prev:r[k]=prev[k]
            by_id[r['id']]=r
        if len(raws)<10:break
        time.sleep(.4)
    if not by_id: raise RuntimeError('No reviews extracted from Yandex')
    out={'source':{'provider':'yandex','businessId':BUSINESS_ID,'businessUrl':f'https://yandex.com/maps/org/{SLUG}/{BUSINESS_ID}/reviews/'},'summary':summary,'fetchedAt':datetime.now(timezone.utc).isoformat(),'reviews':list(by_id.values())}
    os.makedirs(os.path.dirname(OUT),exist_ok=True)
    with open(OUT,'w',encoding='utf-8') as f: json.dump(out,f,ensure_ascii=False,indent=2)
    print(f"Saved {len(by_id)} reviews")
if __name__=='__main__':main()
