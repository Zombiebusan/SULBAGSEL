import { initialSpan, reference } from './reference';
import { normalizeTickets } from './normalize';
import { clientRuntime } from './dashboard-runtime';
import { dashboardAppearance, themeInit } from './dashboard-appearance';
import { hamburgerNavigation, navigationStyle } from './dashboard-navigation';
import type { Workzone } from './types';

export type DashboardBootstrap = {
  snapshots: Record<string, Record<string, number>>;
  mapping: Record<string, Workzone>;
  syncedAt: string | null;
  error: string | null;
  persisted: boolean;
};

const monthlyChart = String.raw`function drawMonthlyCharts(target,series){
  $(target).innerHTML=series.map((item,j)=>{
    const values=months.map(m=>monthlyValue(m,item.codes)),rates=values.map(v=>v?rate(v.saldo,v.n):null);
    const forecast=target==='monthlyChart'&&j===0&&item.name==='SULBAGSEL'&&!$('branch').value&&months.at(-1)<='2026-11';
    const labels=[...names];if(forecast)labels.push('Desember Prognosa');
    const width=Math.max(650,labels.length*125+90),height=215,max=Math.max(.12,...rates.filter(v=>v!==null)) * 1.3;
    const x=i=>65+i*(width-150)/Math.max(1,labels.length-1),y=v=>170-v/max*120,color=colors[j%colors.length];
    let svg='<svg viewBox="0 0 '+width+' '+height+'" style="width:100%;display:block" role="img" aria-label="Tren bulanan '+esc(item.name)+'"><line x1="65" x2="'+(width-85)+'" y1="'+y(.1)+'" y2="'+y(.1)+'" stroke="#148060" stroke-dasharray="5 5"/><text x="65" y="'+(y(.1)-6)+'" fill="#148060">Target 0,10%</text>';
    labels.forEach((label,i)=>{svg+='<text x="'+x(i)+'" y="198" text-anchor="middle" fill="#71808b">'+esc(label)+'</text>';const r=rates[i];if(r==null){if(i<months.length)svg+='<text x="'+x(i)+'" y="140" text-anchor="middle" fill="#71808b">Belum tersedia</text>';return;}
      if(i&&rates[i-1]!=null)svg+='<line x1="'+x(i-1)+'" y1="'+y(rates[i-1])+'" x2="'+x(i)+'" y2="'+y(r)+'" stroke="'+color+'" stroke-width="2"/>';
      svg+='<circle cx="'+x(i)+'" cy="'+y(r)+'" r="5" fill="'+color+'"/><text x="'+x(i)+'" y="'+(y(r)-22)+'" text-anchor="middle" fill="'+color+'" font-weight="700">'+pct(r)+'</text><text x="'+x(i)+'" y="'+(y(r)-7)+'" text-anchor="middle" fill="#71808b">'+num(values[i].saldo)+'</text>';
    });
    if(forecast){const oct=months.indexOf('2026-10'),nov=months.indexOf('2026-11');if(oct>=0&&nov>=0&&rates[oct]!=null){
      const points=[[oct,rates[oct]],[nov,.08],[nov+1,.05]];
      points.slice(1).forEach((p,i)=>{const prev=points[i];svg+='<line x1="'+x(prev[0])+'" y1="'+y(prev[1])+'" x2="'+x(p[0])+'" y2="'+y(p[1])+'" stroke="#18364b" stroke-dasharray="5 4"/><circle cx="'+x(p[0])+'" cy="'+y(p[1])+'" r="4" fill="white" stroke="#18364b"/><text x="'+x(p[0])+'" y="'+(y(p[1])+16)+'" text-anchor="middle" fill="#71808b">PROGNOSA '+pct(p[1])+'</text>';});
    }}
    const chartTitle=item.name==='SULBAGSEL'?'Sulbagsel':item.name;
    const branchHeading=target==='monthlyChart'&&item.name!=='SULBAGSEL'&&(j===0||series[j-1].name==='SULBAGSEL')?'<h2 class="monthly-branch-heading" style="grid-column:1 / -1;margin:6px 0 0">Tren Bulanan Branch</h2>':'';
    return branchHeading+'<div style="border:1px solid #e5eaf0;border-radius:10px;padding:12px;'+(target==='monthlyChart'&&j===0?'grid-column:1 / -1;':'')+'"><b>'+esc(chartTitle)+'</b>'+svg+'</svg></div>';
  }).join('');$(target).style.display='grid';$(target).style.gridTemplateColumns='repeat(2,minmax(0,1fr))';$(target).style.gap='12px';
}
`;

