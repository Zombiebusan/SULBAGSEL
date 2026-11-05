import { dashboardPolish } from './dashboard-polish';

export const themeInit = String.raw`try{const saved=localStorage.getItem('unspec-theme');document.documentElement.dataset.theme=saved==='dark'||saved==='light'?saved:'light'}catch{document.documentElement.dataset.theme='light'}`;

export const dashboardAppearance = String.raw`
${dashboardPolish}
.card,.panel,#chart>.daily-trend-card,#monthlyChart>div,#monthlySaChart>div{box-shadow:0 3px 12px rgba(15,23,42,.07),0 1px 3px rgba(15,23,42,.04)}
.theme-button{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:12px;font-size:11px;font-weight:600}
.theme-button svg{width:16px;height:16px;flex:none}
.notice:empty,#message:empty{display:none}
#message:not(:empty){margin-top:10px;padding:9px 12px;border:1px solid var(--line);border-left:3px solid #71808b;border-radius:6px;font-size:12px;line-height:1.5;background:#f1f5f9;color:var(--ink)}
html[data-theme="dark"] .notice,html[data-theme="dark"] #message:not(:empty){background:#242424;color:#e5e5e5;border-color:#404040;border-left-color:#737373}
.achieved-value{display:flex;align-items:center;justify-content:space-between;gap:6px}
#page-progress #cards .achieved-value{font-size:clamp(15px,1.25vw,21px)!important;gap:4px}
.achieved-icon{display:inline-flex;align-items:center;justify-content:center;flex:0 0 30px;width:30px;height:30px;border-radius:8px;background:#edf2f7}
.achieved-icon svg{width:22px;height:22px;display:block}
.gauge-needle{transform-box:view-box;transform-origin:12px 15px;transition:transform .65s cubic-bezier(.22,.61,.36,1)}
.value.green .achieved-icon{background:#dff3e8}.value.red .achieved-icon{background:#fbe4e9}
#syncProgress{position:fixed;inset:0 0 auto;height:3px;z-index:1000;overflow:hidden;background:#dbeafe;pointer-events:none}
#syncProgress[hidden]{display:none}
#syncProgress span{display:block;width:35%;height:100%;background:linear-gradient(90deg,#397ec3,#148060);animation:sync-progress 1.2s ease-in-out infinite}
.sidebar-note.is-loading .status-dot,.inline-spinner{display:inline-block;width:12px;height:12px;border:2px solid #bfd4e5;border-top-color:#397ec3;border-radius:50%;background:transparent;box-shadow:none;flex:none;animation:loading-spin .7s linear infinite}
.inline-spinner{vertical-align:middle;margin-right:8px}
.dashboard-page.active{animation:dashboard-enter .2s ease-out}
@keyframes loading-spin{to{transform:rotate(360deg)}}
@keyframes sync-progress{from{transform:translateX(-100%)}to{transform:translateX(390%)}}
@keyframes dashboard-enter{from{opacity:.65;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}
html[data-theme="dark"]{color-scheme:dark;--ink:#e5e5e5;--muted:#a3a3a3;--line:#363636;--red:#fb7185;--green:#5ee0a4}
html[data-theme="dark"] body{background:#090909;color:var(--ink)}
html[data-theme="dark"] .sidebar,html[data-theme="dark"] .panel,html[data-theme="dark"] .card{background:#171717;border-color:#363636;color:var(--ink)}
html[data-theme="dark"] header{background:#141414;border-color:#363636}
html[data-theme="dark"] header .eyebrow{color:#d4d4d4}html[data-theme="dark"] header small{color:#a3a3a3}
html[data-theme="dark"] button,html[data-theme="dark"] select,html[data-theme="dark"] input{background:#242424;border-color:#404040;color:var(--ink)}
html[data-theme="dark"] button:hover{background:#303030}
html[data-theme="dark"] .sidebar-brand{border-color:#363636}
html[data-theme="dark"] .brand-mark{background:#333;color:#fff}
html[data-theme="dark"] .sidebar-brand strong,html[data-theme="dark"] .nav-item{color:#e5e5e5}
html[data-theme="dark"] .nav-item.active{background:#303030;border-color:#525252;box-shadow:inset 3px 0 #a3a3a3}
html[data-theme="dark"] .nav-item:hover,html[data-theme="dark"] .sidebar-note,html[data-theme="dark"] .nav-number{background:#252525;color:#d4d4d4}
html[data-theme="dark"] .nav-item small,html[data-theme="dark"] small,html[data-theme="dark"] .muted{color:#a3a3a3}
html[data-theme="dark"] .panel h2{color:#e5e5e5!important;border-left-color:#a3a3a3!important}
html[data-theme="dark"] .green{color:#5ee0a4!important}html[data-theme="dark"] .red{color:#fb7185!important}
html[data-theme="dark"] .panel h2.green,html[data-theme="dark"] .panel h2.red{background:#2b2b2b!important;color:#fff!important}
html[data-theme="dark"] .saldo{background:#303030;color:#e5e5e5;border-color:#404040}
html[data-theme="dark"] .balance-trend-icon.green,html[data-theme="dark"] .value.green .achieved-icon{background:#183e31}
html[data-theme="dark"] .balance-trend-icon.red,html[data-theme="dark"] .value.red .achieved-icon{background:#492432}
html[data-theme="dark"] .balance-trend-icon.muted,html[data-theme="dark"] .achieved-icon{background:#333}
html[data-theme="dark"] .card[data-card-tone="green"]{background:linear-gradient(180deg,#173e31,#182b23 55%,#171717);border-color:#315946}
html[data-theme="dark"] .card[data-card-tone="red"]{background:linear-gradient(180deg,#462532,#2e2026 55%,#171717);border-color:#65404e}
html[data-theme="dark"] .card[data-card-tone="neutral"]{background:linear-gradient(180deg,#2b2b2b,#202020 55%,#171717);border-color:#404040}
html[data-theme="dark"] .card[data-card-tone="split"]{background:linear-gradient(180deg,var(--card-top-tint),#171717 48%,#171717 52%,var(--card-bottom-tint));border-color:#494040}
html[data-theme="dark"] #chart>.daily-trend-card,html[data-theme="dark"] #monthlyChart>div,html[data-theme="dark"] #monthlySaChart>div{background:#171717;border-color:#363636!important}
html[data-theme="dark"] .card,html[data-theme="dark"] .panel,html[data-theme="dark"] #chart>.daily-trend-card,html[data-theme="dark"] #monthlyChart>div,html[data-theme="dark"] #monthlySaChart>div{box-shadow:0 5px 18px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.03)}
html[data-theme="dark"] #chart .daily-trend-card>b{color:#e5e5e5!important}
html[data-theme="dark"] .levelbranch,html[data-theme="dark"] .levelsa,html[data-theme="dark"] #branchPerformanceTable tr.regional-total td{background:#262626!important}
html[data-theme="dark"] td,html[data-theme="dark"] #branchPerformanceTable td{border-color:#404040!important;color:#e5e5e5}
html[data-theme="dark"] #branchPerformanceTable th{background:#262626!important;border-color:#404040!important}
html[data-theme="dark"] #branchPerformanceTable tbody td:nth-child(5){background:transparent!important;color:var(--ink)!important}
html[data-theme="dark"] #branchPerformanceTable tr.regional-total td:nth-child(5){background:#262626!important}
html[data-theme="dark"] th{background:#262626}
html[data-theme="dark"] .branch{border-color:#363636}
html[data-theme="dark"] #imjasTrend .imjas-legend{border-color:#363636;color:#d4d4d4}
html[data-theme="dark"] #imjasTrend .imjas-legend>span{background:#252525;border-color:#404040}
html[data-theme="dark"] svg text[fill="#71808b"],html[data-theme="dark"] svg text[fill="#526575"]{fill:#a3a3a3}
html[data-theme="dark"] svg text[fill="#18364b"],html[data-theme="dark"] svg text[fill="#172b3a"]{fill:#e5e5e5}
html[data-theme="dark"] svg line[stroke="#e5eaf0"],html[data-theme="dark"] svg line[stroke="#e9edf2"]{stroke:#363636}
html[data-theme="dark"] svg line[stroke="#18364b"]{stroke:#a3a3a3}
html[data-theme="dark"] .daily-point-label[data-target-status="above"] rect{fill:#3c1d2a}
html[data-theme="dark"] .daily-point-label[data-target-status="met"] rect{fill:#14362c}
html[data-theme="dark"] .daily-point-label[data-target-status="above"] text{fill:#fb7185}
html[data-theme="dark"] .daily-point-label[data-target-status="met"] text{fill:#5ee0a4}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
@media print{.theme-button,#syncProgress{display:none!important}html[data-theme="dark"] body,html[data-theme="dark"] .panel,html[data-theme="dark"] .card{background:white!important;color:#172b3a!important}}
`;
