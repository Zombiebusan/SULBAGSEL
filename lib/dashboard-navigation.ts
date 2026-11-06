export function hamburgerNavigation(html: string): string {
  const originalBrand = '<div class="sidebar-brand"><span class="brand-mark">U</span><div><strong>UNSPEC</strong><small>EXECUTIVE SULBAGSEL</small></div></div>';
  return html.replace('class="app-layout"', 'class="app-layout hamburger-layout"')
    .replace(originalBrand, '<button type="button" class="sidebar-brand menu-toggle" id="menuToggle" aria-expanded="false" aria-controls="sidebarMenu" aria-label="Buka menu UNSPEC" title="Buka menu UNSPEC"><span class="brand-mark" aria-hidden="true">U</span><span class="sidebar-brand-copy"><strong>UNSPEC</strong><small>EXECUTIVE SULBAGSEL</small></span><span class="hamburger-glyph" aria-hidden="true"><span></span><span></span><span></span></span></button><div id="sidebarMenu" class="sidebar-menu" aria-hidden="true" inert><div id="sidebarMenuInner" class="sidebar-menu-inner">')
    .replace('</aside>', '</div></div></aside>');
}

export const navigationRuntime = String.raw`
const navigationLayout=document.querySelector('.hamburger-layout');
const menuToggle=$('menuToggle'),sidebarMenu=$('sidebarMenu');
function setMenuOpen(open,returnFocus=false){
 if(!navigationLayout||!menuToggle||!sidebarMenu)return;
 navigationLayout.classList.toggle('menu-open',open);
 menuToggle.setAttribute('aria-expanded',String(open));
 menuToggle.setAttribute('aria-label',open?'Tutup menu UNSPEC':'Buka menu UNSPEC');
 menuToggle.title=open?'Tutup menu UNSPEC':'Buka menu UNSPEC';
 sidebarMenu.setAttribute('aria-hidden',String(!open));sidebarMenu.inert=!open;
 if(!open&&returnFocus)menuToggle.focus({preventScroll:true});
}
if(menuToggle&&sidebarMenu){
 menuToggle.addEventListener('click',()=>setMenuOpen(menuToggle.getAttribute('aria-expanded')!=='true'));
 sidebarMenu.addEventListener('click',event=>{if(event.target.closest('.nav-item[data-page]'))setMenuOpen(false,true)});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menuToggle.getAttribute('aria-expanded')==='true'){event.preventDefault();setMenuOpen(false,true)}});
 setMenuOpen(false);
}
`;

export const navigationStyle = String.raw`
@media screen {
 .hamburger-layout.app-layout{grid-template-columns:72px minmax(0,1fr);gap:16px;transition:grid-template-columns .26s cubic-bezier(.22,.61,.36,1)}
 .hamburger-layout.app-layout.menu-open{grid-template-columns:228px minmax(0,1fr)}
 .hamburger-layout>.sidebar{display:block;width:100%;min-width:0;padding:8px;overflow:clip}
 .sidebar .menu-toggle{position:relative;display:flex;align-items:center;gap:10px;width:100%;min-height:56px;margin:0;padding:8px;border:0;border-radius:9px;background:transparent;box-shadow:none;text-align:left;cursor:pointer}
 .sidebar .menu-toggle .brand-mark{display:grid;place-items:center;flex:0 0 36px;width:36px;height:36px;line-height:1}
 .sidebar .menu-toggle .sidebar-brand-copy{display:none;min-width:0;flex:1}
 .sidebar .menu-toggle .sidebar-brand-copy strong{display:block}
 .sidebar .menu-toggle .sidebar-brand-copy small{display:block;white-space:nowrap}
 .sidebar .menu-toggle:hover{background:#eef3f8}
 .hamburger-glyph{position:absolute;right:2px;bottom:4px;display:block;width:14px;height:16px;color:var(--ink);background:#fff;border-radius:3px}
 .hamburger-glyph>span{position:absolute;left:1px;right:1px;height:2px;border-radius:2px;background:currentColor;transition:transform .22s ease,opacity .18s ease}
 .hamburger-glyph>span:nth-child(1){top:3px}.hamburger-glyph>span:nth-child(2){top:7px}.hamburger-glyph>span:nth-child(3){top:11px}
 .menu-open .menu-toggle .hamburger-glyph{position:relative;right:auto;bottom:auto;flex:0 0 16px;width:16px;margin-left:auto;background:transparent}
 .menu-open .menu-toggle .sidebar-brand-copy{display:block}
 .menu-open .hamburger-glyph>span:nth-child(1){transform:translateY(4px) rotate(45deg)}
 .menu-open .hamburger-glyph>span:nth-child(2){opacity:0;transform:scaleX(.2)}
 .menu-open .hamburger-glyph>span:nth-child(3){transform:translateY(-4px) rotate(-45deg)}
 .sidebar-menu{display:grid;grid-template-rows:0fr;min-width:0;opacity:0;visibility:hidden;margin-top:0;transition:grid-template-rows .26s ease,opacity .18s ease,margin-top .26s ease,visibility 0s linear .26s}
 .sidebar-menu-inner{min-height:0;min-width:0;overflow:clip}
 .menu-open .sidebar-menu{grid-template-rows:1fr;opacity:1;visibility:visible;margin-top:8px;transition:grid-template-rows .26s ease,opacity .18s ease .07s,margin-top .26s ease,visibility 0s}
 .sidebar-menu-inner .nav-caption{padding-top:8px}
 .sidebar-menu-inner .theme-button,.sidebar-menu-inner .logout-button{width:100%}
 html[data-theme="dark"] .sidebar .menu-toggle:hover{background:#252525}
 html[data-theme="dark"] .hamburger-glyph{background:#171717}
 html[data-theme="dark"] .menu-open .hamburger-glyph{background:transparent}
 @media(max-width:760px){
  .hamburger-layout.app-layout,.hamburger-layout.app-layout.menu-open{grid-template-columns:minmax(0,1fr);gap:14px}
  .sidebar .menu-toggle{min-height:48px;padding:6px 8px}
  .sidebar .menu-toggle .sidebar-brand-copy{display:block}
  .sidebar .menu-toggle .hamburger-glyph{position:relative;right:auto;bottom:auto;flex:0 0 16px;width:16px;margin-left:auto;background:transparent}
  .sidebar-menu-inner .nav-item{display:flex;flex-direction:row;align-items:center;justify-content:flex-start;gap:9px;text-align:left;min-height:58px;margin:4px 0;padding:10px}
  .sidebar-menu-inner .nav-item strong{font-size:11px}.sidebar-menu-inner .nav-item small{font-size:10px}
  .sidebar-menu-inner .theme-button,.sidebar-menu-inner .logout-button{margin-top:10px}
 }
}
`;
