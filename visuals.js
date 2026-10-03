import {escapeHtml as e,icon,fullDate} from './ui.js';
import {currentEvaluation,isPlanCurrent} from './state.js';
import {weekLabel} from './engine.js';
import {SOURCES} from './knowledge.js';

const bucketLabels=[['clarify','Tisztázás'],['followup','Gondozási terv'],['review','Szakértői áttekintés'],['closed','Lezárt']];

export function dashboardMetrics(state){
  const buckets=bucketLabels.map(([id,label])=>({id,label,count:0}));
  let active=0,shared=0;
  for(const c of state.cases){
    let bucket='closed';
    if(c.outcome==='ongoing'){
      active++;
      const r=currentEvaluation(state,c).output;
      bucket=['unsupported','invalid'].includes(r.support)||['specialist_review','fetal_finding'].includes(r.stage)?'review':r.stage==='followup'?'followup':'clarify';
      if(isPlanCurrent(state,c,c.plans.find(p=>p.id===c.publishedPlanId)))shared++;
    }
    buckets.find(b=>b.id===bucket).count++;
  }
  return {total:state.cases.length,active,shared,review:active-shared,closed:state.cases.length-active,buckets};
}

export function heroArtwork(kind='doctor'){
  if(kind==='patient')return `<svg class="hero-art patient-art" viewBox="0 0 440 285" role="img" aria-label="Támogató beszélgetés: két ember és egy szív sematikus illusztrációja">
    <ellipse cx="230" cy="145" rx="153" ry="122" fill="#e0eeea"/><path d="M53 206C99 232 99 256 194 248S366 225 392 160" fill="none" stroke="#92b9b2" stroke-width="2" stroke-dasharray="5 7"/>
    <circle cx="127" cy="111" r="30" fill="#d9a988"/><path d="M96 107q-4-43 32-41 34 1 30 42l-12-19-32 5z" fill="#2c4b54"/>
    <path d="M66 234c3-70 17-98 62-98 41 0 61 37 64 98z" fill="#34776e"/><path d="m145 164 42 35 33-17" fill="none" stroke="#d9a988" stroke-width="17" stroke-linecap="round"/>
    <circle cx="310" cy="105" r="28" fill="#e4b59a"/><path d="M282 98q0-37 31-32 34 2 30 40l-12-18-36 10z" fill="#805c49"/>
    <path d="M259 234c0-68 17-102 53-102 35 0 56 33 66 102z" fill="#fbfaf6"/><path d="m294 160-41 37-27-14" fill="none" stroke="#e4b59a" stroke-width="17" stroke-linecap="round"/>
    <path d="m304 136 7 54 13-54M270 214h33M326 211h31" fill="none" stroke="#bfd2cc" stroke-width="2"/>
    <rect x="174" y="26" width="98" height="66" rx="21" fill="#fff"/><path d="m197 89 1 18 20-16" fill="#fff"/>
    <path d="M205 53a10 10 0 0 1 17-6 10 10 0 0 1 17 6c0 8-17 20-17 20s-17-12-17-20" fill="#ca876e"/>
    <circle cx="74" cy="65" r="6" fill="#dbb978"/><circle cx="382" cy="99" r="5" fill="#83b6ad"/><path d="M365 47v15m-7-7h14" stroke="#3a817b" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
  return `<svg class="hero-art doctor-art" viewBox="0 0 440 285" role="img" aria-label="DNS-spirál és a T7, T15, T16, T22 jelzések sematikus illusztrációja">
    <circle cx="241" cy="143" r="118" fill="#dcece7"/><circle cx="241" cy="143" r="91" fill="none" stroke="#b1cfc5" stroke-dasharray="3 8"/>
    <path d="M217 41c-78 42 112 135 17 195M268 40c72 52-108 135-26 198" fill="none" stroke="#337d74" stroke-width="9" stroke-linecap="round"/>
    <g stroke="#7eb2a4" stroke-width="4" stroke-linecap="round"><path d="m217 48 46 2m-49 22 43 7m-18 17 2 11m-3 11-1 12m-12 9 26 11m-40 9 53 9m-46 16 42 3m-22 17 4 9m-9 16 0 9"/></g>
    <rect x="43" y="67" width="114" height="67" rx="15" fill="#fff"/><circle cx="64" cy="86" r="5" fill="#dbad65"/><text x="77" y="91" class="art-caption">T7</text><path d="m62 106 12 12m-12 0 12-12m16 0 12 12m-12 0 12-12" stroke="#d4ac6c" stroke-width="4" stroke-linecap="round"/>
    <rect x="306" y="31" width="99" height="66" rx="15" fill="#fff"/><circle cx="326" cy="51" r="5" fill="#a393b8"/><text x="339" y="56" class="art-caption">T15</text><path d="m326 70 11 11m-11 0 11-11m13 0 11 11m-11 0 11-11" stroke="#a393b8" stroke-width="4" stroke-linecap="round"/>
    <rect x="51" y="186" width="122" height="66" rx="15" fill="#fff"/><circle cx="73" cy="206" r="5" fill="#6395b0"/><text x="86" y="211" class="art-caption">T16</text><path d="M73 230h62" stroke="#6395b0" stroke-width="5" stroke-linecap="round"/>
    <rect x="311" y="185" width="93" height="66" rx="15" fill="#fff"/><circle cx="332" cy="205" r="5" fill="#5d998b"/><text x="345" y="210" class="art-caption">T22</text><path d="m331 223 13 13m-13 0 13-13m10 0 13 13m-13 0 13-13" stroke="#5d998b" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M158 101h27m92-44 28-2M173 216l29-8m74 0 32 10" stroke="#98b8ae" stroke-width="2" stroke-dasharray="4 5"/>
    <circle cx="105" cy="39" r="4" fill="#b8cdb9"/><path d="M352 137v14m-7-7h14" stroke="#d0a66f" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}

