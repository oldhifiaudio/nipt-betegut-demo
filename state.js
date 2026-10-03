import {clone,dayNumber,evaluate,gestation} from './engine.js';
import {RULES} from './knowledge.js';

const uid=prefix=>`${prefix}-${globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
export function isPlanCurrent(state,c,p){
  return !!p&&p.caseRevision===c.revision&&p.snapshot.asOf===state.demoDate&&c.plans.at(-1)?.id===p.id;
}
export function getPlanSnapshot(state,id,planId){
  const c=getCase(state,id),p=c.plans.find(x=>x.id===planId);
  if(!p)throw Error('Nem található az esethez tartozó tervváltozat.');
  return {plan:clone(p),wasPublished:c.publishedPlanId===p.id||(c.publications||[]).some(x=>x.planId===p.id),
    isCurrentPublished:c.publishedPlanId===p.id};
}
const text=(value,max=1200)=>String(value??'').trim().slice(0,max);
export function getCase(state,id){const c=state.cases.find(x=>x.id===id);if(!c)throw Error('Nem található demóeset.');return c;}
const openCase=(state,id)=>{const c=getCase(state,id);if(c.outcome!=='ongoing')throw Error('A lezárt eset már nem módosítható.');return c;};
export function updateContext(state,id,input){
  const c=openCase(state,id);
  if(text(input.reason).length<5)throw Error('Az adatpontosításhoz indoklás szükséges.');
  const values={lab:text(input.lab,100),assay:text(input.assay,60),
    pregnancyType:oneOf(input.pregnancyType,['singleton','twins','unknown'],'Érvénytelen terhességtípus.'),
    vanishingTwin:oneOf(input.vanishingTwin,['yes','no','unknown'],'Érvénytelen előzmény.')};
  Object.assign(c,values);c.revision++;audit(state,c,'Esetadatok pontosítva',text(input.reason));return evaluateCase(state,id);
}
function audit(state,c,action,detail){c.audit.push({id:uid('audit'),on:state.demoDate,action,detail,actor:'Demóorvos',revision:c.revision});}
function validDate(value,today){return Number.isFinite(dayNumber(value))&&dayNumber(value)<=dayNumber(today);}
function dating(input,asOf){
  const weeks=Number(input.weeks),days=Number(input.days);
  if(!Number.isInteger(weeks)||!Number.isInteger(days)||days<0||days>6||weeks<0||weeks>44)throw Error('Érvénytelen hét vagy nap (a nap 0–6 lehet).');
  const anchorDays=weeks*7+days;
  if(!validDate(input.anchorDate,asOf)||anchorDays+dayNumber(asOf)-dayNumber(input.anchorDate)>315)throw Error('A viszonyítási dátum nem érvényes.');
  return {anchorDays,anchorDate:input.anchorDate};
}
function oneOf(value,values,message){if(!values.includes(value))throw Error(message);return value;}

export function createCase(state,input){
  if(input.synthetic!==true)throw Error('Csak mintaeset rögzíthető.');
  const dates=dating(input,state.demoDate);
  const chromosome=Number(input.chromosome);
  if(!Number.isInteger(chromosome)||chromosome<1||chromosome>22)throw Error('Válassz kromoszómát.');
  const c={id:uid('case'),code:`DEMO-${String(state.cases.length+1).padStart(3,'0')}`,
    label:`Mintaeset ${String(state.cases.length+1).padStart(2,'0')}`,chromosome,...dates,
    findingType:oneOf(input.findingType,['whole_trisomy','segmental','multiple','no_call'],'Válassz lelettípust.'),
    pregnancyType:oneOf(input.pregnancyType,['singleton','twins','unknown'],'Válassz terhességtípust.'),
    vanishingTwin:oneOf(input.vanishingTwin,['no','yes','unknown'],'Válassz előzményt.'),
    lab:text(input.lab,100),assay:text(input.assay,60),niptDate:input.niptDate,
    cpmStatus:'unknown',outcome:'ongoing',revision:1,observations:[],evaluations:[],plans:[],publications:[],tasks:[],audit:[],publishedPlanId:null};
  if(!validDate(c.niptDate,state.demoDate)||dayNumber(c.niptDate)<dayNumber(c.anchorDate)-c.anchorDays)throw Error('Érvénytelen leletdátum: a dátumnak ebbe a bemutatóeset időszakába kell esnie.');
  audit(state,c,'Eset létrehozva','Mintaeset.');state.cases.push(c);evaluateCase(state,c.id);return c;
}

export function recordObservation(state,id,input){
  const c=openCase(state,id);
  const kind=oneOf(input.kind,['diagnostic','ultrasound','upd','growth'],'Érvénytelen vizsgálattípus.');
  const specimen=oneOf(input.specimen,['amniotic_fluid','chorionic_villi','none','unknown'],'Érvénytelen minta.');
  const method=oneOf(input.method,['karyotype','microarray','qpcr','upd','methylation','clinical'],'Érvénytelen módszer.');
  const result=oneOf(input.result,['normal','abnormal','pending','inconclusive'],'Érvénytelen eredmény.');
  if(!validDate(input.observedOn,state.demoDate)||dayNumber(input.observedOn)<dayNumber(c.anchorDate)-c.anchorDays)throw Error('Érvénytelen vizsgálati dátum.');
  if(['diagnostic','upd'].includes(kind)&&specimen==='none')throw Error('A genetikai vizsgálathoz mintatípus szükséges.');
  if((kind==='diagnostic'&&!['karyotype','microarray','qpcr'].includes(method))||
    (kind==='upd'&&!['upd','methylation'].includes(method))||
    (['ultrasound','growth'].includes(kind)&&(method!=='clinical'||specimen!=='none')))throw Error('A módszer és a mintatípus nem illik a vizsgálathoz.');
  const supersedes=input.supersedes||null;
  if(supersedes){
    const old=c.observations.find(o=>o.id===supersedes);
    if(!old||old.kind!==kind||c.observations.some(o=>o.supersedes===supersedes))throw Error('Csak azonos típusú, aktív lelet helyesbíthető.');
    if(text(input.note).length<5)throw Error('A helyesbítéshez indoklás szükséges.');
  }
  const observation={id:uid('obs'),kind,specimen,method,result,coversTarget:input.coversTarget===true,
    observedOn:input.observedOn,note:text(input.note),supersedes};
  c.observations.push(observation);c.revision++;audit(state,c,supersedes?'Lelet helyesbítve':'Új lelet rögzítve',`${kind} · ${result}`);
  return evaluateCase(state,id);
}

export function correctDating(state,id,input){
  const c=openCase(state,id);const updated=dating(input,state.demoDate);
  const reason=text(input.reason);if(reason.length<5)throw Error('A dátumjavításhoz indoklás szükséges.');
  Object.assign(c,updated);c.revision++;audit(state,c,'Terhességi kor pontosítva',reason);return evaluateCase(state,id);
}

export function caseSnapshot(c){
  const keys=['code','chromosome','findingType','pregnancyType','vanishingTwin','anchorDate','anchorDays',
    'niptDate','lab','assay','outcome','cpmStatus','observations','revision'];
  return clone(Object.fromEntries(keys.map(key=>[key,c[key]])));
}
export function evaluateCase(state,id){
  const c=getCase(state,id),input=caseSnapshot(c),rules=clone(RULES);
  const evaluation={id:uid('eval'),revision:c.revision,asOf:state.demoDate,input,rules,
    output:evaluate(input,{rules,asOf:state.demoDate})};
  c.evaluations.push(evaluation);return evaluation;
}
export function replayEvaluation(e){return evaluate(clone(e.input),{rules:clone(e.rules),asOf:e.asOf});}
export function currentEvaluation(state,c){
  const last=c.evaluations.at(-1);
  return last&&last.revision===c.revision&&last.asOf===state.demoDate?last:{output:evaluate(caseSnapshot(c),{asOf:state.demoDate}),asOf:state.demoDate,revision:c.revision};
}

export function approvePlan(state,id,input){
  const c=openCase(state,id),e=c.evaluations.find(x=>x.id===input.evaluationId);
  if(!e)throw Error('Nem található az esethez tartozó értékelés.');
  if(e.revision!==c.revision||e.asOf!==state.demoDate)throw Error('Az értékelés elavult. Előbb frissítsd az értékelést.');
  const summary=text(input.summary),taskTitle=text(input.taskTitle,160);
  const override=!!input.override||taskTitle!==e.output.steps[0]?.title;
  if(override&&text(input.overrideReason).length<5)throw Error('Az eltérő teendőhöz indoklás szükséges.');
  if(summary.length<10||taskTitle.length<5)throw Error('Az összefoglaló és a teendő megadása szükséges.');
  if(!Number.isFinite(dayNumber(input.dueDate))||dayNumber(input.dueDate)<dayNumber(state.demoDate))throw Error('A teendő dátuma nem lehet korábbi a bemutató napjánál.');
  const p={id:uid('plan'),version:c.plans.length+1,caseRevision:c.revision,evaluationId:e.id,acceptedOn:state.demoDate,
    summary,taskTitle,dueDate:input.dueDate,overrideReason:override?text(input.overrideReason):'',
    snapshot:{code:c.code,label:c.label,chromosome:c.chromosome,gestationalDays:gestation(c,state.demoDate),
      cpmStatus:c.cpmStatus,stage:e.output.stage,stageLabel:e.output.stageLabel,steps:clone(e.output.steps),
      rulesVersion:e.output.rulesVersion,asOf:state.demoDate,sources:clone(e.output.sources)},
    clinicalApproval:false};
  // A draft can supersede other drafts, never the still-published patient's task.
  for(const task of c.tasks)if(task.status==='open'&&task.planId!==c.publishedPlanId)task.status='superseded';
  c.plans.push(p);c.tasks.push({id:uid('task'),planId:p.id,title:taskTitle,dueDate:input.dueDate,status:'open'});
  audit(state,c,'Bemutatóterv elfogadva',`${p.version}. változat. Ez nem klinikai jóváhagyás.`);return p;
}
export function publishPlan(state,id,planId){
  const c=openCase(state,id),p=c.plans.find(x=>x.id===planId);
  if(!p)throw Error('Nem található a terv.');
  if(!isPlanCurrent(state,c,p))throw Error('Az elavult terv nem osztható meg.');
  if(c.publishedPlanId===p.id)return;
  c.publications??=[];
  // Older development sessions did not record the publication date; do not invent one.
  if(c.publishedPlanId&&!c.publications.some(x=>x.planId===c.publishedPlanId))c.publications.push({planId:c.publishedPlanId,publishedOn:null});
  c.publications.push({planId:p.id,publishedOn:state.demoDate});
  for(const task of c.tasks)if(task.status==='open'&&task.planId!==p.id)task.status='superseded';
  c.publishedPlanId=p.id;audit(state,c,'Páciensnézet frissítve',`${p.version}. bemutatóváltozat megosztva.`);
}
export function patientView(state,id){
  const c=getCase(state,id),plan=c.plans.find(p=>p.id===c.publishedPlanId)||null;
  return {plan:plan?clone(plan):null,needsReview:!!plan&&!isPlanCurrent(state,c,plan),
    closed:c.outcome!=='ongoing',tasks:plan?clone(c.tasks.filter(t=>t.planId===plan.id)):[]};
}
export function completeTask(state,id,taskId){
  const c=openCase(state,id),task=c.tasks.find(x=>x.id===taskId);
  if(!task||task.status!=='open')throw Error('Csak nyitott teendő zárható le.');
  task.status='done';task.completedOn=state.demoDate;audit(state,c,'Teendő teljesítve',task.title);
}
export function closeCase(state,id,input){
  const c=openCase(state,id),outcome=oneOf(input.outcome,['birth','loss','termination','transferred'],'Válassz lezárási módot.');
  if(text(input.note).length<5)throw Error('A lezáráshoz rövid indoklás szükséges.');
  c.outcome=outcome;c.closedOn=state.demoDate;c.closureNote=text(input.note);c.revision++;
  for(const t of c.tasks)if(t.status==='open')t.status='cancelled';
  audit(state,c,'Eset lezárva',c.closureNote);return evaluateCase(state,id);
}
