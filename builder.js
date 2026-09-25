const $=id=>document.getElementById(id);

const sampleReviews=[
{id:'demo1',author:'Анна',rating:5,date:'2026-09-20',source:'yandex',text:'Демо-отзыв для настройки внешнего вида. Реальная синхронизация с Яндексом ещё не подключена.',pinned:true,pinOrder:1},
{id:'demo2',author:'Мария',rating:5,date:'2026-09-16',source:'yandex',text:'Можно менять колонки, шрифт, радиусы, цвета и остальные параметры карточек.',pinned:false},
{id:'demo3',author:'Екатерина',rating:5,date:'2026-09-09',source:'yandex',text:'После подключения коннектора здесь будут реальные отзывы выбранной организации.',pinned:false},
{id:'demo4',author:'Ольга',rating:4,date:'2026-08-30',source:'yandex',text:'Сейчас эти карточки используются только как предпросмотр дизайна.',pinned:false},
{id:'demo5',author:'Алина',rating:5,date:'2026-08-24',source:'yandex',text:'Источник данных и режим отображения теперь настраиваются отдельно.',pinned:false}
];

const defaults={
  source:{provider:'yandex',businessId:'226327670406',businessUrl:'https://yandex.ru/maps/org/usadba_izmaylovo/226327670406/',url:'',syncEveryMinutes:60,connected:false},
  display:{mode:'custom'},
  design:{layout:'slider',columns:3,gap:18,radius:12,maxWidth:1200,fontFamily:'Inter,Arial,sans-serif',titleFontFamily:'Inter,Arial,sans-serif',titleSize:38,bodySize:16,cardPadding:22,buttonRadius:0,borderWidth:1,minRating:1,accent:'#111111',background:'#ffffff',cardBackground:'#ffffff',textColor:'#171717',mutedColor:'#777777',borderColor:'#e7e7e7',starColor:'#f2b01e',showAvatar:true,showDate:true,showSource:true,showSummary:true,autoplay:true,yandexHeight:620},
  content:{title:'Отзывы клиентов',subtitle:'Что говорят о нас',buttonText:'Оставить отзыв',buttonUrl:'',showHeader:true},
  reviews:sampleReviews
};
let data=structuredClone(defaults),inst;
const STATIC_MODE=location.hostname.endsWith('github.io')||location.protocol==='file:';

function storageKey(){return 'URW_WIDGET_V4_demo'}
function api(){return '/api/admin/widget/demo'}
function tokenHeaders(){const t=localStorage.getItem('URW_ADMIN_TOKEN')||'';return {'Content-Type':'application/json',...(t?{'X-Admin-Token':t}:{})}}

async function load(){
  try{
    if(STATIC_MODE){
      const saved=localStorage.getItem(storageKey());
      data=saved?JSON.parse(saved):structuredClone(defaults);
      migrate();
      fill();render();
      setStatus(saved?'Загружено из этого браузера.':'Конструктор готов. Источник и отображение теперь разделены.','ok');
      return;
    }
    const r=await fetch(api(),{headers:tokenHeaders()});
    if(r.status===404){data=structuredClone(defaults);await save(false)}
    else{if(!r.ok)throw new Error(`HTTP ${r.status}`);data=await r.json();migrate()}
    fill();render();setStatus('Загружено.','ok');
  }catch(e){setStatus(e.message,'err')}
}

function migrate(){
  data.source=data.source||{};
  if(!data.source.provider){
    if(data.source.type==='yandex-live')data.source.provider='yandex';
    else if(data.source.type==='json')data.source.provider='json';
    else data.source.provider='manual';
  }
  data.display=data.display||{mode:data.source.type==='yandex-live'?'native':'custom'};
  if(!Array.isArray(data.reviews)||!data.reviews.length)data.reviews=structuredClone(sampleReviews);
}

