from pathlib import Path


def rep(path, old, new, required=True):
    p=Path(path)
    s=p.read_text(encoding='utf-8')
    if new in s:
        return
    if old not in s:
        if required:
            raise SystemExit(f'Pattern not found in {path}: {old[:120]!r}')
        return
    p.write_text(s.replace(old,new,1),encoding='utf-8')

# index.html — contextual layout settings + font weights
p=Path('index.html'); s=p.read_text(encoding='utf-8')
old='''      <div class="group customOnly">\n        <h3>Сетка и список</h3>\n        <div class="notice">Сетка и список не выводят все 204 отзыва сразу. Сначала показывается ограниченное количество карточек, затем кнопка «Показать ещё».</div>\n        <div class="row"><div class="field"><label>Сетка: карточек сначала</label><input id="gridInitialItems" type="number" min="1" max="30"></div><div class="field"><label>Список: карточек сначала</label><input id="listInitialItems" type="number" min="1" max="20"></div></div>\n        <div class="field"><label>Добавлять по нажатию «Показать ещё»</label><input id="loadMoreStep" type="number" min="1" max="30"></div>\n      </div>\n\n      <div class="group customOnly">\n        <h3>Слайдер</h3>'''
new='''      <div class="group customOnly" id="collectionSettings" style="display:none">\n        <h3 id="collectionSettingsTitle">Сетка</h3>\n        <div class="row"><div class="field"><label id="initialItemsLabel">Карточек сначала</label><input id="initialItems" type="number" min="1" max="30"></div><div class="field"><label>Добавлять по «Показать ещё»</label><input id="loadMoreStep" type="number" min="1" max="30"></div></div>\n      </div>\n\n      <div class="group customOnly" id="sliderSettings">\n        <h3>Слайдер</h3>'''
if old not in s: raise SystemExit('index layout block not found')
s=s.replace(old,new,1)
needle='''        <div class="field"><label>URL CSS шрифта (необязательно)</label><input id="fontCssUrl" placeholder="https://fonts.googleapis.com/css2?family=..."></div>\n        <div class="row"><div class="field"><label>Размер заголовка desktop</label>'''
insert='''        <div class="field"><label>URL CSS шрифта (необязательно)</label><input id="fontCssUrl" placeholder="https://fonts.googleapis.com/css2?family=..."></div>\n        <div class="triple font-weight-controls">\n          <div class="field"><label>Толщина текста</label><select id="bodyWeight"><option value="300">300 Light</option><option value="400">400 Regular</option><option value="500">500 Medium</option><option value="600">600 SemiBold</option><option value="700">700 Bold</option></select></div>\n          <div class="field"><label>Толщина заголовка</label><select id="titleWeight"><option value="300">300 Light</option><option value="400">400 Regular</option><option value="500">500 Medium</option><option value="600">600 SemiBold</option><option value="700">700 Bold</option></select></div>\n          <div class="field"><label>Имена и кнопки</label><select id="strongWeight"><option value="300">300 Light</option><option value="400">400 Regular</option><option value="500">500 Medium</option><option value="600">600 SemiBold</option><option value="700">700 Bold</option></select></div>\n        </div>\n        <div class="row"><div class="field"><label>Размер заголовка desktop</label>'''
if needle not in s: raise SystemExit('index typography block not found')
s=s.replace(needle,insert,1)
p.write_text(s,encoding='utf-8')