export function cohortCard(state){
  const m=dashboardMetrics(state),circ=2*Math.PI*54;let offset=0;
  const arcs=m.buckets.map((b,i)=>{const length=m.total?b.count/m.total*circ:0;const svg=length?`<circle class="cohort-segment segment-${i}" cx="80" cy="80" r="54" fill="none" stroke-width="14" stroke-dasharray="${length} ${circ-length}" stroke-dashoffset="${-offset}" transform="rotate(-90 80 80)"/>`:'';offset+=length;return svg;}).join('');
  return `<section class="card cohort-card"><div class="section-title"><h2>Hol tartanak az esetek?</h2><span class="tiny-label">Mintaadatok</span></div><div class="cohort-layout"><div class="cohort-ring"><svg viewBox="0 0 160 160" role="img" aria-label="${m.total} mintaeset; ${m.buckets.map(b=>`${b.label}: ${b.count}`).join('; ')}"><circle cx="80" cy="80" r="54" fill="none" stroke="#edf1eb" stroke-width="14"/>${arcs}</svg><div><strong>${m.total}</strong><span>mintaeset</span></div></div><ul class="chart-legend">${m.buckets.map((b,i)=>`<li><span class="legend-dot segment-${i}"></span><span>${b.label}</span><strong>${b.count}</strong></li>`).join('')}</ul></div><p class="chart-note">A teljes bemutatóállomány munkafolyamata. Nem egészségügyi statisztika.</p></section>`;
}

export function gestationRail(days,date,caption='A bemutató napján'){
  if(!Number.isInteger(days)||days<0||days>315)return '<div class="gestation-visual"><p>Nincs értékelhető terhességi kor.</p></div>';
  const end=Math.max(42,Math.ceil(days/7)),x=18+Math.min(1,days/(end*7))*304;
  return `<figure class="gestation-visual"><figcaption><div><span class="eyebrow">Terhességi idővonal</span><strong>${weekLabel(days)} <small>hét</small></strong></div><span>${e(caption)}<br>${fullDate(date)}</span></figcaption><svg viewBox="0 0 340 56" role="img" aria-label="Terhességi kor ${weekLabel(days)} hét, viszonyítás ${fullDate(date)}"><path d="M18 18h304" stroke="#dce7df" stroke-width="8" stroke-linecap="round"/><path d="M18 18H${x}" stroke="#428878" stroke-width="8" stroke-linecap="round"/><circle cx="${x}" cy="18" r="7" fill="#1d554e" stroke="white" stroke-width="3"/>${[0,14,28,end].map(w=>`<text x="${18+w/end*304}" y="48" text-anchor="middle">${w}</text>`).join('')}</svg><p class="chart-note">Időbeli tájékozódás, nem vizsgálati ütemezés.</p></figure>`;
}

