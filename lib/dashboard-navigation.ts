export function sidebarNavigation(html: string): string {
  const icon = (paths: string) => '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths+'</svg>';
  return html.replace('class="app-layout"', 'class="app-layout sidebar-layout"')
    .replace('<div class="sidebar-brand"><span class="brand-mark">U</span><div><strong>UNSPEC</strong><small>EXECUTIVE SULBAGSEL</small></div></div>', '<button type="button" id="sidebarToggle" class="sidebar-brand" aria-controls="sidebarMenu" aria-expanded="true" aria-label="Ringkas menu"><span class="brand-mark" aria-hidden="true">U</span><span class="sidebar-brand-copy"><strong>UNSPEC</strong><small>EXECUTIVE SULBAGSEL</small></span></button>')
    .replace('<span class="nav-number">01</span>', '<span class="nav-number">'+icon('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>')+'</span>')
    .replace('<span class="nav-number">02</span>', '<span class="nav-number">'+icon('<path d="M3 3v18h18M7 14l4-4 4 3 5-7"/>')+'</span>')
    .replace('<span class="nav-number">03</span>', '<span class="nav-number">'+icon('<path d="M12 3v18M17 7H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>')+'</span>')
    .replace('</aside>', '</div></div></aside>')
    .replace('<div class="nav-caption">', '<div id="sidebarMenu" class="sidebar-menu"><div id="sidebarMenuInner" class="sidebar-menu-inner"><div class="nav-caption">')
    .replace('<small>EXECUTIVE SULBAGSEL</small>', '')
    .replace('<span class="badge">Target', '<span class="badge"><span class="target-icon" aria-hidden="true">🎯</span>Target');
}

export const navigationRuntime = String.raw`
const sidebarToggle=$('sidebarToggle');
function setSidebarExpanded(expanded){
 document.documentElement.dataset.sidebar=expanded?'expanded':'collapsed';
 sidebarToggle.setAttribute('aria-expanded',String(expanded));
 sidebarToggle.setAttribute('aria-label',expanded?'Ringkas menu':'Perluas menu');
 sidebarToggle.title=expanded?'Ringkas menu':'Perluas menu';
}
sidebarToggle.onclick=()=>setSidebarExpanded(sidebarToggle.getAttribute('aria-expanded')!=='true');
const sidebarMobile=matchMedia('(max-width:760px)');
setSidebarExpanded(!sidebarMobile.matches);
sidebarMobile.addEventListener('change',event=>setSidebarExpanded(!event.matches));
document.querySelectorAll('.sidebar .nav-item').forEach(button=>{
 const label=button.querySelector('strong').textContent;button.setAttribute('aria-label',label);button.title=label;
});
const dashboardHeader=document.querySelector('main>header');
const measureDashboardHeader=()=>document.documentElement.style.setProperty('--dashboard-header-height',dashboardHeader.getBoundingClientRect().height+'px');
new ResizeObserver(measureDashboardHeader).observe(dashboardHeader);measureDashboardHeader();
`;

