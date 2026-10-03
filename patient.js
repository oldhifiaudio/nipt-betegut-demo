import {patientView} from './state.js';
import {LABELS} from './data.js';
import {escapeHtml as e,fullDate,icon} from './ui.js';
import {weekLabel} from './engine.js';
import {heroArtwork,patientJourney,originDiagram} from './visuals.js';

export const patientMeaning={
  diagnostic:'A szűrőeredmény tisztázása még folyamatban van. A pozitív szűrés önmagában nem jelent diagnózist.',
  diagnostic_pending:'A vizsgálat mintáját és azt is át kell tekinteni, hogy pontosan melyik kérdésre adott választ.',
  discordant:'A vizsgálatok más-más kérdésekre adhatnak választ. Néhány genetikai kérdés külön tisztázást igényelhet.',
  followup:'A vizsgált eltérést a rögzített magzatvíz-leletben nem találták. A további gondozást ettől külön érdemes megbeszélni.',
  fetal_finding:'A megerősítő leletben eltérés szerepel. Ennek jelentőségét az orvos személyes konzultáción értékeli.',
  specialist_review:'Ezt a helyzetet a kezelőorvossal és a megfelelő szakemberrel külön kell áttekinteni.',
  closed:'A bemutatóeset követése lezárult.'
};

const faq=()=>`<section class="card card-pad patient-faq"><div class="eyebrow">Kérdezni ér</div><h2>Ami most foglalkoztathat</h2><details><summary>Mit jelent, hogy a NIPT szűrővizsgálat?</summary><p>A szűrés jelezhet olyan eltérést, amely további vizsgálattal tisztázható. Az eredmény önmagában nem ad végleges diagnózist.</p></details><details><summary>Miért lehet eltérés a különböző leletek között?</summary><p>A vizsgálatok eltérő mintákból és módszerekkel dolgozhatnak. A lepény és a magzat genetikai eredménye sem minden esetben azonos. A leleteket az orvos együtt értékeli.</p></details><details><summary>Megmondja az app, hogy egészséges-e a baba?</summary><p>Ez a bemutató nem állapít meg egészségi állapotot és nem számít személyes kockázatot. A valós gondozási és diagnosztikai kérdéseket a kezelőorvossal kell megbeszélni.</p></details></section>`;

export function patientPanel(state,c){
  const view=patientView(state,c.id),p=view.plan,next=view.tasks.find(t=>t.status==='open');
  const switcher=`<div class="patient-toolbar"><label for="patient-case">Bemutatóeset</label><select id="patient-case">${state.cases.map(x=>`<option value="${e(x.id)}" ${x.id===c.id?'selected':''}>${e(x.label)} · T${x.chromosome}</option>`).join('')}</select><span class="patient-mode-note">${icon('heart')} Páciensnézet</span></div>`;
  const headline=!p?'A következő lépést<br>közösen tisztázzuk.':view.closed?'A követés lezárult.':view.needsReview?'Egyeztessünk<br>a következő lépésről.':'Lépésről lépésre,<br><em>együtt.</em>';
  const intro=!p?'Ehhez a bemutatóesethez még nincs megosztott terv.':view.closed?'A megbeszélt összefoglaló és a korábbi terv egy helyen.':'Az egyeztetett terv, érthető magyarázatok és a következő megbeszélt lépés.';
  const hero=`<section class="patient-hero"><div><div class="hero-kicker"><span></span> AZ ÉN BETEGUTAM</div><h1>${headline}</h1><p>${intro}</p><div class="patient-trust"><span>${icon('document')} Érthető összefoglaló</span><span>${icon('share')} Közös terv</span></div></div><div class="patient-hero-art">${heroArtwork('patient')}</div></section>`;
  if(!p)return switcher+hero+`<div class="patient-empty-grid"><section class="card card-pad"><span class="big-soft-icon">${icon('document')}</span><h2>Az összefoglaló az egyeztetés után jelenik meg</h2><p class="muted">Az orvosi nézetben áttekinthető és megosztható a bemutatóterv. A még nem egyeztetett lépések nem kerülnek automatikusan ide.</p><button class="button primary" data-role="doctor" data-id="${e(c.id)}">${icon('case')} Orvosi nézet</button></section>${patientJourney(view)}</div><div class="section-gap">${originDiagram()}</div>`;
  const nextStatus=next?.status==='open'&&next.dueDate<state.demoDate?'Egyeztetendő, a dátum elmúlt':next?LABELS.task[next.status]:'';
  return switcher+hero+`${view.needsReview&&!view.closed?`<div class="callout amber patient-alert">${icon('clock')}<p><strong>A megosztott terv felülvizsgálatra vár.</strong><br>Az alábbiak a korábban megosztott változatot mutatják. Az új lépéseket az orvossal kell egyeztetni.</p></div>`:''}
  <div class="patient-grid"><div class="stack"><section class="card patient-summary"><div class="card-pad"><div class="summary-heading"><span class="big-soft-icon">${icon('document')}</span><div><span class="eyebrow">Mit jelent az eredmény?</span><h2>${view.closed?'Az eset összefoglalója':'Amit eddig tudunk'}</h2></div></div><p class="patient-lead">${e(patientMeaning[p.snapshot.stage]||patientMeaning.specialist_review)}</p><div class="patient-separator"></div><h3>A megbeszélt összefoglaló</h3><p>${e(p.summary)}</p><div class="summary-meta">${icon('check')}${p.version}. megosztott bemutatóváltozat · ${fullDate(p.acceptedOn)}</div></div></section>
    ${patientJourney(view)}${originDiagram()}${faq()}</div>
  <aside class="stack"><section class="next-appointment"><div class="appointment-top"><span class="eyebrow">${next?'Következő megbeszélt teendő':'Megbeszélt teendők'}</span><span class="appointment-icon">${icon(next?'calendar':'check')}</span></div><h2>${next?e(next.title):view.closed?'A követés lezárult':'Nincs nyitott teendő a megosztott tervben'}</h2>${next?`<div class="appointment-date">${fullDate(next.dueDate)}</div><span class="appointment-status">${e(nextStatus)}</span>`:'<p>A további lépéseket az egyeztetett terv tartalmazza.</p>'}<div class="appointment-decoration" aria-hidden="true"><span></span><span></span><span></span></div></section>
    <section class="card card-pad print-card"><span class="big-soft-icon">${icon('document')}</span><h3>Vidd magaddal az összefoglalót</h3><p class="muted small-copy">A megosztott terv nyomtatható és PDF-ként is elmenthető.</p><button class="button wide" data-action="print" data-id="${e(c.id)}">${icon('document')} Nyomtatás / PDF</button><div class="summary-meta section-gap">${e(p.snapshot.code)} · T${p.snapshot.chromosome}<br>Megosztáskor: ${weekLabel(p.snapshot.gestationalDays)} hét</div></section>
    <section class="conversation-card"><span class="eyebrow">A következő beszélgetéshez</span><h3>Két kérdés, amit érdemes felírni.</h3><ol><li>Melyik kérdésre adott választ a vizsgálat?</li><li>Mi a következő, közösen egyeztetett lépés?</li></ol></section>
    <details class="contact-note"><summary>Kihez fordulhatok?</summary><p>A valódi ellátásban itt a gondozó elérhetősége szerepelne. Ebben a bemutatóban nincs üzenetküldés vagy egészségügyi szolgáltatás.</p></details></aside></div>`;
}
