(function(){
'use strict';
const script=document.currentScript;
const base=new URL('./',script&&script.src?script.src:location.href);
const projectCache=new Map();
let widgetPromise=null;

function loadWidget(){
  if(window.UniversalReviews)return Promise.resolve(window.UniversalReviews);
  if(widgetPromise)return widgetPromise;
  widgetPromise=new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src=new URL('widget.js',base).href+'?v=20260925-projects';
    s.async=true;
    s.onload=()=>window.UniversalReviews?resolve(window.UniversalReviews):reject(new Error('Widget API not found'));
    s.onerror=()=>reject(new Error('Widget script failed to load'));
    document.head.appendChild(s);
  });
  return widgetPromise;
}

async function getProject(id){
  if(projectCache.has(id))return projectCache.get(id);
  const p=(async()=>{
    const cfgUrl=new URL('projects/'+encodeURIComponent(id)+'.json',base);
    const cfgRes=await fetch(cfgUrl,{cache:'no-cache'});
    if(!cfgRes.ok)throw new Error('Project not found: '+id);
    const cfg=await cfgRes.json();
    const reviewsUrl=new URL(cfg.reviewsUrl||('data/projects/'+encodeURIComponent(id)+'.json'),base);
    const dataRes=await fetch(reviewsUrl,{cache:'no-cache'});
    if(!dataRes.ok)throw new Error('Reviews not found for project: '+id);
    const data=await dataRes.json();
    return {cfg,data};
  })();
  projectCache.set(id,p);
  return p;
}

function applyModeration(reviews,map){
  map=map||{};
  return (reviews||[]).map(r=>Object.assign({},r,map[String(r.id)]||{})).filter(r=>!r.hidden);
}

async function mount(el){
  const id=(el.getAttribute('data-reviews-project')||'').trim();
  if(!id)return;
  try{
    const [{cfg,data},api]=await Promise.all([getProject(id),loadWidget()]);
    let payload;
    if(cfg.display&&cfg.display.mode==='native'){
      payload={
        mode:'yandex-live',
        source:cfg.source||{},
        design:cfg.design||{},
        content:cfg.content||{}
      };
    }else{
      const reviews=applyModeration(data.reviews,cfg.moderation);
      payload={
        mode:'managed',
        summary:data.summary||null,
        profile:data.profile||null,
        reviews,
        design:cfg.design||{},
        content:cfg.content||{}
      };
    }
    api.mount(el,payload);
    el.setAttribute('data-reviews-ready','true');
  }catch(err){
    console.error('[Reviews Widget]',err);
    el.innerHTML='<div style="font:14px/1.4 Arial,sans-serif;color:#777;padding:12px 0">Не удалось загрузить отзывы.</div>';
    el.setAttribute('data-reviews-error','true');
  }
}

function start(){
  document.querySelectorAll('[data-reviews-project]').forEach(mount);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.UniversalReviewsEmbed={mountProject:(el,id)=>{if(typeof el==='string')el=document.querySelector(el);if(!el)return;el.setAttribute('data-reviews-project',id);return mount(el)}};
})();