const pathLabels=['Szűrőlelet','Tisztázás','Terv','Követés','Lezárás'];
export function carePath(stage){
  const index={diagnostic:1,diagnostic_pending:1,discordant:1,fetal_finding:1,specialist_review:1,followup:3,closed:4}[stage]??0;
  return `<ol class="care-path" aria-label="A betegút állomásai">${pathLabels.map((label,i)=>`<li class="${i===index?'current':i<index?'past':''}" ${i===index?'aria-current="step"':''}><span>${String(i+1).padStart(2,'0')}</span><strong>${label}</strong>${i===index?'<small>Aktuális szakasz</small>':''}</li>`).join('')}</ol>`;
}

export function patientJourney(view){
  if(!view.plan)return `<section class="card journey-card"><div class="eyebrow">Lépésről lépésre</div><h2>Az egyeztetéssel kezdődik.</h2>${carePath('diagnostic')}<p class="chart-note">A személyes összefoglaló a terv megosztása után jelenik meg.</p></section>`;
  const p=view.plan;
  return `<section class="card journey-card"><div class="section-title"><h2>A betegút térképe</h2><span class="badge ${view.needsReview&&!view.closed?'amber':'teal'}">${view.closed?'Lezárt követés':view.needsReview?'Felülvizsgálatra vár':'Megosztott terv'}</span></div>${carePath(p.snapshot.stage)}${gestationRail(p.snapshot.gestationalDays,p.acceptedOn,'A megosztott tervben')}<p class="chart-note">Az ábra a megosztott terv ${p.version}. változatának állapotát mutatja, nem a vizsgálatok teljesítését.</p></section>`;
}

export function resultCompass(stage,cpmStatus,chromosome){
  const fetal=stage==='fetal_finding'?['Leletben eltérés szerepel','amber']:['followup','discordant'].includes(stage)?['A célzott eltérés nem szerepel','teal']:['Tisztázás / áttekintés szükséges','neutral'];
  const placenta={unknown:'Nincs megállapítva',suspected:'Feltételezett',confirmed:'Dokumentáltan igazolt'}[cpmStatus]||'Nincs megállapítva';
  return `<div class="result-compass" aria-label="Három külön értelmezendő kérdés"><div><span class="compass-icon">${icon('document')}</span><small>Szűrőjelzés</small><strong>T${e(chromosome)}</strong><span class="compass-foot">NIPT-eredmény</span></div><div><span class="compass-icon">${icon('grid')}</span><small>Magzati tisztázás</small><strong class="status-text ${fetal[1]}">${fetal[0]}</strong><span class="compass-foot">A vizsgált eltérésre vonatkozik</span></div><div><span class="compass-icon">${icon('share')}</span><small>Lepényi eredet</small><strong class="status-text">${placenta}</strong><span class="compass-foot">Külön szakmai kérdés</span></div></div>`;
}

