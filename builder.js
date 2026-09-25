const $=id=>document.getElementById(id);

const ETNIKA_YANDEX_ID='136853819595';
const ETNIKA_YANDEX_URL='https://yandex.com/maps/org/studiya_avtoportreta_etnika/136853819595/reviews/';
const sampleReviews=[
  {id:'preview-1',author:'Предпросмотр',rating:5,date:'2026-09-20',source:'yandex',text:'Здесь будут реальные отзывы из Яндекс Карт после синхронизации.',pinned:true,pinOrder:1},
  {id:'preview-2',author:'Предпросмотр',rating:5,date:'2026-09-16',source:'yandex',text:'Эти карточки нужны только для настройки внешнего вида виджета.'},
  {id:'preview-3',author:'Предпросмотр',rating:5,date:'2026-09-09',source:'yandex',text:'Шрифт, колонки, радиусы, цвета и отступы управляются нашим кодом.'}
];

const defaults={
  source:{provider:'yandex',businessId:ETNIKA_YANDEX_ID,businessUrl:ETNIKA_YANDEX_URL},
  display:{mode:'custom'},
  design:{layout:'slider',columns:3,gap:18,radius:12,maxWidth:1200,fontFamily:'Inter,Arial,sans-serif',titleFontFamily:'Inter,Arial,sans-serif',titleSize:38,bodySize:16,cardPadding:22,buttonRadius:0,borderWidth:1,minRating:1,accent:'#111111',background:'#ffffff',cardBackground:'#ffffff',textColor:'#171717',mutedColor:'#777777',borderColor:'#e7e7e7',starColor:'#f2b01e',showAvatar:true,showDate:true,showSource:true,showSummary:true,autoplay:true,yandexHeight:620},
  content:{title:'Отзывы клиентов',subtitle:'Яндекс Карты',buttonText:'Оставить отзыв',buttonUrl:ETNIKA_YANDEX_URL,showHeader:true},
  reviews:[]
};

let data=structuredClone(defaults),inst,sourceMeta=null,usingPreview=false;
const STATIC_MODE=location.hostname.endsWith('github.io')||location.protocol==='file:';
const SOURCE_URL='./data/reviews.json';
function storageKey(){return 'URW_WIDGET_V5_demo'}
function setStatus(s,c=''){const el=$('status');el.textContent=s;el.className='status '+c}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
const designKeys=['layout','columns','radius','gap','maxWidth','cardPadding','borderWidth','buttonRadius','minRating','fontFamily','titleFontFamily','titleSize','bodySize','accent','background','cardBackground','textColor','borderColor','starColor','yandexHeight'];

async function fetchSource(){
  try{
    const r=await fetch(`${SOURCE_URL}?v=${Date.now()}`,{cache:'no-store'});
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const j=await r.json();
    if(Array.isArray(j.reviews)&&j.reviews.length){
      sourceMeta=j;
      data.reviews=j.reviews;
      usingPreview=false;
      return true;
    }
  }catch(e){}
  sourceMeta=null;
  if(!Array.isArray(data.reviews)||!data.reviews.length){data.reviews=structuredClone(sampleReviews);usingPreview=true}
  return false;
}

async function load(){
  try{
    const saved=localStorage.getItem(storageKey());
    if(saved){
      const s=JSON.parse(saved);
      data={...structuredClone(defaults),...s,source:{...defaults.source,...(s.source||{})},display:{...defaults.display,...(s.display||{})},design:{...defaults.design,...(s.design||{})},content:{...defaults.content,...(s.content||{})}};
    }else data=structuredClone(defaults);
    data.source.provider='yandex';
    data.source.businessId=data.source.businessId||ETNIKA_YANDEX_ID;
    data.source.businessUrl=data.source.businessUrl||ETNIKA_YANDEX_URL;
    await fetchSource();
    fill();render();
    setStatus(sourceMeta?`Загружено ${sourceMeta.reviews.length} отзывов из Яндекс Карт.`:'Источник выбран: Яндекс Карты. Автосинхронизация ещё не дала данные; показан только предпросмотр дизайна.',sourceMeta?'ok':'err');
  }catch(e){setStatus(e.message,'err')}
}

