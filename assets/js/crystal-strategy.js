/* Mission 02 — falling crystals and five independent positioning screens. */
(function(){
'use strict';
const defs=[
 {name:'СЕГМЕНТЫ ЦА',color:'#65e5fa',light:'#defaff',dark:'#2372b5',label:'бирюзовый',asset:'crystal_turquoise.gif'},
 {name:'ПОЗИЦИОНИРОВАНИЕ',color:'#c290ff',light:'#f5dfff',dark:'#714bb2',label:'фиолетовый',asset:'crystal_purple.gif'},
 {name:'ПИЛОТ ПРОДУКТА',color:'#ffca65',light:'#fff3bb',dark:'#c66c2d',label:'золотой',asset:'crystal_gold.gif'},
 {name:'КАНАЛЫ РОСТА',color:'#ff829e',light:'#ffdce7',dark:'#ba396a',label:'розовый',asset:'crystal_pink.gif'},
 {name:'KPI И ЭКОНОМИКА',color:'#8deaa3',light:'#edffe9',dark:'#2c9678',label:'зелёный',asset:'crystal_green.gif'}
];
const $=s=>document.querySelector(s);
let ctx=null,els=null,falling=[],held=null,heldOrigin=null,drag=null,flight=null,busy=false,timer=null,deck=[],serial=0;
const allOn=()=>ctx&&ctx.data.crystals.every(Boolean);
function styleGem(node,i){const d=defs[i];node.style.setProperty('--gem',d.color);node.style.setProperty('--gem-light',d.light);node.style.setProperty('--gem-dark',d.dark)}
// Original artist-made animated GIFs, not the temporary hand-drawn SVG approximations.
const gemShape=i=>'<span class="crystal-art-host"><img class="crystal-source-gif" src="assets/crystals/'+defs[i].asset+'" alt="" aria-hidden="true" draggable="false" loading="eager"><canvas class="crystal-gem-art" aria-hidden="true"></canvas></span>';
function notice(s){els.help.textContent=s}
const titleLines=[
 ['СЕГМЕНТЫ','ЦА'],
 ['ПОЗИЦИОНИРОВАНИЕ'],
 ['ПИЛОТ','ПРОДУКТА'],
 ['КАНАЛЫ','РОСТА'],
 ['KPI И','ЭКОНОМИКА']
];
const slotOrder=[0,2,3,4,1]; // longest cables serve top two screens, routed along left/right edges.
function fitScreenTitles(){
 if(!els?.matrix)return;
 els.matrix.querySelectorAll('.crystal-screen-label').forEach(label=>{
  label.style.removeProperty('font-size');
  const screen=label.closest('.crystal-mini-screen');
  if(!screen)return;
  const width=screen.clientWidth-8;
  if(width<30)return;
  const lines=Array.from(label.querySelectorAll('.crystal-label-line'));
  if(!lines.length)return;
  const widest=Math.max(...lines.map(line=>line.getBoundingClientRect().width));
  if(widest>width){
   const font=parseFloat(getComputedStyle(label).fontSize)||8;
   const fit=Math.max(5.5,Math.floor(font*width/widest*98)/100);
   label.style.setProperty('font-size',fit+'px','important');
  }
 });
}
function drawWires(){
 if(!els?.matrix||!$('#strategy').classList.contains('active'))return;
 const rack=els.matrix,svg=rack.querySelector('.crystal-wire-network');
 if(!svg)return;
 const root=rack.getBoundingClientRect(),w=root.width,h=root.height;
 if(!w||!h)return;
 svg.setAttribute('viewBox','0 0 '+w+' '+h);
 const paths=svg.querySelectorAll('[data-crystal-wire]');
 paths.forEach(path=>{
  const i=Number(path.dataset.crystalWire);
  const scr=rack.querySelector('[data-crystal-screen="'+i+'"]');
  const slot=rack.querySelector('[data-crystal-slot="'+i+'"]');
  if(!scr||!slot)return;
  const a=scr.getBoundingClientRect(),b=slot.getBoundingClientRect();
  const x1=a.left-root.left+a.width/2,y1=a.bottom-root.top;
  const x2=b.left-root.left+b.width/2,y2=b.top-root.top;
  let d;
  if(i===0||i===1){
   // Outer routes let two upper screens power the outside sockets
   // without cutting through the three middle screens.
   const edge=i===0?6:w-6;
   const upperY=y1+11,lowerY=y2-13;
   const corner=i===0?1:-1;
   d='M '+x1+' '+y1+' V '+upperY+
    ' H '+(edge+corner*7)+' L '+edge+' '+(upperY+7)+
    ' V '+(lowerY-7)+' L '+(edge+corner*7)+' '+lowerY+
    ' H '+x2+' V '+y2;
  }else{
   const elbowY=y1+12;
   d='M '+x1+' '+y1+' V '+elbowY+
     ' H '+x2+' V '+y2;
  }
  path.setAttribute('d',d);
 });
}
function render(){
 if(!ctx)return;
 const rack=els.matrix;rack.replaceChildren();
 const network=document.createElementNS('http://www.w3.org/2000/svg','svg');
 network.classList.add('crystal-wire-network');
 network.setAttribute('aria-hidden','true');
 network.setAttribute('preserveAspectRatio','none');
 defs.forEach((d,i)=>{
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');
  path.dataset.crystalWire=String(i);
  path.classList.add('crystal-wire-path');
  if(ctx.data.crystals[i])path.classList.add('is-powered');
  else if(held===i)path.classList.add('is-selected');
  path.style.setProperty('--gem',d.color);
  network.append(path);
 });
 rack.append(network);
 const displayRows=document.createElement('div');
 displayRows.className='crystal-display-rows';
 [[0,1],[2,3,4]].forEach((members,index)=>{
  const row=document.createElement('div');
  row.className='crystal-screen-row '+(index===0?'crystal-screen-row-top':'crystal-screen-row-bottom');
  members.forEach(i=>{
   const d=defs[i],powered=ctx.data.crystals[i];
   const panel=document.createElement('div');
   panel.className='crystal-display'+(powered?' is-powered':'')+(held===i&&!powered?' is-selected':'');
   panel.dataset.crystalScreen=String(i);
   styleGem(panel,i);
   const screen=document.createElement('div');
   screen.className='crystal-mini-screen'+(powered?' is-powered':'');
   screen.setAttribute('aria-live','polite');
   screen.setAttribute('aria-label',powered?d.name:'Экран '+(i+1)+' ожидает кристалл');
   const label=document.createElement('strong');label.className='crystal-screen-label';
   if(powered)titleLines[i].forEach(piece=>{
    const line=document.createElement('span');
    line.className='crystal-label-line';line.textContent=piece;label.append(line);
   });
   const led=document.createElement('span');led.className='crystal-monitor-led';led.setAttribute('aria-hidden','true');
   screen.append(label,led);panel.append(screen);row.append(panel);
  });
  displayRows.append(row);
 });
 rack.append(displayRows);
 const bank=document.createElement('div');bank.className='crystal-slot-bank';
 slotOrder.forEach(i=>{
  const d=defs[i],powered=ctx.data.crystals[i];
  const holder=document.createElement('div');holder.className='crystal-slot-holder'+(powered?' is-powered':'');
  styleGem(holder,i);
  const socket=document.createElement('button');socket.type='button';
  socket.className='crystal-socket'+(powered?' is-powered':'')+(held===i?' is-target':'');
  socket.dataset.crystalSlot=String(i);
  socket.setAttribute('aria-label',d.label+' гнездо: '+(powered?'включён экран '+d.name:'ожидает кристалл'));
  socket.setAttribute('aria-pressed',String(powered));
  const port=document.createElement('span');port.className='crystal-port';
  port.innerHTML=powered?gemShape(i):'◇';
  socket.append(port);holder.append(socket);bank.append(holder);
  socket.addEventListener('click',()=>place(i));
 });
 rack.append(bank);
 requestAnimationFrame(()=>{fitScreenTitles();drawWires()});
 const n=ctx.data.crystals.filter(Boolean).length;
 els.count.textContent=n+' / 5';els.charge.style.width=n*20+'%';
 els.next.disabled=n!==5;
 els.next.style.display=n===5?'block':'none';
 els.next.textContent=n===5?'К диалогу с собственником →':'Заряжено '+n+' из 5';
 els.core.textContent=n===5?'ВСЕ ПЯТЬ ЭКРАНОВ АКТИВИРОВАНЫ':'CAP · СТРАТЕГИЯ / ОЖИДАНИЕ ЭНЕРГИИ';
 els.core.classList.toggle('is-on',n===5);
 els.feedback.textContent=n===5
  ?'✓ Все пять экранов работают! Каждый цвет активировал отдельную часть маркетинговой стратегии CAP Education.'
  :n===0?'Поймай пять цветов и заряди пять экранов, соединённых проводами со слотами.'
   :'Активировано '+n+' из 5 экранов. Держи кристалл и перенеси его в слот соответствующего цвета.';
 if(n===5){stop();if(!ctx.data.completed.includes('strategy'))ctx.reward('strategy')}
}
function choose(i,origin){
 if(busy||ctx.data.crystals[i])return;
 held=i;heldOrigin=origin||null;
 render(); // highlights the one matching cell, without an extra held-item panel
 notice('Выбран '+defs[i].label+' кристалл. Нажми подсвеченную ячейку, чтобы включить её экран.');
}
function clearFlight(){
 if(!flight)return;
 const active=flight;flight=null;
 if(active.timeoutId)clearTimeout(active.timeoutId);
 if(active.animation)try{active.animation.cancel()}catch(e){}
 active.node.remove();busy=false;
}
function place(i,origin){
 if(busy)return;
 if(ctx.data.crystals[i]){notice('Этот экран уже включён: '+defs[i].name);return}
 if(held===null){notice('Сначала поймай кристалл внизу игрового поля.');return}
 if(held!==i){
  notice('Цвета не совпадают: нужен '+defs[held].label+' слот.');
  const wrong=els.matrix.querySelector('[data-crystal-slot="'+i+'"]');
  if(wrong){wrong.classList.add('is-wrong');setTimeout(()=>wrong.classList.remove('is-wrong'),460)}
  return;
 }
 const target=els.matrix.querySelector('[data-crystal-slot="'+i+'"]');
 const rect=target?.querySelector('.crystal-port')?.getBoundingClientRect()||target?.getBoundingClientRect();
 const from=origin||heldOrigin;
 const to=rect?{x:rect.left+rect.width/2,y:rect.top+rect.height/2}:null;
 busy=true;
 if(target)target.classList.add('is-charging');
 let finished=false;
 function complete(){
  if(finished)return;finished=true;
  if(flight){const active=flight;flight=null;if(active.timeoutId)clearTimeout(active.timeoutId);active.node.remove()}
  if(!$('#strategy').classList.contains('active')){busy=false;return}
  ctx.data.crystals[i]=true;held=null;heldOrigin=null;busy=false;ctx.persist();
  falling.filter(g=>g.id===i).forEach(g=>g.node.remove());
  falling=falling.filter(g=>g.id!==i);
  render();notice('✦ '+defs[i].name+' — экран включён!');
 }
 const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(!from||!to||reduced){complete();return}
 const flying=document.createElement('div');flying.className='crystal-flight-gem';
 styleGem(flying,i);
 flying.innerHTML=gemShape(i);
 flying.style.left=from.x+'px';flying.style.top=from.y+'px';
 $('#strategy').append(flying);
 const duration=470;
 const animation=flying.animate([
  {left:from.x+'px',top:from.y+'px',transform:'translate(-50%,-50%) scale(1)',opacity:1,offset:0},
  {left:(from.x+(to.x-from.x)*.48)+'px',top:(Math.min(from.y,to.y)-55)+'px',transform:'translate(-50%,-50%) scale(1.12)',opacity:1,offset:.55},
  {left:to.x+'px',top:to.y+'px',transform:'translate(-50%,-50%) scale(.46)',opacity:.93,offset:1}
 ],{duration,easing:'cubic-bezier(.28,.85,.32,1)',fill:'forwards'});
 flight={node:flying,animation,timeoutId:setTimeout(complete,duration+120)};
 animation.finished.then(complete).catch(()=>{});
}
function refill(){
 const remaining=defs.map((_,i)=>i).filter(i=>!ctx.data.crystals[i]);
 deck=[];
 for(let n=0;n<2;n++)deck.push(...remaining.slice().sort(()=>Math.random()-.5));
}
function spawn(){
 if(!ctx||allOn()||!$('#strategy').classList.contains('active')||falling.length>=6)return;
 if(!deck.length)refill();
 const i=deck.shift();if(i===undefined||ctx.data.crystals[i])return;
 const el=document.createElement('button');el.type='button';el.className='falling-crystal';
 el.dataset.crystal=String(serial++);el.innerHTML=gemShape(i);styleGem(el,i);
 el.setAttribute('aria-label','Поймать '+defs[i].label+' кристалл');
 const w=els.rain.clientWidth,travel=els.rain.clientHeight+115;
 // Reserve space on both sides for a gentle zig-zag without clipping.
 const pad=Math.min(82,Math.max(34,w*.14));
 const drift=Math.round((Math.random()-.5)*Math.min(62,w*.18));
 const startX=Math.round(pad+Math.random()*Math.max(1,w-2*pad));
 el.style.left=startX+'px';
 el.style.setProperty('--drift',drift+'px');
 el.style.setProperty('--fall-distance',travel+'px');
 el.style.setProperty('--sway1',Math.round(drift*.2+9)+'px');
 el.style.setProperty('--sway2',Math.round(drift*.48-11)+'px');
 el.style.setProperty('--sway3',Math.round(drift*.75+8)+'px');
 el.style.setProperty('--fall22',Math.round(travel*.22)+'px');
 el.style.setProperty('--fall48',Math.round(travel*.48)+'px');
 el.style.setProperty('--fall75',Math.round(travel*.75)+'px');
 el.style.setProperty('--spark-delay',(-Math.random()*2.7).toFixed(2)+'s');
 el.style.animationDuration=(4.1+Math.random()*2.1).toFixed(2)+'s';
 falling.push({node:el,id:i});els.rain.append(el);
 // Also catch ordinary click/keyboard activation (some mobile browsers and
 // automation drivers do not deliver pointerdown to fast-moving elements).
 el.addEventListener('click',()=>{
  const at=falling.find(g=>g.node===el);
  if(!at)return;
  falling=falling.filter(g=>g!==at);const bounds=el.getBoundingClientRect();const point={x:bounds.left+bounds.width/2,y:bounds.top+bounds.height/2};el.remove();choose(i,point);
 });
 el.addEventListener('animationend',()=>{
  // Missed gems disappear below the playfield; colors keep spawning until all screens light.
  const at=falling.findIndex(g=>g.node===el);
  if(at!==-1)falling.splice(at,1);
  el.remove();
 });
}
function stop(){
 if(timer!==null){clearInterval(timer);timer=null}
 falling.forEach(g=>g.node.remove());falling=[];deck=[];
}
function start(){
 if(timer!==null||allOn())return;
 spawn();timer=setInterval(spawn,640);
}
function clearDrag(){
 if(!drag)return;
 const d=drag;drag=null;
 if(d.ghost)d.ghost.remove();
 if(d.button){
  d.button.classList.remove('is-grabbed');
  d.button.style.animationPlayState='';
 }
 try{
  if(els?.rain?.hasPointerCapture?.(d.id))els.rain.releasePointerCapture(d.id);
 }catch(err){}
}
function removeCaughtGem(gem){
 if(!gem)return;
 falling=falling.filter(g=>g!==gem);
 gem.node.remove();
}
function getSlotAt(x,y){
 const exact=document.elementFromPoint(x,y)?.closest('[data-crystal-slot]');
 if(exact)return exact;
 // A small magnetic margin around the correct socket makes thumb drops
 // less frustrating on narrow mobile screens without accepting a wrong color.
 if(held===null)return null;
 const matching=els.matrix.querySelector('[data-crystal-slot="'+held+'"]');
 if(!matching)return null;
 const rect=matching.getBoundingClientRect();
 return x>=rect.left-12&&x<=rect.right+12&&y>=rect.top-18&&y<=rect.bottom+18?matching:null;
}
function markHoverSlot(slot){
 els.matrix.querySelectorAll('.crystal-socket.is-drop-hover').forEach(node=>{
  if(node!==slot)node.classList.remove('is-drop-hover');
 });
 if(slot&&Number(slot.dataset.crystalSlot)===held&&!ctx.data.crystals[held])slot.classList.add('is-drop-hover');
}
function init(c){
 ctx=c;
 els={rain:$('#crystal-rain'),matrix:$('#crystal-matrix'),count:$('#crystal-count'),charge:$('#crystal-charge'),next:$('#strategy-check'),core:$('#crystal-core-text'),help:$('#crystal-help'),feedback:$('#strategy-feedback')};
 els.rain.addEventListener('pointerdown',e=>{
  const button=e.target.closest('.falling-crystal');
  if(!button||(e.pointerType==='mouse'&&e.button!==0)||busy||drag)return;
  const gem=falling.find(g=>g.node===button);if(!gem)return;
  e.preventDefault();
  const rect=button.getBoundingClientRect();
  const point={x:rect.left+rect.width/2,y:rect.top+rect.height/2};
  // Leave the actual pointer target attached and pause its fall. Removing it
  // on pointerdown causes iOS Safari to cancel the active touch gesture.
  button.classList.add('is-grabbed');
  button.style.animationPlayState='paused';
  drag={id:e.pointerId,gem:gem.id,entry:gem,button,x:e.clientX,y:e.clientY,ghost:null,moved:false};
  try{els.rain.setPointerCapture(e.pointerId)}catch(err){
   try{button.setPointerCapture(e.pointerId)}catch(ignore){}
  }
  choose(gem.id,point);
 });
 window.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  if(!drag.ghost&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7){
   drag.moved=true;
   drag.ghost=document.createElement('div');
   drag.ghost.className='crystal-drag-ghost';
   drag.ghost.innerHTML=gemShape(drag.gem);styleGem(drag.ghost,drag.gem);
   // Keep the drag preview inside #strategy so the original GIF alpha
   // processing and game CSS are applied to it as well.
   $('#strategy').append(drag.ghost);
  }
  if(drag.ghost){
   drag.ghost.style.left=e.clientX+'px';
   drag.ghost.style.top=(e.clientY-30)+'px';
   const target=getSlotAt(e.clientX,e.clientY);
   markHoverSlot(target);
   e.preventDefault();
  }
 },{passive:false});
 window.addEventListener('pointerup',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  const grabbed=drag;
  const destination=grabbed.moved?getSlotAt(e.clientX,e.clientY):null;
  // End capture only after hit-testing; then release the invisible original.
  clearDrag();
  removeCaughtGem(grabbed.entry);
  markHoverSlot(null);
  if(destination)place(Number(destination.dataset.crystalSlot),{x:e.clientX,y:e.clientY});
  // A quick tap, or a drag released elsewhere, keeps the correct slot
  // highlighted so it can also be completed with one more tap.
 });
 window.addEventListener('pointercancel',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  const grabbed=drag;clearDrag();removeCaughtGem(grabbed.entry);markHoverSlot(null);
 });
 window.addEventListener('resize',()=>requestAnimationFrame(()=>{fitScreenTitles();drawWires()}),{passive:true});
 if(window.ResizeObserver){
  const watcher=new ResizeObserver(()=>requestAnimationFrame(drawWires));
  watcher.observe(els.matrix);
 }
  els.next.addEventListener('click',()=>{if(allOn()){stop();ctx.go('pilot')}});
}
function enter(){if(!ctx)return;render();start()}
function leave(){stop();clearDrag();clearFlight();held=null;heldOrigin=null}
function reset(){stop();clearDrag();clearFlight();held=null;heldOrigin=null;if(els)notice('Лови кристаллы в нижнем поле. Каждый слот связан проводом со своим экраном.')}
window.CAPCrystals={init,enter,leave,reset,defs};
})();