export function originDiagram(){return `<figure class="origin-diagram"><figcaption><div class="eyebrow">A vizsgálat logikája</div><h2>Három külön kérdés. Egy közös kép.</h2><p>A NIPT szűrőjelzése, a magzati lelet és a lepényi eredet külön értelmezendő.</p></figcaption><div class="origin-flow">
  <div><svg viewBox="0 0 150 100" role="img" aria-label="Anyai vér, benne anyai és lepényi eredetű DNS-töredékek"><rect x="15" y="28" width="120" height="48" rx="24" fill="#e7efec"/><g fill="#c88e78"><ellipse cx="36" cy="51" rx="11" ry="6" transform="rotate(-20 36 51)"/><ellipse cx="104" cy="48" rx="11" ry="6" transform="rotate(18 104 48)"/><ellipse cx="77" cy="67" rx="10" ry="5"/></g><g stroke="#3e8077" stroke-width="3" stroke-linecap="round"><path d="m64 44 8 8m-8 0 8-8m43 16 6 6m-6 0 6-6m-77 9 7-7"/></g></svg><span class="flow-number">01</span><h3>Anyai vér</h3><p>Anyai és lepényi eredetű DNS-töredékek.</p></div>
  <span class="flow-arrow" aria-hidden="true">${icon('chevron')}</span>
  <div><svg viewBox="0 0 150 100" role="img" aria-label="A lepényi eredetű DNS jelének szűrővizsgálata"><circle cx="75" cy="51" r="35" fill="#e6eee8"/><path d="M58 20c-24 22 50 40 34 62M91 20c23 23-49 40-33 62M57 28h35M63 42h22M63 61h22M57 74h35" stroke="#3e8077" stroke-width="4" fill="none" stroke-linecap="round"/></svg><span class="flow-number">02</span><h3>NIPT-jelzés</h3><p>Szűrési eredmény. Önmagában nem diagnózis.</p></div>
  <span class="flow-arrow" aria-hidden="true">${icon('chevron')}</span>
  <div><svg viewBox="0 0 150 100" role="img" aria-label="Két külön ág: magzati tisztázás és a gondozás egyeztetése"><path d="M30 52h35m0 0V26h26M65 52v26h26" fill="none" stroke="#85afa2" stroke-width="3"/><circle cx="108" cy="26" r="18" fill="#dcece7"/><circle cx="108" cy="78" r="18" fill="#f1e4d6"/><path d="m101 20 14 12m-14 0 14-12M101 78h14m-7-7v14" stroke="#446e69" stroke-width="2.5" stroke-linecap="round"/></svg><span class="flow-number">03</span><h3>Szakmai tisztázás</h3><p>Magzati diagnosztika és gondozás: külön kérdések.</p></div>
  </div><div class="diagram-foot"><span>Sematikus magyarázat, nem diagnosztikai ábra.</span><a href="https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0308008" target="_blank" rel="noopener noreferrer">Szakmai háttér ${icon('chevron')}</a></div></figure>`;}

export function ppvFigure(){
  const s=SOURCES.find(x=>x.id==='plos-2024');
  return `<section class="card evidence-visual"><div class="section-title"><div><div class="eyebrow">Kutatásból a megértéshez</div><h2>Ugyanaz a kérdés, két végpont.</h2></div><span class="badge neutral">PLOS ONE · 2024</span></div><p class="muted">Ritka autoszomális triszómiát jelző eredmények összesített PPV-je.</p><div class="ppv-rows">${s.estimates.map((x,i)=>`<div class="ppv-row"><div class="ppv-label"><div><strong>${e(x.value)}</strong><span>${e(x.label)}</span></div><small>${e(x.interval)}</small></div><svg viewBox="0 0 420 52" role="img" aria-label="${e(x.label)}: ${e(x.value)}, ${e(x.interval)}, részletezett skála 0–25%"><path d="M10 24h400" stroke="#e6ede8" stroke-width="2"/><g stroke="#dae4dc">${[0,5,10,15,20,25].map(n=>`<path d="M${10+n*16} 17v14"/>`).join('')}</g><path d="M${10+x.ciLow*16} 24H${10+x.ciHigh*16}" stroke="${i?'#b1805a':'#3d8276'}" stroke-width="8" stroke-linecap="round"/><circle cx="${10+x.proportion*16}" cy="24" r="7" fill="${i?'#8b5e3e':'#174e47'}" stroke="white" stroke-width="2"/></svg></div>`).join('')}</div><div class="ppv-axis"><span>0%</span><span>5%</span><span>10%</span><span>15%</span><span>20%</span><span>25%</span></div><p class="chart-note">Részletezett skála: 0–25%. Pont: összesített becslés · sáv: 95%-os konfidenciaintervallum.</p><div class="evidence-caption"><strong>Nem személyes kockázat.</strong><p>A kiterjesztett végpont egyes, genetikai diagnózissal nem megerősített kimeneteleket is magában foglal. A két érték nem összeadható; a vizsgálatok között jelentős eltérések vannak.</p><a href="${e(s.url)}" target="_blank" rel="noopener noreferrer">Kónya és munkatársai · Eredeti közlemény ${icon('chevron')}</a></div></section>`;
}
