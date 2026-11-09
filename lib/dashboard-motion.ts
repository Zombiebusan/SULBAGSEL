export const motionRuntime = String.raw`
const reducedDashboardMotion=matchMedia('(prefers-reduced-motion:reduce)');
const countedValues=new WeakSet(),animatedCharts=new WeakSet(),observedCharts=new Set(),runningCounters=new Map();
let dashboardMotionFrame=0;
function finishDashboardCounters(){
 for(const [node,animation] of runningCounters){cancelAnimationFrame(animation.frame);node.nodeValue=animation.text}
 runningCounters.clear();
}
function animateDashboardValues(){
 document.querySelectorAll('.dashboard-page.active .card .value').forEach(value=>{
  if(countedValues.has(value))return;countedValues.add(value);
  value.dataset.finalValue=value.textContent;
  if(reducedDashboardMotion.matches)return;
  const walker=document.createTreeWalker(value,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode())){
   if(node.parentElement.closest('svg,.achieved-icon,.balance-trend-icon'))continue;
   const text=node.nodeValue,match=/^(\s*)(-?)(Rp\s*)?([\d.]+(?:,\d+)?)(%?)(\s*)$/.exec(text);
   if(!match)continue;
   const target=Number(match[4].replace(/\./g,'').replace(',','.'))*(match[2]?-1:1);
   if(!Number.isFinite(target)||target===0)continue;
   const decimals=match[4].split(',')[1]?.length||0;
   const animation={frame:0,text},textNode=node,start=performance.now();
   const format=number=>match[1]+(match[3]||'')+number.toLocaleString('id-ID',{minimumFractionDigits:decimals,maximumFractionDigits:decimals})+match[5]+match[6];
   textNode.nodeValue=format(0);runningCounters.set(textNode,animation);
   const step=now=>{
    if(!textNode.isConnected){runningCounters.delete(textNode);return}
    const progress=Math.min(1,(now-start)/800),eased=1-Math.pow(1-progress,3);
    textNode.nodeValue=progress===1?text:format(target*eased);
    if(progress<1)animation.frame=requestAnimationFrame(step);else runningCounters.delete(textNode);
   };
   animation.frame=requestAnimationFrame(step);
  }
 });
}
function revealDashboardChart(svg){
 if(reducedDashboardMotion.matches)return;
 svg.animate([{opacity:0,transform:'translateY(18px) scaleY(.82)'},{opacity:1,transform:'translateY(0) scaleY(1)'}],{duration:750,easing:'cubic-bezier(.22,.61,.36,1)'});
}
const chartMotionObserver=new IntersectionObserver(entries=>{
 for(const entry of entries)if(entry.isIntersecting){chartMotionObserver.unobserve(entry.target);observedCharts.delete(entry.target);revealDashboardChart(entry.target)}
},{threshold:.08});
function queueDashboardMotion(){
 cancelAnimationFrame(dashboardMotionFrame);
 dashboardMotionFrame=requestAnimationFrame(()=>{
  animateDashboardValues();
  for(const svg of observedCharts)if(!svg.isConnected){chartMotionObserver.unobserve(svg);observedCharts.delete(svg)}
  document.querySelectorAll('.dashboard-page.active #chart svg,.dashboard-page.active #monthlyChart svg,.dashboard-page.active #monthlySaChart svg,.dashboard-page.active #imjasTrend>.tablewrap>svg').forEach(svg=>{
   if(animatedCharts.has(svg))return;animatedCharts.add(svg);svg.style.transformOrigin='50% 100%';observedCharts.add(svg);chartMotionObserver.observe(svg);
  });
 });
}
document.querySelectorAll('.nav-item[data-page]').forEach(button=>button.addEventListener('click',queueDashboardMotion));
reducedDashboardMotion.addEventListener('change',()=>{
 if(reducedDashboardMotion.matches){finishDashboardCounters();document.querySelectorAll('.dashboard-page svg').forEach(svg=>svg.getAnimations().forEach(animation=>animation.finish()))}
});
window.addEventListener('beforeprint',()=>{finishDashboardCounters();document.querySelectorAll('.dashboard-page svg').forEach(svg=>svg.getAnimations().forEach(animation=>animation.finish()))});
`;

export const motionStyle = String.raw`
@media screen and (prefers-reduced-motion:no-preference){
 body>main{transition:width .3s cubic-bezier(.22,.61,.36,1),margin-left .3s cubic-bezier(.22,.61,.36,1)}
 .sidebar-layout>.sidebar{transition:width .3s cubic-bezier(.22,.61,.36,1)}
 .sidebar-layout .sidebar-brand-copy{display:block;max-width:150px;overflow:hidden;white-space:nowrap;opacity:1;transition:max-width .25s ease,opacity .2s ease}
 .sidebar-layout .nav-item>span:not(.nav-number){display:block;min-width:0;max-width:170px;overflow:hidden;opacity:1;transition:max-width .25s ease,opacity .2s ease}
  html[data-sidebar="collapsed"] .sidebar-brand-copy,html[data-sidebar="collapsed"] .nav-item>span:not(.nav-number){display:block;flex:0 0 0;max-width:0;max-height:0;overflow:hidden;opacity:0;pointer-events:none}
}
`;
