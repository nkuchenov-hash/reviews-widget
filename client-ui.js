(function(){
'use strict';
function q(s){return document.querySelector(s)}
function qa(s){return [...document.querySelectorAll(s)]}
function closestField(id){const el=document.getElementById(id);return el?el.closest('.field'):null}
function hide(el){if(el)el.style.display='none'}
function text(el,v){if(el)el.textContent=v}
function relabel(id,v){const f=closestField(id);if(f){const l=f.querySelector('label');if(l)l.textContent=v}}
function groupOf(id){const el=document.getElementById(id);return el?el.closest('.group'):null}
function addInstallHint(){const code=document.getElementById('code');if(!code)return;const g=code.closest('.group');if(!g||g.querySelector('.client-install-hint'))return;const p=document.createElement('div');p.className='client-install-hint';p.innerHTML='<b>Установка занимает пару минут.</b><span>Скопируйте код и вставьте его в HTML-блок на сайте. Для Tilda подходит блок T123.</span>';g.insertBefore(p,code)}
function apply(){
 document.body.classList.add('client-mode');
 text(q('.brand'),'Виджет отзывов');
 text(q('.sub'),'Отзывы из Яндекс Карт в дизайне вашего сайта.');
 const tabs=qa('.tab'); if(tabs[0])tabs[0].textContent='Подключение'; if(tabs[1])tabs[1].textContent='Отзывы'; if(tabs[2])tabs[2].textContent='Дизайн';
 const source=document.querySelector('[data-pane="source"]');
 if(source){
   const hs=source.querySelectorAll('.group h3'); if(hs[0])hs[0].textContent='Источник отзывов'; if(hs[1])hs[1].textContent='Отображение'; if(hs[2])hs[2].textContent='Установка на сайт';
 }
 hide(closestField('businessId'));
 const providerField=source&&source.querySelector('input[disabled]')?.closest('.field'); hide(providerField);
 relabel('businessUrl','Ссылка на карточку в Яндекс Картах');
 relabel('displayMode','Вид виджета');
 const dm=document.getElementById('displayMode'); if(dm&&dm.options.length>1){dm.options[0].text='Фирменный дизайн';dm.options[1].text='Официальный виджет Яндекса'}
 text(document.getElementById('save'),'Сохранить');
 text(document.getElementById('sync'),'Проверить данные');
 text(document.getElementById('embed'),'Получить код для сайта');
 const custom=document.getElementById('customModeInfo'); if(custom)custom.innerHTML='<b>Фирменный дизайн:</b> отзывы остаются данными Яндекса, а внешний вид полностью настраивается под ваш сайт.';
 const native=document.getElementById('nativeModeInfo'); if(native)native.innerHTML='<b>Официальный виджет:</b> внешний вид задаёт Яндекс и изменить его нельзя.';
 const preset=document.getElementById('preset'); hide(preset&&preset.closest('.group'));
 const saved=document.getElementById('savedDesign'); const sg=groupOf('savedDesign'); if(sg){const h=sg.querySelector('h3'); if(h)h.textContent='Мои стили'};
 relabel('savedDesign','Сохранённый стиль'); relabel('designName','Название стиля');
 text(document.getElementById('saveDesign'),'Сохранить стиль'); text(document.getElementById('deleteDesign'),'Удалить');
 const map=groupOf('layout'); if(map){const h=map.querySelector('h3');if(h)h.textContent='Макет'};
 const typography=groupOf('fontPreset'); if(typography){const h=typography.querySelector('h3');if(h)h.textContent='Шрифты и размеры'};
 const colors=groupOf('accentPicker'); if(colors){const h=colors.querySelector('h3');if(h)h.textContent='Цвета'};
 const content=groupOf('showAvatar'); if(content){const h=content.querySelector('h3');if(h)h.textContent='Что показывать'};
 const top=q('.top h1'); text(top,'Предпросмотр на сайте');
 qa('.view-btn').forEach(b=>{if(b.dataset.view==='desktop')b.textContent='Компьютер';if(b.dataset.view==='tablet')b.textContent='Планшет';if(b.dataset.view==='mobile')b.textContent='Телефон'});
 text(document.getElementById('reload'),'Обновить');
 addInstallHint();
 const badge=document.getElementById('modeBadge'); if(badge&&badge.textContent.includes('наш дизайн'))badge.textContent='Яндекс Карты · фирменный дизайн';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,0));else setTimeout(apply,0);
})();