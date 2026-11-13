/* Small-screen game controls for touch devices. */
(function(){
 'use strict';
 function setup(){
  const scene=document.getElementById('research');
  const header=scene&&scene.querySelector('.retro-monitor-header');
  if(!scene||!header||header.querySelector('.retro-monitor-zoom'))return;
  const control=document.createElement('button');
  control.type='button';control.className='retro-monitor-zoom';
  control.textContent='⛶ Играть крупно';
  control.setAttribute('aria-label','Развернуть игровую сцену на весь экран телефона');
  control.setAttribute('aria-pressed','false');
  function resizePan(){requestAnimationFrame(()=>{window.dispatchEvent(new Event('resize'));});}
  function toggle(force){
   const expanded=typeof force==='boolean'?force:!scene.classList.contains('game-focused');
   scene.classList.toggle('game-focused',expanded);
   control.setAttribute('aria-pressed',String(expanded));
   control.textContent=expanded?'✕ Свернуть':'⛶ Играть крупно';
   control.setAttribute('aria-label',expanded?'Вернуться к миссии и подсказкам':'Развернуть игровую сцену на весь экран телефона');
   if(expanded)scene.scrollTop=0;
   resizePan();
  }
  control.addEventListener('click',()=>toggle());
  header.append(control);
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&scene.classList.contains('game-focused'))toggle(false)});
  const help=scene.querySelector('.research-pan-help');
  const touch=window.matchMedia&&window.matchMedia('(pointer:coarse)').matches;
  if(help&&touch)help.textContent='↔ Листай пальцем · нажимай на объекты';
  if(window.MutationObserver){
   const observer=new MutationObserver(()=>{if(!scene.classList.contains('active')&&scene.classList.contains('game-focused'))toggle(false)});
   observer.observe(scene,{attributes:true,attributeFilter:['class']});
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
 else setup();
})();