# builder.js
p=Path('builder.js'); s=p.read_text(encoding='utf-8')
s=s.replace("titleSize:38,mobileTitleSize:30,bodySize:15,", "titleSize:38,mobileTitleSize:30,bodySize:15,bodyWeight:400,titleWeight:500,strongWeight:500,",1)
s=s.replace("'gridInitialItems','listInitialItems','loadMoreStep','transitionMs','titleSize','mobileTitleSize','bodySize',", "'loadMoreStep','transitionMs','titleSize','mobileTitleSize','bodySize','bodyWeight','titleWeight','strongWeight',",1)
old_collect="d.autoplayDelay=Math.round(Math.max(1.2,Number($('autoplaySeconds').value)||4.5)*1000);d.fontFamily=familyFromControls('font');"
new_collect="const layout=$('layout').value;if(layout==='grid')d.gridInitialItems=Math.max(1,Number($('initialItems').value)||6);if(layout==='list')d.listInitialItems=Math.max(1,Number($('initialItems').value)||3);d.autoplayDelay=Math.round(Math.max(1.2,Number($('autoplaySeconds').value)||4.5)*1000);d.fontFamily=familyFromControls('font');"
if old_collect not in s: raise SystemExit('builder collect hook not found')
s=s.replace(old_collect,new_collect,1)
old_update="function updateFontUI(){const f=$('fontPreset').value,t=$('titleFontPreset').value;$('customFontWrap').style.display=f==='custom'?'grid':'none';$('customTitleFontWrap').style.display=t==='custom'?'grid':'none'}"
new_update=old_update+"\nfunction updateLayoutUI(){const l=$('layout').value,slider=l==='slider';$('sliderSettings').style.display=slider?'block':'none';$('collectionSettings').style.display=slider?'none':'block';if(!slider){$('collectionSettingsTitle').textContent=l==='grid'?'Сетка':'Список';$('initialItemsLabel').textContent=l==='grid'?'Карточек сначала':'Отзывов сначала';const d={...defaults.design,...(data.design||{})};$('initialItems').value=l==='grid'?(d.gridInitialItems||6):(d.listInitialItems||3)}}"
if old_update not in s: raise SystemExit('builder updateFontUI not found')
s=s.replace(old_update,new_update,1)
old_fill="$('fontCssUrl').value=d.fontCssUrl||'';updateFontUI();sourceUI();reviewsUI()"
new_fill="$('fontCssUrl').value=d.fontCssUrl||'';updateFontUI();updateLayoutUI();sourceUI();reviewsUI()"
if old_fill not in s: raise SystemExit('builder fill hook not found')
s=s.replace(old_fill,new_fill,1)
s=s.replace("titleSize:48,mobileTitleSize:34,bodySize:16,", "titleSize:48,mobileTitleSize:34,bodySize:16,bodyWeight:300,titleWeight:400,strongWeight:400,",1)
old_events="['fontPreset','titleFontPreset'].forEach(k=>$(k).addEventListener('change',()=>{updateFontUI();render()}));"
new_events=old_events+"\n$('layout').addEventListener('change',()=>{updateLayoutUI();render()});$('initialItems').addEventListener('input',render);"
if old_events not in s: raise SystemExit('builder event hook not found')
s=s.replace(old_events,new_events,1)
p.write_text(s,encoding='utf-8')

# widget.js — configurable weights
p=Path('widget.js'); s=p.read_text(encoding='utf-8')
s=s.replace("titleSize:38,bodySize:15,mobileTitleSize:30,", "titleSize:38,bodySize:15,mobileTitleSize:30,bodyWeight:400,titleWeight:500,strongWeight:500,",1)
s=s.replace("--u-body-size:15px;", "--u-body-size:15px;--u-body-weight:400;--u-title-weight:500;--u-strong-weight:500;",1)
s=s.replace("font-family:var(--u-font);color:var(--u-text);", "font-family:var(--u-font);font-weight:var(--u-body-weight);color:var(--u-text);",1)
s=s.replace(".urw-title{font-family:var(--u-title-font);font-size:var(--u-title-size);font-weight:600;", ".urw-title{font-family:var(--u-title-font);font-size:var(--u-title-size);font-weight:var(--u-title-weight);",1)
s=s.replace(".urw-author{font-weight:650;", ".urw-author{font-weight:var(--u-strong-weight);",1)
s=s.replace("font-size:13px;font-weight:600}.urw-viewport", "font-size:13px;font-weight:var(--u-strong-weight)}.urw-viewport",1)
s=s.replace("font:600 12px var(--u-font);", "font:var(--u-strong-weight) 12px var(--u-font);",1)
s=s.replace("font-size:12px;font-weight:600;color:var(--u-muted);", "font-size:12px;font-weight:var(--u-strong-weight);color:var(--u-muted);",1)
s=s.replace("font-size:12px;font-weight:700}.urw-response-date", "font-size:12px;font-weight:var(--u-strong-weight)}.urw-response-date",1)
s=s.replace("font:600 13px var(--u-font);", "font:var(--u-strong-weight) 13px var(--u-font);",1)
old_apply="s.setProperty('--u-body-size',`${Math.max(12,Number(d.bodySize)||15)}px`);s.setProperty('--u-card-pad'"
new_apply="s.setProperty('--u-body-size',`${Math.max(12,Number(d.bodySize)||15)}px`);s.setProperty('--u-body-weight',String(Math.max(100,Math.min(900,Number(d.bodyWeight)||400))));s.setProperty('--u-title-weight',String(Math.max(100,Math.min(900,Number(d.titleWeight)||500))));s.setProperty('--u-strong-weight',String(Math.max(100,Math.min(900,Number(d.strongWeight)||500))));s.setProperty('--u-card-pad'"
if old_apply not in s: raise SystemExit('widget apply hook not found')
s=s.replace(old_apply,new_apply,1)
p.write_text(s,encoding='utf-8')

print('UI v8 patch applied')
