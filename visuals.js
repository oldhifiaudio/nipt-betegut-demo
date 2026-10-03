import {escapeHtml as e,icon,fullDate,dnaMotif} from './ui.js';
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
  const cards=[
    {n:7,x:23,y:48,ink:'#b38a47',tint:'#f7f0e1'},
    {n:15,x:295,y:48,ink:'#9380ad',tint:'#f0ecf7'},
    {n:16,x:23,y:173,ink:'#5b8da7',tint:'#eaf2f7'},
    {n:22,x:295,y:173,ink:'#548f80',tint:'#e8f3ed'}
  ].map(({n,x,y,ink,tint})=>`<g transform="translate(${x} ${y})">
    <rect x="0" y="3" width="122" height="64" rx="16" fill="#264f42" opacity=".04"/>
    <rect width="122" height="64" rx="16" fill="#fff" stroke="#d7e4da" stroke-width=".75"/>
    <rect x="12" y="15" width="34" height="34" rx="11" fill="${tint}"/>
    <g transform="translate(29 32)" fill="none" stroke="${ink}" stroke-width="3.5" stroke-linecap="round">
      <path d="M-7-9C-7-4 7 4 7 9M7-9C7-4-7 4-7 9"/>
    </g>
    <text class="hero-chromosome-label" x="57" y="30" fill="#3e6259" font-size="15" font-weight="650">T${n}</text>
    <text class="hero-chromosome-caption" x="57" y="44" fill="#7b9085" font-size="8.5">kromoszóma</text>
  </g>`).join('');
  return `<svg class="hero-art doctor-art" viewBox="0 0 440 285" role="img" aria-label="Szabályos kettős DNS-spirál, körülötte a T7, T15, T16 és T22 betegutak egységes jelképei. Sematikus illusztráció.">
    <ellipse cx="220" cy="143" rx="108" ry="126" fill="#dfede5"/>
    <ellipse cx="220" cy="143" rx="85" ry="108" fill="none" stroke="#bbd4c7" stroke-width="1" stroke-dasharray="2 7"/>
    <g fill="none" stroke="#b0cbbb" stroke-width="1.4" stroke-linecap="round">
      <path d="M145 80h17q12 0 18 9M295 80h-17q-12 0-18 9M145 205h17q12 0 18-9M295 205h-17q-12 0-18-9"/>
    </g>
    ${dnaMotif({cx:220,top:25,height:235,amplitude:37,stroke:6,rungs:17})}
    ${cards}
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
  <div><svg viewBox="0 0 160 112" role="img" aria-label="Vérminta, mellette az anyai és lepényi eredetű DNS-töredékek jelképei"><circle cx="80" cy="56" r="46" fill="#edf1e8"/>
    <rect x="39" y="20" width="28" height="73" rx="13" fill="#fff" stroke="#9bb9a8" stroke-width="1.5"/>
    <path d="M44 47h18v32a9 9 0 0 1-18 0z" fill="#deb8a6"/><path d="M44 47c6 3 12-3 18 0" fill="none" stroke="#bf8a73" stroke-width="1.3"/>
    <rect x="37" y="15" width="32" height="13" rx="4" fill="#548b75"/><path d="M43 18v7m6-7v7m6-7v7m6-7v7" stroke="#8ab49f" stroke-width="1.3"/>
    <ellipse cx="51" cy="63" rx="4.5" ry="2.5" fill="#bf8b75" transform="rotate(-20 51 63)"/><ellipse cx="55" cy="78" rx="4.5" ry="2.5" fill="#bf8b75" transform="rotate(18 55 78)"/>
    <path d="M75 55h8" stroke="#b7cbbb" stroke-width="1.5" stroke-linecap="round"/>
    <g transform="translate(104 39) rotate(-20)" stroke="#6c9c85" stroke-width="2" stroke-linecap="round"><path d="M-11-4h22m-22 8h22M-6-4v8M0-4v8M6-4v8"/></g>
    <g transform="translate(109 71) rotate(17)" stroke="#b39073" stroke-width="2" stroke-linecap="round"><path d="M-10-4h20m-20 8h20M-5-4v8M1-4v8M6-4v8"/></g>
    <circle cx="86" cy="24" r="2" fill="#bad0be"/><circle cx="91" cy="93" r="2.5" fill="#ceddcb"/>
  </svg><span class="flow-number">01</span><h3>Anyai vér</h3><p>Anyai és lepényi eredetű DNS-töredékek.</p></div>
  <span class="flow-arrow" aria-hidden="true">${icon('chevron')}</span>
  <div><svg viewBox="0 0 160 112" role="img" aria-label="DNS-t vizsgáló nagyító és leletlap: a NIPT szűrővizsgálat"><circle cx="80" cy="56" r="46" fill="#e6efe9"/>
    <rect x="42" y="13" width="63" height="87" rx="10" fill="#fff" stroke="#c0d5c8" stroke-width="1.5"/>
    <path d="M53 24h14m6 0h8" stroke="#b4cbbc" stroke-width="2" stroke-linecap="round"/>
    ${dnaMotif({cx:73,top:34,height:54,amplitude:14,stroke:2.8,rungs:11})}
    <path d="m118 86 12 13" stroke="#568571" stroke-width="5" stroke-linecap="round"/>
    <circle cx="108" cy="76" r="17" fill="#f7faf5" stroke="#568571" stroke-width="2.5"/>
    ${dnaMotif({cx:108,top:68,height:16,amplitude:5,turns:1,stroke:1.3,rungs:3})}
  </svg><span class="flow-number">02</span><h3>NIPT-jelzés</h3><p>Szűrési eredmény. Önmagában nem diagnózis.</p></div>
  <span class="flow-arrow" aria-hidden="true">${icon('chevron')}</span>
  <div><svg viewBox="0 0 160 112" role="img" aria-label="Két külön ág: DNS-jelkép a magzati diagnosztikához, naptár a gondozás egyeztetéséhez"><circle cx="80" cy="56" r="46" fill="#f0f1e7"/>
    <path d="M44 56h21m0 0V29h21M65 56v27h21" fill="none" stroke="#9ab9a5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="32" cy="56" r="13" fill="#dcebe0" stroke="#b9d1be" stroke-width="1"/>
    <rect x="26" y="49" width="12" height="15" rx="2.5" fill="#fff" stroke="#69947c" stroke-width="1.4"/><path d="M29 54h6m-6 4h4" stroke="#69947c" stroke-width="1.4" stroke-linecap="round"/>
    <circle cx="65" cy="56" r="3" fill="#69947c"/>
    <rect x="87" y="10" width="49" height="38" rx="11" fill="#fff" stroke="#c4d9ca" stroke-width="1.2"/>
    ${dnaMotif({cx:111.5,top:18,height:22,amplitude:5.5,turns:1,stroke:1.8,rungs:5})}
    <rect x="87" y="64" width="49" height="38" rx="11" fill="#fff" stroke="#ddd4bd" stroke-width="1.2"/>
    <g fill="none" stroke="#a38c63" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="102" y="74" width="20" height="18" rx="3"/><path d="M107 72v5m10-5v5m-15 4h20M107 85h2m5 0h2m-9 4h2"/></g>
  </svg><span class="flow-number">03</span><h3>Szakmai tisztázás</h3><p>Magzati diagnosztika és gondozás: külön kérdések.</p></div>
  </div><div class="diagram-foot"><span>Sematikus magyarázat, nem diagnosztikai ábra.</span><a href="https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0308008" target="_blank" rel="noopener noreferrer">Szakmai háttér ${icon('chevron')}</a></div></figure>`;}

