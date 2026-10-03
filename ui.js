export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const dateLabel=value=>value?new Intl.DateTimeFormat('hu-HU',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z')):'Nincs megadva';
export const fullDate=value=>value?new Intl.DateTimeFormat('hu-HU',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z')):'–';
const paths={
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  case:'<path d="M9 5V3h6v2M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 12h18M10 11v3h4v-3"/>',
  book:'<path d="M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-4-2-7-1-10 1zm0 0v15"/>',
  project:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.1"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  refresh:'<path d="M20 7v5h-5M4 17v-5h5M5.8 7a7 7 0 0 1 12.7-1L20 9M4 15l1.5 3A7 7 0 0 0 18.2 17"/>',
  document:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5"/>',
  share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/>',
  shield:'<path d="m12 3 8 3v6c0 4-3 7-8 10-5-3-8-6-8-10V6zM8 12l3 3 5-6"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  edit:'<path d="m14 5 5 5M4 20l5-1L21 7l-5-5L4 14z"/>',
};
export function icon(name){return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.info}</svg>`;}
// A shared decorative motif keeps the logo and explanatory artwork consistent.
export function dnaMotif({cx,top,height,amplitude,turns=1.5,stroke=3,rungs=13,front='#347b6c',back='#9ec3b4',bridge='#8eb6a6'}){
  const point=(side,t)=>[cx+side*amplitude*Math.cos(t*Math.PI*2*turns),top+t*height];
  const strand=(side,from=0,to=1)=>{
    const steps=Math.round((to-from)*turns*64);
    return Array.from({length:steps+1},(_,i)=>{
      const [x,y]=point(side,from+(to-from)*i/steps);
      return `${i?'L':'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');
  };
  const bridges=Array.from({length:rungs},(_,i)=>{
    const t=(i+1)/(rungs+1),[a,y]=point(1,t),[b]=point(-1,t);
    return Math.abs(a-b)<stroke*1.4?'':`<path d="M${a.toFixed(2)} ${y.toFixed(2)}H${b.toFixed(2)}"/>`;
  }).join('');
  const halves=turns*2;
  return `<g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <g stroke="${back}" stroke-width="${stroke}"><path d="${strand(1)}"/><path d="${strand(-1)}"/></g>
    <g stroke="${bridge}" stroke-width="${stroke*.42}">${bridges}</g>
    <g stroke="${front}" stroke-width="${stroke}">${Array.from({length:halves},(_,i)=>`<path d="${strand(i%2?-1:1,i/halves,(i+1)/halves)}"/>`).join('')}</g>
  </g>`;
}
export const mark=`<svg class="brand-mark" viewBox="0 0 48 48" fill="none" color="#88bcae" aria-hidden="true"><rect width="48" height="48" rx="15" fill="currentColor"/><rect x="1" y="1" width="46" height="46" rx="14" stroke="#fff" stroke-opacity=".17"/>${dnaMotif({cx:24,top:9,height:30,amplitude:8,turns:1,stroke:2.3,rungs:7,front:'#fff',back:'#d3e8dd',bridge:'#e9f4ec'})}</svg>`;
