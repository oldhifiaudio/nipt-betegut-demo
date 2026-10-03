import {createDemoState,LABELS} from './data.js';
import {currentEvaluation,getCase,createCase,recordObservation,correctDating,updateContext,evaluateCase,
  approvePlan,publishPlan,completeTask,closeCase,replayEvaluation,isPlanCurrent,getPlanSnapshot} from './state.js';
import {gestation,weekLabel,dayNumber} from './engine.js';
import {CHROMOSOMES} from './knowledge.js';
import {escapeHtml as esc,fullDate,icon,mark} from './ui.js';
import {casePanel,patientPanel,knowledgePanel,projectPanel,printMarkup} from './panels.js';
import {newCaseForm,observationForm,planForm,datingForm,contextForm,closeForm,dateForm,replayContent,planVersionContent} from './forms.js';

const KEY='nipt-demo-v1';
let state=createDemoState(),filter='all',toastTimer,lastFocus;
try{
  const saved=JSON.parse(sessionStorage.getItem(KEY)||'null');
  if(saved?.schemaVersion===1&&Number.isFinite(dayNumber(saved.demoDate))&&Array.isArray(saved.cases)&&
    saved.cases.length&&saved.cases.every(c=>typeof c.id==='string'&&Array.isArray(c.observations)&&
      Array.isArray(c.evaluations)&&Array.isArray(c.plans)&&Array.isArray(c.audit)&&Array.isArray(c.tasks)))state=saved;
}catch{/* An unreadable synthetic session starts with the documented baseline. */}
const app=document.querySelector('#app'),modal=document.querySelector('#modal');
function toast(message){const t=document.querySelector('#toast');t.textContent=message;t.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),4500);}
function persist(){try{sessionStorage.setItem(KEY,JSON.stringify(state));}catch{toast('A módosítások most csak a megnyitott oldalon maradnak meg; frissítéskor elveszhetnek.');}}
const route=()=>{const [page,id,tab]=location.hash.replace(/^#\/?/,'').split('/');return{page:page||'overview',id,tab};};
const navigate=hash=>{if(location.hash===hash)render();else location.hash=hash;};

function badge(c){
  const r=currentEvaluation(state,c).output;
  if(c.outcome!=='ongoing')return '<span class="badge neutral">Lezárt</span>';
  if(r.support==='unsupported')return '<span class="badge neutral">Hatókörön kívül</span>';
  if(r.support==='needs_data'||r.support==='invalid')return '<span class="badge amber">Adatpontosítás szükséges</span>';
  const p=c.plans.find(x=>x.id===c.publishedPlanId);
  return isPlanCurrent(state,c,p)?'<span class="badge teal">Megosztott demóterv</span>':'<span class="badge amber">Áttekintésre vár</span>';
}
function overview(allCases=false){
  const active=state.cases.filter(c=>c.outcome==='ongoing');
  const shared=active.filter(c=>c.plans.some(p=>p.id===c.publishedPlanId&&isPlanCurrent(state,c,p)));
  const cases=state.cases.filter(c=>filter==='all'||(filter==='active'?c.outcome==='ongoing':c.outcome!=='ongoing'));
  return `<div class="page-heading"><div><h1>${allCases?'Bemutatóesetek':'Esetáttekintés'}</h1><p>A lelettől a következő megbeszélt lépésig.</p></div><div class="heading-actions"><button class="button primary" data-action="new-case">${icon('plus')} Új demóeset</button></div></div>
    <div class="stats"><div class="stat"><div class="stat-icon">${icon('case')}</div><div><div class="stat-number">${active.length}</div><div class="stat-label">Folyamatban lévő eset</div></div></div><div class="stat"><div class="stat-icon">${icon('share')}</div><div><div class="stat-number">${shared.length}</div><div class="stat-label">Páciensnek megosztva</div></div></div><div class="stat"><div class="stat-icon">${icon('clock')}</div><div><div class="stat-number">${active.length-shared.length}</div><div class="stat-label">Áttekintésre vár</div></div></div></div>
    <div class="dashboard-grid"><div class="card"><div class="card-header"><h2>${allCases?'Minden eset':'Bemutatóesetek'}</h2><small>${state.cases.length} fiktív eset</small></div><div class="filters" aria-label="Esetszűrő">${[['all','Mind'],['active','Folyamatban'],['closed','Lezárt']].map(([id,label])=>`<button class="filter ${filter===id?'active':''}" aria-pressed="${filter===id}" data-filter="${id}">${label}</button>`).join('')}</div><div class="table-wrap"><table class="case-table"><thead><tr><th>Eset</th><th>NIPT-jelzés</th><th>Terhességi kor</th><th>Állapot</th><th><span class="sr-only">Megnyitás</span></th></tr></thead><tbody>${cases.map(c=>`<tr><td><a class="case-link" href="#case/${esc(c.id)}">${esc(c.label)}</a><span class="case-code mono">${esc(c.code)}</span></td><td><span class="chromosome c${c.chromosome}">T${c.chromosome}</span></td><td><span class="nowrap">${weekLabel(gestation(c,state.demoDate))} hét</span></td><td>${badge(c)}</td><td><a class="button small" href="#case/${esc(c.id)}" aria-label="${esc(c.label)} megnyitása">Megnyitás</a></td></tr>`).join('')||'<tr><td colspan="5">Ebben a csoportban nincs eset.</td></tr>'}</tbody></table></div><div class="card-foot">${icon('calendar')} Bemutató dátuma: ${fullDate(state.demoDate)} <button class="button subtle small" data-action="demo-date">Módosítás</button></div></div>
    <aside class="side-stack"><div class="card card-pad feature-panel"><div class="eyebrow">Közös kiindulópont</div><h2>Egy betegút.<br>Két érthető nézet.</h2><div class="feature-line"></div><p>Az orvos a forrásokat és a döntési pontokat látja. A páciens az egyeztetett tervét követheti.</p><button class="button" data-action="patient-preview">${icon('heart')} Páciensnézet kipróbálása</button></div><div class="card card-pad"><h3>Próbáld végig a folyamatot</h3><div class="guide-step"><span>1</span><p>Nyiss meg egy fiktív esetet.</p></div><div class="guide-step"><span>2</span><p>Rögzíts leletet, majd tekintsd át a tervet.</p></div><div class="guide-step"><span>3</span><p>Válts a páciens nézetére.</p></div><a class="button subtle small" href="#project">A bemutató működése</a></div></aside></div><div class="scope-note">${icon('info')}<span>A demó T7, T15, T16 és T22 jelzéseket mutat be egyes terhességben. Minden más helyzet külön szakmai felülvizsgálatot jelez.</span></div>`;
}

function render(){
  const r=route(),patient=r.page==='patient';let content;
  try{
    if(r.page==='case'||patient){const c=getCase(state,r.id||state.selectedCaseId);state.selectedCaseId=c.id;content=patient?patientPanel(state,c):casePanel(state,c,r.tab||'path');}
    else if(r.page==='knowledge')content=knowledgePanel();
    else if(r.page==='project')content=projectPanel();
    else content=overview(r.page==='cases');
  }catch{content='<div class="empty"><h1>Az eset nem található</h1><p>A demólink másik böngészőben az alapmintaesetekkel indul. A saját módosítások ezen a lapon maradnak.</p><a class="button" href="#overview">Esetáttekintés</a></div>';}
  document.title=`NIPT Betegút · ${patient?'Páciensnézet':'Bemutató'}`;
  app.innerHTML=`<div class="shell"><aside class="sidebar"><a class="brand" href="#overview">${mark}<div><strong>nipt betegút</strong><small>ÁTTEKINTHETŐ GONDOZÁS</small></div></a><div class="nav-label">${patient?'Bemutató nézetek':'Munkaterület'}</div><nav class="nav" aria-label="Fő navigáció">${[['overview','grid','Áttekintés'],['cases','case','Esetek'],['knowledge','book','Tudástár'],['project','project','A projektről']].map(([id,i,label])=>`<a href="#${id}" aria-label="${label}" class="${r.page===id||(id==='cases'&&r.page==='case')?'active':''}" ${r.page===id?'aria-current="page"':''}>${icon(i)}<span>${label}</span></a>`).join('')}</nav><div class="side-footer"><span class="side-version">BEMUTATÓ · 0.1</span><p>A klinikai pilot külön jóváhagyásra vár.</p><button class="ghost-light" data-action="reset">${icon('refresh')} Demó alaphelyzet</button></div></aside><div class="workspace"><div class="demo-banner"><span>${icon('info')}<strong>Bemutató · fiktív adatok.</strong> Betegellátásra nem használható.</span><span class="secondary">A módosítások csak ezen a böngészőlapon maradnak.</span></div><header class="topbar"><div class="breadcrumbs"><span class="crumb-root">NIPT Betegút</span>${icon('chevron')}<strong>${patient?'Páciensnézet':'Orvosi munkaterület'}</strong></div><div class="header-tools"><div class="view-switch" aria-label="Bemutató nézet"><button class="${patient?'':'active'}" data-role="doctor" aria-pressed="${!patient}">${icon('case')} Orvosi</button><button class="${patient?'active':''}" data-role="patient" aria-pressed="${patient}">${icon('heart')} Páciens</button></div><span class="avatar" title="Bemutató felhasználó">${patient?'MP':'DO'}</span></div></header><main id="main" class="main" tabindex="-1">${content}<div class="footer-note">Fiktív bemutató · Nincs személyre szabott kockázatszámítás · Szabálycsomag 0.1.0-demo<br><button class="button subtle small" data-action="share-demo">Demólink másolása</button> · <button class="button subtle small" data-action="reset">Saját demó alaphelyzet</button></div></main></div></div>`;
  if(r.page==='knowledge'&&r.id?.startsWith('source-')){
    const chr=r.id.slice(7),info=CHROMOSOMES[chr];
    if(info)showModal({title:info.title,body:`<span class="chromosome c${chr}">T${chr}</span><h3 class="section-gap">${esc(info.tag)}</h3><p>${esc(info.description)}</p><p class="muted small-copy">A bemutató nem rendel személyes PPV-t ehhez az eltéréshez. A döntési tábla szakmai jóváhagyásra vár.</p>`});
  }
}

function showModal(spec){
  lastFocus=document.activeElement;
  if(modal.open)modal.close();
  modal.innerHTML=`${spec.action?`<form data-form="${spec.action}">`:''}<div class="modal-head"><h2 id="modal-title">${esc(spec.title)}</h2><button class="icon-button" type="button" data-close aria-label="Bezárás">${icon('close')}</button></div><div class="modal-body"><div id="form-error" class="form-error hidden" role="alert"></div>${spec.body}</div><div class="modal-foot"><button class="button" type="button" data-close>${spec.action?'Mégse':'Bezárás'}</button>${spec.action?`<button class="button ${spec.danger?'danger':'primary'}" type="submit">${esc(spec.submit)}</button>`:''}</div>${spec.action?'</form>':''}`;
  modal.showModal();
}
modal.addEventListener('close',()=>{
  // Dismissed deep links must allow the same knowledge card to open again.
  // A queued close event must not clear a newly opened dialog's route.
  const r=route();
  if(!modal.open&&r.page==='knowledge'&&r.id?.startsWith('source-'))history.replaceState(null,'','#knowledge');
  if(lastFocus?.isConnected)lastFocus.focus();else document.querySelector('#main')?.focus({preventScroll:true});
});
modal.addEventListener('click',ev=>{if(ev.target.closest('[data-close]'))modal.close();});
modal.addEventListener('input',ev=>{
  if(ev.target.name==='taskTitle'&&ev.target.form.elements.proposedTask&&ev.target.value.trim()!==ev.target.form.elements.proposedTask.value){
    ev.target.form.elements.override.checked=true;ev.target.form.elements.overrideReason.required=true;
  }
});
modal.addEventListener('change',ev=>{
  if(ev.target.name==='kind'){
    const form=ev.target.form,kind=ev.target.value,clinical=['ultrasound','growth'].includes(kind);
    form.elements.method.value=clinical?'clinical':kind==='upd'?'upd':'karyotype';
    form.elements.specimen.value=clinical?'none':'amniotic_fluid';form.elements.coversTarget.checked=false;
  }
  if(ev.target.name==='override')ev.target.form.elements.overrideReason.required=ev.target.checked;
});
modal.addEventListener('submit',ev=>{
  ev.preventDefault();const form=ev.target,values=Object.fromEntries(new FormData(form));
  const action=form.dataset.form,id=values.caseId;
  try{
    let message='A bemutató módosítása elmentve.',destination;
    if(action==='new-case'){const c=createCase(state,{...values,synthetic:values.synthetic==='on'});state.selectedCaseId=c.id;destination=`#case/${c.id}`;message='A fiktív eset létrejött.';}
    if(action==='observation'){recordObservation(state,id,{...values,coversTarget:values.coversTarget==='on'});message='A fiktív lelet rögzítve. Az értékelés frissült.';destination=`#case/${id}`;}
    if(action==='dating'){correctDating(state,id,values);destination=`#case/${id}`;message='A terhességi kor pontosítása és indoka megőrizve.';}
    if(action==='context'){updateContext(state,id,values);destination=`#case/${id}`;}
    if(action==='approve'){approvePlan(state,id,{...values,override:values.override==='on'});destination=`#case/${id}`;message='A fiktív terv elfogadva. A páciensnézeti megosztás külön lépés.';}
    if(action==='close-case'){closeCase(state,id,values);destination=`#case/${id}`;message='A fiktív eset lezárva, a korábbi változatok megmaradtak.';}
    if(action==='demo-date'){
      if(!Number.isFinite(dayNumber(values.demoDate))||values.demoDate<'2026-01-01'||values.demoDate>'2027-12-31')throw Error('Érvénytelen demódátum.');
      state.demoDate=values.demoDate;message='A bemutató dátuma frissült.';
    }
    if(action==='reset'){state=createDemoState();filter='all';destination='#overview';message='A saját fiktív esetek visszaálltak az alaphelyzetre.';}
    persist();modal.close();render();if(destination)navigate(destination);toast(message);
  }catch(error){const box=document.querySelector('#form-error');box.textContent=error.message;box.classList.remove('hidden');box.scrollIntoView({block:'nearest'});}
});

app.addEventListener('click',async event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.dataset.filter){filter=b.dataset.filter;render();return;}
  const id=b.dataset.id||state.selectedCaseId;
  if(b.dataset.role){navigate(`#${b.dataset.role==='patient'?'patient':'case'}/${id}`);return;}
  const action=b.dataset.action;
  try{
    if(action==='new-case')showModal(newCaseForm(state));
    if(action==='observation')showModal(observationForm(state,getCase(state,id),b.dataset.correct));
    if(action==='dating')showModal(datingForm(state,getCase(state,id)));
    if(action==='context')showModal(contextForm(state,getCase(state,id)));
    if(action==='approve'){const ev=evaluateCase(state,id);persist();showModal(planForm(state,getCase(state,id),ev));}
    if(action==='publish'){publishPlan(state,id,b.dataset.plan);persist();render();toast('A terv most már a páciensnézetben is látható.');}
    if(action==='complete-task'){completeTask(state,id,b.dataset.task);persist();render();toast('A fiktív teendő teljesítése rögzítve.');}
    if(action==='close-case')showModal(closeForm(state,getCase(state,id)));
    if(action==='patient-preview')navigate(`#patient/${id}`);
    if(action==='demo-date')showModal(dateForm(state));
    if(action==='replay'){const evaluation=getCase(state,id).evaluations.find(x=>x.id===b.dataset.eval);if(!evaluation)throw Error('Az értékelés nem található.');showModal(replayContent(evaluation,replayEvaluation(evaluation)));}
    if(action==='plan-history')showModal(planVersionContent(getPlanSnapshot(state,id,b.dataset.plan)));
    if(action==='print'){document.querySelector('#print-report').innerHTML=printMarkup(state,getCase(state,id));window.print();}
    if(action==='reset')showModal({action:'reset',title:'A saját bemutató alaphelyzetbe állítása',submit:'Alaphelyzet visszaállítása',danger:true,body:'<p>A saját fiktív módosításaid helyére az eredeti hat mintaeset kerül. Más látogatók bemutatóját ez nem érinti.</p>'});
    if(action==='share-demo'){
      const url=location.origin+location.pathname;
      try{await navigator.clipboard.writeText(url);toast('A demólink a vágólapra került. Másik látogató az alapmintaesetekkel indul.');}
      catch{showModal({title:'A bemutató megosztása',body:`<p>Másold ki ezt a címet:</p><div class="field"><input readonly aria-label="Demólink" value="${esc(url)}"></div><p class="muted section-gap">Másik látogató a saját, fiktív mintaeseteivel indul.</p>`});}
    }
  }catch(error){toast(error.message);}
});
app.addEventListener('change',ev=>{if(ev.target.id==='patient-case'){state.selectedCaseId=ev.target.value;persist();navigate(`#patient/${ev.target.value}`);}});
window.addEventListener('hashchange',()=>{if(modal.open)modal.close();render();persist();document.querySelector('#main')?.focus({preventScroll:true});window.scrollTo(0,0);});
render();

// Optional WebMCP tools expose only the same fictional data and navigation as the visible demo.
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  const register=tool=>{try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
  register({name:'list_nipt_demo_cases',title:'Fiktív NIPT-esetek listázása',description:'Csak a megnyitott fiktív bemutató eseteit olvassa; nem betegadatbázis.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input){if(!input||typeof input!=='object'||Object.keys(input).length)throw Error('Üres objektum szükséges.');return state.cases.map(c=>({id:c.id,code:c.code,chromosome:c.chromosome,closed:c.outcome!=='ongoing'}));}});
  register({name:'open_nipt_demo_case',title:'Fiktív eset megnyitása',description:'Megnyit egy létező fiktív esetet az orvosi bemutatóban. Nem rögzít leletet és nem fogad el tervet.',inputSchema:{type:'object',properties:{caseId:{type:'string'}},required:['caseId'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute(input){if(!input||typeof input.caseId!=='string'||Object.keys(input).some(k=>k!=='caseId'))throw Error('Érvénytelen bemenet.');getCase(state,input.caseId);navigate(`#case/${input.caseId}`);render();return{opened:true,caseId:input.caseId,synthetic:true};}});
}
