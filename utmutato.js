import {mark} from './ui.js';

document.querySelector('#guide-brand-mark').innerHTML=mark;
document.querySelector('[data-print-guide]').addEventListener('click',()=>window.print());
if(window.matchMedia('(max-width:780px)').matches)document.querySelector('#guide-index-details').open=false;