async function save(show=true){
  collect();
  if(STATIC_MODE){
    localStorage.setItem(storageKey(),JSON.stringify(data));
    if(show)setStatus('Сохранено в этом браузере.','ok');
    fill();render();return;
  }
  const r=await fetch(api(),{method:'PUT',headers:tokenHeaders(),body:JSON.stringify(data)});
  if(!r.ok)throw new Error((await r.json()).error||`HTTP ${r.status}`);
  data=await r.json();migrate();
  if(show)setStatus('Сохранено.','ok');
  fill();render();
}

async function sync(){
  collect();
  const p=data.source.provider,m=data.display.mode;
  if(STATIC_MODE){
    if(p==='yandex'&&m==='native'){
      setStatus('Официальный Yandex iframe обновляется самим Яндексом.','ok');
    }else if(p==='yandex'&&m==='custom'){
      setStatus('Для Яндекс → наш дизайн нужен backend-коннектор данных. Сейчас он ещё не подключён.','err');
    }else if(p==='json'){
      setStatus('Для автоматической JSON-синхронизации нужен backend.','err');
    }else{
      setStatus('Ручной источник не синхронизируется автоматически.','err');
    }
    return;
  }
  await save(false);
  const r=await fetch(api()+'/sync',{method:'POST',headers:tokenHeaders()});
  const j=await r.json();
  if(!r.ok)throw new Error(j.error||`HTTP ${r.status}`);
  data=j;migrate();fill();render();setStatus('Синхронизировано.','ok');
}

function setStatus(s,c=''){const el=$('status');el.textContent=s;el.className='status '+c}

const designKeys=['layout','columns','radius','gap','maxWidth','cardPadding','borderWidth','buttonRadius','minRating','fontFamily','titleFontFamily','titleSize','bodySize','accent','background','cardBackground','textColor','borderColor','starColor','yandexHeight'];

function fill(){
  const s={...defaults.source,...(data.source||{})},d={...defaults.design,...(data.design||{})},c={...defaults.content,...(data.content||{})};
  $('provider').value=s.provider||'yandex';
  $('displayMode').value=data.display?.mode||'custom';
  $('businessId').value=s.businessId||'';
  $('businessUrl').value=s.businessUrl||'';
  $('jsonUrl').value=s.url||'';
  $('syncEveryMinutes').value=s.syncEveryMinutes||60;
  designKeys.forEach(k=>{if($(k))$(k).value=d[k]});
  ['showAvatar','showDate','showSource','showSummary','autoplay'].forEach(k=>$(k).checked=Boolean(d[k]));
  ['title','subtitle','buttonText','buttonUrl'].forEach(k=>$(k).value=c[k]||'');
  sourceUI();reviewsUI();
}

function collect(){
  data.source={...(data.source||{}),provider:$('provider').value,businessId:$('businessId').value.trim(),businessUrl:$('businessUrl').value.trim(),url:$('jsonUrl').value.trim(),syncEveryMinutes:Math.max(5,Number($('syncEveryMinutes').value)||60)};
  data.display={mode:$('displayMode').value};
  data.design={...(data.design||{}),layout:$('layout').value,columns:Number($('columns').value),radius:Number($('radius').value),gap:Number($('gap').value),maxWidth:Number($('maxWidth').value),cardPadding:Number($('cardPadding').value),borderWidth:Number($('borderWidth').value),buttonRadius:Number($('buttonRadius').value),minRating:Number($('minRating').value),fontFamily:$('fontFamily').value,titleFontFamily:$('titleFontFamily').value,titleSize:Number($('titleSize').value),bodySize:Number($('bodySize').value),accent:$('accent').value,background:$('background').value,cardBackground:$('cardBackground').value,textColor:$('textColor').value,borderColor:$('borderColor').value,starColor:$('starColor').value,yandexHeight:Number($('yandexHeight').value),showAvatar:$('showAvatar').checked,showDate:$('showDate').checked,showSource:$('showSource').checked,showSummary:$('showSummary').checked,autoplay:$('autoplay').checked};
  data.content={...(data.content||{}),title:$('title').value,subtitle:$('subtitle').value,buttonText:$('buttonText').value,buttonUrl:$('buttonUrl').value,showHeader:true};
}