export const navigationStyle = String.raw`
@media screen {
 :root{--sidebar-width:220px}
 html[data-sidebar="collapsed"]{--sidebar-width:68px}
 html,body{overflow-x:clip}
 body>main{width:calc(100% - var(--sidebar-width));margin-left:var(--sidebar-width);margin-right:0;max-width:none}
 .sidebar-layout.app-layout{display:block;margin-top:20px;--sidebar-bg:#fff;--sidebar-line:#e5eaf0;--sidebar-text:#294457;--sidebar-muted:#718394;--sidebar-soft:#f6f9fb;--sidebar-hover:#eef3f8}
 html[data-theme="dark"] .sidebar-layout{--sidebar-bg:#171717;--sidebar-line:#363636;--sidebar-text:#e5e5e5;--sidebar-muted:#a3a3a3;--sidebar-soft:#242424;--sidebar-hover:#303030}
 .sidebar-layout>.sidebar{position:fixed;inset:0 auto 0 0;z-index:45;display:block;width:var(--sidebar-width);height:100dvh;overflow-y:auto;overscroll-behavior:contain;border:0;border-right:1px solid var(--sidebar-line);border-radius:0;padding:20px 12px;background:var(--sidebar-bg);box-shadow:none;color:var(--sidebar-text);scrollbar-width:thin}
 .sidebar-layout .sidebar-brand{padding:0 4px 24px;border-bottom:1px solid var(--sidebar-line);gap:10px}
 .sidebar-layout .sidebar-brand .brand-mark{flex-shrink:0;background:#18364b;color:#fff;box-shadow:0 3px 15px #18364b40}
 .sidebar-layout .sidebar-brand strong{color:var(--sidebar-text);font-size:14px}
 .sidebar-layout .sidebar-brand small{color:var(--sidebar-muted);font-size:8px}
 .sidebar-layout .nav-caption{color:var(--sidebar-muted);padding:22px 10px 10px}
 .sidebar-layout .nav-item{display:flex;align-items:center;gap:9px;width:100%;margin:6px 0;padding:12px 9px;color:var(--sidebar-text);background:transparent;border:1px solid transparent;border-radius:8px;text-align:left}
 .sidebar-layout .nav-item:hover{background:var(--sidebar-hover)}
 .sidebar-layout .nav-item.active{background:#eaf2f8;border-color:#cfdeea;box-shadow:inset 3px 0 #18364b;color:#18364b}
 .sidebar-layout .nav-item strong{font-size:10px;line-height:1.5}
 .sidebar-layout .nav-item small{font-size:9px;color:var(--sidebar-muted)}
 .sidebar-layout .nav-item.active small{color:var(--sidebar-muted)}
 .sidebar-layout .nav-number{flex:0 0 25px;height:25px;background:var(--sidebar-soft);color:var(--sidebar-muted)}
 .sidebar-layout .nav-item.active .nav-number{background:#dce9f3;color:#18364b}
 html[data-theme="dark"] .sidebar-layout .nav-item.active{background:#303030;border-color:#525252;box-shadow:inset 3px 0 #a3a3a3;color:#e5e5e5}
 html[data-theme="dark"] .sidebar-layout .nav-item.active .nav-number{background:#404040;color:#e5e5e5}
 .sidebar-layout .sidebar-note{margin:24px 0 0;padding:10px;background:var(--sidebar-soft);color:var(--sidebar-muted)}
 .sidebar-layout .runtime-status{color:var(--sidebar-muted)}
 .sidebar-layout .runtime-status.error{color:var(--red)}
 .sidebar-layout .theme-button,.sidebar-layout .logout-button{width:100%;background:var(--sidebar-soft);color:var(--sidebar-text);border-color:var(--sidebar-line);margin-top:12px}
 .sidebar-layout .theme-button:hover,.sidebar-layout .logout-button:hover{background:var(--sidebar-hover)}
 header .badge{display:inline-flex;align-items:center;gap:8px}
 .target-icon{font-size:24px;line-height:1}
 main .tablewrap:has(table){max-height:65vh;overflow:auto!important;position:relative;scrollbar-gutter:stable}
 main .tablewrap:has(table) table{display:table!important;overflow:visible;border-collapse:separate;border-spacing:0}
 main .tablewrap:has(table) thead{position:sticky;top:0;z-index:6}
 main .tablewrap:has(table) thead th{position:static!important;background:#18364b;color:#fff;box-shadow:0 1px 0 var(--line)}
 .imjas-table-toolbar{flex-wrap:wrap;gap:12px}
 @media(max-width:760px){
  :root{--sidebar-width:180px}
  body>main{padding:12px}
  .sidebar-layout>.sidebar{padding:14px 6px}
  .sidebar-layout .sidebar-brand{flex-direction:column;text-align:center;padding:0 2px 16px;gap:6px}
  .sidebar-layout .sidebar-brand strong{font-size:11px}
  .sidebar-layout .sidebar-brand small{font-size:6px;letter-spacing:0}
  .sidebar-layout .nav-caption{font-size:8px;padding:16px 3px 8px}
  .sidebar-layout .nav-item{flex-direction:column;align-items:flex-start;gap:5px;padding:9px 5px}
  .sidebar-layout .nav-number{flex:0 0 auto;width:22px;height:22px}
  .sidebar-layout .nav-item strong{font-size:9px;overflow-wrap:anywhere}
  .sidebar-layout .nav-item small{font-size:8px}
  .sidebar-layout .sidebar-note{padding:8px 5px;gap:5px}
  .sidebar-layout .runtime-status{font-size:9px}
  .sidebar-layout .theme-button,.sidebar-layout .logout-button{font-size:9px;padding:8px 4px;gap:4px}
  .sidebar-layout .theme-button svg{width:13px;height:13px}
  main>header{padding:12px}
  main>header h1{font-size:16px;overflow-wrap:anywhere}
  main>header .eyebrow{font-size:8px}
  header .badge{font-size:10px}
  .target-icon{font-size:20px}
 }
 body>main{padding:0}
 main>header{margin:0;border-radius:0;border:0;padding:24px 28px;box-shadow:none;background:#18364b}
 .sidebar-layout.app-layout{margin-top:0;padding:20px 24px 24px}
 .sidebar-layout>.sidebar{padding:0;border-right:0}
 .sidebar-layout .sidebar-brand{display:flex;align-items:center;flex-direction:row;gap:10px;width:100%;min-height:var(--dashboard-header-height,140px);margin:0;padding:20px 14px;border:0;border-radius:0;background:#18364b;text-align:left;cursor:pointer}
 .sidebar-layout .sidebar-brand:hover{background:#18364b}
 .sidebar-layout .sidebar-brand strong{color:#fff;font-size:clamp(22px,2.05vw,32px);line-height:1.25;font-weight:750;letter-spacing:-.025em}
 .sidebar-layout .sidebar-brand small{color:#d0dfe9}
 .sidebar-layout .sidebar-brand .brand-mark{display:grid;place-items:center;flex:0 0 48px;width:48px;height:48px;font-size:30px;border-radius:12px;background:#ffffff16;border:1px solid #ffffff40;box-shadow:none}
 html[data-theme="dark"] .sidebar-layout .sidebar-brand,html[data-theme="dark"] .sidebar-layout .sidebar-brand:hover{background:#141414}
 .sidebar-layout .sidebar-brand-copy{min-width:0}
 .sidebar-layout .sidebar-menu-inner{padding:0 10px 18px}
 .sidebar-layout .nav-number{display:grid;place-items:center;flex:0 0 28px;width:28px;height:28px}
 .sidebar-layout .nav-number svg{display:block;width:18px;height:18px}
 html[data-sidebar="collapsed"] .sidebar-brand{justify-content:center;gap:0;padding:20px 8px}
 html[data-sidebar="collapsed"] .sidebar-brand-copy,html[data-sidebar="collapsed"] .nav-caption,html[data-sidebar="collapsed"] .nav-item>span:not(.nav-number),html[data-sidebar="collapsed"] .sidebar-note{display:none}
 html[data-sidebar="collapsed"] .sidebar-menu-inner{padding:12px 7px}
 html[data-sidebar="collapsed"] .nav-item{flex-direction:row;align-items:center;justify-content:center;gap:0;min-height:44px;height:44px;margin:6px 0;padding:8px 4px}
 html[data-sidebar="collapsed"] .theme-button,html[data-sidebar="collapsed"] .logout-button{justify-content:center;padding:10px 4px;font-size:0;gap:0}
 html[data-sidebar="collapsed"] .theme-button>span,html[data-sidebar="collapsed"] .logout-button>span{display:none}
 html[data-sidebar="collapsed"] .theme-button svg,html[data-sidebar="collapsed"] .logout-button svg{width:18px;height:18px;flex:none}
 .sidebar-layout .logout-button{display:flex;align-items:center;justify-content:center;gap:8px}
 .sidebar-layout .logout-button[hidden]{display:none}
 .sidebar-layout .logout-button svg{width:16px;height:16px;flex:none}
 @media(max-width:760px){main>header{padding:16px 12px}.sidebar-layout.app-layout{padding:14px 10px}.sidebar-layout .sidebar-brand{padding:16px 10px}.sidebar-layout .sidebar-brand strong{font-size:16px}.sidebar-layout .sidebar-brand .brand-mark{flex-basis:42px;width:42px;height:42px;font-size:27px}.sidebar-layout .nav-item{flex-direction:row;align-items:center;gap:6px}.sidebar-layout .nav-number{flex-basis:24px;width:24px;height:24px}}
}
@media print{body>main{width:100%;margin:0}.sidebar{display:none!important}main .tablewrap:has(table){max-height:none!important;overflow:visible!important}main .tablewrap:has(table) thead{position:static}}
`;
