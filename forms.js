import {LABELS} from './data.js';
import {escapeHtml as e,fullDate} from './ui.js';
import {dayNumber,isoDay,gestation} from './engine.js';

export const options=(items,selected)=>Object.entries(items).map(([value,label])=>`<option value="${e(value)}" ${String(value)===String(selected)?'selected':''}>${e(label)}</option>`).join('');
const select=(name,label,items,value,extra='')=>`<div class="field"><label for="f-${name}">${label}</label><select id="f-${name}" name="${name}" ${extra}>${options(items,value)}</select></div>`;
const input=(name,label,value,type='text',extra='')=>`<div class="field"><label for="f-${name}">${label}</label><input id="f-${name}" name="${name}" type="${type}" value="${e(value)}" ${extra}></div>`;
const textarea=(name,label,value='',extra='')=>`<div class="field full"><label for="f-${name}">${label}</label><textarea id="f-${name}" name="${name}" maxlength="1200" ${extra}>${e(value)}</textarea></div>`;
const hidden=(name,value)=>`<input type="hidden" name="${name}" value="${e(value)}">`;
const note='<p class="modal-note">Kizárólag fiktív adatot adj meg. A változás ezen a böngészőlapon marad, nem kerül valódi betegnyilvántartásba.</p>';
const pregnancy={singleton:'Egyes terhesség',twins:'Ikerterhesség – külön felülvizsgálat',unknown:'Nem ismert'};
const vanished={no:'Nincs ilyen előzmény',yes:'Van ilyen előzmény',unknown:'Nem ismert'};

export function newCaseForm(state){return {action:'new-case',title:'Új fiktív eset',submit:'Bemutatóeset létrehozása',body:note+
  `<div class="form-grid">${select('chromosome','NIPT által jelzett kromoszóma',Object.fromEntries(Array.from({length:22},(_,i)=>[i+1,`${i+1}-es kromoszóma${[7,15,16,22].includes(i+1)?' · kezdő betegút':' · külön felülvizsgálat'}`])),16)}
  <div class="field"><label for="f-weeks">Terhességi kor</label><div class="inline-fields"><input id="f-weeks" name="weeks" type="number" min="0" max="44" value="14" required aria-label="Terhességi hét"><input name="days" type="number" min="0" max="6" value="0" required aria-label="További napok"></div><small>Hét + nap (0–6)</small></div>
  ${input('anchorDate','A terhességi kor viszonyítási napja',state.demoDate,'date',`required max="${state.demoDate}"`)}
  ${input('niptDate','A fiktív NIPT-lelet dátuma',isoDay(dayNumber(state.demoDate)-3),'date',`required max="${state.demoDate}"`)}
  ${select('findingType','Lelet típusa',{whole_trisomy:'Egy teljes kromoszóma triszómiájának jelzése',segmental:'Kromoszómaszakasz eltérése',multiple:'Több kromoszómát érintő jelzés',no_call:'Nem értékelhető eredmény'},'whole_trisomy')}
  ${select('pregnancyType','Terhesség típusa',pregnancy,'singleton')}${select('vanishingTwin','Eltűnő iker előzménye',vanished,'no')}
  ${select('assay','A leleten szereplő módszer',{MPS:'MPS – bemutatómódszer',unknown:'Nem ismert'},'MPS')}
  ${select('lab','Vizsgáló labor',{'Bemutató Genetikai Labor':'Bemutató Genetikai Labor',unknown:'Nem ismert'},'Bemutató Genetikai Labor')}
  <label class="check-label field full"><input type="checkbox" name="synthetic" required> Megerősítem, hogy fiktív bemutatóesetet rögzítek.</label></div>`};}