function sourceUI(){
  const p=$('provider').value,m=$('displayMode').value,isY=p==='yandex',isNative=m==='native',validNative=isY&&isNative;
  $('yandexFields').style.display=isY?'block':'none';
  $('jsonFields').style.display=p==='json'?'block':'none';
  $('manualFields').style.display=p==='manual'?'block':'none';
  $('customModeInfo').style.display=!isNative?'block':'none';
  $('nativeModeInfo').style.display=validNative?'block':'none';
  $('invalidModeInfo').style.display=isNative&&!isY?'block':'none';
  $('designLimit').style.display=isNative?'block':'none';
  $('yandexHeightField').style.display=validNative?'grid':'none';

  document.querySelectorAll('.customOnly').forEach(el=>el.classList.toggle('disabled',isNative));

  const reviewsDisabled=isNative;
  $('reviewsDisabled').style.display=reviewsDisabled?'block':'none';
  $('reviewList').style.display=reviewsDisabled?'none':'grid';

  if(p==='yandex'&&m==='custom'){
    $('reviewsSourceLabel').innerHTML='<b>Источник: Яндекс Карты.</b> Сейчас показаны демо-карточки для настройки дизайна. Реальные отзывы появятся после подключения коннектора данных.';
    $('modeBadge').textContent='Яндекс · наш дизайн · коннектор не подключён';
    $('modeBadge').classList.add('limited');
  }else if(validNative){
    $('reviewsSourceLabel').innerHTML='<b>Источник: Яндекс Карты.</b> Отзывы отображаются официальным iframe.';
    $('modeBadge').textContent='Яндекс · официальный iframe';
    $('modeBadge').classList.add('limited');
  }else if(p==='json'){
    $('reviewsSourceLabel').innerHTML='<b>Источник: JSON / API.</b> После синхронизации карточками можно управлять здесь.';
    $('modeBadge').textContent='JSON/API · наш дизайн';
    $('modeBadge').classList.toggle('limited',isNative);
  }else{
    $('reviewsSourceLabel').innerHTML='<b>Источник: ручной.</b> Отзывы хранятся внутри сервиса.';
    $('modeBadge').textContent='Ручной источник · наш дизайн';
    $('modeBadge').classList.toggle('limited',isNative);
  }
}

function reviewsUI(){
  const list=$('reviewList'),rs=data.reviews||[];
  list.innerHTML=rs.length?rs.map((r,i)=>`<div class="review ${r.hidden?'hidden':''} ${r.pinned?'pinned':''}"><div class="review-head"><div><div class="review-author">${escapeHtml(r.author||'Клиент')} · ${Number(r.rating||0)}★</div><div class="review-meta">${escapeHtml(r.date||'')} · ${escapeHtml(r.source||data.source.provider||'custom')}</div></div><b>${r.pinned?'PIN':''}</b></div><div class="review-text">${escapeHtml(r.text||'')}</div><div class="review-actions"><button class="btn sm" onclick="togglePin(${i})">${r.pinned?'Открепить':'Закрепить'}</button><button class="btn sm" onclick="toggleHide(${i})">${r.hidden?'Показать':'Скрыть'}</button>${r.pinned?`<button class="btn sm" onclick="movePin(${i},-1)">↑</button><button class="btn sm" onclick="movePin(${i},1)">↓</button>`:''}</div></div>`).join(''):'<div class="muted">Отзывов пока нет.</div>';
}

