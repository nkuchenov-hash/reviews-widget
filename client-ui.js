(function(){
'use strict';
const PROJECT_ID=(new URLSearchParams(location.search).get('project')||'etnika').trim();
function q(s){return document.querySelector(s)}
function qa(s){return [...document.querySelectorAll(s)]}
function closestField(id){const el=document.getElementById(id);return el?el.closest('.field'):null}
function hide(el){if(el)el.style.display='none'}
function text(el,v){if(el)el.textContent=v}
function relabel(id,v){const f=closestField(id);if(f){const l=f.querySelector('label');if(l)l.textContent=v}}
function groupOf(id){const el=document.getElementById(id);return el?el.closest('.group'):null}
function baseUrl(){return new URL('./',location.href).href}
function stableEmbed(){const b=baseUrl();return `<div data-reviews-project="${PROJECT_ID}"></div>\n<script src="${b}embed.js" defer><\/script>`}
function addInstallHint(){const code=document.getElementById('code');if(!code)return;const g=code.closest('.group');if(!g||g.querySelector('.client-install-hint'))return;const p=document.createElement('div');p.className='client-install-hint';p.innerHTML='<b>Установка занимает пару минут.</b><span>Скопируйте код и вставьте его в HTML-блок на сайте. Для Tilda подходит блок T123. Этот код постоянный — при обновлении опубликованного проекта менять его на сайте не нужно.</span>';g.insertBefore(p,code)}
function addProjectBadge(name){const sub=q('.sub');if(!sub||q('.client-project-badge'))return;const b=document.createElement('div');b.className='client-project-badge';b.textContent=name?`Проект: ${name}`:`Проект: ${PROJECT_ID}`;sub.insertAdjacentElement('afterend',b)}
function setControl(id,value){const el=document.getElementById(id);if(!el||value==null)return;if(el.type==='checkbox')el.checked=Boolean(value);else el.value=value}
async function loadProject(){
 try{
   const r=await fetch(`./projects/${encodeURIComponent(PROJECT_ID)}.json?v=${Date.now()}`,{cache:'no-store'});
   if(!r.ok)throw new Error('Project not found');
   const cfg=await r.json();
   addProjectBadge(cfg.name||PROJECT_ID);
   // The editor's own load() is the only code allowed to fill source and design controls.
 }catch(e){addProjectBadge(PROJECT_ID)}
}
function apply(){
 document.body.classList.add('client-mode');
 text(q('.brand'),'Виджет отзывов');
 text(q('.sub'),'Отзывы из Яндекс Карт в дизайне вашего сайта.');
 const tabs=qa('.tab'); if(tabs[0])tabs[0].textContent='Подключение'; if(tabs[1])tabs[1].textContent='Отзывы'; if(tabs[2])tabs[2].textContent='Дизайн';
 const source=document.querySelector('[data-pane="source"]');
 if(source){const hs=source.querySelectorAll('.group h3'); if(hs[0])hs[0].textContent='Источник отзывов'; if(hs[1])hs[1].textContent='Отображение'; if(hs[2])hs[2].textContent='Установка на сайт'}
 relabel('businessId','Business ID Яндекс Карт');
 const providerField=source&&source.querySelector('input[disabled]')?.closest('.field'); hide(providerField);
 relabel('businessUrl','Ссылка на карточку в Яндекс Картах');
 relabel('displayMode','Вид виджета');
 const dm=document.getElementById('displayMode'); if(dm&&dm.options.length>1){dm.options[0].text='Фирменный дизайн';dm.options[1].text='Официальный виджет Яндекса'}
 text(document.getElementById('save'),'Сохранить черновик');
 text(document.getElementById('sync'),'Проверить данные');
 text(document.getElementById('embed'),'Получить код для сайта');
 const custom=document.getElementById('customModeInfo'); if(custom)custom.innerHTML='<b>Фирменный дизайн:</b> отзывы остаются данными Яндекса, а внешний вид полностью настраивается под ваш сайт.';
 const native=document.getElementById('nativeModeInfo'); if(native)native.innerHTML='<b>Официальный виджет:</b> внешний вид задаёт Яндекс и изменить его нельзя.';
 const preset=document.getElementById('preset'); hide(preset&&preset.closest('.group'));
 const sg=groupOf('savedDesign'); if(sg){const h=sg.querySelector('h3'); if(h)h.textContent='Мои стили'};
 relabel('savedDesign','Сохранённый стиль'); relabel('designName','Название стиля');
 text(document.getElementById('saveDesign'),'Сохранить стиль'); text(document.getElementById('deleteDesign'),'Удалить');
 const map=groupOf('layout'); if(map){const h=map.querySelector('h3');if(h)h.textContent='Макет'};
 const typography=groupOf('fontPreset'); if(typography){const h=typography.querySelector('h3');if(h)h.textContent='Шрифты и размеры'};
 const colors=groupOf('accentPicker'); if(colors){const h=colors.querySelector('h3');if(h)h.textContent='Цвета'};
 const content=groupOf('showAvatar'); if(content){const h=content.querySelector('h3');if(h)h.textContent='Что показывать'};
 text(q('.top h1'),'Предпросмотр на сайте');
 qa('.view-btn').forEach(b=>{if(b.dataset.view==='desktop')b.textContent='Компьютер';if(b.dataset.view==='tablet')b.textContent='Планшет';if(b.dataset.view==='mobile')b.textContent='Телефон'});
 text(document.getElementById('reload'),'Обновить');
 addInstallHint();
 const badge=document.getElementById('modeBadge'); if(badge&&badge.textContent.includes('наш дизайн'))badge.textContent='Яндекс Карты · фирменный дизайн';
 // Use the builder's canonical published config and installation code; do not overwrite them.
 loadProject();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,0));else setTimeout(apply,0);
})();