function collect(){
  data.source={provider:'yandex',businessId:$('businessId').value.trim()||ETNIKA_YANDEX_ID,businessUrl:$('businessUrl').value.trim()||ETNIKA_YANDEX_URL};
  data.display={mode:$('displayMode').value};
  data.design={...(data.design||{}),layout:$('layout').value,columns:Number($('columns').value),radius:Number($('radius').value),gap:Number($('gap').value),maxWidth:Number($('maxWidth').value),cardPadding:Number($('cardPadding').value),borderWidth:Number($('borderWidth').value),buttonRadius:Number($('buttonRadius').value),minRating:Number($('minRating').value),fontFamily:$('fontFamily').value,titleFontFamily:$('titleFontFamily').value,titleSize:Number($('titleSize').value),bodySize:Number($('bodySize').value),accent:$('accent').value,background:$('background').value,cardBackground:$('cardBackground').value,textColor:$('textColor').value,borderColor:$('borderColor').value,starColor:$('starColor').value,yandexHeight:Number($('yandexHeight').value),showAvatar:$('showAvatar').checked,showDate:$('showDate').checked,showSource:$('showSource').checked,showSummary:$('showSummary').checked,autoplay:$('autoplay').checked};
  data.content={...(data.content||{}),title:$('title').value,subtitle:$('subtitle').value,buttonText:$('buttonText').value,buttonUrl:$('buttonUrl').value,showHeader:true};
}

function fill(){
  const s={...defaults.source,...(data.source||{})},d={...defaults.design,...(data.design||{})},c={...defaults.content,...(data.content||{})};
  $('displayMode').value=data.display?.mode||'custom';
  $('businessId').value=s.businessId;
  $('businessUrl').value=s.businessUrl;
  designKeys.forEach(k=>{if($(k))$(k).value=d[k]});
  ['showAvatar','showDate','showSource','showSummary','autoplay'].forEach(k=>$(k).checked=Boolean(d[k]));
  ['title','subtitle','buttonText','buttonUrl'].forEach(k=>$(k).value=c[k]||'');
  sourceUI();reviewsUI();
}

function sourceUI(){
  const native=$('displayMode').value==='native';
  $('customModeInfo').style.display=native?'none':'block';
  $('nativeModeInfo').style.display=native?'block':'none';
  $('designLimit').style.display=native?'block':'none';
  $('yandexHeightField').style.display=native?'grid':'none';
  document.querySelectorAll('.customOnly').forEach(el=>el.classList.toggle('disabled',native));
  $('reviewsDisabled').style.display=native?'block':'none';
  $('reviewList').style.display=native?'none':'grid';
  $('modeBadge').textContent=native?'Яндекс Карты · официальный iframe':'Яндекс Карты · наш дизайн';
  $('modeBadge').classList.toggle('limited',native||!sourceMeta);
  $('reviewsSourceLabel').innerHTML=sourceMeta
    ? `<b>Источник: Яндекс Карты.</b> Загружено ${sourceMeta.reviews.length} отзывов${sourceMeta.fetchedAt?`, обновлено ${escapeHtml(new Date(sourceMeta.fetchedAt).toLocaleString('ru-RU'))}`:''}.`
    : '<b>Источник: Яндекс Карты.</b> Реальные данные ещё не синхронизированы. В предпросмотре временно показаны демонстрационные карточки.';
}

function reviewsUI(){
  const list=$('reviewList'),rs=data.reviews||[];
  list.innerHTML=rs.length?rs.map((r,i)=>`<div class="review ${r.hidden?'hidden':''} ${r.pinned?'pinned':''}"><div class="review-head"><div><div class="review-author">${escapeHtml(r.author||'Клиент')} · ${Number(r.rating||0)}★</div><div class="review-meta">${escapeHtml(r.date||'')} · Яндекс</div></div><b>${r.pinned?'PIN':''}</b></div><div class="review-text">${escapeHtml(r.text||'')}</div>${usingPreview?'':'<div class="review-actions"><button class="btn sm" onclick="togglePin('+i+')">'+(r.pinned?'Открепить':'Закрепить')+'</button><button class="btn sm" onclick="toggleHide('+i+')">'+(r.hidden?'Показать':'Скрыть')+'</button></div>'}</div>`).join(''):'<div class="muted">Отзывы не загружены.</div>';
}

