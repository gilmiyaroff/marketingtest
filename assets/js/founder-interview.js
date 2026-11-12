/* CAP Growth Quest — founder interview, personalized strategy, retro display. */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const questions=[
 {tag:'ЦЕЛЬ МАРКЕТИНГА',q:'Какую главную задачу должен решить маркетинг CAP Education в ближайший год?',intro:'Вы исследовали рынок и собрали каркас стратегии. Что для вас главное в маркетинге CAP?',answers:[
 ['Сделать новый школьный продукт узнаваемым и понятным','Значит, сначала проверим, понимают ли родители ценность нового продукта.','Проверить позиционирование нового продукта через интервью и тесты офферов.'],
 ['Построить предсказуемый поток заявок и продаж','Понадобится прозрачная воронка от рекламы и CRM до оплаты.','Собрать единую воронку обращения → квалификация → оплата и измерить CAC.'],
 ['Усилить бренд и доверие к CAP Education','Тогда ключевыми станут экспертность, репутация и проверяемые кейсы.','Проанализировать бренд, экспертный контент и подтверждаемые результаты учеников.']
 ]},
 {tag:'ЦЕННОСТЬ ДЛЯ РОДИТЕЛЯ',q:'Что должно стать главным аргументом для родителей при выборе нового продукта?',intro:'А теперь о семье. Какую ценность родитель должен почувствовать в первую очередь?',answers:[
 ['Понятный и подтверждаемый прогресс ребёнка','Проверим, как измерить и показать прогресс без неподтверждённых обещаний.','Протестировать объяснение результатов диагностики и отчёт о прогрессе.'],
 ['Доступность, гибкость и удобная подписка','Важно проверить тариф, условия подписки и барьеры первой оплаты.','Проверить ценовые гипотезы, путь первой оплаты и причины отказа.'],
 ['Экспертность преподавателей и качество обучения','Сделаем экспертизу и качество первого опыта видимыми.','Упаковать преподавательскую экспертизу и проверить пробный урок.']
 ]},
 {tag:'ПОДХОД К ЗАПУСКУ',q:'Как вы предпочитаете запускать и развивать новое направление?',intro:'Хочу понять отношение к скорости и риску: какой путь запуска вам ближе?',answers:[
 ['Сначала небольшой пилот, затем масштабирование','Определим критерии пилота, проверим активацию, оплаты и удержание.','Провести пилот с критериями активации, оплаты и продления.'],
 ['Быстро тестировать несколько гипотез и каналов','Тогда организуем короткие спринты с понятными критериями решений.','Запустить ограниченные эксперименты с офферами, креативами и каналами.'],
 ['Расти через контент, рекомендации и партнёрства','Проверим, какие истории и рекомендации действительно создают спрос.','Протестировать экспертный контент, родительский UGC и партнёрские источники.']
 ]},
 {tag:'РЕЗУЛЬТАТ 90 ДНЕЙ',q:'По каким признакам вы поймёте, что первые 90 дней прошли успешно?',intro:'Последний вопрос. Что будет убедительным результатом работы руководителя маркетинга?',answers:[
 ['Понятны сегменты, спрос и сильные офферы','Значит, главная ценность — проверенные инсайты и ясные следующие решения.','Зафиксировать подтверждённые сегменты и проверенные офферы.'],
 ['Прозрачны CAC, конверсии и первые продажи','Главное — управляемая экономика и прозрачность показателей.','Настроить отчётность по CAC, конверсиям, оплатам и удержанию.'],
 ['Продукт, контент, маркетинг и продажи работают как система','Тогда выстраиваем общий ритм команд, данные и ответственность.','Ввести общие KPI маркетинга и продаж и регулярные встречи по решениям.']
 ]}
];
let ctx=null,step=null,baseline=null;
const complete=()=>ctx&&Array.isArray(ctx.data.ownerAnswers)&&ctx.data.ownerAnswers.length===4&&ctx.data.ownerAnswers.every(v=>Number.isInteger(v)&&v>=0&&v<3);
function decorate(){
 const ids=['research','strategy','pilot','content','scale','puzzle'];
 ids.forEach((id,i)=>{
  const host=$('#'+id+' .activity');if(!host||host.querySelector('.retro-monitor'))return;
  const monitor=document.createElement('div');monitor.className='retro-monitor';
  const chassis=document.createElement('div');chassis.className='retro-monitor-chassis';
  const header=document.createElement('div');header.className='retro-monitor-header';
  header.innerHTML='<span class="retro-monitor-logo">CAP <em>GROWTH</em></span><span class="retro-monitor-id">LEVEL '+String(i+1).padStart(2,'0')+' / 06</span>';
  const screen=document.createElement('div');screen.className='retro-monitor-screen';
  while(host.firstChild)screen.append(host.firstChild);
  const footer=document.createElement('div');footer.className='retro-monitor-footer';
  footer.innerHTML='<span class="retro-monitor-led" aria-hidden="true"></span><span>PIXEL STRATEGY SYSTEM</span><span class="retro-monitor-slits" aria-hidden="true">▰▰▰</span>';
  chassis.append(header,screen,footer);
  const stand=document.createElement('div');stand.className='retro-monitor-stand';stand.setAttribute('aria-hidden','true');
  monitor.append(chassis,stand);host.append(monitor);
 });
}
function init(config){
 ctx=config;
 baseline={a:$('#plan-30').textContent,b:$('#plan-60').textContent,c:$('#plan-90').textContent};
 $('#owner-back').addEventListener('click',()=>{if(step===null||step===0)return;step--;render()});
 $('#pilot-next').addEventListener('click',()=>{
  if(step===4){if(complete())ctx.go('content');return}
  if(!Number.isInteger(ctx.data.ownerAnswers[step]))return;
  step++;
  if(step===4&&complete())ctx.reward('pilot');
  render();
 });
 $('#owner-final-edit').addEventListener('click',()=>{step=4;ctx.go('pilot')});
 decorate();
}
function render(){
 if(!ctx)return;
 if(step===null)step=complete()?4:ctx.data.ownerAnswers.findIndex(v=>v===null);
 if(step<0)step=0;
 const done=step===4;
 $('#owner-question-panel').hidden=done;$('#owner-summary').hidden=!done;
 $('#owner-counter').textContent=done?'04 / 04':String(step+1).padStart(2,'0')+' / 04';
 $('#owner-back').disabled=step===0;$('#owner-back').textContent=done?'← Изменить ответы':'← Предыдущий вопрос';
 $('#owner-talk').textContent=done?'Спасибо! Теперь ваши приоритеты помогут мне адаптировать финальный план CAP Education.':questions[step].intro;
 if(done){
  const recap=$('#owner-recap');recap.replaceChildren();
  questions.forEach((q,i)=>{
   const node=document.createElement('div');node.className='owner-recap-item';
   const key=document.createElement('strong');key.textContent=(i+1)+'. '+q.tag;
   const value=document.createElement('span');value.textContent=q.answers[ctx.data.ownerAnswers[i]][0];
   node.append(key,value);recap.append(node);
  });
  $('#pilot-feedback').textContent='Ответы сохранены. Они изменят акценты в финальном плане на 30, 60 и 90 дней.';
  $('#pilot-next').disabled=false;$('#pilot-next').textContent='К каналам роста →';
  return;
 }
 const q=questions[step],selected=ctx.data.ownerAnswers[step];
 $('#owner-question-id').textContent='ВОПРОС '+String(step+1).padStart(2,'0')+' / 04 · '+q.tag;
 $('#owner-question').textContent=q.q;
 const options=$('#owner-options');options.replaceChildren();
 q.answers.forEach((o,i)=>{
  const btn=document.createElement('button');btn.type='button';btn.className='owner-choice'+(selected===i?' selected':'');btn.setAttribute('aria-pressed',String(selected===i));
  const label=document.createElement('span');label.className='owner-choice-index';label.textContent=String.fromCharCode(65+i);
  const value=document.createElement('span');value.className='owner-choice-label';value.textContent=o[0];
  const mark=document.createElement('strong');mark.textContent=selected===i?'✓':'›';
  btn.append(label,value,mark);btn.addEventListener('click',()=>{ctx.data.ownerAnswers[step]=i;ctx.persist();render()});options.append(btn);
 });
 const response=$('#owner-response');response.hidden=selected===null;
 response.textContent=selected===null?'':'✓ Понял. '+q.answers[selected][1];
 $('#pilot-next').disabled=selected===null;
 $('#pilot-next').textContent=selected===null?'Выберите ответ':step===3?'Собрать профиль →':'Следующий вопрос →';
 $('#pilot-feedback').textContent=selected===null?'Нет правильных и неправильных ответов. Выберите наиболее близкий вам приоритет.':'Ответ принят — его можно изменить до следующего вопроса.';
}
function renderFinal(){
 if(!ctx||!baseline)return;
 $('#plan-30').textContent=baseline.a;$('#plan-60').textContent=baseline.b;$('#plan-90').textContent=baseline.c;
 const ready=complete();$('#owner-final-block').hidden=!ready;if(!ready)return;
 const list=$('#owner-final-cards');list.replaceChildren();
 const picked=questions.map((q,i)=>q.answers[ctx.data.ownerAnswers[i]]);
 questions.forEach((q,i)=>{
  const box=document.createElement('div');box.className='owner-final-item';
  const tag=document.createElement('strong');tag.textContent=q.tag;
  const title=document.createElement('p');title.textContent=picked[i][0];
  const action=document.createElement('small');action.textContent='Приоритет: '+picked[i][2];
  box.append(tag,title,action);list.append(box);
 });
 $('#plan-30').textContent=baseline.a+' По вашим ответам: '+picked[0][2]+' '+picked[1][2];
 $('#plan-60').textContent=baseline.b+' Приоритет запуска: '+picked[2][2];
 $('#plan-90').textContent=baseline.c+' Критерий результата: '+picked[3][2];
}
function reset(){step=null}
window.CAPFounder={init,render,renderFinal,reset,questions};
})();
