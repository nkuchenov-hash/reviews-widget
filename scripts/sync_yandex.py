#!/usr/bin/env python3
import json, os, time
from datetime import datetime, timezone
from html import unescape
from html.parser import HTMLParser
from urllib.parse import quote
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

def tpl_url(value,size='M'):
    if not isinstance(value,str) or not value:return ''
    return value.replace('{size}',size).replace('%s',size)

def avatar_url(value):
    if not isinstance(value,str) or not value:return ''
    return value.replace('{size}','islands-68').replace('%s','islands-68')

def normalize_video(v):
    if not isinstance(v,dict): return None
    url=v.get('url') or v.get('videoUrl') or v.get('urlTemplate') or ''
    preview=v.get('preview') or v.get('previewUrl') or v.get('thumbnail') or v.get('imageUrlTemplate') or ''
    if isinstance(preview,dict): preview=preview.get('url') or preview.get('urlTemplate') or ''
    if isinstance(url,dict): url=url.get('url') or url.get('urlTemplate') or ''
    url=tpl_url(url,'L')
    preview=tpl_url(preview,'M')
    if not url and not preview:return None
    return {'type':'video','url':url,'preview':preview}

def normalize(raw):
    rid=str(raw.get('reviewId') or '')
    if not rid:return None
    a=raw.get('author')
    author=a.get('name') if isinstance(a,dict) else a
    public_id=str(a.get('publicId') or '') if isinstance(a,dict) else ''
    avatar=avatar_url(a.get('avatarUrl') or a.get('avatar') or a.get('photoUrl')) if isinstance(a,dict) else ''
    profession=(a.get('professionLevel') or a.get('rtb') or '') if isinstance(a,dict) else ''

    photos=[]
    for p in raw.get('photos') or []:
        if not isinstance(p,dict):continue
        u=tpl_url(p.get('urlTemplate') or p.get('url') or '', 'M')
        if u: photos.append({'type':'photo','url':u})

    videos=[]
    for v in raw.get('videos') or []:
        nv=normalize_video(v)
        if nv:videos.append(nv)

    bc=raw.get('businessComment') if isinstance(raw.get('businessComment'),dict) else None
    reactions=raw.get('reactions') if isinstance(raw.get('reactions'),dict) else {}
    created=raw.get('createdTime') or raw.get('time') or ''
    updated=raw.get('updatedTime') or created
    general_url=f'https://yandex.ru/maps/org/{SLUG}/{BUSINESS_ID}/reviews/'
    review_url=(f'{general_url}?reviews%5BpublicId%5D={quote(public_id)}&utm_source=review' if public_id else general_url)

    return {
        'id':rid,
        'author':author or 'Пользователь Яндекса',
        'authorPublicId':public_id,
        'authorLevel':profession,
        'avatar':avatar,
        'rating':int(raw.get('rating') or 0),
        'text':raw.get('text') or '',
        'date':updated,
        'createdDate':created,
        'edited':bool(created and updated and created!=updated),
        'source':'yandex',
        'url':review_url,
        'likes':int(reactions.get('likes') or 0),
        'dislikes':int(reactions.get('dislikes') or 0),
        'photos':photos,
        'videos':videos,
        'businessResponse':({'text':bc.get('text') or '', 'date':bc.get('updatedTime') or ''} if bc else None)
    }

def profile_from_node(node):
    cats=[]
    for c in node.get('categories') or []:
        if isinstance(c,dict) and c.get('name'):cats.append(c.get('name'))
        elif isinstance(c,str):cats.append(c)
    phones=[]
    for p in node.get('phones') or []:
        if isinstance(p,dict):
            v=p.get('formatted') or p.get('value') or p.get('number')
            if v:phones.append(v)
        elif isinstance(p,str):phones.append(p)
    photos=node.get('photos') if isinstance(node.get('photos'),dict) else {}
    business_images=node.get('businessImages') if isinstance(node.get('businessImages'),dict) else {}
    logo=business_images.get('logo')
    if isinstance(logo,dict):logo=logo.get('url') or logo.get('urlTemplate') or ''
    return {
        'name':node.get('name') or node.get('title') or '',
        'address':node.get('fullAddress') or node.get('address') or '',
        'categories':cats,
        'phones':phones,
        'description':node.get('shortDescription') or node.get('description') or '',
        'photoCount':photos.get('count') if photos else None,
        'coverPhoto':tpl_url(photos.get('urlTemplate') if photos else '', 'L'),
        'logo':tpl_url(logo,'M')
    }

def main():
    old={}
    try:
        with open(OUT,'r',encoding='utf-8') as f:
            for r in json.load(f).get('reviews',[]): old[str(r.get('id'))]=r
    except Exception: pass
    by_id={}; summary={}; profile={}
    for page in range(1,MAX_PAGES+1):
        node=fetch_page(page)
        rd=node.get('ratingData') or {}
        if page==1:
            summary={'name':node.get('name') or node.get('title'),'rating':rd.get('ratingValue'),'ratingsCount':rd.get('ratingCount'),'reviewsCount':rd.get('reviewCount')}
            profile=profile_from_node(node)
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
    out={
        'source':{'provider':'yandex','businessId':BUSINESS_ID,'businessUrl':f'https://yandex.ru/maps/org/{SLUG}/{BUSINESS_ID}/reviews/'},
        'summary':summary,
        'profile':profile,
        'fetchedAt':datetime.now(timezone.utc).isoformat(),
        'reviews':list(by_id.values())
    }
    os.makedirs(os.path.dirname(OUT),exist_ok=True)
    with open(OUT,'w',encoding='utf-8') as f: json.dump(out,f,ensure_ascii=False,indent=2)
    print(f"Saved {len(by_id)} reviews")
if __name__=='__main__':main()