const periodFunctions = String.raw`
function todayWita(){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Makassar',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const v=k=>p.find(x=>x.type===k).value;return v('year')+'-'+v('month')+'-'+v('day')}
function periodMonths(){const end=[todayWita().slice(0,7),...Object.keys(data.snapshots).map(d=>d.slice(0,7)),'2026-11'].sort().at(-1);const result=[];let year=2026,month=7;while(year+'-'+String(month).padStart(2,'0')<=end){result.push(year+'-'+String(month).padStart(2,'0'));if(++month===13){month=1;year++}}return result}
function monthTitle(month){const [y,m]=month.split('-').map(Number);return new Intl.DateTimeFormat('id-ID',{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,1)))+' '+y}
function periodNames(months){return months.map(m=>monthTitle(m)+(m===todayWita().slice(0,7)?' MTD':' FM'))}
function monthlyValue(month,cc){
 if(month<'2026-10'){const m=INITIAL.monthly?.[month];if(!m)return null;return {saldo:cc.reduce((a,c)=>a+(m.saldo[c]||0),0),n:cc.reduce((a,c)=>a+(m.customers[c]||0),0),label:m.label}}
 const end=month==='2026-10'?'2026-10-30':month+'-31';const date=dates().filter(d=>d.startsWith(month)&&d<=end).at(-1);if(!date)return null;
 return {saldo:tickets(date,cc).length,n:total(cc),date,label:month===todayWita().slice(0,7)?'MTD s.d. '+date:'FM s.d. '+date};
}
`;

const balanceChange = String.raw`
function renderBalanceChange(current,previous){
 const card=$('cards').firstElementChild,value=card.querySelector('.value');
 const delta=previous===null?null:current-previous;
 const trend=delta===null?'unavailable':delta<0?'down':delta>0?'up':'equal';
 const color=trend==='down'?'green':trend==='up'?'red':'muted';
 // Lucide TrendingDown/TrendingUp, the icon style used by shadcn/ui.
 const paths=trend==='down'?'<path d="m22 17-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/>':trend==='up'?'<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>':'<path d="M5 12h14"/>';
 const icon='<span class="balance-trend-icon '+color+'"><svg class="lucide lucide-'+(trend==='down'?'trending-down':trend==='up'?'trending-up':'minus')+'" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths+'</svg></span>';
 const text=delta===null?'Belum ada pembanding':delta===0?'Tetap · selisih 0 tiket':(delta<0?'Turun ':'Naik ')+num(Math.abs(delta))+' tiket';
 card.dataset.balanceTrend=trend;value.classList.add('balance-value');value.insertAdjacentHTML('beforeend',icon);
 card.insertAdjacentHTML('beforeend','<div class="balance-change '+color+'"><strong>'+text+'</strong><small>'+(delta===null?'Snapshot H-1 belum tersedia':'dibanding saldo H-1')+'</small></div>');
}
`;

