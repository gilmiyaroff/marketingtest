/* CAP Growth Quest: render the original animated GIFs with their black matte removed.
   Same-origin source GIFs are decoded by the browser; the displayed canvas has
   transparent pixels. This preserves the original six-frame crystal design. */
(function(){
'use strict';
const selector='#strategy .crystal-art-host';
const threshold=93;
let previous=0;
let started=false;
function stripEdgeMatte(img){
 const {data,width:w,height:h}=img, pixels=w*h;
 const marked=new Uint8Array(pixels);
 const queue=new Int32Array(pixels);
 let end=0,head=0;
 const dark=i=>{
   const off=i*4;
   if(data[off+3]<8)return true;
   const r=data[off],g=data[off+1],b=data[off+2];
   return Math.max(r,g,b)<threshold && (r+g+b)<215;
 };
 function add(i){
   if(i<0||i>=pixels||marked[i]||!dark(i))return;
   marked[i]=1;queue[end++]=i;
 }
 for(let x=0;x<w;x++){add(x);add((h-1)*w+x)}
 for(let y=0;y<h;y++){add(y*w);add(y*w+w-1)}
 while(head<end){
   const i=queue[head++], x=i%w,y=(i-x)/w;
   if(x>0)add(i-1);
   if(x+1<w)add(i+1);
   if(y>0)add(i-w);
   if(y+1<h)add(i+w);
 }
 for(let p=0;p<pixels;p++){
   const off=p*4;
   if(marked[p] || data[off+3]===0){data[off+3]=0;continue}
   // Feather only the very darkest isolated pixels, not the colored facets.
   if(data[off]<23 && data[off+1]<23 && data[off+2]<23)data[off+3]=0;
 }
 return img;
}
function process(host){
 const source=host.querySelector('img.crystal-source-gif');
 const canvas=host.querySelector('canvas.crystal-gem-art');
 if(!source||!canvas||!source.complete||!source.naturalWidth)return;
 const w=source.naturalWidth,h=source.naturalHeight;
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 if(!ctx)return;
 ctx.clearRect(0,0,w,h);
 try{
   ctx.drawImage(source,0,0,w,h);
   const image=ctx.getImageData(0,0,w,h);
   stripEdgeMatte(image);
   ctx.clearRect(0,0,w,h);
   ctx.putImageData(image,0,0);
   host.classList.add('crystal-art-ready');
 }catch(err){
   // If canvas is blocked, reveal the original GIF rather than a blank sprite.
   host.classList.add('crystal-art-fallback');
 }
}
function tick(now){
 requestAnimationFrame(tick);
 if(document.hidden||!document.querySelector('#strategy.active')||now-previous<95)return;
 previous=now;
 document.querySelectorAll(selector).forEach(process);
}
function init(){if(started)return;started=true;requestAnimationFrame(tick)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();