window.togglePin=async i=>{data.reviews[i].pinned=!data.reviews[i].pinned;if(data.reviews[i].pinned)data.reviews[i].pinOrder=Math.max(0,...data.reviews.filter(x=>x.pinned).map(x=>Number(x.pinOrder)||0))+1;await save()};
window.toggleHide=async i=>{data.reviews[i].hidden=!data.reviews[i].hidden;await save()};
window.movePin=async(i,dir)=>{const pins=data.reviews.filter(x=>x.pinned).sort((a,b)=>(a.pinOrder||0)-(b.pinOrder||0)),r=data.reviews[i],p=pins.indexOf(r),q=p+dir;if(q<0||q>=pins.length)return;const t=r.pinOrder;r.pinOrder=pins[q].pinOrder;pins[q].pinOrder=t;await save()};

function payload(){
  const p=data.source.provider,m=data.display.mode;
  if(p==='yandex'&&m==='native')return {mode:'yandex-live',source:{businessId:data.source.businessId,businessUrl:data.source.businessUrl},design:data.design,content:data.content};
  return {mode:'managed',reviews:(data.reviews||[]).filter(r=>!r.hidden),design:data.design,content:data.content};
}

function render(){
  if(inst?.stop)inst.stop();
  const el=$('preview');el.innerHTML='';
  collect();
  inst=UniversalReviews.mount(el,payload());
}

function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

function applyPreset(name){
  if(name!=='etnika')return;
  data.design={...(data.design||{}),layout:'slider',columns:3,gap:16,radius:0,maxWidth:1440,fontFamily:'Geologica,Arial,sans-serif',titleFontFamily:'Forum,Georgia,serif',titleSize:48,bodySize:16,cardPadding:24,buttonRadius:0,borderWidth:1,accent:'#981018',background:'#f5f3f2',cardBackground:'#ffffff',textColor:'#0a0a0a',mutedColor:'#6f6f6f',borderColor:'#0a0a0a',starColor:'#981018',minRating:1,showAvatar:true,showDate:true,showSource:true,showSummary:true,autoplay:true,yandexHeight:620};
  fill();render();setStatus('Пресет ETNIKA применён.','ok');
}

document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('on',x===b));document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('on',p.dataset.pane===b.dataset.tab))});
$('preset').onchange=()=>applyPreset($('preset').value);
$('provider').onchange=()=>{if($('provider').value!=='yandex'&&$('displayMode').value==='native')$('displayMode').value='custom';sourceUI();render()};
$('displayMode').onchange=()=>{if($('displayMode').value==='native'&&$('provider').value!=='yandex'){$('displayMode').value='custom';setStatus('Официальный iframe сейчас доступен только для Яндекс Карт.','err')}sourceUI();render()};
$('save').onclick=()=>save().catch(e=>setStatus(e.message,'err'));
$('saveDesign').onclick=()=>save().catch(e=>setStatus(e.message,'err'));
$('sync').onclick=()=>sync().catch(e=>setStatus(e.message,'err'));
$('reload').onclick=load;
$('embed').onclick=()=>{
  collect();
  if(data.source.provider==='yandex'&&data.display.mode==='custom'&&!data.source.connected){
    $('code').textContent='Для live-виджета Яндекс в нашем дизайне сначала нужно подключить backend-коннектор данных. Сейчас код с реальными автоматически обновляемыми отзывами сгенерировать нельзя.';
    $('code').classList.add('on');return;
  }
  const id='demo',base=STATIC_MODE?location.href.replace(/[^/]*$/,''):`${location.origin}/`;
  const publicData=payload();
  const safeJson=JSON.stringify(publicData).replace(/</g,'\\u003c');
  const code=`<div id="reviews-${id}"></div>\n<script src="${base}widget.js"><\/script>\n<script>UniversalReviews.mount('#reviews-${id}', ${safeJson});<\/script>`;
  $('code').textContent=code;$('code').classList.add('on');
};
[...designKeys,'title','subtitle','buttonText','buttonUrl','showAvatar','showDate','showSource','showSummary','autoplay'].forEach(k=>$(k)?.addEventListener('input',render));
load();
