// Presentation only: keep the reference markup, chart geometry, and interactions intact.
export const dashboardPolish = String.raw`
@media screen {
  :root {
    --ink:#203247;
    --muted:#718096;
    --line:#e1e7ef;
    --ui-radius:14px;
    --ui-focus:rgba(57,126,195,.24);
  }
  body {
    background:#f4f6fa;
    font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    font-size:14px;
    line-height:1.5;
    -webkit-font-smoothing:antialiased;
    text-rendering:optimizeLegibility;
  }
  main {width:100%;max-width:1920px;margin-inline:auto;padding:24px}
  header {
    min-height:116px;
    padding:22px 26px;
    margin-bottom:20px;
    border-radius:16px;
    background:linear-gradient(115deg,#18364b,#263e58);
    border:1px solid #29465e;
    box-shadow:0 5px 18px rgba(24,54,75,.09);
    gap:20px;
  }
  header .eyebrow {font-size:10px;letter-spacing:.18em;font-weight:700}
  header h1 {font-size:clamp(22px,2.05vw,32px);line-height:1.25;letter-spacing:-.025em;font-weight:750;margin:8px 0}
  header small {font-size:12px;line-height:1.5}
  header .badge {font-size:11px;font-weight:600;white-space:nowrap;padding:7px 11px;border-radius:7px}
  .app-layout {grid-template-columns:220px minmax(0,1fr);gap:20px;margin-top:20px;align-items:start}
  .app-content {min-width:0}
  .sidebar {top:20px;padding:15px 11px;border-radius:var(--ui-radius);border-color:var(--line)}
  .sidebar-brand {gap:10px;padding:2px 6px 16px}
  .brand-mark {width:36px;height:36px;border-radius:10px;font-size:19px}
  .sidebar-brand strong {font-size:13px;letter-spacing:.08em}
  .sidebar-brand small {font-size:8px;letter-spacing:.1em;margin-top:3px}
  .nav-caption {padding:18px 9px 8px;font-size:9px;font-weight:700;letter-spacing:.16em}
  .nav-item {width:100%;gap:9px;padding:11px 9px;margin:4px 0;border-radius:9px;align-items:center;min-height:60px}
  .nav-item strong {font-size:11px;font-weight:650;line-height:1.45;letter-spacing:0}
  .nav-item small {font-size:10px;line-height:1.4;margin-top:4px}
  .nav-number {width:27px;height:27px;flex:0 0 27px;border-radius:7px;font-size:10px}
  .nav-item.active {background:#ecf2f8;border-color:#d5e0eb;box-shadow:inset 3px 0 #18364b}
  .sidebar-note {gap:9px;margin:16px 3px 0;padding:10px;border-radius:8px;align-items:flex-start}
  .sidebar-note .status-dot {margin-top:4px;flex-shrink:0}
  .runtime-status {font-size:10px;line-height:1.55;font-weight:500}
  .theme-button,.logout-button {min-height:36px;border-radius:8px;font-size:11px;font-weight:600;margin-top:10px}
  button,select,input {
    font-family:inherit;
    font-size:12px;
    line-height:1.4;
    border-radius:8px;
    border-color:#d8e1eb;
    min-height:36px;
    padding:8px 11px;
  }
  button,select {transition:background-color .15s,border-color .15s,box-shadow .15s}
  button:focus-visible,select:focus-visible,input:focus-visible {
    outline:2px solid #397ec3;
    outline-offset:2px;
    box-shadow:0 0 0 4px var(--ui-focus);
  }
  button:disabled {cursor:not-allowed;opacity:.5}
  select {cursor:pointer;max-width:100%}
  input[type="file"] {max-width:100%;min-width:0;font-size:11px}
  input[type="file"]::file-selector-button {border:0;border-radius:4px;padding:4px 7px;margin-right:8px;font:inherit;cursor:pointer}
  .toolbar {gap:10px;row-gap:10px;min-width:0}
  .toolbar>label {display:flex;align-items:center;gap:8px;font-size:12px;font-weight:550;min-width:0}
  #page-progress>.toolbar {
    padding:12px 14px;
    background:#fff;
    border:1px solid var(--line);
    border-radius:12px;
    box-shadow:0 2px 8px rgba(24,54,75,.035);
    margin-bottom:16px;
  }
  #page-progress>.toolbar select {max-width:270px}
  .panel {padding:18px;border-radius:var(--ui-radius);border-color:var(--line)}
  .panel h2 {
    font-size:17px;
    font-weight:700;
    line-height:1.45;
    letter-spacing:-.015em;
    border-left-width:3px;
    padding:6px 0 6px 11px;
    margin-bottom:14px;
  }
  .panel h2.green,.panel h2.red {font-size:14px;line-height:1.4;padding:11px 13px;border-radius:8px}
  .detailhead {gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:12px}
  .detailhead h2 {margin-bottom:0}
  .detailhead select {font-size:11px;flex:0 0 auto}
  .dashboard-page>.panel,.dashboard-page>.grid {margin-bottom:18px}
  .card {border-radius:12px;min-width:0}
  .card small {line-height:1.45}
  .value,td,.saldo {font-variant-numeric:tabular-nums lining-nums}
  #page-progress #cards {gap:9px!important;margin:0 0 18px!important}
  #page-progress #cards>.card {padding:12px!important;border-radius:12px!important}
  #page-progress #cards>.card>small {font-size:10px!important;line-height:1.45!important;font-weight:550}
  #page-progress #cards .value {font-size:clamp(20px,1.6vw,28px)!important;font-weight:750;line-height:1.2!important;margin:9px 0 8px!important;letter-spacing:-.6px!important}
  .balance-change {font-size:10px;line-height:1.45}
  .balance-change small {font-size:9px}
  .balance-trend-icon,.achieved-icon {border-radius:8px}
  #monthlyCards {gap:10px!important;margin:12px 0 20px}
  #monthlyCards .card {padding:13px}
  #monthlyCards .card>small {font-size:10px;font-weight:550}
  #monthlyCards .value {font-size:clamp(22px,1.8vw,30px);line-height:1.2;margin:9px 0;letter-spacing:-.7px}
  #chart>.daily-trend-card,#monthlyChart>div,#monthlySaChart>div {border-radius:11px!important;border-color:var(--line)!important;box-shadow:0 2px 7px rgba(24,54,75,.045)}
  #chart .daily-trend-card>b,#monthlyChart>div>b,#monthlySaChart>div>b {font-weight:650;letter-spacing:.01em}
  #page-progress #chart .branch-trend-heading,.monthly-branch-heading {padding-top:10px;padding-bottom:8px}
  .tablewrap {border-radius:8px;scrollbar-width:thin;scrollbar-color:#bcc9d8 transparent}
  table {font-size:12px;line-height:1.5}
  th {font-size:10px;font-weight:650;letter-spacing:.035em;padding:10px 11px}
  td {padding:10px 11px}
  .tablewrap tbody tr {transition:background-color .12s}
  .tablewrap tbody tr:not(.levelbranch):not(.levelsa):not(.regional-total):nth-child(even) {background:#f8fafc}
  .tablewrap tbody tr:not(.levelbranch):not(.levelsa):not(.regional-total):hover {background:#f0f4f8}
  .saldo {border-radius:6px;font-weight:650}
  .branch {padding:11px 0;gap:12px;line-height:1.5}
  .branch>div {min-width:0}
  .branch b {font-size:12px;font-weight:650}
  .branch small {font-size:10px}
  .branch .saldo {font-size:11px;padding:3px 7px}
  #page-business .card {border-radius:12px}
  #page-business .card>small:first-child {font-weight:600;letter-spacing:.025em}
  #imjasTrend>b {font-size:12px;font-weight:650;letter-spacing:.04em}
  #imjasTrend .imjas-legend>span {font-weight:500}
  #message:not(:empty) {border-radius:8px}
  html[data-theme="dark"] #page-progress>.toolbar {background:#171717;border-color:#363636;box-shadow:0 3px 12px rgba(0,0,0,.22)}
  html[data-theme="dark"] .tablewrap {scrollbar-color:#525252 transparent}
  html[data-theme="dark"] .tablewrap tbody tr:not(.levelbranch):not(.levelsa):not(.regional-total):nth-child(even) {background:#1c1c1c}
  html[data-theme="dark"] .tablewrap tbody tr:not(.levelbranch):not(.levelsa):not(.regional-total):hover {background:#252525}
  html[data-theme="dark"] button:focus-visible,html[data-theme="dark"] select:focus-visible,html[data-theme="dark"] input:focus-visible {outline-color:#a3a3a3;box-shadow:0 0 0 4px rgba(163,163,163,.16)}
  @media(min-width:1600px) {main{padding:26px 28px}.app-layout{grid-template-columns:230px minmax(0,1fr);gap:22px}}
  @media(min-width:761px) and (max-width:1100px) {.app-layout{grid-template-columns:192px minmax(0,1fr);gap:14px}main{padding:18px}.sidebar{padding:12px 8px}.nav-item{gap:7px;padding:10px 7px}.nav-item strong{font-size:10px}#page-progress #cards>.card{padding:9px 7px!important}#page-progress #cards .value{font-size:18px!important}}
  @media(max-width:760px) {
    main {padding:12px}
    header {padding:18px;min-height:0;border-radius:12px;gap:12px;flex-wrap:wrap;margin-bottom:14px}
    header h1 {font-size:23px;line-height:1.3}
    header .eyebrow {font-size:9px;letter-spacing:.12em}
    header small {font-size:11px}
    header .badge {font-size:10px;padding:5px 8px}
    .app-layout {grid-template-columns:minmax(0,1fr);gap:14px;margin-top:14px}
    .sidebar {position:static;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;padding:12px}
    .sidebar-brand,.nav-caption,.sidebar-note {grid-column:1 / -1}
    .sidebar-brand {padding:0 3px 12px}
    .nav-caption {padding:3px 4px 0}
    .nav-item {display:flex;flex-direction:column;align-items:center;justify-content:flex-start;text-align:center;gap:6px;min-height:100px;margin:0;padding:9px 5px}
    .nav-item strong {font-size:9px}
    .nav-item small {font-size:9px;margin-top:3px}
    .nav-number {width:24px;height:24px;flex:0 0 24px}
    .sidebar-note {margin:2px 0 0;padding:9px}
    .theme-button {grid-column:span 2;margin:0}
    .logout-button {grid-column:span 1;margin:0}
    .sidebar .theme-button,.sidebar .logout-button {margin:0;align-self:stretch}
    .panel {padding:13px;border-radius:12px}
    .panel h2 {font-size:15px;margin-bottom:12px}
    .panel h2.green,.panel h2.red {font-size:13px;padding:9px 11px}
    #page-progress>.toolbar {padding:11px;gap:10px}
    #page-progress>.toolbar>label {flex:1 1 140px;display:flex;flex-direction:column;align-items:stretch;gap:5px;font-size:11px}
    #page-progress>.toolbar>label:nth-child(3) {flex-basis:100%}
    #page-progress>.toolbar select {max-width:none;width:100%}
    .toolbar input[type="file"] {width:100%}
    .toolbar label {max-width:100%;flex-wrap:wrap}
    #page-progress #cards {gap:8px!important;margin-bottom:14px!important}
    #page-progress #cards>.card {padding:12px!important}
    #page-progress #cards .value {font-size:24px!important}
    #page-progress #cards .achieved-value {font-size:21px!important}
    #monthlyCards .card {padding:12px}
    .detailhead {gap:8px}
    .dashboard-page>.panel,.dashboard-page>.grid {margin-bottom:14px}
  }
}
`;