export function ppvFigure(){
  const s=SOURCES.find(x=>x.id==='plos-2024');
  return `<section class="card evidence-visual"><div class="section-title"><div><div class="eyebrow">Kutatásból a megértéshez</div><h2>Ugyanaz a kérdés, két végpont.</h2></div><span class="badge neutral">PLOS ONE · 2024</span></div><p class="muted">Ritka autoszomális triszómiát jelző eredmények összesített PPV-je.</p><div class="ppv-rows">${s.estimates.map((x,i)=>`<div class="ppv-row"><div class="ppv-label"><div><strong>${e(x.value)}</strong><span>${e(x.label)}</span></div><small>${e(x.interval)}</small></div><svg viewBox="0 0 420 52" role="img" aria-label="${e(x.label)}: ${e(x.value)}, ${e(x.interval)}, részletezett skála 0–25%"><path d="M10 24h400" stroke="#e6ede8" stroke-width="2"/><g stroke="#dae4dc">${[0,5,10,15,20,25].map(n=>`<path d="M${10+n*16} 17v14"/>`).join('')}</g><path d="M${10+x.ciLow*16} 24H${10+x.ciHigh*16}" stroke="${i?'#b1805a':'#3d8276'}" stroke-width="8" stroke-linecap="round"/><circle cx="${10+x.proportion*16}" cy="24" r="7" fill="${i?'#8b5e3e':'#174e47'}" stroke="white" stroke-width="2"/></svg></div>`).join('')}</div><div class="ppv-axis"><span>0%</span><span>5%</span><span>10%</span><span>15%</span><span>20%</span><span>25%</span></div><p class="chart-note">Részletezett skála: 0–25%. Pont: összesített becslés · sáv: 95%-os konfidenciaintervallum.</p><div class="evidence-caption"><strong>Nem személyes kockázat.</strong><p>A kiterjesztett végpont egyes, genetikai diagnózissal nem megerősített kimeneteleket is magában foglal. A két érték nem összeadható; a vizsgálatok között jelentős eltérések vannak.</p><a href="${e(s.url)}" target="_blank" rel="noopener noreferrer">Kónya és munkatársai · Eredeti közlemény ${icon('chevron')}</a></div></section>`;
}