export async function dashboardHtml(bootstrap?: DashboardBootstrap) {
  const { html, initial } = await reference();
  // Keep initial HTML lightweight; full ticket details are fetched only for the selected date.
  const compact = {
    ...initial,
    mapping: { ...initial.mapping, ...bootstrap?.mapping },
    snapshots: bootstrap
      ? Object.fromEntries(Object.entries(bootstrap.snapshots).map(([date, counts]) => [date, Object.entries(counts).flatMap(([WORKZONE, count]) => Array.from({ length: count }, () => ({ WORKZONE })))]))
      : Object.fromEntries(Object.entries(initial.snapshots).map(([date, rows]) => [date, normalizeTickets(rows, initial.mapping).map(r => ({ WORKZONE: r.WORKZONE }))])),
  };
  const { start } = initialSpan(html);
  const end = html.indexOf('</script>', start);
  let result = html.slice(0, start)+JSON.stringify(compact).replace(/</g, '\\u003c')+';'+html.slice(end);
  result = result.replace(/let data=INITIAL;try\{[\s\S]*?catch\(e\)\{\}/, 'let data=structuredClone(INITIAL);');
  result = result.replace("fillDates('2026-11-04')", 'fillDates()');
  result = result.replace("'Snapshot sebelumnya: '+p", "'Saldo pada tanggal '+Number(p.slice(8))");
  result = result.replace('Snapshot sebelumnya belum tersedia', 'Saldo tanggal sebelumnya belum tersedia');
  result = result.replaceAll('UNSPEC Executive Dashboard', 'MONITORING UNSPEC SULBAGSEL');
  result = result.replace(/<title>[\s\S]*?<\/title>/, '<title>MONITORING UNSPEC SULBAGSEL</title>');
  result = result.replace('<h2>Tren harian</h2>', '<h2>Tren Harian Sulbagsel</h2>');
  result = result.replace('${esc(br)}</b>', "${esc(br==='SULBAGSEL'?'Sulbagsel':br)}</b>");
  result = result.replace('Tren pencapaian bulanan · Branch', 'Tren Bulanan Sulbagsel');
  result = result.replace('Tren pencapaian bulanan · Service Area (SA)', 'Tren Bulanan Service Area (SA)');
  result = result.replace('function render(){', balanceChange+'\nfunction render(){');
  result = result.replace("$('totalSaldo').onclick=", "renderBalanceChange(h,old);$('totalSaldo').onclick=");
  result = result.replace(/function monthlyValue\(month,cc\)\{[\s\S]*?(?=function renderMonthly\()/, periodFunctions+'\n');
  result = result.replaceAll("['2026-07','2026-08','2026-09','2026-10','2026-11']", 'periodMonths()');
  result = result.replaceAll("['Juli FM','Agustus FM','September FM','Oktober FM','November MTD']", 'periodNames(months)');
  result = result.replace(/function drawMonthlyCharts\(target,series\)\{[\s\S]*?(?= const selectedBranch=)/, monthlyChart+'\n');
  result = result.replaceAll("calc(br,'2026-11')", 'calc(br,months.at(-1))');
  result = result.replaceAll(' · NOVEMBER MTD</small>', ' · ${esc(names.at(-1).toUpperCase())}</small>');
  result = result.replace('viewBox="0 0 1120 355"', 'viewBox="0 0 ${Math.max(1120,months.length*190+170)} 355"');
  result = result.replaceAll('x2="1060"', 'x2="${Math.max(1060,months.length*190+110)}"');
  result = result.replace('Juli sampai November 2026', '${esc(monthTitle(months[0]))} sampai ${esc(monthTitle(months.at(-1)))}');
  result = result.replace(/function save\(\)\{localStorage[\s\S]*?(?=fillSA\(\);\['date')/, 'function save(){}\n');
  result = result.replace('Juli–Oktober 2026', '<span id="periodCaption">Juli–November 2026</span>');
  result = result.replace('Pencapaian UNSPEC bulanan · Juli–November 2026', '<span id="monthlyHeading">Pencapaian UNSPEC bulanan · Juli–November 2026</span>');
  result = result.replace('IMJAS MTD November · Realisasi &amp; Loss per Branch', '<span id="businessHeading">IMJAS MTD November · Realisasi &amp; Loss per Branch</span>');
  result = result.replace('Empat branch menggunakan posisi November MTD terbaru', 'Empat branch menggunakan posisi periode terbaru');
  result = result.replace('<h2>IMJAS · Kontribusi KPI UNSPEC</h2>', '');
  result = result.replace('<div id="imjasCards"', '<h2 id="regionalImjasHeading">IMJAS Juli- November MTD 2026 - Realisasi &amp; Loss Regional Sulbagsel</h2><div id="imjasCards"');
  result = result.replace('Snapshot 1 November 2026; Oktober FM sampai 30 Oktober dan November MTD mulai 1 November.', 'Histori awal mengikuti referensi. Oktober 2026 FM sampai 30 Oktober; periode berikutnya berlanjut otomatis berdasarkan snapshot WITA.');
  result = result.replace('Sumber pembaruan: export (40).', 'Sumber pembaruan: API MONICA dan snapshot Neon PostgreSQL.');
  result = result.replace('November dihitung terpisah mulai 1 November.', 'periode berikutnya dihitung terpisah secara otomatis.');
  result = result.replace('</head>', '<style>.card[data-card-tone="split"]{background:linear-gradient(180deg,var(--card-top-tint) 0%,#fff 48%,#fff 52%,var(--card-bottom-tint) 100%);border-color:#dce5ef}</style></head>');
  result = result.replace('</head>', '<style>.card[data-card-tone="green"]{background:linear-gradient(180deg,#e2f4e9 0%,#f3faf6 55%,#fff 100%);border-color:#c5e4d2}.card[data-card-tone="red"]{background:linear-gradient(180deg,#fbe4e9 0%,#fff3f5 55%,#fff 100%);border-color:#efcbd3}.card[data-card-tone="neutral"]{background:linear-gradient(180deg,#edf3fa 0%,#f8fafd 55%,#fff 100%);border-color:#dce5ef}</style></head>');
  result = result.replace('</head>', '<style>#page-business>.panel{padding:16px}#page-business .panel h2{margin-bottom:10px;padding:8px 11px}#page-business .cards{gap:10px;margin:10px 0 14px}#page-business .card{padding:12px;border-radius:10px;min-width:0}#page-business .card>small{font-size:10px;line-height:1.35}#page-business .card>small[style]{margin-top:6px!important}#page-business .card>.value{font-size:clamp(15px,1.25vw,21px)!important;line-height:1.25;margin:5px 0!important;letter-spacing:-.3px;overflow-wrap:anywhere}#page-business .card>div[style]:not(.value){margin-top:8px!important;padding-top:8px!important}#page-business .card>div[style] .value{font-size:clamp(15px,1.25vw,21px)!important;line-height:1.25;margin:5px 0!important;letter-spacing:-.3px;overflow-wrap:anywhere}#page-business #imjasCards{grid-template-columns:repeat(auto-fit,minmax(185px,1fr))}#imjasTrend> .tablewrap{margin:4px 0}#imjasTrend> .tablewrap>svg{max-width:1050px!important;margin:0 auto}#imjasTrend .imjas-legend{gap:8px 12px!important;margin:8px 0!important;padding-top:8px;min-height:0}#imjasTrend .imjas-legend>span{padding:5px 8px;border:1px solid #e5eaf0;border-radius:6px;background:#f8fafc;font-size:11px!important}@media(max-width:760px){#page-business>.panel{padding:12px}#page-business #imjasBranchCards,#page-business #imjasCards{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px}#page-business .card{padding:10px}#page-business .card>.value,#page-business .card>div[style] .value{font-size:15px!important}}</style></head>');
  result = result.replaceAll('#imjasTrend svg', '#imjasTrend > .tablewrap > svg');
  result = result.replace("${y(v)+(z.key==='loss'?20:-12)}", "${y(v)+(z.key==='loss'?20:z.key==='max'?-26:-10)}");
  result = result.replace('</head>', '<style>#page-business #imjasTrend>.tablewrap>svg{width:100%!important;max-width:none!important;height:auto!important;margin:0}#page-business #imjasTrend>.tablewrap>svg text{font-size:12px!important}</style></head>');
  result = result.replace('</head>', '<style>#imjasTrend .imjas-legend{display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:12px 24px!important;width:100%;margin:12px 0 0!important;padding:12px 0 0;border-top:1px solid #e5eaf0;font-size:12px!important;line-height:1.4;color:#526575}#imjasTrend .imjas-legend>span{display:inline-flex!important;align-items:center;gap:8px!important;flex:0 0 auto;white-space:nowrap;font-size:12px;min-width:0}#imjasTrend .imjas-legend svg{display:block;flex:0 0 35px;width:35px!important;min-width:35px!important;max-width:35px!important;height:12px!important;min-height:12px;max-height:12px;overflow:visible}</style></head>');
  result = result.replace('</head>', '<style>.panel h2,.panel h2.green,.panel h2.red{background:transparent!important;color:#18364b!important;border-left-color:#18364b!important}</style></head>');
  result = result.replace('</head>', '<style>.panel h2.green,.panel h2.red{background:#2d3e58!important;color:#fff!important;border-left-color:#2d3e58!important}</style></head>');
  result = result.replace(/CSV mengikuti format export yang Bapak kirim\.[\s\S]*?perangkat lain\./g, '');
  result = result.replace(/<div class="notice">\s*<\/div>/g, '');
  result = result.replace(/<div class="foot">[\s\S]*?<\/div>/g, '');
  result = result.replace(/(<h2><span id="businessHeading">[\s\S]*?<\/span><\/h2><div id="imjasBranchCards" class="cards"><\/div>)(\s*)(<h2 id="regionalImjasHeading">[\s\S]*?<\/h2><div id="imjasCards" class="cards"><\/div>)/, '$3$2$1');
  result = result.replace(/\$\('legend'\)\.innerHTML=[^\r\n]*/g, "$('legend').textContent='';");
  result = result.replace('</head>', '<style>.foot,.panel>small{display:none!important}#page-progress #chart .branch-trend-heading{grid-column:1 / -1;order:0;width:100%;margin:6px 0 0}#page-progress #chart .daily-trend-card:not(.regional-trend-card){order:1!important}</style></head>');
  result = result.replace('</head>', '<style>#page-progress #chart .main-trend-card{grid-column:1 / -1!important;width:100%!important;min-width:0}#page-progress #chart .main-trend-card svg{display:block;width:100%!important;max-width:100%!important;height:auto!important;max-height:none!important}#page-progress #chart .main-trend-card svg text{font-size:7px!important}</style></head>');
  result = result.replace('</head>', '<style>#page-progress .branch-performance .tablewrap{overflow:visible!important;width:100%;min-width:0}#branchPerformanceTable{display:table!important;width:100%!important;min-width:0!important;table-layout:fixed;white-space:normal!important;border-collapse:collapse}#branchPerformanceTable th,#branchPerformanceTable td{border:1px solid #cbd5e1!important;padding:9px 5px!important;font-size:clamp(9px,.75vw,12px);line-height:1.4;white-space:normal!important;overflow-wrap:anywhere;vertical-align:middle}#branchPerformanceTable th{font-size:clamp(9px,.7vw,11px);letter-spacing:0;text-align:center}#branchPerformanceTable th:first-child,#branchPerformanceTable td:first-child{width:12%;text-align:left}#branchPerformanceTable th:nth-child(2),#branchPerformanceTable th:nth-child(3){width:7%}#branchPerformanceTable th:nth-child(4),#branchPerformanceTable th:nth-child(5){width:10%}#branchPerformanceTable th:nth-child(6){width:7%}#branchPerformanceTable th:nth-child(7){width:15%}#branchPerformanceTable th:nth-child(8){width:14%}#branchPerformanceTable th:nth-child(9),#branchPerformanceTable th:nth-child(10){width:9%}#branchPerformanceTable th:nth-child(5),#branchPerformanceTable td:nth-child(5){position:static!important;left:auto!important;box-shadow:none!important}#branchPerformanceTable .saldo{max-width:100%;padding:2px 4px;white-space:normal;overflow-wrap:anywhere}#branchPerformanceTable tr.regional-total td{border-top:2px solid #18364b!important}@media(max-width:760px){#branchPerformanceTable th,#branchPerformanceTable td{padding:6px 2px!important;font-size:9px}#branchPerformanceTable .saldo{padding:2px 0}}</style></head>');
  result = result.replace('</head>', '<style>.runtime-status{font-size:11px;line-height:1.5;overflow-wrap:anywhere}.runtime-status.error{color:#c72e43}.logout-button{width:100%;font-size:11px;margin-top:12px}#cards .balance-value{display:flex;align-items:center;justify-content:space-between;gap:6px}.balance-trend-icon{display:inline-flex;align-items:center;justify-content:center;flex:0 0 30px;width:30px;height:30px;border-radius:8px}.balance-trend-icon.green{background:#e9f6ef}.balance-trend-icon.red{background:#fff0f2}.balance-trend-icon.muted{background:#f1f5f9}.balance-trend-icon svg{display:block}.balance-change{font-size:11px;line-height:1.4}.balance-change strong{display:block;font-weight:650}.balance-change small{display:block;color:var(--muted);font-size:10px;margin-top:2px}@media print{.logout-button{display:none!important}}</style></head>');
  result = result.replace('</body>', '<script>const bootstrapState='+JSON.stringify(bootstrap ?? null).replace(/</g, '\\u003c')+';\n'+clientRuntime+'</script></body>');
  result = result.replace('</head>', '<script>'+themeInit+'</script><style>'+dashboardAppearance+'</style></head>');
  result = hamburgerNavigation(result).replace('</head>', '<style>'+navigationStyle+'</style></head>');
  return result;
}
