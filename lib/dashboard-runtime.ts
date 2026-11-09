import { navigationRuntime } from './dashboard-navigation';

export const clientRuntime = String.raw`
${navigationRuntime}
// Extend the reference dashboard without changing its navigation or component layout.
const statusNode=document.querySelector('.sidebar-note');
let achievedGaugePercent=0;
statusNode.innerHTML='<span class="status-dot"></span><span id="syncStatus" class="runtime-status" role="status">Memuat data…</span>';
const logout=document.createElement('button');logout.className='logout-button';logout.textContent='Keluar';
logout.onclick=async()=>{try{await fetch('/api/auth/logout',{method:'POST'});location.assign('/login')}catch{setStatus('Logout gagal. Coba lagi.',true)}};
(document.getElementById('sidebarMenuInner')||document.querySelector('.sidebar')).append(logout);
const themeButton=document.createElement('button');themeButton.type='button';themeButton.className='theme-button';logout.before(themeButton);
const themeIcon=paths=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths+'</svg>';
logout.innerHTML=themeIcon('<path d="M9 5H5v14h4M14 8l4 4-4 4M9 12h9"/>')+'<span>Keluar</span>';logout.setAttribute('aria-label','Keluar');logout.title='Keluar';
function setTheme(theme,save=true){
 document.documentElement.dataset.theme=theme;
 const dark=theme==='dark';
 themeButton.innerHTML=themeIcon(dark?'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>':'<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>')+'<span>'+(dark?'Mode Siang':'Mode Malam')+'</span>';
  themeButton.setAttribute('aria-pressed',String(dark));
  themeButton.setAttribute('aria-label',dark?'Mode Siang':'Mode Malam');themeButton.title=dark?'Mode Siang':'Mode Malam';
 if(save)try{localStorage.setItem('unspec-theme',theme)}catch{}
 applyCardGradients();
}
themeButton.onclick=()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
setTheme(document.documentElement.dataset.theme||'light',false);
const progress=document.createElement('div');progress.id='syncProgress';progress.hidden=true;progress.setAttribute('aria-hidden','true');progress.innerHTML='<span></span>';document.body.append(progress);
function setLoading(loading){progress.hidden=!loading;statusNode.classList.toggle('is-loading',loading);document.querySelector('main').setAttribute('aria-busy',String(loading))}
let pendingPoll=false,detailRequest=0,lastRevision=bootstrapState?JSON.stringify([bootstrapState.syncedAt,bootstrapState.snapshots]):'',detailCache=new Map(),persisted=bootstrapState?.persisted||false;
const originalShowDetails=showDetails;
function applyCardGradients(){
 const achieved=$('cards')?.children[5]?.querySelector('.value');
 if(achieved){
   const parsed=Number.parseFloat(achieved.textContent.replace(/\./g,'').replace(',','.'));
   const percent=Number.isFinite(parsed)?Math.max(0,Math.min(100,parsed)):null;
   let icon=achieved.querySelector('.achieved-icon');
   if(!icon){
     achieved.classList.add('achieved-value');achieved.insertAdjacentHTML('beforeend','<span class="achieved-icon">'+themeIcon('<path d="M3 15a9 9 0 0 1 18 0"/><path d="M4 15h2m6-8v2m6 6h2"/><line class="gauge-needle" x1="12" y1="15" x2="12" y2="7"/><circle cx="12" cy="15" r="1.5" fill="currentColor" stroke="none"/>')+'</span>');
     icon=achieved.querySelector('.achieved-icon');
     const needle=icon.querySelector('.gauge-needle');needle.style.transform='rotate('+(achievedGaugePercent*1.8-90)+'deg)';needle.getBoundingClientRect();
   }
   const angle=(percent??0)*1.8-90,needle=icon.querySelector('.gauge-needle');
   icon.setAttribute('role','meter');icon.setAttribute('aria-label','Achieved');icon.setAttribute('aria-valuemin','0');icon.setAttribute('aria-valuemax','100');
   icon.dataset.percent=percent===null?'':String(percent);
   if(percent===null){icon.removeAttribute('aria-valuenow');icon.setAttribute('aria-valuetext','Data belum tersedia')}else{icon.setAttribute('aria-valuenow',String(percent));icon.setAttribute('aria-valuetext',String(percent)+'%')}
   requestAnimationFrame(()=>{if(needle.isConnected)needle.style.transform='rotate('+angle+'deg)'});
   achievedGaugePercent=percent??0;
 }
 document.querySelectorAll('.card').forEach(card=>{
   const values=card.querySelectorAll('.value');
   const tone=value=>value.classList.contains('red')?'red':value.classList.contains('green')?'green':'neutral';
   if(values.length>1){
     const top=tone(values[0]),bottom=tone(values[values.length-1]);
     if(top!==bottom){
       const tint=document.documentElement.dataset.theme==='dark'?{green:'#173e31',red:'#462532',neutral:'#2b2b2b'}:{green:'#e2f4e9',red:'#fbe4e9',neutral:'#edf3fa'};
       card.dataset.cardTone='split';card.style.setProperty('--card-top-tint',tint[top]);card.style.setProperty('--card-bottom-tint',tint[bottom]);
       return;
     }
   }
   const trend=card.dataset.balanceTrend;
   card.dataset.cardTone=trend==='down'?'green':trend==='up'?'red':card.querySelector('.value.red')?'red':card.querySelector('.value.green')?'green':'neutral';
 });
}
const originalRender=render,originalRenderImjas=renderImjas;
render=function(){originalRender();applyCardGradients()};
renderImjas=function(){originalRenderImjas();applyCardGradients()};
const originalDrawChart=drawChart;
function shadeDailyTrend(svg,index){
 const polyline=svg?.querySelector('polyline');if(!polyline)return;
 const points=polyline.getAttribute('points').trim().split(/\s+/).map(pair=>pair.split(',').map(Number));
 if(!points.length)return;
 const ns='http://www.w3.org/2000/svg',colors={down:'#148060',up:'#c72e43',equal:'#526575'};
 const make=(tag,attributes)=>{const element=document.createElementNS(ns,tag);Object.entries(attributes).forEach(([key,value])=>element.setAttribute(key,String(value)));return element};
 const baseline=Math.max(...Array.from(svg.querySelectorAll('line'),line=>Number(line.getAttribute('y1'))),...points.map(p=>p[1]));
 const targetLine=svg.querySelector('line[stroke-dasharray]');
 const target=Number(targetLine?.getAttribute('y1')??baseline);
 targetLine?.setAttribute('vector-effect','non-scaling-stroke');targetLine?.setAttribute('stroke-width','1.25');
 const status=y=>y<target-0.000001?'up':'down';
 const top=Math.min(...points.map(p=>p[1])),defs=make('defs',{}),areas=make('g',{'class':'daily-trend-areas','pointer-events':'none'}),lines=make('g',{'class':'daily-trend-lines','pointer-events':'none'});
 for(const [direction,color] of Object.entries(colors)){
   const gradient=make('linearGradient',{id:'daily-area-'+index+'-'+direction,gradientUnits:'userSpaceOnUse',x1:0,y1:top,x2:0,y2:baseline});
   gradient.append(make('stop',{offset:'0%','stop-color':color,'stop-opacity':'.25'}),make('stop',{offset:'100%','stop-color':color,'stop-opacity':'.02'}));defs.append(gradient);
 }
 for(let i=1;i<points.length;i++){
   const [x0,y0]=points[i-1],[x1,y1]=points[i],pieces=[];
   if((y0-target)*(y1-target)<0){const crossing=x0+(target-y0)/(y1-y0)*(x1-x0);pieces.push([x0,y0,crossing,target],[crossing,target,x1,y1])}else pieces.push([x0,y0,x1,y1]);
   pieces.forEach(([left,start,right,end])=>{
     const direction=status((start+end)/2);
     areas.append(make('path',{d:'M '+left+' '+start+' L '+right+' '+end+' L '+right+' '+baseline+' L '+left+' '+baseline+' Z',fill:'url(#daily-area-'+index+'-'+direction+')','data-direction':direction}));
     lines.append(make('line',{x1:left,y1:start,x2:right,y2:end,stroke:colors[direction],'stroke-width':'1.5','vector-effect':'non-scaling-stroke','stroke-linecap':'round','data-direction':direction}));
   });
 }
 svg.prepend(defs,areas);polyline.replaceWith(lines);
 svg.querySelectorAll('circle').forEach((circle,i)=>{
   const direction=status(points[i][1]),color=colors[direction];circle.setAttribute('fill',color);circle.dataset.targetStatus=direction==='up'?'above':'met';
   const primary=circle.nextElementSibling,secondary=primary?.nextElementSibling;
   if(primary?.tagName.toLowerCase()==='text')primary.setAttribute('fill',color);
   const label=[primary,secondary].find(element=>element?.tagName.toLowerCase()==='text'&&element.textContent.includes('%'));
   if(label){
     label.setAttribute('fill',color);label.setAttribute('font-weight','700');
     let box=label.getBBox();
     if(!box.width){const size=parseFloat(getComputedStyle(label).fontSize)||7,width=label.textContent.length*size*.6;box={x:Number(label.getAttribute('x'))-width/2,y:Number(label.getAttribute('y'))-size,width,height:size}}
     const group=make('g',{'class':'daily-point-label','data-target-status':direction==='up'?'above':'met'});
     const rect=make('rect',{x:box.x-4,y:box.y-2,width:box.width+8,height:box.height+4,rx:3,fill:direction==='up'?'#fff0f2':'#e9f6ef',stroke:color,'stroke-width':'.5'});
     label.replaceWith(group);group.append(rect,label);
   }
 });
}
drawChart=function(){
 originalDrawChart();
 const cards=$('chart').querySelectorAll('.daily-trend-card');
 cards[0]?.classList.add('main-trend-card');
 cards.forEach((card,index)=>shadeDailyTrend(card.querySelector('svg'),index));
 if(!$('sa').value){
   const firstBranch=$('branch').value?cards[0]:cards[1];
   if(firstBranch){const heading=document.createElement('h2');heading.className='branch-trend-heading';heading.textContent='Tren Harian Branch';firstBranch.before(heading)}
 }
};
function setStatus(message,error=false){$('syncStatus').textContent=message;$('syncStatus').classList.toggle('error',error)}
// The reference bound this handler before drawChart was extended.
$('metric').onchange=drawChart;
function showSyncStatus(state){
 const time=state.syncedAt?new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Makassar',dateStyle:'short',timeStyle:'medium'}).format(new Date(state.syncedAt))+' WITA':'belum sinkron';
 setStatus(state.error?(state.error+' Terakhir: '+time):'Pembaruan terakhir · '+time,!!state.error);
}
function jsonFetch(url,options){if(offlineExport)return Promise.reject(Error('File HTML ini adalah snapshot offline.'));return fetch(url,options).then(async r=>{if(r.status===401){location.assign('/login');throw Error('Sesi berakhir.')}const body=await r.json();if(!r.ok)throw Error(body.error||'Permintaan gagal.');return body})}
function updatePeriodLabels(){
 const months=periodMonths(),last=months.at(-1),range=monthTitle(months[0])+'–'+monthTitle(last);
 $('periodCaption').textContent=range;$('monthlyHeading').textContent='Pencapaian UNSPEC bulanan · '+range;
 $('businessHeading').textContent='IMJAS '+periodNames([last])[0]+' · Realisasi & Loss per Branch';
 const firstMonth=months[0],start=firstMonth.slice(0,4)===last.slice(0,4)?monthTitle(firstMonth).split(' ')[0]:monthTitle(firstMonth);
 $('regionalImjasHeading').textContent='IMJAS '+start+'- '+monthTitle(last).split(' ')[0]+' MTD '+last.slice(0,4)+' - Realisasi & Loss Regional Sulbagsel';
 const filter=$('imjasMonthFilter'),old=filter.value;
 filter.innerHTML='<option value="">Semua bulan</option>'+months.map(m=>'<option value="'+m+'">'+esc(periodNames([m])[0])+'</option>').join('');filter.value=months.includes(old)?old:'';
}
showDetails=async function(d,codes,label,scroll=true){
 const request=++detailRequest;selected={date:d,codes,label};page=0;$('search').value='';
 $('detailTitle').textContent='Detail tiket · '+label;$('detailCount').textContent=d+' · Memuat detail…';
  $('orders').innerHTML='<tr><td colspan="9"><span class="inline-spinner" aria-hidden="true"></span>Memuat detail tiket…</td></tr>';detailRows=[];$('prev').disabled=true;$('next').disabled=true;
 if(scroll)$('detailPanel').scrollIntoView({behavior:'smooth',block:'start'});
 try{
   const key=lastRevision+':'+d;
   if(!detailCache.has(key))detailCache.set(key,jsonFetch('/api/tickets?date='+encodeURIComponent(d)).then(v=>v.tickets).catch(e=>{detailCache.delete(key);throw e}));
   const rows=await detailCache.get(key);if(request!==detailRequest)return;
   data.snapshots[d]=rows;originalShowDetails(d,codes,label,false);
 }catch(e){if(request===detailRequest){$('orders').innerHTML='<tr><td colspan="9">'+esc(e.message)+'</td></tr>';$('detailCount').textContent=d+' · Detail belum tersedia';}}
};
async function refresh(sync=true){
  if(offlineExport)return;
 if(pendingPoll)return;pendingPoll=true;setLoading(true);setStatus('Memperbarui data…');
 try{
   const state=await jsonFetch('/api/dashboard',{method:sync?'POST':'GET'}),oldDate=$('date').value,oldLatest=dates().at(-1);
   persisted=state.persisted;
   const revision=JSON.stringify([state.syncedAt,state.snapshots]);
   if(revision!==lastRevision){lastRevision=revision;detailCache.clear();
     Object.assign(mapping,state.mapping);
     allCodes.splice(0,allCodes.length,...Object.keys(mapping).filter(c=>mapping[c].region==='SULBAGSEL'));
     data.snapshots=Object.fromEntries(Object.entries(state.snapshots).map(([d,counts])=>[d,Object.entries(counts).flatMap(([WORKZONE,count])=>Array.from({length:count},()=>({WORKZONE})))]));
     const prefer=oldDate===oldLatest?dates().at(-1):oldDate;fillDates(prefer);fillSA();updatePeriodLabels();render();
   }else updatePeriodLabels();
   showSyncStatus(state);
 }catch(e){setStatus(e.message,true)}finally{pendingPoll=false;setLoading(false)}
}
async function persistSnapshots(snapshots){
 if(!persisted)throw Error('Konfigurasikan Neon sebelum mengimpor snapshot.');
 let count=0;for(const [date,rows] of Object.entries(snapshots)){
   const body=JSON.stringify({snapshots:{[date]:rows}});if(new Blob([body]).size>4000000)throw Error('Snapshot '+date+' melebihi batas 4 MB.');
   await jsonFetch('/api/history',{method:'POST',headers:{'Content-Type':'application/json'},body});count++;
 }return count;
}
$('import').onclick=async()=>{
 try{const file=$('file').files[0],date=$('uploadDate').value;if(!file||!date)throw Error('Pilih file CSV dan tanggal snapshot.');
   const rows=parseCSV(await file.text()).map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k.replaceAll('_',' '),v]))).map(r=>({...r,INCIDENT:String(r.INCIDENT||'').trim().toUpperCase(),WORKZONE:String(r.WORKZONE||'').trim().toUpperCase()}));
   if(!rows.length)throw Error('File kosong.');if(data.snapshots[date]&&!confirm('Ganti snapshot '+date+' di database bersama?'))return;
   await persistSnapshots({[date]:rows});$('message').textContent='Snapshot '+date+' berhasil disimpan di Neon.';lastRevision='';await refresh(false);fillDates(date);render();
 }catch(e){$('message').textContent=e.message}
};
$('restore').onchange=async()=>{
 let completed=0;
 try{const file=$('restore').files[0];if(!file)return;const restored=JSON.parse(await file.text());if(!restored.snapshots||typeof restored.snapshots!=='object'||Array.isArray(restored.snapshots))throw Error('Cadangan tidak valid.');
   if(!confirm('Pulihkan snapshot dari cadangan ke database bersama? Tanggal yang sama akan diganti.'))return;
   for(const [date,rows] of Object.entries(restored.snapshots)){await persistSnapshots({[date]:rows});completed++}
   $('message').textContent=completed+' snapshot berhasil dipulihkan.';lastRevision='';await refresh(false);
 }catch(e){$('message').textContent=completed+' snapshot dipulihkan. '+e.message;lastRevision='';await refresh(false)}finally{$('restore').value=''}
};
backup=async function(){
 try{setStatus('Menyiapkan cadangan…');const snapshots={};for(const date of dates()){const result=await jsonFetch('/api/tickets?date='+encodeURIComponent(date));snapshots[date]=result.tickets}
   download('unspec-riwayat.json',JSON.stringify({...data,snapshots}),'application/json');setStatus('Cadangan berhasil diunduh.');
 }catch(e){setStatus(e.message,true)}
};
if(offlineExport){
 showDetails=originalShowDetails;logout.hidden=true;
 for(const id of ['import','file','uploadDate','restore']){const control=$(id);if(control){control.disabled=true;control.title='Impor tersedia pada dashboard online.'}}
 backup=()=>download('unspec-riwayat.json',JSON.stringify(data),'application/json');
}
applyCardGradients();updatePeriodLabels();drawChart();showDetails($('date').value,filteredCodes($('branch').value),scopeLabel(),false);
if(offlineExport){
 const time=value=>new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Makassar',dateStyle:'short',timeStyle:'medium'}).format(new Date(value))+' WITA';
 setStatus('Snapshot offline · Diekspor '+time(offlineExport.exportedAt)+(bootstrapState?.syncedAt?' · Data terakhir '+time(bootstrapState.syncedAt):' · Histori referensi'));
}else if(bootstrapState){showSyncStatus(bootstrapState);refresh(true)}else refresh(false).then(()=>refresh(true));
`;
