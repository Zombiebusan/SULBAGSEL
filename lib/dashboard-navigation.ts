export function sidebarNavigation(html: string): string {
  return html.replace('class="app-layout"', 'class="app-layout sidebar-layout"')
    .replace('</aside>', '</div></div></aside>')
    .replace('<div class="nav-caption">', '<div id="sidebarMenu" class="sidebar-menu"><div id="sidebarMenuInner" class="sidebar-menu-inner"><div class="nav-caption">')
    .replace('<span class="badge">Target', '<span class="badge"><span class="target-icon" aria-hidden="true">🎯</span>Target');
}

export const navigationStyle = String.raw`
@media screen {
 :root{--sidebar-width:220px}
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
  :root{--sidebar-width:112px}
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
}
@media print{body>main{width:100%;margin:0}.sidebar{display:none!important}main .tablewrap:has(table){max-height:none!important;overflow:visible!important}main .tablewrap:has(table) thead{position:static}}
`;