export function observationForm(state,c,correctId=null){
  const old=c.observations.find(o=>o.id===correctId),kind=old?.kind||'diagnostic';
  const o=old||{specimen:'amniotic_fluid',method:'karyotype',result:'pending',coversTarget:false,observedOn:state.demoDate,note:''};
  return {action:'observation',title:old?'Fiktív lelet helyesbítése':'Új fiktív lelet',submit:old?'Helyesbítés rögzítése':'Lelet rögzítése',body:note+hidden('caseId',c.id)+hidden('supersedes',correctId||'')+
    `<div class="form-grid">${select('kind','Vizsgálat típusa',LABELS.kind,kind,old?'disabled':'')}${old?hidden('kind',kind):''}
    ${input('observedOn','Vizsgálat / mintavétel napja',o.observedOn,'date',`required max="${state.demoDate}"`)}
    ${select('specimen','Minta típusa',LABELS.specimen,o.specimen)}${select('method','Vizsgálati módszer',LABELS.method,o.method)}
    ${select('result','Rögzített fiktív eredmény',LABELS.result,o.result)}
    <label class="check-label field full"><input type="checkbox" name="coversTarget" ${o.coversTarget?'checked':''}> A lelet kifejezetten lefedi a jelzett T${c.chromosome} eltérést / a célzott UPD-kérdést.</label>
    ${textarea('note',old?'A helyesbítés indoka':'Bemutatómegjegyzés (nem kötelező)',old?'':o.note,old?'required minlength="5"':'')}
    </div><div class="callout section-gap"><p>A minta, a módszer és a lefedettség együtt számít. A „nem szerepel eltérés” nem általános egészségi állítás.</p></div>`};
}

export function planForm(state,c,evaluation){
  const r=evaluation.output;
  const summary={
    diagnostic:'A fiktív pozitív szűrőlelet tisztázásának lehetőségeit genetikai konzultáción beszéljük át. A NIPT önmagában nem jelent végleges diagnózist.',
    diagnostic_pending:'A fiktív lelet mintatípusát és vizsgálati lefedettségét külön áttekintjük. A következő lépésről a szakmai megbeszélésen születik döntés.',
    discordant:'A fiktív magzatvíz-leletben a célzott eltérést nem találták. A még nyitott UPD-kérdést és a későbbi gondozás tervét külön egyeztetjük.',
    followup:'A fiktív magzatvíz-leletben a célzott eltérést nem találták. A további genetikai kérdéseket és a gondozási tervet külön áttekintjük; a lepényi eredet nincs automatikusan igazolva.',
    fetal_finding:'A fiktív megerősítő leletben eltérés szerepel. A jelentőségét és a további gondozás lehetőségeit szakorvosi konzultáción beszéljük át.',
    specialist_review:'Ez a fiktív helyzet külön szakértői felülvizsgálatot igényel. A bemutató nem határoz meg önálló vizsgálati vagy kezelési lépést.'
  }[r.stage]||'A fiktív eset további lépéseit külön egyeztetjük.';
  return {action:'approve',title:'Bemutatóterv áttekintése',submit:'Fiktív terv elfogadása',body:note+hidden('caseId',c.id)+hidden('evaluationId',evaluation.id)+hidden('proposedTask',r.steps[0]?.title||'')+
    `<div class="lead-question"><strong>${e(r.stageLabel)}</strong><br>${e(r.steps[0]?.title||'Lezárt eset')}</div><div class="form-grid">
    ${textarea('summary','Páciensnek szánt fiktív összefoglaló',summary,'required minlength="10"')}
    <div class="field full">${input('taskTitle','Megbeszélt teendő',r.steps[0]?.title||'Szakmai egyeztetés','text','required minlength="5" maxlength="160"')}</div>
    ${input('dueDate','A bemutató teendő választott dátuma',isoDay(dayNumber(state.demoDate)+7),'date',`required min="${state.demoDate}"`)}
    <div class="field"><label>Időzítési megjegyzés</label><small>A dátumot a demóban te választod. Ez nem a klinikai vizsgálat ajánlott időpontja.</small></div>
    <label class="check-label field full"><input type="checkbox" name="override"> Eltérő lépést választok a bemutató javaslathoz képest.</label>
    ${textarea('overrideReason','Eltérés indoka (eltérő lépésnél kötelező)')}
    <label class="check-label field full"><input type="checkbox" required name="acknowledge"> Ez kizárólag fiktív tervelfogadás, nem klinikai jóváhagyás.</label></div>`};
}

