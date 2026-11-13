/* Mission 02 — falling crystals and five independent positioning screens. */
(function(){
'use strict';
const defs=[
 {name:'СЕГМЕНТЫ ЦА',color:'#65e5fa',light:'#defaff',dark:'#2372b5',label:'бирюзовый'},
 {name:'ПОЗИЦИОНИРОВАНИЕ',color:'#c290ff',light:'#f5dfff',dark:'#714bb2',label:'фиолетовый'},
 {name:'ПИЛОТ ПРОДУКТА',color:'#ffca65',light:'#fff3bb',dark:'#c66c2d',label:'золотой'},
 {name:'КАНАЛЫ РОСТА',color:'#ff829e',light:'#ffdce7',dark:'#ba396a',label:'розовый'},
 {name:'KPI И ЭКОНОМИКА',color:'#8deaa3',light:'#edffe9',dark:'#2c9678',label:'зелёный'}
];
const $=s=>document.querySelector(s);
let ctx=null,els=null,falling=[],held=null,drag=null,timer=null,deck=[],serial=0;
const allOn=()=>ctx&&ctx.data.crystals.every(Boolean);
function styleGem(node,i){const d=defs[i];node.style.setProperty('--gem',d.color);node.style.setProperty('--gem-light',d.light);node.style.setProperty('--gem-dark',d.dark)}
const gemShape='<span class="crystal-gem-shape"><span class="crystal-gem-facet"></span><span class="crystal-gem-spark"></span></span>';
function notice(s){els.help.textContent=s}
function refreshHeld(){
 const show=held!==null&&!ctx.data.crystals[held];els.held.hidden=!show;
 if(show){styleGem(els.hand,held);els.heldLabel.textContent='ПОЙМАН: '+defs[held].label.toUpperCase()+' КРИСТАЛЛ'}
}
function render(){
 if(!ctx)return;
 const grid=els.matrix;grid.replaceChildren();
 defs.forEach((d,i)=>{
  const on=ctx.data.crystals[i],button=document.createElement('button');
  button.type='button';button.className='crystal-socket'+(on?' is-powered':'')+(held===i?' is-target':'');
  button.dataset.crystalSlot=String(i);styleGem(button,i);
  button.setAttribute('aria-label',d.label+' слот, '+(on?'экран активен: '+d.name:'экран ждёт кристалл'));
  const port=document.createElement('span');port.className='crystal-port';port.innerHTML=on?gemShape:'◇';
  const screen=document.createElement('span');screen.className='crystal-mini-screen';
  const heading=document.createElement('small');heading.textContent='ЭКРАН 0'+(i+1);
  const label=document.createElement('strong');label.textContent=on?d.name:'· · ·';
  screen.append(heading,label);button.append(port,screen);
  button.addEventListener('click',()=>place(i));grid.append(button);
 });
 const n=ctx.data.crystals.filter(Boolean).length;
 els.count.textContent=n+' / 5';els.charge.style.width=n*20+'%';
 els.next.disabled=n!==5;
 els.next.textContent=n===5?'К диалогу с собственником →':'Заряжено '+n+' из 5';
 els.core.textContent=n===5?'ВСЕ ПЯТЬ ЭКРАНОВ АКТИВИРОВАНЫ':'CAP · СТРАТЕГИЯ / ОЖИДАНИЕ ЭНЕРГИИ';
 els.core.classList.toggle('is-on',n===5);
 els.feedback.textContent=n===5
  ?'✓ Все пять экранов работают! Каждый цвет активировал отдельную часть маркетинговой стратегии CAP Education.'
  :n===0
   ?'Лови падающие кристаллы. Каждый цвет питает отдельный экран: сегменты, позиционирование, пилот, каналы или экономику.'
   :'Уже активировано '+n+' из 5 экранов. Продолжай ловить оставшиеся цвета.';
 refreshHeld();
 if(n===5){stop();if(!ctx.data.completed.includes('strategy'))ctx.reward('strategy')}
}
function choose(i){
 if(ctx.data.crystals[i])return;
 held=i;render();
 notice('Пойман '+defs[i].label+' кристалл. Перетащи к нужному слоту или нажми на экран такого же цвета.');
}
function place(i){
 if(ctx.data.crystals[i]){notice('Экран уже горит: '+defs[i].name);return}
 if(held===null){notice('Сначала поймай падающий кристалл, затем выбери слот того же цвета.');return}
 if(held!==i){
  notice('Цвета не совпадают! Нужен '+defs[held].label+' слот.');
  const b=els.matrix.querySelector('[data-crystal-slot="'+i+'"]');
  b.classList.add('is-wrong');setTimeout(()=>b.classList.remove('is-wrong'),460);return;
 }
 ctx.data.crystals[i]=true;held=null;ctx.persist();
 falling.filter(g=>g.id===i).forEach(g=>g.node.remove());
 falling=falling.filter(g=>g.id!==i);
 render();notice('✦ '+defs[i].name+' — экран включён!');
}
function refill(){
 const remaining=defs.map((_,i)=>i).filter(i=>!ctx.data.crystals[i]);
 deck=[];
 for(let n=0;n<2;n++)deck.push(...remaining.slice().sort(()=>Math.random()-.5));
}
function spawn(){
 if(!ctx||allOn()||!$('#strategy').classList.contains('active')||falling.length>=7)return;
 if(!deck.length)refill();
 const i=deck.shift();if(i===undefined||ctx.data.crystals[i])return;
 const el=document.createElement('button');el.type='button';el.className='falling-crystal';
 el.dataset.crystal=String(serial++);el.innerHTML=gemShape;styleGem(el,i);
 el.setAttribute('aria-label','Поймать '+defs[i].label+' кристалл');
 const w=els.rain.clientWidth,travel=els.rain.clientHeight+70;
 el.style.left=Math.round(7+Math.random()*Math.max(0,w-66))+'px';
 el.style.setProperty('--fall-distance',travel+'px');
 el.style.animationDuration=(3.2+Math.random()*1.25)+'s';
 falling.push({node:el,id:i});els.rain.append(el);
 // Also catch ordinary click/keyboard activation (some mobile browsers and
 // automation drivers do not deliver pointerdown to fast-moving elements).
 el.addEventListener('click',()=>{
  const at=falling.find(g=>g.node===el);
  if(!at)return;
  falling=falling.filter(g=>g!==at);el.remove();choose(i);
 });
 el.addEventListener('animationend',()=>{
  const at=falling.find(g=>g.node===el);
  if(!at)return;
  // Let missed crystals settle on a reachable ledge instead of vanishing.
  // Only one stable crystal of each unfilled color can be on the ledge.
  const sameColor=falling.some(g=>g!==at&&g.id===i&&g.landed);
  if(!ctx.data.crystals[i]&&!sameColor&&els.tray.childElementCount<5){
   at.landed=true;el.classList.add('crystal-landed');
   el.style.left='auto';el.style.top='auto';el.style.animation='none';
   el.style.removeProperty('--fall-distance');el.style.transform='none';
   els.tray.append(el);return;
  }
  falling=falling.filter(g=>g!==at);el.remove();
 });
}
function stop(){
 if(timer!==null){clearInterval(timer);timer=null}
 falling.forEach(g=>g.node.remove());falling=[];deck=[];
}
function start(){
 if(timer!==null||allOn())return;
 spawn();timer=setInterval(spawn,530);
}
function clearDrag(){
 if(drag?.ghost)drag.ghost.remove();drag=null;
}
function init(c){
 ctx=c;
 els={rain:$('#crystal-rain'),tray:$('#crystal-catch-tray'),matrix:$('#crystal-matrix'),held:$('#crystal-held'),hand:$('#crystal-held-gem'),heldLabel:$('#crystal-held-label'),count:$('#crystal-count'),charge:$('#crystal-charge'),next:$('#strategy-check'),core:$('#crystal-core-text'),help:$('#crystal-help'),feedback:$('#strategy-feedback')};
 els.rain.addEventListener('pointerdown',e=>{
  const button=e.target.closest('.falling-crystal');
  if(!button||(e.pointerType==='mouse'&&e.button!==0))return;
  const gem=falling.find(g=>g.node===button);if(!gem)return;
  e.preventDefault();
  falling=falling.filter(g=>g!==gem);gem.node.remove();
  choose(gem.id);clearDrag();drag={id:e.pointerId,gem:gem.id,x:e.clientX,y:e.clientY,ghost:null};
 });
 window.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  if(!drag.ghost&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>9){
   drag.ghost=document.createElement('div');drag.ghost.className='crystal-drag-ghost';
   drag.ghost.innerHTML=gemShape;styleGem(drag.ghost,drag.gem);
   document.body.append(drag.ghost);
  }
  if(drag.ghost){drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';e.preventDefault()}
 },{passive:false});
 window.addEventListener('pointerup',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  const wasDragging=!!drag.ghost;clearDrag();
  if(wasDragging){
   const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-crystal-slot]');
   if(target)place(Number(target.dataset.crystalSlot));
  }
 });
 window.addEventListener('pointercancel',e=>{if(drag?.id===e.pointerId)clearDrag()});
 $('#crystal-drop').addEventListener('click',()=>{held=null;render();notice('Кристалл отпущен. Поймай другой цвет!')});
 els.next.addEventListener('click',()=>{if(allOn()){stop();ctx.go('pilot')}});
}
function enter(){if(!ctx)return;render();start()}
function leave(){stop();clearDrag()}
function reset(){stop();held=null;clearDrag();if(els){els.held.hidden=true;notice('Лови падающие кристаллы и заряжай каждый мини-экран своим цветом.')}}
window.CAPCrystals={init,enter,leave,reset,defs};
})();