import {RULES} from './knowledge.js';

export const STAGES = {
  diagnostic:'Diagnosztikai tisztázás',diagnostic_pending:'Megerősítő lelet áttekintése',
  discordant:'Eltérő leletek tisztázása',followup:'Gondozási terv egyeztetése',
  fetal_finding:'Igazolt eltérés megbeszélése',specialist_review:'Szakértői felülvizsgálat',closed:'Lezárt terhesség'
};
export const clone = value => JSON.parse(JSON.stringify(value));
export function dayNumber(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const time=Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0,10)!==value) return NaN;
  return time/86400000;
}
export const isoDay = number => new Date(number*86400000).toISOString().slice(0,10);
export const gestation = (c,asOf) => c.anchorDays + dayNumber(asOf)-dayNumber(c.anchorDate);
export const weekLabel = days => Number.isFinite(days) && days>=0 ? `${Math.floor(days/7)}+${days%7}` : '–';

export function evaluate(snapshot,{rules=RULES,asOf='2026-10-03'}={}) {
  if (rules.engineVersion!=='1') throw new Error('Nem támogatott értékelőverzió.');
  const r={engineVersion:'1',rulesVersion:rules.version,asOf,clinicalUseAllowed:false,
    approvalStatus:'pending',personalPpv:null,stage:'diagnostic',stageLabel:STAGES.diagnostic,
    support:'supported',gaps:[],steps:[],sources:clone(rules.sources),timeWindow:null,
    cpmStatus:snapshot.cpmStatus||'unknown',gestationalDays:null,
    explanation:'Bemutató értékelés. A klinikai döntési táblák szakmai jóváhagyásra várnak.'};
  const finish=(stage,...steps)=>({...r,stage,stageLabel:STAGES[stage],steps:steps.map(id=>clone(rules.steps[id]))});
  if (['birth','loss','termination','transferred'].includes(snapshot.outcome)) return finish('closed');
  const anchor=dayNumber(snapshot.anchorDate),on=dayNumber(asOf),ga=gestation(snapshot,asOf);
  if (![anchor,on,ga].every(Number.isFinite) || !Number.isInteger(snapshot.anchorDays) ||
      snapshot.anchorDays<0 || snapshot.anchorDays>315 || ga<0 || ga>315 || anchor>on) {
    r.support='invalid'; r.gaps.push({field:'dating',label:'A terhességi kor vagy a dátum nem értékelhető.'});
    return finish('specialist_review','specialist_review');
  }
  r.gestationalDays=ga;
  r.timeWindow={open:ga>=105,earliestDate:isoDay(anchor+105-snapshot.anchorDays),
    label:'15+0 hét – időzítési referencia, nem beavatkozási ajánlás',source:'rcog-8'};
  if (!rules.supportedChromosomes.includes(snapshot.chromosome) || snapshot.findingType!=='whole_trisomy' ||
      !['singleton','unknown','',null,undefined].includes(snapshot.pregnancyType) || snapshot.vanishingTwin==='yes') {
    r.support='unsupported'; return finish('specialist_review','specialist_review');
  }
  const labels={lab:'Vizsgáló labor',assay:'Vizsgálati módszer',niptDate:'NIPT-lelet dátuma',
    pregnancyType:'Terhesség típusa',vanishingTwin:'Eltűnő iker előzménye'};
  for(const [field,label] of Object.entries(labels)) if ([undefined,null,'','unknown'].includes(snapshot[field])) r.gaps.push({field,label});
  if(r.gaps.length){r.support='needs_data';return finish('diagnostic','complete_context');}
  const observations=snapshot.observations||[];
  const superseded=new Set(observations.map(o=>o.supersedes).filter(Boolean));
  const active=observations.filter(o=>!superseded.has(o.id));
  const beginning=anchor-snapshot.anchorDays;
  if (!Number.isFinite(dayNumber(snapshot.niptDate)) || dayNumber(snapshot.niptDate)>on || dayNumber(snapshot.niptDate)<beginning ||
      active.some(o=>!Number.isFinite(dayNumber(o.observedOn))||dayNumber(o.observedOn)>on||dayNumber(o.observedOn)<beginning)) {
    r.support='invalid';r.gaps.push({field:'observations',label:'Az aktív vizsgálati dátum érvénytelen, jövőbeli vagy ezen a terhességen kívül esik.'});
    return finish('specialist_review','specialist_review');
  }
  if(active.some(o=>o.specimen==='amniotic_fluid'&&snapshot.anchorDays+dayNumber(o.observedOn)-anchor<105)){
    r.support='invalid';r.gaps.push({field:'sampling_date',label:'A magzatvíz-mintavétel dátuma a 15+0 hetes referencia előtt szerepel; szakmai ellenőrzés szükséges.'});
    return finish('specialist_review','specialist_review');
  }
  const diagnostic=active.filter(o=>o.kind==='diagnostic');
  const fetal=diagnostic.filter(o=>o.specimen==='amniotic_fluid' && ['karyotype','microarray'].includes(o.method)
    && o.coversTarget===true && ['normal','abnormal'].includes(o.result));
  const results=new Set(fetal.map(o=>o.result));
  const abnormalOther=active.some(o=>o.result==='abnormal'&&['ultrasound','upd','growth'].includes(o.kind));
  if(results.size>1||abnormalOther) return finish('specialist_review','specialist_review');
  if(results.has('abnormal')) return finish('fetal_finding','confirmed_finding_review');
  if(results.has('normal')) {
    const updComplete=active.some(o=>o.kind==='upd'&&o.coversTarget===true&&o.result==='normal'&&
      o.specimen==='amniotic_fluid'&&['upd','methylation'].includes(o.method));
    if([7,15].includes(snapshot.chromosome)&&!updComplete) return finish('discordant','upd_review','followup_review');
    return finish('followup','followup_review');
  }
  if(diagnostic.length) return finish('diagnostic_pending','specimen_review');
  return finish('diagnostic','diagnostic_review');
}