window.togglePin=i=>{if(usingPreview)return;data.reviews[i].pinned=!data.reviews[i].pinned;if(data.reviews[i].pinned)data.reviews[i].pinOrder=Math.max(0,...data.reviews.filter(x=>x.pinned).map(x=>Number(x.pinOrder)||0))+1;save()};
window.toggleHide=i=>{if(usingPreview)return;data.reviews[i].hidden=!data.reviews[i].hidden;save()};

function payload(){
  if(data.display.mode==='native')return {mode:'yandex-live',source:{businessId:data.source.businessId,businessUrl:data.source.businessUrl},design:data.design,content:data.content};
  return {mode:'managed',reviews:(data.reviews||[]).filter(r=>!r.hidden),design:data.design,content:data.content};
}
function render(){if(inst?.stop)inst.stop();collect();const el=$('preview');el.innerHTML='';inst=UniversalReviews.mount(el,payload())}
function save(show=true){collect();localStorage.setItem(storageKey(),JSON.stringify({...data,reviews:[]}));if(show)setStatus('Настройки дизайна сохранены в этом браузере.','ok');sourceUI();reviewsUI();render()}

async function sync(){setStatus('Проверяю файл автоматической синхронизации Яндекса…');const ok=await fetchSource();fill();render();setStatus(ok?`Получено ${data.reviews.length} реальных отзывов из Яндекс Карт.`:'Новых данных пока нет. Синхронизация GitHub Actions ещё не сформировала reviews.json.',ok?'ok':'err')}

function applyPreset(name){
  if(name!=='etnika')return;
  data.design={...(data.design||{}),layout:'slider',columns:3,gap:16,radius:0,maxWidth:1440,fontFamily:'Geologica,Arial,sans-serif',titleFontFamily:'Forum,Georgia,serif',titleSize:48,bodySize:16,cardPadding:24,buttonRadius:0,borderWidth:1,accent:'#981018',background:'#f5f3f2',cardBackground:'#ffffff',textColor:'#0a0a0a',mutedColor:'#6f6f6f',borderColor:'#0a0a0a',starColor:'#981018',minRating:1,showAvatar:true,showDate:true,showSource:true,showSummary:true,autoplay:true,yandexHeight:620};
  fill();render();setStatus('Пресет ETNIKA применён.','ok');
}

function embedCode(){
  collect();
  const base=STATIC_MODE?location.href.replace(/[^/]*$/,''):`${location.origin}/`;
  if(data.display.mode==='native'){
    return `<div id="reviews-etnika"></div>\n<script src="${base}widget.js"><\/script>\n<script>UniversalReviews.mount('#reviews-etnika', ${JSON.stringify(payload()).replace(/</g,'\\u003c')});<\/script>`;
  }
  const config={design:data.design,content:data.content};
  return `<div id="reviews-etnika"></div>\n<script src="${base}widget.js"><\/script>\n<script>fetch('${base}data/reviews.json').then(r=>r.json()).then(d=>UniversalReviews.mount('#reviews-etnika',{mode:'managed',reviews:d.reviews||[],design:${JSON.stringify(config.design)},content:${JSON.stringify(config.content)}}));<\/script>`;
}

document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('on',x===b));document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('on',p.dataset.pane===b.dataset.tab))});
$('preset').onchange=()=>applyPreset($('preset').value);
$('displayMode').onchange=()=>{sourceUI();render()};
$('save').onclick=()=>save();$('saveDesign').onclick=()=>save();$('sync').onclick=sync;$('reload').onclick=load;
$('embed').onclick=()=>{const el=$('code');el.textContent=embedCode();el.classList.toggle('on')};
[...designKeys,'title','subtitle','buttonText','buttonUrl','showAvatar','showDate','showSource','showSummary','autoplay'].forEach(k=>$(k)?.addEventListener('input',render));
load();