export function datingForm(state,c){const ga=gestation(c,state.demoDate);return {action:'dating',title:'Terhességi kor pontosítása',submit:'Pontosítás rögzítése',body:note+hidden('caseId',c.id)+
  `<div class="form-grid">${input('weeks','Terhességi hét',Math.floor(ga/7),'number','min="0" max="44" required')}${input('days','További napok',ga%7,'number','min="0" max="6" required')}
  ${input('anchorDate','Viszonyítási nap',state.demoDate,'date',`required max="${state.demoDate}"`)}${textarea('reason','A pontosítás indoka','','required minlength="5"')}</div>`};}

export function contextForm(state,c){return {action:'context',title:'Esetadatok pontosítása',submit:'Pontosítás rögzítése',body:note+hidden('caseId',c.id)+
  `<div class="form-grid">${select('pregnancyType','Terhesség típusa',pregnancy,c.pregnancyType)}${select('vanishingTwin','Eltűnő iker előzménye',vanished,c.vanishingTwin)}
  ${select('lab','Vizsgáló labor',{'Bemutató Genetikai Labor':'Bemutató Genetikai Labor',unknown:'Nem ismert'},c.lab)}
  ${select('assay','Módszer',{MPS:'MPS – bemutatómódszer',unknown:'Nem ismert'},c.assay)}
  ${textarea('reason','A pontosítás indoka','','required minlength="5"')}</div>`};}

export function closeForm(state,c){return {action:'close-case',title:'Fiktív eset lezárása',submit:'Bemutatóeset lezárása',body:note+hidden('caseId',c.id)+
  `<div class="form-grid">${select('outcome','A követés lezárásának módja',{birth:LABELS.outcome.birth,loss:LABELS.outcome.loss,termination:LABELS.outcome.termination,transferred:LABELS.outcome.transferred},'birth')}
  ${textarea('note','Fiktív lezáró megjegyzés','','required minlength="5"')}</div><div class="callout section-gap"><p>A nyitott teendők lezáródnak. A korábbi leletek, tervek és napló megmaradnak.</p></div>`};}

export function dateForm(state){return {action:'demo-date',title:'A bemutató idejének változtatása',submit:'Demódátum beállítása',body:`<p class="modal-note">A fiktív terhességi korok és a teendők ehhez a naphoz igazodnak. A korábbi tervváltozatok megőrzik saját dátumukat.</p><div class="form-grid">${input('demoDate','Bemutató dátuma',state.demoDate,'date','required min="2026-01-01" max="2027-12-31"')}</div>`};}

export function replayContent(evaluation,replayed){const same=JSON.stringify(replayed)===JSON.stringify(evaluation.output);return {
  title:'Korábbi értékelés',body:`<span class="badge ${same?'teal':'amber'}">${same?'Az értékelés változatlanul visszajátszható':'Az értékelés eltérést mutat'}</span><h3 class="section-gap">${e(evaluation.output.stageLabel)}</h3><p class="muted">${fullDate(evaluation.asOf)} · ${evaluation.revision}. adatváltozat · ${e(evaluation.output.rulesVersion)}</p><p>A megőrzött bemeneti állapot és szabálycsomag alapján.</p><details><summary>Megőrzött fiktív bemeneti adatok</summary><pre class="technical-detail">${e(JSON.stringify(evaluation.input,null,2))}</pre></details>`};}

export function planVersionContent(view){const p=view.plan;return {title:`${p.version}. bemutatóterv-változat`,body:
  `<span class="badge ${view.isCurrentPublished?'teal':'neutral'}">${view.isCurrentPublished?'Jelenlegi páciensnézet':view.wasPublished?'Korábban megosztott változat':'Elfogadott, nem megosztott változat'}</span><p class="muted section-gap">${fullDate(p.acceptedOn)} · ${p.caseRevision}. adatváltozat · ${e(p.snapshot.rulesVersion)}</p><h3>Megőrzött összefoglaló</h3><p>${e(p.summary)}</p><h3 class="section-gap">Az ebben a változatban elfogadott teendő</h3><p>${e(p.taskTitle)}<br>${fullDate(p.dueDate)}</p>${p.overrideReason?`<h3>Eltérés indoklása</h3><p>${e(p.overrideReason)}</p>`:''}<p class="modal-note section-gap">Történeti bemutatóváltozat; megtekintése nem módosítja az esetet vagy a páciensnézetet.</p>`};}
