import {approvePlan,closeCase,completeTask,createCase,publishPlan,recordObservation} from './state.js';

export function createDemoState(){
  const s={schemaVersion:1,demoDate:'2026-10-03',role:'doctor',selectedCaseId:null,cases:[]};
  const add=(chromosome,weeks,days,extra={})=>createCase(s,{chromosome,weeks,days,anchorDate:s.demoDate,
    synthetic:true,pregnancyType:'singleton',vanishingTwin:'no',findingType:'whole_trisomy',
    lab:'Bemutató Genetikai Labor',assay:'MPS',niptDate:'2026-09-22',...extra});
  const o=(extra={})=>({kind:'diagnostic',specimen:'amniotic_fluid',method:'microarray',result:'normal',
    coversTarget:true,observedOn:'2026-10-01',...extra});
  const c1=add(16,18,2);c1.id='demo-16';
  recordObservation(s,c1.id,o());
  const p=approvePlan(s,c1.id,{evaluationId:c1.evaluations.at(-1).id,
    summary:'Ebben a fiktív esetben a célzott magzatvíz-vizsgálatban a jelzett eltérést nem találták. A további genetikai kérdéseket és a várandósgondozás tervét az orvossal külön kell áttekinteni. A lepényi eredet nincs igazolva.',
    taskTitle:'Gondozási terv átbeszélése',dueDate:'2026-10-08',override:true,overrideReason:'Bemutató: a megbeszélés közérthető elnevezése.'});publishPlan(s,c1.id,p.id);
  const c2=add(15,17,4);c2.id='demo-15';recordObservation(s,c2.id,o());
  const c3=add(7,13,1);c3.id='demo-7';recordObservation(s,c3.id,o({kind:'ultrasound',specimen:'none',method:'clinical',coversTarget:false}));
  const c4=add(22,16,3);c4.id='demo-22';recordObservation(s,c4.id,o({result:'abnormal'}));
  const c5=add(8,14,5,{pregnancyType:'twins'});c5.id='demo-review';
  const c6=add(16,39,2);c6.id='demo-closed';recordObservation(s,c6.id,o());
  const p6=approvePlan(s,c6.id,{evaluationId:c6.evaluations.at(-1).id,summary:'A fiktív terhesség gondozásának lezáró megbeszélése.',
    taskTitle:'Lezáró összefoglaló egyeztetése',dueDate:s.demoDate,override:true,overrideReason:'Bemutató: a terhesség lezárását szemléltető konzultáció.'});publishPlan(s,c6.id,p6.id);completeTask(s,c6.id,c6.tasks[0].id);
  closeCase(s,c6.id,{outcome:'birth',note:'A bemutató terhesség lezárult. A kimenetel kizárólag fiktív.'});
  s.selectedCaseId=c1.id;return s;
}

export const LABELS={
  kind:{diagnostic:'Genetikai vizsgálat',ultrasound:'Ultrahang',upd:'UPD / metiláció',growth:'Növekedési vizsgálat'},
  specimen:{amniotic_fluid:'Magzatvíz',chorionic_villi:'Chorionboholy (CVS)',none:'Nem mintavételes vizsgálat',unknown:'Nem ismert'},
  method:{karyotype:'Kariotípus',microarray:'Kromoszomális microarray',qpcr:'Célzott QF-PCR',upd:'Célzott UPD-vizsgálat',methylation:'Metilációs vizsgálat',clinical:'Klinikai / ultrahangos vizsgálat'},
  result:{normal:'A vizsgált eltérés nem szerepel',abnormal:'Eltérés szerepel',pending:'Folyamatban',inconclusive:'Nem egyértelmű'},
  outcome:{ongoing:'Folyamatban',birth:'Szüléssel lezárult',loss:'Veszteséggel lezárult',termination:'Megszakítással lezárult',transferred:'Ellátás átadva'},
  task:{open:'Tervezett',done:'Teljesítve',cancelled:'Lezáráskor törölve',superseded:'Új terv váltotta'},
  cpm:{unknown:'Nincs megállapítva',suspected:'Feltételezett',confirmed:'Dokumentáltan igazolt'},
};
