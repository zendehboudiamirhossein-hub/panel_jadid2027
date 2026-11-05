// ui.js — پنل مدیریت Chop نسخه‌ی Aurora (طراحی مدرن، انیمیشن‌دار، چند‌تم)
// بازطراحی کامل رابط کاربری با حفظ تمام توابع و APIهای موجود.

const BASE_STYLE = `
<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Vazirmatn:wght@300;400;500;600;700;800&display=swap');

:root{
  --base:#0a0a14; --base-2:#0d0d1f;
  --panel:rgba(20,22,42,.62); --panel-2:rgba(28,30,55,.82); --panel-3:rgba(34,38,68,.92);
  --line:rgba(120,140,200,.18); --line-strong:rgba(140,160,220,.32);
  --ink:#eef2ff; --ink-2:#c7cce8; --ink-dim:#7e87b5; --ink-mute:#525a82;
  --accent:#7c5cff; --accent-2:#5eead4; --accent-3:#ff6ec7; --accent-4:#ffb347;
  --online:#34e89e; --warn:#ffc857; --danger:#ff5d73; --info:#5cc8ff;
  --glow-1:rgba(124,92,255,.28); --glow-2:rgba(94,234,212,.22); --glow-3:rgba(255,110,199,.18);
  --ease:cubic-bezier(.4,0,.2,1); --ease-out:cubic-bezier(.16,1,.3,1); --ease-bounce:cubic-bezier(.34,1.56,.64,1);
  --shadow-card:0 10px 30px -12px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.04);
  --shadow-glow:0 0 24px rgba(124,92,255,.25);
}

[data-theme="cyber"]{
  --base:#050a08; --base-2:#06120e;
  --panel:rgba(11,22,17,.78); --panel-2:rgba(16,30,23,.9);
  --accent:#39ff88; --accent-2:#7cffc4; --accent-3:#ffd166; --accent-4:#5cc8ff;
  --glow-1:rgba(57,255,136,.22); --glow-2:rgba(124,255,196,.18); --glow-3:rgba(255,209,102,.14);
  --line:rgba(57,255,136,.14); --line-strong:rgba(57,255,136,.3);
  --ink:#e8fff1; --ink-2:#a9d9bf; --ink-dim:#5f9c7c; --ink-mute:#3a5c47;
}

[data-theme="sunset"]{
  --base:#140a14; --base-2:#1a0d18;
  --panel:rgba(40,20,38,.7); --panel-2:rgba(52,26,48,.86);
  --accent:#ff6ec7; --accent-2:#ffb347; --accent-3:#ff5d73; --accent-4:#5eead4;
  --glow-1:rgba(255,110,199,.25); --glow-2:rgba(255,179,71,.18); --glow-3:rgba(92,200,255,.16);
  --line:rgba(255,150,200,.16); --line-strong:rgba(255,150,200,.32);
  --ink:#ffeef5; --ink-2:#e5b8c8; --ink-dim:#9c6a85; --ink-mute:#5a3a48;
}

[data-theme="royal"]{
  --base:#08081a; --base-2:#0c0c24;
  --panel:rgba(20,18,52,.7); --panel-2:rgba(28,24,68,.88);
  --accent:#7c5cff; --accent-2:#5cc8ff; --accent-3:#ff6ec7; --accent-4:#ffd166;
  --glow-1:rgba(124,92,255,.3); --glow-2:rgba(92,200,255,.22); --glow-3:rgba(255,110,199,.18);
  --line:rgba(140,120,255,.18); --line-strong:rgba(140,120,255,.34);
  --ink:#eef0ff; --ink-2:#c2c8ee; --ink-dim:#7e87b5; --ink-mute:#424a78;
}

[data-mode="light"]{
  --base:#f0f2ff; --base-2:#e6eaf5;
  --panel:rgba(255,255,255,.78); --panel-2:rgba(248,250,255,.94);
  --line:rgba(120,140,200,.22); --line-strong:rgba(120,140,200,.4);
  --ink:#1a1f3a; --ink-2:#3a4068; --ink-dim:#6a7299; --ink-mute:#9aa3c8;
  --shadow-card:0 8px 24px -10px rgba(60,70,120,.18), 0 0 0 1px rgba(120,140,200,.08);
}

*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0;color:var(--ink);font-family:'Vazirmatn','Space Grotesk',sans-serif;-webkit-font-smoothing:antialiased;
  background:var(--base);min-height:100vh;position:relative;overflow-x:hidden;
}
.mono{font-family:'JetBrains Mono',monospace}
.display{font-family:'Space Grotesk','Vazirmatn',sans-serif}

/* Animated aurora background */
.aurora-bg{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:var(--base)}
.aurora-bg::before{
  content:'';position:absolute;inset:-20%;
  background:
    radial-gradient(40% 50% at 15% 25%, var(--glow-1), transparent 60%),
    radial-gradient(45% 60% at 85% 15%, var(--glow-2), transparent 60%),
    radial-gradient(40% 50% at 70% 85%, var(--glow-3), transparent 60%),
    radial-gradient(35% 45% at 20% 80%, rgba(124,92,255,.14), transparent 60%);
  filter:blur(50px);animation:auroraShift 18s ease-in-out infinite alternate;
}
.aurora-bg::after{
  content:'';position:absolute;inset:0;
  background-image:
    linear-gradient(rgba(120,140,200,.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(120,140,200,.04) 1px, transparent 1px);
  background-size:48px 48px;
  -webkit-mask-image:radial-gradient(ellipse at center, black 30%, transparent 80%);
  mask-image:radial-gradient(ellipse at center, black 30%, transparent 80%);
}
@keyframes auroraShift{
  0%{transform:translate(0,0) rotate(0deg)}
  50%{transform:translate(3%,-2%) rotate(2deg)}
  100%{transform:translate(-3%,2%) rotate(-2deg)}
}
#particleCanvas{position:fixed;inset:0;z-index:1;pointer-events:none;opacity:.7}

/* Sidebar layout */
.app-shell{display:grid;grid-template-columns:260px 1fr;min-height:100vh;position:relative;z-index:2}
.sidebar{
  background:linear-gradient(180deg,var(--panel),var(--panel-2));
  border-inline-end:1px solid var(--line);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  padding:22px 16px;display:flex;flex-direction:column;gap:18px;position:sticky;top:0;height:100vh;overflow-y:auto;
  transition:transform .3s var(--ease);
}
.sidebar::-webkit-scrollbar{width:5px}
.sidebar::-webkit-scrollbar-thumb{background:var(--line-strong);border-radius:3px}

.brand{display:flex;align-items:center;gap:10px;padding:6px 8px 16px;border-bottom:1px solid var(--line)}
.brand-mark{
  width:38px;height:38px;border-radius:10px;display:grid;place-items:center;
  background:conic-gradient(from 0deg,var(--accent),var(--accent-2),var(--accent-3),var(--accent));
  box-shadow:0 0 18px var(--glow-1);position:relative;animation:brandSpin 12s linear infinite;
}
.brand-mark::before{content:'';position:absolute;inset:2px;border-radius:8px;background:var(--base-2)}
.brand-mark span{position:relative;z-index:1;font-family:'Space Grotesk',sans-serif;font-weight:700;color:var(--ink);font-size:18px}
@keyframes brandSpin{to{transform:rotate(360deg)}}
.brand h1{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:18px;margin:0;letter-spacing:-.01em;
  background:linear-gradient(135deg,var(--ink),var(--accent-2));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.brand small{display:block;font-size:10px;color:var(--ink-dim);font-family:'JetBrains Mono',monospace;letter-spacing:.1em;text-transform:uppercase;margin-top:2px}

.nav-section{display:flex;flex-direction:column;gap:2px}
.nav-section .nav-label{font-size:10px;color:var(--ink-mute);text-transform:uppercase;letter-spacing:.12em;padding:8px 12px 6px;font-family:'JetBrains Mono',monospace}
.nav-item{
  display:flex;align-items:center;gap:11px;padding:10px 12px;border-radius:10px;cursor:pointer;
  color:var(--ink-dim);font-size:13.5px;font-weight:500;
  border:1px solid transparent;transition:all .22s var(--ease);position:relative;
}
.nav-item .nav-ic{width:18px;height:18px;display:grid;place-items:center;color:inherit;flex-shrink:0;opacity:.85}
.nav-item .nav-ic svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2}
.nav-item:hover{color:var(--ink);background:rgba(124,92,255,.06);border-color:var(--line)}
.nav-item.active{
  color:var(--ink);background:linear-gradient(135deg,rgba(124,92,255,.18),rgba(94,234,212,.08));
  border-color:var(--line-strong);box-shadow:0 0 14px rgba(124,92,255,.18);
}
.nav-item.active::before{content:'';position:absolute;inset-inline-start:-1px;top:8px;bottom:8px;width:3px;border-radius:2px;background:linear-gradient(180deg,var(--accent),var(--accent-2))}
.nav-item .badge{margin-inline-start:auto;background:var(--accent);color:#fff;font-size:10px;padding:2px 7px;border-radius:10px;font-weight:600;font-family:'JetBrains Mono',monospace}
.nav-item .badge.warn{background:var(--warn);color:#3a2c00}
.nav-item .badge.dim{background:rgba(120,140,200,.18);color:var(--ink-dim)}

.sidebar-foot{margin-top:auto;padding-top:14px;border-top:1px solid var(--line)}
.theme-row{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap}
.theme-dot{width:22px;height:22px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:all .2s var(--ease)}
.theme-dot:hover{transform:scale(1.1)}
.theme-dot.active{border-color:var(--ink);box-shadow:0 0 10px rgba(255,255,255,.25)}
.theme-dot.t-aurora{background:conic-gradient(from 0deg,#7c5cff,#5eead4,#ff6ec7,#ffb347,#7c5cff)}
.theme-dot.t-cyber{background:linear-gradient(135deg,#050a08,#39ff88)}
.theme-dot.t-sunset{background:linear-gradient(135deg,#ff6ec7,#ffb347)}
.theme-dot.t-royal{background:linear-gradient(135deg,#7c5cff,#5cc8ff)}
.theme-dot.t-light{background:linear-gradient(135deg,#f0f2ff,#5cc8ff)}

.user-card{display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;background:rgba(120,140,200,.06);border:1px solid var(--line)}
.user-card .avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent-3));display:grid;place-items:center;color:#fff;font-weight:700;font-size:14px;font-family:'Space Grotesk',sans-serif;flex-shrink:0}
.user-card .uc-name{font-size:12.5px;font-weight:600;color:var(--ink)}
.user-card .uc-meta{font-size:10.5px;color:var(--ink-dim);font-family:'JetBrains Mono',monospace}
.user-card .logout-btn{margin-inline-start:auto;background:transparent;border:none;color:var(--ink-dim);cursor:pointer;padding:6px;border-radius:6px;transition:all .2s var(--ease)}
.user-card .logout-btn:hover{color:var(--danger);background:rgba(255,93,115,.1)}

/* Main content */
.main{padding:24px 32px 60px;min-width:0;animation:mainIn .4s var(--ease-out) both}
@keyframes mainIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

.topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:14px}
.topbar .page-title{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:22px;margin:0;letter-spacing:-.01em;display:flex;align-items:center;gap:12px}
.topbar .page-title .pt-sub{font-size:13px;color:var(--ink-dim);font-weight:400}
.topbar .topbar-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}

.hdr-meta{display:flex;align-items:center;gap:16px;font-size:12px;color:var(--ink-dim);font-family:'JetBrains Mono',monospace;direction:ltr}
.hdr-meta .live-dot{width:8px;height:8px;border-radius:50%;background:var(--online);box-shadow:0 0 10px var(--online);display:inline-block;animation:livePulse 1.6s ease-in-out infinite;margin-inline-end:5px}
@keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}

/* Search bar */
.search-bar{position:relative;flex:1;max-width:380px}
.search-bar input{
  width:100%;padding:10px 38px 10px 14px;border-radius:10px;border:1px solid var(--line);
  background:var(--panel);color:var(--ink);font-size:13.5px;font-family:'Vazirmatn',sans-serif;
  transition:all .2s var(--ease);
}
.search-bar input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--glow-1)}
.search-bar .sb-ic{position:absolute;inset-inline-end:12px;top:50%;transform:translateY(-50%);color:var(--ink-dim);font-size:14px}
.search-bar .sb-key{position:absolute;inset-inline-start:12px;top:50%;transform:translateY(-50%);font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--ink-mute);background:rgba(120,140,200,.1);padding:2px 6px;border-radius:4px;border:1px solid var(--line)}

/* Buttons */
button{cursor:pointer;font-family:'Vazirmatn',sans-serif;border:none}
.btn-primary{
  position:relative;overflow:hidden;
  background:linear-gradient(135deg,var(--accent),var(--accent-3));color:#fff;font-weight:600;letter-spacing:.01em;
  border-radius:10px;padding:10px 18px;font-size:13px;
  box-shadow:0 4px 14px -4px var(--glow-1), 0 0 0 1px rgba(255,255,255,.05) inset;
  transition:all .2s var(--ease);display:inline-flex;align-items:center;gap:7px;
}
.btn-primary::before{content:'';position:absolute;top:0;bottom:0;inset-inline-start:-60%;width:40%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);transform:skewX(-20deg);transition:inset-inline-start .55s var(--ease)}
.btn-primary:hover::before{inset-inline-start:130%}
.btn-primary:hover{filter:brightness(1.08);transform:translateY(-1px);box-shadow:0 8px 22px -6px var(--glow-1), 0 0 0 1px rgba(255,255,255,.08) inset}
.btn-primary:active{transform:translateY(0)}
.btn-primary:disabled{opacity:.5;cursor:default;transform:none}
.btn-primary svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2.5}

.btn-ghost{
  background:rgba(120,140,200,.06);border:1px solid var(--line);color:var(--ink-2);
  border-radius:9px;padding:8px 14px;font-size:12.5px;font-family:'Vazirmatn',sans-serif;
  transition:all .18s var(--ease);display:inline-flex;align-items:center;gap:6px;
}
.btn-ghost:hover{color:var(--ink);border-color:var(--accent);background:rgba(124,92,255,.1);box-shadow:0 0 12px var(--glow-1)}
.btn-ghost:active{transform:translateY(0)}
.btn-ghost.danger:hover{color:var(--danger);border-color:var(--danger);background:rgba(255,93,115,.1);box-shadow:0 0 12px rgba(255,93,115,.18)}
.btn-ghost.success:hover{color:var(--online);border-color:var(--online);background:rgba(52,232,158,.1)}
.btn-ghost.warn:hover{color:var(--warn);border-color:var(--warn);background:rgba(255,200,87,.1)}
.btn-ghost svg{width:13px;height:13px;stroke:currentColor;fill:none;stroke-width:2}

.btn-icon{
  width:38px;height:38px;border-radius:10px;display:grid;place-items:center;cursor:pointer;
  background:rgba(120,140,200,.06);border:1px solid var(--line);color:var(--ink-dim);
  transition:all .2s var(--ease);
}
.btn-icon:hover{color:var(--accent);border-color:var(--accent);background:rgba(124,92,255,.1);transform:translateY(-1px)}
.btn-icon svg{width:17px;height:17px;stroke:currentColor;fill:none;stroke-width:2}

/* Cards */
.card{
  background:linear-gradient(180deg,var(--panel),var(--panel-2));border:1px solid var(--line);border-radius:14px;
  box-shadow:var(--shadow-card);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  position:relative;transition:border-color .25s var(--ease),box-shadow .25s var(--ease),transform .2s var(--ease);
}
.card.glow:hover{border-color:var(--line-strong);box-shadow:var(--shadow-card),0 0 20px var(--glow-1)}
.card-pad{padding:18px}

/* Stat cards */
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:22px}
.stat{
  background:linear-gradient(160deg,var(--panel),var(--panel-2));border:1px solid var(--line);border-radius:14px;padding:16px;
  position:relative;overflow:hidden;transition:all .25s var(--ease);
}
.stat::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--accent),var(--accent-2));opacity:.6}
.stat::after{content:'';position:absolute;top:-30%;inset-inline-end:-30%;width:60%;height:160%;background:radial-gradient(circle,var(--glow-1),transparent 70%);opacity:.4;transition:opacity .3s var(--ease)}
.stat:hover{transform:translateY(-3px);border-color:var(--line-strong);box-shadow:0 14px 32px -14px var(--glow-1)}
.stat:hover::after{opacity:.8}
.stat .stat-icon{
  width:34px;height:34px;border-radius:10px;display:grid;place-items:center;margin-bottom:12px;
  background:rgba(124,92,255,.12);border:1px solid rgba(124,92,255,.22);color:var(--accent);
}
.stat .stat-icon.green{background:rgba(52,232,158,.12);border-color:rgba(52,232,158,.25);color:var(--online)}
.stat .stat-icon.gold{background:rgba(255,200,87,.12);border-color:rgba(255,200,87,.25);color:var(--warn)}
.stat .stat-icon.pink{background:rgba(255,110,199,.12);border-color:rgba(255,110,199,.25);color:var(--accent-3)}
.stat .stat-icon.cyan{background:rgba(92,200,255,.12);border-color:rgba(92,200,255,.25);color:var(--info)}
.stat .stat-icon svg{width:17px;height:17px;stroke:currentColor;fill:none;stroke-width:2}
.stat .stat-num{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:24px;letter-spacing:-.02em;color:var(--ink);line-height:1.1}
.stat .stat-num .unit{font-size:13px;color:var(--ink-dim);margin-inline-start:4px;font-weight:500}
.stat .stat-lbl{color:var(--ink-dim);font-size:11px;margin-top:4px;text-transform:uppercase;letter-spacing:.06em;font-family:'JetBrains Mono',monospace}
.stat .stat-trend{position:absolute;top:14px;inset-inline-end:14px;font-size:11px;display:inline-flex;align-items:center;gap:3px;font-family:'JetBrains Mono',monospace}
.stat .stat-trend.up{color:var(--online)} .stat .stat-trend.down{color:var(--danger)}
.stat .stat-spark{margin-top:10px;height:30px;width:100%}
.stat .stat-bar{margin-top:8px;height:4px;background:rgba(120,140,200,.1);border-radius:2px;overflow:hidden}
.stat .stat-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--accent),var(--accent-2));border-radius:2px;transition:width .8s var(--ease)}

/* Circular progress ring */
.ring-progress{position:relative;width:60px;height:60px}
.ring-progress svg{width:100%;height:100%;transform:rotate(-90deg)}
.ring-progress circle{fill:none;stroke-width:5}
.ring-progress .ring-bg{stroke:rgba(120,140,200,.15)}
.ring-progress .ring-fg{stroke:url(#ringGrad);stroke-linecap:round;transition:stroke-dashoffset 1s var(--ease);filter:drop-shadow(0 0 4px var(--glow-1))}
.ring-progress .ring-txt{position:absolute;inset:0;display:grid;place-items:center;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:13px;color:var(--ink)}

/* Tables */
.table-wrap{overflow-x:auto;border-radius:14px}
table{width:100%;border-collapse:collapse;font-size:12.5px;font-family:'Vazirmatn',sans-serif}
th{text-align:right;color:var(--ink-dim);font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;padding:11px 10px;border-bottom:1px solid var(--line);font-family:'JetBrains Mono',monospace;font-weight:500}
td{padding:11px 10px;border-bottom:1px solid var(--line);vertical-align:middle}
tbody tr{transition:background .15s var(--ease)}
tbody tr:nth-child(even){background:rgba(120,140,200,.02)}
tbody tr:hover{background:rgba(124,92,255,.06)}
tbody tr.selected{background:rgba(124,92,255,.1)}
tbody tr:last-child td{border-bottom:none}

.cfg-name{font-weight:600;color:var(--ink);display:flex;align-items:center;gap:6px}
.cfg-usage-bar{height:3px;background:rgba(120,140,200,.15);border-radius:2px;margin-top:5px;overflow:hidden;min-width:70px}
.cfg-usage-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--accent),var(--accent-2));border-radius:2px;transition:width .6s var(--ease)}
.cfg-usage-bar i.hot{background:linear-gradient(90deg,var(--warn),var(--accent-4))}
.cfg-usage-bar i.over{background:var(--danger)}
.row-actions{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}
.flag-badge{font-size:14px;margin-inline-end:4px}

/* Pills / Badges */
.pill{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:12px;font-size:10.5px;font-family:'JetBrains Mono',monospace;border:1px solid transparent;letter-spacing:.03em;font-weight:500}
.pill::before{content:'';width:6px;height:6px;border-radius:50%;background:currentColor;box-shadow:0 0 6px currentColor}
.pill.on{background:rgba(52,232,158,.12);color:var(--online);border-color:rgba(52,232,158,.3)}
.pill.on::before{animation:livePulse 1.6s ease-in-out infinite}
.pill.off{background:rgba(255,93,115,.1);color:var(--danger);border-color:rgba(255,93,115,.28)}
.pill.warn{background:rgba(255,200,87,.12);color:var(--warn);border-color:rgba(255,200,87,.3)}
.pill.info{background:rgba(92,200,255,.12);color:var(--info);border-color:rgba(92,200,255,.28)}
.pill.dim{background:rgba(120,140,200,.1);color:var(--ink-dim);border-color:var(--line)}

/* Tabs (legacy compatibility) */
.tabs{display:none}

/* Inputs */
input,select,textarea{
  background:var(--panel-2); border:1px solid var(--line); color:var(--ink);
  border-radius:9px; padding:9px 12px; font-family:'Vazirmatn',sans-serif; font-size:13px; width:100%;
  transition:all .18s var(--ease);
}
input:hover,select:hover,textarea:hover{border-color:var(--line-strong)}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--glow-1)}
input::placeholder,textarea::placeholder{color:var(--ink-mute)}
label{font-size:11px;color:var(--ink-dim);text-transform:uppercase;letter-spacing:.06em;font-family:'JetBrains Mono',monospace;display:block;margin-bottom:6px}
input[type="checkbox"],input[type="radio"]{width:auto;accent-color:var(--accent)}

/* Modal */
.modal-bg{
  position:fixed;inset:0;background:rgba(8,8,20,.78);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  display:flex;align-items:center;justify-content:center;padding:16px;z-index:1000;
  animation:fadeIn .15s var(--ease);
}
.modal-bg .card{animation:modalPop .25s var(--ease-bounce)}
@keyframes modalPop{from{opacity:0;transform:scale(.94) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}

.modal-head{display:flex;justify-content:space-between;align-items:center;padding:18px 22px;border-bottom:1px solid var(--line)}
.modal-head h3{margin:0;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:16px;color:var(--ink)}
.modal-head .close-btn{background:transparent;border:none;color:var(--ink-dim);cursor:pointer;font-size:20px;padding:4px;border-radius:6px;transition:all .2s var(--ease);width:28px;height:28px;display:grid;place-items:center}
.modal-head .close-btn:hover{color:var(--danger);background:rgba(255,93,115,.1)}
.modal-body{padding:22px;max-height:calc(90vh - 70px);overflow-y:auto}
.modal-foot{padding:16px 22px;border-top:1px solid var(--line);display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}

/* Toast */
#toastWrap{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:3000;display:flex;flex-direction:column;gap:8px;align-items:center}
.toast{
  background:linear-gradient(135deg,var(--panel-3),var(--panel-2));border:1px solid var(--line-strong);color:var(--ink);
  border-radius:12px;padding:11px 16px 11px 14px;font-size:13px;font-family:'Vazirmatn',sans-serif;
  box-shadow:0 10px 28px rgba(0,0,0,.5);display:flex;align-items:center;gap:10px;max-width:90vw;
  position:relative;overflow:hidden;animation:toastIn .3s var(--ease-bounce);min-width:240px;
}
.toast::before{content:'';position:absolute;inset-inline-start:0;top:0;bottom:0;width:3px;background:var(--accent)}
.toast.ok::before{background:var(--online)}
.toast.err::before{background:var(--danger)}
.toast.warn::before{background:var(--warn)}
.toast .t-ic{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:700;background:var(--accent);color:#fff;flex-shrink:0}
.toast.ok .t-ic{background:var(--online);color:#052} .toast.err .t-ic{background:var(--danger);color:#fff}
.toast.warn .t-ic{background:var(--warn);color:#3a2c00}
.toast .t-progress{position:absolute;bottom:0;left:0;height:2px;background:var(--accent);animation:toastProg 3.2s linear forwards}
.toast.ok .t-progress{background:var(--online)} .toast.err .t-progress{background:var(--danger)}
@keyframes toastIn{from{opacity:0;transform:translateY(20px) scale(.94)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes toastProg{from{width:100%}to{width:0%}}
.toast.hide{transition:opacity .3s,transform .3s;opacity:0;transform:translateY(8px) scale(.95)}

/* Chart */
.chart-card{padding:18px;margin-bottom:22px}
.chart-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px}
.chart-legend{display:flex;gap:14px;font-size:11px;color:var(--ink-dim);flex-wrap:wrap;font-family:'JetBrains Mono',monospace}
.chart-legend .lg{display:inline-flex;align-items:center;gap:5px}
.chart-legend .sw{width:10px;height:10px;border-radius:3px;display:inline-block}
.traffic-chart{width:100%;height:170px;display:block}
.traffic-chart .gridline{stroke:rgba(120,140,200,.1);stroke-width:1}
.traffic-chart .axis-label{fill:var(--ink-mute);font-size:9px;font-family:'JetBrains Mono',monospace}
.traffic-chart .area{opacity:.4}
.traffic-chart .line{fill:none;stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round}
.traffic-chart .dot{stroke-width:2}
.chart-tip{
  position:absolute;pointer-events:none;background:var(--panel-3);border:1px solid var(--line-strong);
  border-radius:8px;padding:7px 11px;font-size:11.5px;color:var(--ink);white-space:nowrap;
  box-shadow:0 6px 18px rgba(0,0,0,.4);display:none;z-index:5;font-family:'JetBrains Mono',monospace;
}
.chart-tip .t{color:var(--ink-dim);font-size:10px;margin-bottom:2px}
.chart-wrap{position:relative}

/* Progress bar */
.progress{background:rgba(120,140,200,.1);border-radius:8px;height:10px;overflow:hidden;position:relative}
.progress .progress-bar{height:100%;border-radius:8px;background:linear-gradient(90deg,var(--accent),var(--accent-2));transition:width .6s var(--ease);position:relative;overflow:hidden}
.progress .progress-bar::after{content:'';position:absolute;inset:0;background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.18) 0 8px,transparent 8px 16px);background-size:24px 24px;animation:progStripe 1.2s linear infinite}
@keyframes progStripe{from{background-position:0 0}to{background-position:24px 0}}
.progress .progress-bar.warn{background:linear-gradient(90deg,var(--warn),var(--accent-4))}
.progress .progress-bar.danger{background:linear-gradient(90deg,var(--danger),var(--accent-3))}
#reqUsageBar{position:relative;overflow:hidden;box-shadow:0 0 12px var(--glow-1)}
#reqUsageBar::after{content:'';position:absolute;inset:0;background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.22) 0 10px,transparent 10px 20px);background-size:28px 28px;animation:progStripe 1.4s linear infinite}

/* Skeleton loading */
.skeleton{background:linear-gradient(90deg,rgba(120,140,200,.06) 25%,rgba(120,140,200,.16) 50%,rgba(120,140,200,.06) 75%);background-size:200% 100%;animation:skel 1.1s infinite;border-radius:6px;height:38px}
@keyframes skel{from{background-position:200% 0}to{background-position:-200% 0}}

/* QR */
#qrBox{display:flex;justify-content:center;padding:10px;background:#fff;border-radius:10px;margin:10px 0}
#qrBox svg,#qrBox canvas,#qrBox img{display:block}

/* Toolbar */
.toolbar{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;justify-content:space-between;align-items:center}

/* Section / panel headers */
.section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:12px;flex-wrap:wrap}
.section-head h2{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:16px;margin:0;color:var(--ink)}
.section-head .sh-sub{font-size:11px;color:var(--ink-dim);font-family:'JetBrains Mono',monospace}

/* Bulk action bar (slides in when configs selected) */
.bulk-bar{
  position:fixed;bottom:24px;inset-inline:50%;transform:translateX(50%);
  background:linear-gradient(135deg,var(--panel-3),var(--panel-2));border:1px solid var(--line-strong);
  border-radius:14px;padding:10px 14px;display:none;align-items:center;gap:10px;
  box-shadow:0 12px 36px rgba(0,0,0,.5),0 0 20px var(--glow-1);z-index:200;animation:bulkIn .25s var(--ease-bounce);
}
.bulk-bar.show{display:flex}
@keyframes bulkIn{from{opacity:0;transform:translateX(50%) translateY(20px)}to{opacity:1;transform:translateX(50%) translateY(0)}}
.bulk-bar .bb-count{font-size:13px;color:var(--ink);font-weight:600}
.bulk-bar .bb-count b{color:var(--accent)}

/* FAB */
.fab-group{position:fixed;bottom:24px;inset-inline-end:24px;display:flex;flex-direction:column;gap:10px;z-index:150}
.fab{
  width:48px;height:48px;border-radius:50%;border:none;cursor:pointer;
  background:linear-gradient(135deg,var(--accent),var(--accent-3));color:#fff;
  box-shadow:0 6px 18px -2px var(--glow-1);display:grid;place-items:center;
  transition:all .25s var(--ease);position:relative;
}
.fab:hover{transform:translateY(-2px) scale(1.05);box-shadow:0 10px 24px -2px var(--glow-1)}
.fab svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2.2}
.fab.secondary{background:linear-gradient(135deg,var(--panel-3),var(--panel-2));color:var(--ink);border:1px solid var(--line-strong);width:42px;height:42px}
.fab.secondary svg{width:17px;height:17px}

/* Command palette */
.cmd-palette{position:fixed;inset:0;background:rgba(8,8,20,.7);backdrop-filter:blur(8px);z-index:2500;display:none;align-items:flex-start;justify-content:center;padding-top:12vh}
.cmd-palette.show{display:flex;animation:fadeIn .15s var(--ease)}
.cmd-box{width:min(580px,90vw);background:var(--panel-3);border:1px solid var(--line-strong);border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,.5);overflow:hidden;animation:modalPop .2s var(--ease-bounce)}
.cmd-input{width:100%;padding:16px 18px;background:transparent;border:none;border-bottom:1px solid var(--line);color:var(--ink);font-size:15px;font-family:'Vazirmatn',sans-serif}
.cmd-input:focus{outline:none}
.cmd-list{max-height:50vh;overflow-y:auto}
.cmd-item{padding:11px 18px;display:flex;align-items:center;gap:11px;cursor:pointer;color:var(--ink-2);font-size:13px;transition:all .12s var(--ease);border-bottom:1px solid var(--line)}
.cmd-item:hover,.cmd-item.active{background:rgba(124,92,255,.12);color:var(--ink)}
.cmd-item .ci-ic{width:18px;height:18px;color:var(--accent);flex-shrink:0}
.cmd-item .ci-ic svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2}
.cmd-item .ci-key{margin-inline-start:auto;font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--ink-mute);background:rgba(120,140,200,.1);padding:2px 6px;border-radius:4px}

/* Activity feed */
.activity-feed{display:flex;flex-direction:column;gap:6px;max-height:340px;overflow-y:auto}
.activity-item{display:flex;gap:11px;padding:10px;border-radius:10px;transition:background .15s var(--ease);align-items:flex-start}
.activity-item:hover{background:rgba(120,140,200,.05)}
.activity-item .ai-dot{width:8px;height:8px;border-radius:50%;margin-top:5px;flex-shrink:0}
.activity-item .ai-dot.online{background:var(--online);box-shadow:0 0 6px var(--online)}
.activity-item .ai-dot.warn{background:var(--warn);box-shadow:0 0 6px var(--warn)}
.activity-item .ai-dot.info{background:var(--info);box-shadow:0 0 6px var(--info)}
.activity-item .ai-dot.danger{background:var(--danger);box-shadow:0 0 6px var(--danger)}
.activity-item .ai-content{flex:1;font-size:12.5px;color:var(--ink-2);line-height:1.5}
.activity-item .ai-content b{color:var(--ink)}
.activity-item .ai-time{font-size:10.5px;color:var(--ink-mute);font-family:'JetBrains Mono',monospace;margin-top:2px}

/* Settings grid */
.settings-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}

/* Sparkline */
.spark{width:100%;height:30px}

/* Misc */
.divider{height:1px;background:var(--line);margin:14px 0}
.empty-state{text-align:center;padding:36px;color:var(--ink-dim)}
.empty-state svg{width:48px;height:48px;opacity:.3;margin-bottom:10px}
.empty-state .es-title{font-size:14px;color:var(--ink-2);margin-bottom:4px}
.empty-state .es-sub{font-size:12px;color:var(--ink-mute)}

/* Mobile */
.mobile-toggle{display:none}
@media (max-width:900px){
  .app-shell{grid-template-columns:1fr}
  .sidebar{position:fixed;inset-block-start:0;inset-inline-start:0;width:260px;z-index:500;transform:translateX(-100%);inset-inline-start:auto;left:0;right:auto}
  [dir="rtl"] .sidebar{transform:translateX(100%);left:auto;right:0}
  .sidebar.open{transform:translateX(0)}
  .mobile-toggle{display:grid}
  .main{padding:18px 16px 80px}
  .topbar .page-title{font-size:18px}
  .stats-grid{grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}
  .stat .stat-num{font-size:20px}
  .fab-group{inset-inline-end:16px;bottom:16px}
}

/* Scrollbar */
::-webkit-scrollbar{width:8px;height:8px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--line-strong);border-radius:8px}
::-webkit-scrollbar-thumb:hover{background:var(--accent)}

/* Selection */
::selection{background:rgba(124,92,255,.35);color:#fff}

/* Reduced motion */
@media (prefers-reduced-motion: reduce){
  *{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}
  #particleCanvas{display:none}
}

/* Page transition */
.page-section{display:none;animation:pageIn .3s var(--ease-out) both}
.page-section.active{display:block}
@keyframes pageIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}

/* Tooltip */
.tip-ic{display:inline-grid;place-items:center;width:14px;height:14px;border-radius:50%;background:rgba(120,140,200,.18);color:var(--ink-dim);font-size:9px;cursor:help;margin-inline-start:4px}

/* Tag */
.tag{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:6px;font-size:10.5px;font-family:'JetBrains Mono',monospace;background:rgba(124,92,255,.12);color:var(--accent);border:1px solid rgba(124,92,255,.22)}
.tag.red{background:rgba(255,93,115,.12);color:var(--danger);border-color:rgba(255,93,115,.22)}
.tag.green{background:rgba(52,232,158,.12);color:var(--online);border-color:rgba(52,232,158,.22)}
.tag.gold{background:rgba(255,200,87,.12);color:var(--warn);border-color:rgba(255,200,87,.22)}

/* Sound toggle */
.sound-toggle{position:fixed;bottom:24px;inset-inline-start:24px;z-index:140;display:flex;gap:8px;align-items:center}
</style>
<canvas id="particleCanvas"></canvas>
<script src="/qrcode.min.js"></script>
`;

// helper: SVG icons used in the sidebar
function iconSet(){ return {
  dashboard: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  configs: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>',
  logs: '<svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  bot: '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>',
  backup: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  scan: '<svg viewBox="0 0 24 24"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  refresh: '<svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
  cmd: '<svg viewBox="0 0 24 24"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
  link: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  power: '<svg viewBox="0 0 24 24"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>',
  server: '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
  activity: '<svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  users: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  menu: '<svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  bell: '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
  play: '<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  qrcode: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="14" y1="14" x2="14" y2="21"/><line x1="21" y1="14" x2="21" y2="21"/><line x1="18" y1="17" x2="21" y2="17"/></svg>',
  cpu: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>',
}; }

// Inline SVG icons for stat cards (defined at module scope so dashboardPage can use them)
const IC_DASH_CONFIG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>';
const IC_DASH_ONLINE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>';
const IC_DASH_TRAFFIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17l5-5 4 4 8-8"/><path d="M15 8h5v5"/></svg>';
const IC_DASH_REQ = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
const IC_DASH_BACKEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>';

export function loginPage() {
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chop — ورود</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Vazirmatn:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --base:#0a0a14; --panel:rgba(20,22,42,.6); --panel-2:rgba(28,30,55,.85);
    --accent:#7c5cff; --accent-2:#5eead4; --accent-3:#ff6ec7; --accent-4:#ffb347;
    --ink:#eef2ff; --ink-dim:#7e87b5; --ink-mute:#525a82;
    --glow-1:rgba(124,92,255,.32); --glow-2:rgba(94,234,212,.22); --glow-3:rgba(255,110,199,.2);
    --line:rgba(120,140,200,.18); --line-strong:rgba(140,160,220,.32);
    --danger:#ff5d73; --warn:#ffc857;
    --ease:cubic-bezier(.4,0,.2,1); --ease-out:cubic-bezier(.16,1,.3,1);
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%;overflow:hidden}
  body{
    background:var(--base);color:var(--ink);font-family:'Vazirmatn',sans-serif;
    -webkit-font-smoothing:antialiased;position:relative;
  }
  .bg-aurora{position:fixed;inset:0;z-index:0;overflow:hidden}
  .bg-aurora::before{
    content:'';position:absolute;inset:-20%;
    background:
      radial-gradient(40% 50% at 15% 25%, var(--glow-1), transparent 60%),
      radial-gradient(45% 60% at 85% 15%, var(--glow-2), transparent 60%),
      radial-gradient(40% 50% at 70% 85%, var(--glow-3), transparent 60%),
      radial-gradient(35% 45% at 20% 80%, var(--glow-1), transparent 60%);
    filter:blur(60px);animation:auroraShift 18s ease-in-out infinite alternate;
  }
  .bg-aurora::after{
    content:'';position:absolute;inset:0;
    background-image:linear-gradient(rgba(120,140,200,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(120,140,200,.06) 1px,transparent 1px);
    background-size:48px 48px;-webkit-mask-image:radial-gradient(ellipse at center,black 30%,transparent 80%);mask-image:radial-gradient(ellipse at center,black 30%,transparent 80%);
  }
  @keyframes auroraShift{0%{transform:translate(0,0) rotate(0)}50%{transform:translate(3%,-2%) rotate(2deg)}100%{transform:translate(-3%,2%) rotate(-2deg)}}
  #particleCanvas{position:fixed;inset:0;z-index:1;pointer-events:none;opacity:.8}
  .stage{position:relative;z-index:2;height:100vh;display:grid;place-items:center;padding:20px}
  .panel{
    width:min(440px,92vw);background:linear-gradient(160deg,var(--panel),var(--panel-2));
    border:1px solid var(--line-strong);border-radius:18px;padding:32px 30px 26px;
    backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
    box-shadow:0 24px 60px -20px rgba(0,0,0,.6),0 0 30px var(--glow-1),0 0 0 1px rgba(255,255,255,.04) inset;
    animation:panelIn .6s var(--ease-bounce) both;position:relative;
  }
  @keyframes panelIn{from{opacity:0;transform:translateY(20px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
  .panel::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--accent),var(--accent-2),var(--accent-3));border-radius:18px 18px 0 0}
  .brand-row{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:24px}
  .brand-mark{
    width:48px;height:48px;border-radius:14px;display:grid;place-items:center;
    background:conic-gradient(from 0deg,var(--accent),var(--accent-2),var(--accent-3),var(--accent-4),var(--accent));
    box-shadow:0 0 24px var(--glow-1);position:relative;animation:brandSpin 12s linear infinite;
  }
  .brand-mark::before{content:'';position:absolute;inset:2px;border-radius:12px;background:var(--base)}
  .brand-mark span{position:relative;z-index:1;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:22px;background:linear-gradient(135deg,var(--ink),var(--accent-2));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
  @keyframes brandSpin{to{transform:rotate(360deg)}}
  .brand-text h1{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:24px;letter-spacing:-.02em;margin:0;
    background:linear-gradient(135deg,var(--ink),var(--accent-2));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
  .brand-text small{display:block;font-size:11px;color:var(--ink-dim);font-family:'JetBrains Mono',monospace;letter-spacing:.14em;text-transform:uppercase;margin-top:2px}
  .field{margin-bottom:16px;position:relative}
  .field label{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--ink-dim);margin-bottom:7px;text-transform:uppercase;letter-spacing:.08em;font-family:'JetBrains Mono',monospace}
  .field label .lbl-tag{font-size:9.5px;opacity:.6}
  .field .input-wrap{position:relative}
  .field input{
    width:100%;background:rgba(120,140,200,.05);border:1px solid var(--line);color:var(--ink);
    padding:13px 16px 13px 42px;border-radius:11px;font-family:'JetBrains Mono',monospace;font-size:13.5px;
    direction:ltr;text-align:left;transition:all .2s var(--ease);letter-spacing:.5px;
  }
  .field input::placeholder{color:var(--ink-mute)}
  .field input:focus{outline:none;border-color:var(--accent);background:rgba(124,92,255,.08);box-shadow:0 0 0 3px var(--glow-1)}
  .field .ic{position:absolute;inset-inline-start:14px;top:50%;transform:translateY(-50%);color:var(--ink-dim);width:16px;height:16px;transition:color .2s var(--ease)}
  .field input:focus + .ic{color:var(--accent)}
  .field .ic svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2}
  .auth-btn{
    width:100%;position:relative;overflow:hidden;
    background:linear-gradient(135deg,var(--accent),var(--accent-3));color:#fff;
    font-family:'Space Grotesk','Vazirmatn',sans-serif;font-weight:600;letter-spacing:.02em;font-size:14px;
    padding:13px;border-radius:11px;cursor:pointer;transition:all .25s var(--ease);
    box-shadow:0 6px 18px -4px var(--glow-1);display:flex;align-items:center;justify-content:center;gap:8px;
    border:none;margin-top:6px;
  }
  .auth-btn::before{content:'';position:absolute;top:0;bottom:0;left:-60%;width:40%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);transform:skewX(-20deg);transition:left .6s var(--ease)}
  .auth-btn:hover::before{left:130%}
  .auth-btn:hover{transform:translateY(-1px);box-shadow:0 10px 26px -4px var(--glow-1)}
  .auth-btn:active{transform:translateY(0)}
  .auth-btn:disabled{opacity:.7;cursor:wait}
  .auth-btn .sweep{position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);transform:translateX(-100%)}
  .auth-btn.scanning .sweep{animation:sweepMove 1.1s linear infinite}
  @keyframes sweepMove{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
  .auth-btn svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2.5}
  .status-line{margin-top:14px;text-align:center;font-size:11px;font-family:'JetBrains Mono',monospace;letter-spacing:.06em;color:var(--ink-dim);transition:color .3s;direction:ltr}
  .status-line.warn{color:var(--warn)}
  .status-line.ok{color:var(--accent-2)}
  .status-line.err{color:var(--danger)}
  .status-line::before{content:'●';margin-right:5px;animation:livePulse 1.6s infinite}
  @keyframes livePulse{0%,100%{opacity:1}50%{opacity:.4}}
  .foot-meta{margin-top:18px;padding-top:14px;border-top:1px solid var(--line);display:flex;justify-content:space-between;font-size:10px;color:var(--ink-mute);font-family:'JetBrains Mono',monospace;letter-spacing:.1em;direction:ltr}
  .feat-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:22px}
  .feat-item{display:flex;align-items:center;gap:7px;font-size:11px;color:var(--ink-dim);font-family:'JetBrains Mono',monospace}
  .feat-item svg{width:13px;height:13px;color:var(--accent-2);stroke:currentColor;fill:none;stroke-width:2.5}
  @media (max-width:480px){.panel{padding:24px 20px}}
</style>
</head>
<body>
<div class="bg-aurora"></div>
<canvas id="particleCanvas"></canvas>
<div class="stage">
  <div class="panel">
    <div class="brand-row">
      <div class="brand-mark"><span>C</span></div>
      <div class="brand-text">
        <h1>Chop</h1>
        <small>Admin Console</small>
      </div>
    </div>
    <div class="feat-grid">
      <div class="feat-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> VLESS / WS</div>
      <div class="feat-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> آی‌پی تمیز</div>
      <div class="feat-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> ربات تلگرام</div>
      <div class="feat-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> بکاپ خودکار</div>
    </div>
    <div class="field">
      <label>نام کاربری <span class="lbl-tag">USER ID</span></label>
      <div class="input-wrap">
        <input type="text" id="u" placeholder="admin" autocomplete="username" autofocus>
        <span class="ic"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
      </div>
    </div>
    <div class="field">
      <label>رمز عبور <span class="lbl-tag">ACCESS CODE</span></label>
      <div class="input-wrap">
        <input type="password" id="p" placeholder="••••••••" autocomplete="current-password">
        <span class="ic"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
      </div>
    </div>
    <button type="button" class="auth-btn" id="authBtn" onclick="doLogin()">
      <span class="sweep"></span>
      <svg viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
      <span id="btnLabel">ورود به پنل</span>
    </button>
    <div class="status-line" id="statusLine">READY — AWAITING CREDENTIALS</div>
    <div class="foot-meta">
      <span>v2.0 · AURORA</span>
      <span>SEC: TLS</span>
    </div>
  </div>
</div>
<script>
(function(){
  const c = document.getElementById('particleCanvas');
  if(!c || !c.getContext) return;
  const ctx = c.getContext('2d');
  let w=0,h=0,particles=[];
  function resize(){w=c.width=innerWidth;h=c.height=innerHeight;particles=[];const n=Math.min(60,Math.floor(w*h/24000));for(let i=0;i<n;i++)particles.push({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,r:Math.random()*1.8+.4,c:['124,92,255','94,234,212','255,110,199'][Math.floor(Math.random()*3)]});}
  function frame(){
    ctx.clearRect(0,0,w,h);
    for(const p of particles){
      p.x+=p.vx;p.y+=p.vy;
      if(p.x<0||p.x>w)p.vx*=-1;
      if(p.y<0||p.y>h)p.vy*=-1;
      ctx.fillStyle='rgba('+p.c+',0.5)';
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
    }
    for(let i=0;i<particles.length;i++){
      for(let j=i+1;j<particles.length;j++){
        const dx=particles[i].x-particles[j].x,dy=particles[i].y-particles[j].y;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d<110){ctx.strokeStyle='rgba(124,92,255,'+(1-d/110)*.15+')';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(particles[i].x,particles[i].y);ctx.lineTo(particles[j].x,particles[j].y);ctx.stroke();}
      }
    }
    if(!document.hidden)requestAnimationFrame(frame);
  }
  window.addEventListener('resize',resize);
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){resize();frame();}
})();

const authBtn = document.getElementById('authBtn');
const btnLabel = document.getElementById('btnLabel');
const statusLine = document.getElementById('statusLine');

async function doLogin(){
  const u = document.getElementById('u').value.trim();
  const p = document.getElementById('p').value;
  if(!u || !p){
    statusLine.textContent = 'MISSING FIELD — INPUT REQUIRED';
    statusLine.className = 'status-line warn';
    return;
  }
  authBtn.classList.add('scanning');
  authBtn.disabled = true;
  btnLabel.textContent = 'در حال ورود...';
  statusLine.textContent = 'AUTHENTICATING ...';
  statusLine.className = 'status-line warn';
  try{
    const res = await fetch('/api/login', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({username:u, password:p})
    });
    const data = await res.json().catch(()=>({}));
    authBtn.classList.remove('scanning');
    if(!res.ok){
      authBtn.disabled = false;
      btnLabel.textContent = 'ورود به پنل';
      statusLine.textContent = 'ACCESS DENIED — ' + (data.detail || 'خطا');
      statusLine.className = 'status-line err';
      return;
    }
    btnLabel.textContent = 'دسترسی تایید شد';
    statusLine.textContent = 'ACCESS GRANTED — REDIRECTING';
    statusLine.className = 'status-line ok';
    setTimeout(()=>{ location.href='/dashboard'; }, 600);
  }catch(e){
    authBtn.classList.remove('scanning');
    authBtn.disabled = false;
    btnLabel.textContent = 'ورود به پنل';
    statusLine.textContent = 'NETWORK ERROR — RETRY';
    statusLine.className = 'status-line err';
  }
}
document.getElementById('p').addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });
document.getElementById('u').addEventListener('keydown', e=>{ if(e.key==='Enter') document.getElementById('p').focus(); });
</script>
</body>
</html>`;
}

export function dashboardPage() {
  const ic = iconSet();
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chop — پنل مدیریت</title>
${BASE_STYLE}
</head>
<body>
<div class="aurora-bg" aria-hidden="true"></div>

<div class="app-shell">
  <!-- Sidebar -->
  <aside class="sidebar" id="sidebar">
    <div class="brand">
      <div class="brand-mark"><span>C</span></div>
      <div>
        <h1>Chop</h1>
        <small>Admin Console</small>
      </div>
    </div>

    <nav class="nav-section">
      <div class="nav-label">اصلی</div>
      <a class="nav-item active" data-page="dashboard" onclick="goPage('dashboard')">
        <span class="nav-ic">${ic.dashboard}</span>
        <span>داشبورد</span>
      </a>
      <a class="nav-item" data-page="configs" onclick="goPage('configs')">
        <span class="nav-ic">${ic.configs}</span>
        <span>کانفیگ‌ها</span>
        <span class="badge dim" id="navCfgCount">۰</span>
      </a>
      <a class="nav-item" data-page="logs" onclick="goPage('logs')">
        <span class="nav-ic">${ic.logs}</span>
        <span>لاگ اتصال‌ها</span>
      </a>
      <a class="nav-item" data-page="activity" onclick="goPage('activity')">
        <span class="nav-ic">${ic.activity}</span>
        <span>فعالیت زنده</span>
        <span class="badge" id="navOnlineCount">۰</span>
      </a>
    </nav>

    <nav class="nav-section">
      <div class="nav-label">ابزارها</div>
      <a class="nav-item" data-page="scan" onclick="goPage('scan')">
        <span class="nav-ic">${ic.scan}</span>
        <span>اسکن آی‌پی تمیز</span>
      </a>
      <a class="nav-item" data-page="bot" onclick="goPage('bot')">
        <span class="nav-ic">${ic.bot}</span>
        <span>ربات تلگرام</span>
      </a>
      <a class="nav-item" data-page="backup" onclick="goPage('backup')">
        <span class="nav-ic">${ic.backup}</span>
        <span>بکاپ و بازیابی</span>
      </a>
      <a class="nav-item" data-page="settings" onclick="goPage('settings')">
        <span class="nav-ic">${ic.settings}</span>
        <span>تنظیمات</span>
      </a>
    </nav>

    <div class="sidebar-foot">
      <div class="theme-row" title="تغییر تم">
        <span class="theme-dot t-aurora active" data-theme-key="aurora" onclick="setTheme('aurora',this)" title="Aurora"></span>
        <span class="theme-dot t-cyber" data-theme-key="cyber" onclick="setTheme('cyber',this)" title="Cyber"></span>
        <span class="theme-dot t-sunset" data-theme-key="sunset" onclick="setTheme('sunset',this)" title="Sunset"></span>
        <span class="theme-dot t-royal" data-theme-key="royal" onclick="setTheme('royal',this)" title="Royal"></span>
        <span class="theme-dot t-light" data-theme-key="light" onclick="setTheme('light',this)" title="Light"></span>
      </div>
      <div class="user-card">
        <div class="avatar">A</div>
        <div style="flex:1;min-width:0">
          <div class="uc-name">admin</div>
          <div class="uc-meta" id="sidebarUptime">—</div>
        </div>
        <button class="logout-btn" onclick="logout()" title="خروج">${ic.power}</button>
      </div>
    </div>
  </aside>

  <!-- Main -->
  <main class="main">
    <div class="topbar">
      <div style="display:flex;align-items:center;gap:14px">
        <button class="btn-icon mobile-toggle" onclick="toggleSidebar()">${ic.menu}</button>
        <div>
          <h1 class="page-title" id="pageTitle">داشبورد <span class="pt-sub" id="pageSub">نمای کلی</span></h1>
        </div>
      </div>
      <div class="topbar-actions">
        <div class="search-bar">
          <input type="search" id="globalSearch" placeholder="جستجو یا دستور..." oninput="onGlobalSearch(this.value)" onkeydown="onSearchKey(event)">
          <span class="sb-key">⌘K</span>
          <span class="sb-ic">⌕</span>
        </div>
        <button class="btn-icon" onclick="openCmdPalette()" title="پالت دستورات (Ctrl+K)">${ic.cmd}</button>
        <button class="btn-icon" onclick="refreshAll()" title="بروزرسانی">${ic.refresh}</button>
        <button class="btn-primary" onclick="openConfigModal()">${ic.plus}<span>کانفیگ جدید</span></button>
      </div>
    </div>

    <!-- Stats grid -->
    <div class="stats-grid" id="stats"></div>

    <!-- DASHBOARD PAGE -->
    <div class="page-section active" id="page-dashboard">
      <!-- Traffic chart -->
      <div class="card chart-card">
        <div class="chart-head">
          <div>
            <label style="margin:0">ترافیک ۲۴ ساعت اخیر</label>
            <div style="font-size:11px;color:var(--ink-mute);margin-top:2px;font-family:'JetBrains Mono',monospace">حجم عبوری در هر ساعت</div>
          </div>
          <div class="chart-legend">
            <span class="lg"><span class="sw" style="background:var(--accent)"></span> حجم</span>
            <span class="lg" id="chartPeak"></span>
            <span class="lg" id="chartTotal"></span>
          </div>
        </div>
        <div class="chart-wrap">
          <svg class="traffic-chart" id="trafficChart" viewBox="0 0 800 170" preserveAspectRatio="none"></svg>
          <div class="chart-tip" id="chartTip"></div>
        </div>
      </div>

      <!-- Request counter -->
      <div class="card card-pad" style="margin-bottom:22px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div>
            <label style="margin:0">شمارنده‌ی درخواست امروز</label>
            <div style="font-size:11px;color:var(--ink-mute);margin-top:2px;font-family:'JetBrains Mono',monospace">سقف مرجع، قابل تغییر</div>
          </div>
          <span id="reqUsageText" class="mono" style="font-size:12px;color:var(--ink-dim)"></span>
        </div>
        <div class="progress"><div id="reqUsageBar" class="progress-bar" style="width:0%"></div></div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:8px;flex-wrap:wrap">
          <div id="reqUsageHistory" class="mono" style="font-size:11px;color:var(--ink-dim)"></div>
          <div style="display:flex;gap:6px;align-items:center">
            <label style="margin:0;font-size:11px">سقف روزانه</label>
            <input id="reqLimitInput" type="number" style="width:110px" value="100000">
            <button class="btn-ghost" onclick="saveRequestLimit()">ذخیره</button>
          </div>
        </div>
      </div>

      <!-- Activity feed + System info -->
      <div style="display:grid;grid-template-columns:1fr 320px;gap:14px;align-items:start" class="dual-grid">
        <div class="card card-pad">
          <div class="section-head">
            <div><h2>فعالیت اخیر</h2><div class="sh-sub">آخرین اتصال‌ها</div></div>
            <button class="btn-ghost" onclick="loadActivityFeed()">${ic.refresh}<span>بروزرسانی</span></button>
          </div>
          <div class="activity-feed" id="activityFeed">
            <div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>
          </div>
        </div>

        <div class="card card-pad">
          <div class="section-head">
            <div><h2>وضعیت سیستم</h2><div class="sh-sub">منابع سرور</div></div>
          </div>
          <div id="systemInfoBox">
            <div class="skeleton"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- CONFIGS PAGE -->
    <div class="page-section" id="page-configs">
      <div id="configLoadError" style="display:none;background:rgba(255,93,115,.08);color:#ffb0b8;border:1px solid rgba(255,93,115,.3);border-radius:10px;padding:12px 16px;margin-bottom:14px;font-size:13px"></div>
      <div class="toolbar">
        <div class="search-bar" style="max-width:300px">
          <input id="cfgSearch" type="search" placeholder="جستجوی کانفیگ..." oninput="renderConfigRows()">
          <span class="sb-ic">⌕</span>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn-ghost" onclick="toggleBulkMode()" id="bulkModeBtn"> انتخاب گروهی</button>
          <button class="btn-ghost success" onclick="exportConfigsCsv()" title="خروجی CSV"> CSV</button>
          <button class="btn-primary" onclick="openConfigModal()">${ic.plus}<span>کانفیگ جدید</span></button>
        </div>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th style="width:34px;display:none" id="thBulk"><input type="checkbox" onclick="toggleSelectAll(this)" style="width:auto"></th>
              <th>نام</th><th>وضعیت</th><th>آنلاین</th><th>مصرف</th><th>انقضا</th><th>عملیات</th>
            </tr></thead>
            <tbody id="configRows"><tr><td colspan="6"><div class="skeleton"></div></td></tr></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- LOGS PAGE -->
    <div class="page-section" id="page-logs">
      <div class="card card-pad" style="margin-bottom:14px">
        <div class="toolbar" style="margin:0">
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <label style="margin:0">فیلتر:</label>
            <select id="logFilter" style="width:220px" onchange="loadLogs()"><option value="">همه</option></select>
            <input id="logSearch" type="search" placeholder="جستجوی IP یا مقصد..." style="width:240px" oninput="renderLogRows()">
          </div>
          <button class="btn-ghost" onclick="loadLogs()">${ic.refresh}<span>بروزرسانی</span></button>
        </div>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>زمان</th><th>کانفیگ</th><th>IP</th><th>مقصد</th><th>حجم</th></tr></thead>
            <tbody id="logRows"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ACTIVITY PAGE -->
    <div class="page-section" id="page-activity">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" class="dual-grid">
        <div class="card card-pad">
          <div class="section-head">
            <div><h2>فعالیت زنده</h2><div class="sh-sub">آخرین اتصال‌ها به‌صورت بلادرنگ</div></div>
            <span class="pill on" id="liveStatus">زنده</span>
          </div>
          <div class="activity-feed" id="activityLiveFeed" style="max-height:540px">
            <div class="skeleton"></div>
          </div>
        </div>
        <div class="card card-pad">
          <div class="section-head">
            <div><h2>آمار اتصال‌ها</h2><div class="sh-sub">توزیع بر اساس کانفیگ</div></div>
          </div>
          <div id="connDistBox">
            <div class="skeleton"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- SCAN PAGE -->
    <div class="page-section" id="page-scan">
      <div class="card card-pad">
        <div class="section-head">
          <div><h2>اسکن آی‌پی تمیز</h2><div class="sh-sub">تست خودکار آی‌پی‌های Cloudflare/Vercel</div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px" class="dual-grid">
          <div>
            <label>تعداد آی‌پی مورد‌نظر</label>
            <input id="scanWantInput" type="number" value="10" min="1" max="50">
          </div>
          <div>
            <label>ارائه‌دهنده</label>
            <select id="scanProviderSelect">
              <option value="cloudflare">Cloudflare</option>
              <option value="vercel">Vercel</option>
            </select>
          </div>
        </div>
        <button class="btn-primary" id="scanIpsBtn" onclick="scanCleanIpsNow()">${ic.scan}<span>اسکن و پیدا کردن</span></button>
        <div id="scanIpsStatus" class="mono" style="margin-top:12px;font-size:12px;color:var(--ink-dim)"></div>
        <div id="scanIpsResult" style="margin-top:12px"></div>
        <div class="divider"></div>
        <div style="font-size:11.5px;color:var(--ink-dim);line-height:1.7">
          <b style="color:var(--ink-2)">نکته:</b> این تکنیک فقط وقتی واقعاً جواب می‌ده که دامنه پشت Cloudflare (ابر نارنجی) باشه. اگه دامنه مستقیم روی سرویس‌دهنده بدون Cloudflare هست، حالت Vercel رو امتحان کن ولی احتمال پیدا کردن نتیجه خیلی کمتره.
        </div>
      </div>
    </div>

    <!-- BOT PAGE -->
    <div class="page-section" id="page-bot">
      <div class="card card-pad" style="margin-bottom:14px">
        <div class="section-head"><div><h2>تنظیمات ربات</h2><div class="sh-sub">اتصال به BotFather</div></div></div>
        <div style="margin-bottom:14px"><label>توکن ربات (از BotFather)</label><input id="botToken" placeholder="123456:ABC-..."></div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <label style="display:flex;align-items:center;gap:8px;margin:0;cursor:pointer;text-transform:none;letter-spacing:0;font-size:13px;color:var(--ink-2)">
            <input type="checkbox" id="botEnabled" style="width:auto"> ربات فعال باشد
          </label>
        </div>
        <button class="btn-primary" onclick="saveBotSettings()">${ic.bot}<span>ذخیره و اتصال Webhook</span></button>
        <div id="botStatus" class="mono" style="margin-top:14px;font-size:12px;color:var(--ink-dim)"></div>
      </div>

      <div class="card card-pad" style="margin-bottom:14px">
        <div class="section-head"><div><h2>ادمین‌ها</h2><div class="sh-sub">مدیران ربات</div></div></div>
        <div style="display:flex;gap:8px;margin-bottom:14px">
          <input id="newAdminId" placeholder="آی‌دی عددی تلگرام">
          <button class="btn-ghost" onclick="addBotAdmin()">${ic.plus}<span>افزودن</span></button>
        </div>
        <div id="adminList"></div>
      </div>

      <div class="card card-pad" style="margin-bottom:14px">
        <div class="section-head">
          <div><h2>ارسال پیام همگانی</h2><div class="sh-sub">Broadcast</div></div>
          <select id="broadcastTarget" style="width:170px">
            <option value="all">همه‌ی اعضا</option>
            <option value="admins">فقط ادمین‌ها</option>
          </select>
        </div>
        <textarea id="broadcastText" rows="4" placeholder="متن پیام..." style="width:100%;resize:vertical;font-family:'Vazirmatn',sans-serif"></textarea>
        <div style="display:flex;justify-content:flex-end;margin-top:12px">
          <button class="btn-primary" id="broadcastBtn" onclick="sendBroadcast()">ارسال</button>
        </div>
        <div id="broadcastStatus" class="mono" style="font-size:12px;color:var(--ink-dim);margin-top:10px"></div>
      </div>

      <div class="card card-pad">
        <div class="section-head">
          <div><h2>اعضا</h2><div class="sh-sub" id="memberCount"></div></div>
          <button class="btn-ghost" onclick="loadBotMembers()">${ic.refresh}<span>بروزرسانی</span></button>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>نام</th><th>یوزرنیم</th><th>آی‌دی</th><th>آخرین بازدید</th><th></th></tr></thead>
            <tbody id="memberRows"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- BACKUP PAGE -->
    <div class="page-section" id="page-backup">
      <div class="card card-pad" style="margin-bottom:14px">
        <div class="section-head"><div><h2>دانلود بکاپ</h2><div class="sh-sub">JSON شامل همه‌ی داده‌ها</div></div></div>
        <div style="color:var(--ink-dim);font-size:13px;margin-bottom:14px;line-height:1.7">یک فایل JSON شامل همه‌ی کانفیگ‌ها، مصرف، تنظیمات ربات و لاگ‌ها دانلود می‌کند.</div>
        <button class="btn-primary" onclick="location.href='/api/backup'">${ic.backup}<span>دانلود بکاپ</span></button>
      </div>
      <div class="card card-pad" style="margin-bottom:14px">
        <div class="section-head"><div><h2>خروجی CSV</h2><div class="sh-sub">لیست کانفیگ‌ها برای اکسل</div></div></div>
        <button class="btn-ghost success" onclick="exportConfigsCsv()">دانلود CSV</button>
      </div>
      <div class="card card-pad">
        <div class="section-head"><div><h2>بازیابی</h2><div class="sh-sub">آپلود فایل بکاپ</div></div></div>
        <div style="margin-bottom:12px"><label>فایل بکاپ</label><input type="file" id="restoreFile" accept="application/json"></div>
        <div style="display:flex;gap:16px;align-items:center;margin-bottom:14px;flex-wrap:wrap">
          <label style="margin:0;display:flex;align-items:center;gap:6px;cursor:pointer;text-transform:none;letter-spacing:0;font-size:13px;color:var(--ink-2)"><input type="radio" name="mode" value="replace" checked style="width:auto"> جایگزینی کامل</label>
          <label style="margin:0;display:flex;align-items:center;gap:6px;cursor:pointer;text-transform:none;letter-spacing:0;font-size:13px;color:var(--ink-2)"><input type="radio" name="mode" value="merge" style="width:auto"> ادغام</label>
        </div>
        <button class="btn-primary" onclick="doRestore()">${ic.refresh}<span>بازیابی</span></button>
        <div id="restoreStatus" class="mono" style="margin-top:14px;font-size:12px"></div>
      </div>
    </div>

    <!-- SETTINGS PAGE -->
    <div class="page-section" id="page-settings">
      <div class="card card-pad" style="margin-bottom:14px">
        <div class="section-head"><div><h2>ظاهر</h2><div class="sh-sub">تم و رنگ‌بندی</div></div></div>
        <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center">
          <div class="theme-row" style="margin:0">
            <span class="theme-dot t-aurora active" data-theme-key="aurora" onclick="setTheme('aurora',this)"></span>
            <span class="theme-dot t-cyber" data-theme-key="cyber" onclick="setTheme('cyber',this)"></span>
            <span class="theme-dot t-sunset" data-theme-key="sunset" onclick="setTheme('sunset',this)"></span>
            <span class="theme-dot t-royal" data-theme-key="royal" onclick="setTheme('royal',this)"></span>
            <span class="theme-dot t-light" data-theme-key="light" onclick="setTheme('light',this)"></span>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <label style="margin:0">حالت:</label>
            <select id="settingsModeSel" onchange="setMode(this.value)" style="width:140px">
              <option value="dark">تاریک</option>
              <option value="light">روشن</option>
            </select>
          </div>
        </div>
      </div>
      <div class="card card-pad" style="margin-bottom:14px">
        <div class="section-head"><div><h2>رفتار پنل</h2><div class="sh-sub">ترجیحات نمایشی</div></div></div>
        <div class="settings-grid">
          <label style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;text-transform:none;letter-spacing:0;font-size:13px;color:var(--ink-2);padding:8px 10px;border:1px solid var(--line);border-radius:9px">بروزرسانی خودکار<input type="checkbox" id="setAutoRefresh" checked style="width:auto" onchange="toggleAutoRefresh()"></label>
          <label style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;text-transform:none;letter-spacing:0;font-size:13px;color:var(--ink-2);padding:8px 10px;border:1px solid var(--line);border-radius:9px">افکت صوتی<input type="checkbox" id="setSound" style="width:auto" onchange="toggleSound()"></label>
          <label style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;text-transform:none;letter-spacing:0;font-size:13px;color:var(--ink-2);padding:8px 10px;border:1px solid var(--line);border-radius:9px">ذرات پس‌زمینه<input type="checkbox" id="setParticles" checked style="width:auto" onchange="toggleParticles()"></label>
          <label style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;text-transform:none;letter-spacing:0;font-size:13px;color:var(--ink-2);padding:8px 10px;border:1px solid var(--line);border-radius:9px">انیمیشن‌ها<input type="checkbox" id="setAnimations" checked style="width:auto" onchange="toggleAnimations()"></label>
        </div>
      </div>
      <div class="card card-pad">
        <div class="section-head"><div><h2>میانبرهای کیبورد</h2><div class="sh-sub">برای دسترسی سریع</div></div></div>
        <div class="settings-grid">
          <div style="padding:8px 10px;border:1px solid var(--line);border-radius:9px;font-size:12px"><b style="color:var(--accent)">Ctrl/⌘ + K</b> — پالت دستورات</div>
          <div style="padding:8px 10px;border:1px solid var(--line);border-radius:9px;font-size:12px"><b style="color:var(--accent)">G</b> — داشبورد · <b style="color:var(--accent)">C</b> — کانفیگ‌ها</div>
          <div style="padding:8px 10px;border:1px solid var(--line);border-radius:9px;font-size:12px"><b style="color:var(--accent)">L</b> — لاگ‌ها · <b style="color:var(--accent)">B</b> — ربات</div>
          <div style="padding:8px 10px;border:1px solid var(--line);border-radius:9px;font-size:12px"><b style="color:var(--accent)">N</b> — کانفیگ جدید · <b style="color:var(--accent)">R</b> — بروزرسانی</div>
          <div style="padding:8px 10px;border:1px solid var(--line);border-radius:9px;font-size:12px"><b style="color:var(--accent)">/</b> — جستجو · <b style="color:var(--accent)">?</b> — راهنما</div>
          <div style="padding:8px 10px;border:1px solid var(--line);border-radius:9px;font-size:12px"><b style="color:var(--accent)">Esc</b> — بستن مودال‌ها</div>
        </div>
      </div>
    </div>
  </main>
</div>

<!-- Bulk action bar -->
<div class="bulk-bar" id="bulkBar">
  <span class="bb-count"><b id="bbCount">۰</b> انتخاب‌شده</span>
  <button class="btn-ghost success" onclick="bulkToggle(true)">روشن</button>
  <button class="btn-ghost warn" onclick="bulkToggle(false)">خاموش</button>
  <button class="btn-ghost" onclick="bulkResetUsage()">ریست مصرف</button>
  <button class="btn-ghost danger" onclick="bulkDelete()">حذف</button>
  <button class="btn-ghost" onclick="toggleBulkMode()">انصراف</button>
</div>

<!-- FAB group -->
<div class="fab-group">
  <button class="fab secondary" onclick="openCmdPalette()" title="پالت دستورات">${ic.cmd}</button>
  <button class="fab" onclick="openConfigModal()" title="کانفیگ جدید">${ic.plus}</button>
</div>

<!-- Toast container -->
<div id="toastWrap"></div>

<!-- Command palette -->
<div class="cmd-palette" id="cmdPalette">
  <div class="cmd-box">
    <input type="text" class="cmd-input" id="cmdInput" placeholder="دستور بنویس یا جستجو کن..." oninput="filterCmdList()" onkeydown="onCmdKey(event)">
    <div class="cmd-list" id="cmdList"></div>
  </div>
</div>

<!-- Modal: Config edit -->
<div id="configModalBg" class="modal-bg" style="display:none">
  <div class="card" style="width:100%;max-width:480px;max-height:90vh;overflow:auto">
    <div class="modal-head">
      <h3 id="modalTitle">کانفیگ جدید</h3>
      <button class="close-btn" onclick="closeConfigModal()">×</button>
    </div>
    <div class="modal-body">
      <input type="hidden" id="cfgId">
      <div style="margin-bottom:12px"><label>نام</label><input id="cfgName"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div><label>محدودیت ترافیک (GB, 0=بی‌نهایت)</label><input id="cfgTraffic" type="number" value="0"></div>
        <div><label>انقضا (روز, 0=بدون انقفا)</label><input id="cfgExpires" type="number" value="0"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div><label>محدودیت IP هم‌زمان (0=بی‌نهایت)</label><input id="cfgIpLimit" type="number" value="0"></div>
        <div><label>پورت</label><input id="cfgPort" type="number" value="443"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div><label>Fingerprint</label>
          <select id="cfgFp">
            <option value="chrome">chrome</option><option value="firefox">firefox</option>
            <option value="safari">safari</option><option value="ios">ios</option>
            <option value="android">android</option><option value="edge">edge</option>
          </select>
        </div>
        <div><label>ALPN</label><input id="cfgAlpn" value="http/1.1"></div>
      </div>
      <div style="margin-bottom:12px">
        <label>پروکسی‌های خروجی (SOCKS5 یا HTTP — اختیاری، هر خط یکی)</label>
        <textarea id="cfgProxies" dir="ltr" rows="3" placeholder="socks5://user:pass@1.2.3.4:1080" style="font-family:'JetBrains Mono',monospace"></textarea>
        <div style="display:flex;justify-content:flex-end;margin-top:6px">
          <button type="button" class="btn-ghost" onclick="openProxyPicker()">انتخاب از لیست</button>
        </div>
        <div style="font-size:11px;color:var(--ink-dim);margin-top:4px;line-height:1.6">اگر پر شود، هر اتصال خروجی این کانفیگ به‌طور تصادفی از یکی از این پروکسی‌ها رد می‌شود.</div>
      </div>
      <div style="margin-bottom:6px">
        <label>آی‌پی‌های تمیز (اختیاری)</label>
        <textarea id="cfgCleanIps" dir="ltr" rows="3" placeholder="104.16.1.1" style="font-family:'JetBrains Mono',monospace"></textarea>
        <div style="display:flex;justify-content:space-between;gap:8px;margin-top:6px;flex-wrap:wrap">
          <button type="button" class="btn-ghost" onclick="testCleanIps()" id="testIpsBtn">تست آی‌پی‌ها</button>
          <button type="button" class="btn-ghost" onclick="openCleanIpPicker()">انتخاب آی‌پی تمیز از لیست</button>
        </div>
        <div id="cleanIpsTestResult" class="mono" style="font-size:11px;margin-top:6px;display:flex;flex-direction:column;gap:3px"></div>
        <div id="autoRotateSummary" class="mono" style="font-size:11px;color:var(--accent);margin-top:6px"></div>
        <input type="hidden" id="cfgIpOperator" value="all">
        <input type="hidden" id="cfgIpCount" value="20">
        <input type="hidden" id="cfgAutoRotate" value="0">
        <input type="hidden" id="cfgRotateMinutes" value="0">
      </div>
      <div style="margin-bottom:6px">
        <label>مسدودسازی (اختیاری)</label>
        <textarea id="cfgBlocklist" dir="ltr" rows="3" placeholder="example.com" style="font-family:'JetBrains Mono',monospace"></textarea>
      </div>
      <div style="margin-bottom:6px">
        <label>لوکیشن (برای برچسب روی لینک‌ها — اختیاری)</label>
        <select id="cfgLocation" style="width:100%"></select>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn-ghost" onclick="closeConfigModal()">انصراف</button>
      <button class="btn-primary" onclick="saveConfig()">ذخیره</button>
    </div>
  </div>
</div>

<!-- Modal: Show link -->
<div id="linkModalBg" class="modal-bg" style="display:none">
  <div class="card" style="width:100%;max-width:480px;max-height:90vh;overflow:auto">
    <div class="modal-head">
      <h3>لینک اتصال</h3>
      <button class="close-btn" onclick="document.getElementById('linkModalBg').style.display='none'">×</button>
    </div>
    <div class="modal-body">
      <div id="linkCount" class="mono" style="font-size:11px;color:var(--ink-dim);margin-bottom:8px"></div>
      <textarea id="linkText" readonly style="width:100%;height:120px;font-family:'JetBrains Mono',monospace;font-size:12px"></textarea>
      <div id="qrBox"></div>
    </div>
    <div class="modal-foot">
      <button class="btn-ghost" onclick="downloadLinkTxt()">دانلود txt</button>
      <button class="btn-primary" onclick="copyLink()">کپی</button>
    </div>
  </div>
</div>

<!-- Modal: Proxy picker -->
<div id="proxyPickerBg" class="modal-bg" style="display:none">
  <div class="card" style="width:100%;max-width:440px;max-height:85vh;overflow:auto">
    <div class="modal-head"><h3>انتخاب پروکسی از لیست</h3><button class="close-btn" onclick="closeProxyPicker()">×</button></div>
    <div class="modal-body">
      <div style="margin-bottom:14px">
        <label>آدرس لیست پروکسی</label>
        <div style="display:flex;gap:8px">
          <input id="proxyListUrl" dir="ltr" placeholder="https://.../proxy_vip/{country}.txt" style="flex:1">
          <button type="button" class="btn-ghost" onclick="saveProxyListUrl()">ذخیره</button>
        </div>
      </div>
      <div style="margin-bottom:14px">
        <label>لوکیشن</label>
        <select id="proxyPickerCountry" onchange="fetchProxyList()" style="width:100%"></select>
      </div>
      <div style="display:flex;gap:8px;align-items:flex-end;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap">
        <button type="button" class="btn-primary" onclick="fetchProxyList()" id="fetchProxyListBtn">دریافت لیست</button>
        <div style="display:flex;gap:8px;align-items:flex-end">
          <div><label style="font-size:11px">تعداد</label><input id="proxyPickCount" type="number" min="1" value="20" style="width:80px"></div>
          <button type="button" class="btn-ghost" onclick="pickRandomProxies()">انتخاب تصادفی</button>
        </div>
      </div>
      <div id="proxyListStatus" class="mono" style="font-size:12px;color:var(--ink-dim);margin-bottom:8px"></div>
      <div id="proxyListRows" style="display:flex;flex-direction:column;gap:6px"></div>
    </div>
  </div>
</div>

<!-- Modal: Clean IP picker -->
<div id="cleanIpPickerBg" class="modal-bg" style="display:none">
  <div class="card" style="width:100%;max-width:440px;max-height:85vh;overflow:auto">
    <div class="modal-head"><h3>انتخاب آی‌پی تمیز از لیست</h3><button class="close-btn" onclick="closeCleanIpPicker()">×</button></div>
    <div class="modal-body">
      <div style="border-top:1px solid var(--line);padding-top:14px;margin-bottom:14px">
        <label>اسکن خودکار</label>
        <div style="font-size:11px;color:var(--ink-dim);margin-bottom:8px;line-height:1.6">فقط وقتی دامنه پشت Cloudflare باشه جواب می‌ده.</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div><label style="font-size:11px">تعداد</label><input id="scanWantInput2" type="number" value="10" min="1" max="50" style="width:100%"></div>
          <div><label style="font-size:11px">ارائه‌دهنده</label>
            <select id="scanProviderSelect2" style="width:100%"><option value="cloudflare">Cloudflare</option><option value="vercel">Vercel</option></select>
          </div>
        </div>
        <button type="button" class="btn-primary" id="scanIpsBtn2" onclick="scanCleanIpsNow2()" style="width:100%">اسکن و پیدا کردن</button>
        <div id="scanIpsStatus2" class="mono" style="font-size:11px;color:var(--ink-dim);margin-top:8px"></div>
        <div id="scanIpsResult2" style="margin-top:8px"></div>
      </div>
      <div class="divider"></div>
      <div>
        <label>انتخاب از لیست (به‌جای اسکن)</label>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <input id="cleanIpListUrl" dir="ltr" placeholder="https://.../ips.txt" style="flex:1">
          <button type="button" class="btn-ghost" onclick="saveCleanIpListUrl()">ذخیره</button>
        </div>
        <div style="display:flex;gap:8px;align-items:flex-end;margin-bottom:10px">
          <div style="flex:1"><label style="font-size:11px">گروه</label><select id="ipOperatorSelect" style="width:100%"></select></div>
          <div><label style="font-size:11px">تعداد</label><input id="ipCountInput" type="number" value="20" style="width:80px"></div>
          <button type="button" class="btn-ghost" onclick="fetchCleanIpOperators()" id="fetchCleanIpsBtn">دریافت</button>
        </div>
        <div id="cleanIpListStatus" class="mono" style="font-size:11px;color:var(--ink-dim);margin-bottom:8px"></div>
        <label style="display:flex;align-items:center;gap:8px;margin:8px 0;cursor:pointer;text-transform:none;letter-spacing:0;font-size:12px;color:var(--ink-2)"><input type="checkbox" id="autoRotateToggle" style="width:auto" onchange="toggleAutoRotateInputs()"> چرخش خودکار</label>
        <div id="autoRotateMinutesWrap" style="display:none;margin-bottom:10px"><label style="font-size:11px">هر چند دقیقه؟</label><input id="autoRotateMinutes" type="number" value="60" style="width:100%"></div>
        <button type="button" class="btn-primary" onclick="applySelectedCleanIps()" style="width:100%">اعمال</button>
      </div>
    </div>
  </div>
</div>

<!-- Modal: DM (direct message via bot) -->
<div id="dmModal" class="modal-bg" style="display:none">
  <div class="card" style="width:100%;max-width:380px">
    <div class="modal-head"><h3>پیام به <span id="dmTargetLabel" class="mono"></span></h3><button class="close-btn" onclick="closeDmModal()">×</button></div>
    <div class="modal-body">
      <textarea id="dmText" rows="4" style="width:100%;resize:vertical;font-family:'Vazirmatn',sans-serif"></textarea>
    </div>
    <div class="modal-foot">
      <button class="btn-ghost" onclick="closeDmModal()">انصراف</button>
      <button class="btn-primary" onclick="sendDm()">ارسال</button>
    </div>
    <div id="dmStatus" class="mono" style="font-size:12px;color:var(--ink-dim);margin:0 22px 16px"></div>
  </div>
</div>

<script>
// ─── STATE ──────────────────────────────────────────────────────────
let CONFIGS = [];
let LOGS = [];
let BULK_MODE = false;
let SELECTED = new Set();
let STATS = {};
let LAST_STATS = { online: 0, total_used_bytes: 0 };
let AUTO_REFRESH = true;
let SOUND_ON = false;
let PARTICLES_ON = true;
let ANIMATIONS_ON = true;
let CURRENT_PAGE = 'dashboard';
let CMD_ITEMS = [];
let CMD_ACTIVE_IDX = 0;
let ACTIVITY_TIMER = null;

// ─── SOUND (subtle UI sounds via WebAudio) ──────────────────────────
let _ac = null;
function snd(type){
  if(!SOUND_ON) return;
  try{
    if(!_ac) _ac = new (window.AudioContext||window.webkitAudioContext)();
    const o = _ac.createOscillator(), g = _ac.createGain();
    o.connect(g); g.connect(_ac.destination);
    const freqs = {ok:[660,880], err:[220,180], click:[880], toast:[760]};
    const f = freqs[type] || freqs.click;
    o.frequency.setValueAtTime(f[0], _ac.currentTime);
    if(f[1]) o.frequency.linearRampToValueAtTime(f[1], _ac.currentTime + 0.08);
    g.gain.setValueAtTime(0.06, _ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, _ac.currentTime + 0.18);
    o.start(); o.stop(_ac.currentTime + 0.2);
  }catch(e){}
}

// ─── TOAST ──────────────────────────────────────────────────────────
function toast(msg, kind){
  const wrap = document.getElementById('toastWrap');
  const el = document.createElement('div');
  el.className = 'toast ' + (kind || '');
  el.innerHTML = '<span class="t-ic">' + (kind==='ok' ? '✓' : kind==='err' ? '✕' : kind==='warn' ? '!' : '›') + '</span><span></span><span class="t-progress"></span>';
  el.querySelectorAll('span')[1].textContent = msg;
  wrap.appendChild(el);
  setTimeout(()=>{ el.classList.add('hide'); setTimeout(()=>el.remove(), 350); }, 3200);
  snd(kind === 'err' ? 'err' : (kind === 'ok' ? 'ok' : 'toast'));
}

// ─── PREFERENCES (localStorage) ─────────────────────────────────────
function loadPrefs(){
  try{
    const p = JSON.parse(localStorage.getItem('chop_prefs') || '{}');
    if(p.theme) setTheme(p.theme);
    if(p.mode) setMode(p.mode);
    if(typeof p.autoRefresh === 'boolean'){ AUTO_REFRESH = p.autoRefresh; const el=document.getElementById('setAutoRefresh'); if(el) el.checked = p.autoRefresh; }
    if(typeof p.sound === 'boolean'){ SOUND_ON = p.sound; const el=document.getElementById('setSound'); if(el) el.checked = p.sound; }
    if(typeof p.particles === 'boolean'){ PARTICLES_ON = p.particles; const el=document.getElementById('setParticles'); if(el) el.checked = p.particles; if(!p.particles){ const c=document.getElementById('particleCanvas'); if(c) c.style.display='none'; } }
    if(typeof p.animations === 'boolean'){ ANIMATIONS_ON = p.animations; const el=document.getElementById('setAnimations'); if(el) el.checked = p.animations; if(!p.animations) document.documentElement.style.setProperty('--ease','linear'); }
  }catch(e){}
}
function savePrefs(){
  try{
    localStorage.setItem('chop_prefs', JSON.stringify({
      theme: document.documentElement.getAttribute('data-theme') || 'aurora',
      mode: document.documentElement.getAttribute('data-mode') || 'dark',
      autoRefresh: AUTO_REFRESH, sound: SOUND_ON, particles: PARTICLES_ON, animations: ANIMATIONS_ON,
    }));
  }catch(e){}
}
function setTheme(name, srcEl){
  const isLight = name === 'light';
  document.documentElement.setAttribute('data-theme', isLight ? 'aurora' : name);
  document.documentElement.setAttribute('data-mode', isLight ? 'light' : 'dark');
  document.querySelectorAll('.theme-dot').forEach(d => d.classList.toggle('active', d.dataset.themeKey === name));
  const sm = document.getElementById('settingsModeSel');
  if(sm) sm.value = isLight ? 'light' : 'dark';
  savePrefs();
}
function setMode(m){
  const cur = document.documentElement.getAttribute('data-theme') || 'aurora';
  document.documentElement.setAttribute('data-mode', m);
  const sm = document.getElementById('settingsModeSel');
  if(sm) sm.value = m;
  savePrefs();
}
function toggleAutoRefresh(){ AUTO_REFRESH = document.getElementById('setAutoRefresh').checked; savePrefs(); toast(AUTO_REFRESH?'بروزرسانی خودکار روشن':'بروزرسانی خودکار خاموش', AUTO_REFRESH?'ok':'warn'); }
function toggleSound(){ SOUND_ON = document.getElementById('setSound').checked; savePrefs(); if(SOUND_ON) snd('ok'); toast(SOUND_ON?'صدا روشن':'صدا خاموش', 'ok'); }
function toggleParticles(){ PARTICLES_ON = document.getElementById('setParticles').checked; savePrefs(); const c = document.getElementById('particleCanvas'); if(c) c.style.display = PARTICLES_ON ? '' : 'none'; toast(PARTICLES_ON?'ذرات روشن':'ذرات خاموش', 'ok'); }
function toggleAnimations(){ ANIMATIONS_ON = document.getElementById('setAnimations').checked; savePrefs(); document.documentElement.style.setProperty('--ease', ANIMATIONS_ON ? 'cubic-bezier(.4,0,.2,1)' : 'linear'); toast(ANIMATIONS_ON?'انیمیشن‌ها روشن':'انیمیشن‌ها خاموش', 'ok'); }

// ─── PAGE NAVIGATION ────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard: ['داشبورد', 'نمای کلی'],
  configs:   ['کانفیگ‌ها', 'مدیریت VLESS'],
  logs:      ['لاگ اتصال‌ها', 'تاریخچه'],
  activity:  ['فعالیت زنده', 'بلادرنگ'],
  scan:      ['اسکن آی‌پی', 'پیدا کردن آی‌پی تمیز'],
  bot:       ['ربات تلگرام', 'مدیریت ربات'],
  backup:    ['بکاپ و بازیابی', 'Export / Import'],
  settings:  ['تنظیمات', 'پیکربندی پنل'],
};
function goPage(name){
  CURRENT_PAGE = name;
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === name));
  const sec = document.getElementById('page-' + name);
  if(sec) sec.classList.add('active');
  const [title, sub] = PAGE_TITLES[name] || ['', ''];
  document.getElementById('pageTitle').innerHTML = title + ' <span class="pt-sub">' + sub + '</span>';
  // page-specific loaders
  if(name === 'logs') loadLogs();
  if(name === 'bot'){ loadBotSettings(); loadBotMembers(); }
  if(name === 'activity') loadActivityLive();
  if(name === 'dashboard') loadActivityFeed();
  // close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
  snd('click');
}
function toggleSidebar(){ document.getElementById('sidebar').classList.toggle('open'); }

// ─── HELPERS ────────────────────────────────────────────────────────
function fmtBytes(n){
  if(!n) return '0 B';
  const units=['B','KB','MB','GB','TB']; let i=0; let v=n;
  while(v>=1024 && i<units.length-1){ v/=1024; i++; }
  return v.toFixed(v>=10||i===0?0:1)+' '+units[i];
}
function fmtDate(ts){ if(!ts) return '—'; return new Date(ts*1000).toLocaleString('fa-IR'); }
function fmtUptime(sec){
  if(!sec && sec!==0) return '—';
  const d = Math.floor(sec/86400), h = Math.floor(sec%86400/3600), m = Math.floor(sec%3600/60);
  return (d ? d+'d ' : '') + h+'h '+m+'m';
}
function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function cssEsc(s){ return String(s).replace(/[^a-zA-Z0-9_-]/g, m => '_'+m.charCodeAt(0)+'_'); }
function faNum(n){ return String(n||0).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]); }

// ─── API ────────────────────────────────────────────────────────────
async function api(path, opts={}){
  const res = await fetch(path, {headers:{'Content-Type':'application/json'}, ...opts});
  if(res.status===401){ location.href='/'; throw new Error('unauthorized'); }
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.detail||'خطا');
  return data;
}
async function logout(){ await api('/api/logout', {method:'POST'}); location.href='/'; }

// ─── ANIMATE NUMBER ─────────────────────────────────────────────────
function animateNum(el, target, fmt){
  const from = parseFloat(el.dataset.v || '0') || 0;
  if(from === target){ el.textContent = fmt(target); return; }
  const t0 = performance.now(), dur = ANIMATIONS_ON ? 600 : 0;
  function step(t){
    const k = Math.min(1, (t - t0)/dur);
    const eased = 1 - Math.pow(1-k, 3);
    el.textContent = fmt(from + (target-from)*eased);
    if(k < 1) requestAnimationFrame(step);
    else el.dataset.v = String(target);
  }
  if(dur === 0){ el.textContent = fmt(target); el.dataset.v = String(target); return; }
  requestAnimationFrame(step);
  el.dataset.v = String(target);
}

// ─── TRAFFIC CHART (SVG, gradient + tooltip) ────────────────────────
function renderTrafficChart(series){
  const svg = document.getElementById('trafficChart');
  if(!svg) return;
  const W = 800, H = 170, PAD = 6;
  const data = (series || []).map(s => s.bytes || 0);
  const max = Math.max(...data, 1);
  const n = data.length || 24;
  const stepX = (W - PAD*2) / Math.max(1, n-1);
  const pts = data.map((v,i) => [PAD + i*stepX, H - PAD - (v/max)*(H-PAD*2-14)]);
  let grid = '', labels = '';
  for(let g=1; g<=3; g++){
    const y = (H/4)*g;
    grid += '<line class="gridline" x1="0" y1="'+y+'" x2="'+W+'" y2="'+y+'"/>';
  }
  data.forEach((v,i)=>{
    if(i % 6 === 0){
      const d = new Date(Date.now() - (n-1-i)*3600*1000);
      labels += '<text class="axis-label" x="'+pts[i][0]+'" y="'+(H-1)+'" text-anchor="middle">'+String(d.getHours()).padStart(2,'0')+'h</text>';
    }
  });
  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#7c5cff';
  const accent2Color = getComputedStyle(document.documentElement).getPropertyValue('--accent-2').trim() || '#5eead4';
  let defs = '<defs><linearGradient id="chopChartGrad" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0%" stop-color="'+accentColor+'" stop-opacity=".55"/><stop offset="100%" stop-color="'+accentColor+'" stop-opacity="0"/>' +
    '</linearGradient><linearGradient id="chopLineGrad" x1="0" y1="0" x2="1" y2="0">' +
    '<stop offset="0%" stop-color="'+accentColor+'"/><stop offset="100%" stop-color="'+accent2Color+'"/>' +
    '</linearGradient></defs>';
  let line = '', area = '';
  if(pts.length){
    line = 'M' + pts.map(p => p[0].toFixed(1)+','+p[1].toFixed(1)).join(' L');
    area = line + ' L'+pts[pts.length-1][0].toFixed(1)+','+(H-14)+' L'+pts[0][0].toFixed(1)+','+(H-14)+' Z';
  }
  const last = pts[pts.length-1];
  const dot = last ? ('<circle cx="'+last[0]+'" cy="'+last[1]+'" r="6" fill="'+accentColor+'" opacity=".25"/>' +
    '<circle cx="'+last[0]+'" cy="'+last[1]+'" r="3" fill="'+accent2Color+'"/>') : '';
  svg.innerHTML = defs + grid + '<path class="area" fill="url(#chopChartGrad)" d="'+area+'"/><path class="line" stroke="url(#chopLineGrad)" filter="drop-shadow(0 0 5px '+accentColor+'66)" d="'+line+'"/>' + labels + dot;
  document.getElementById('chartPeak').innerHTML = 'اوج: <b style="color:var(--accent)">'+fmtBytes(max)+'</b>/h';
  const total = data.reduce((s,v)=>s+v,0);
  document.getElementById('chartTotal').innerHTML = 'جمع: <b style="color:var(--accent-2)">'+fmtBytes(total)+'</b>';

  const tip = document.getElementById('chartTip');
  const wrap = svg.parentElement;
  svg.onmousemove = (e) => {
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * W;
    let idx = Math.round((x - PAD)/stepX);
    idx = Math.max(0, Math.min(n-1, idx));
    const d = new Date(Date.now() - (n-1-idx)*3600*1000);
    tip.innerHTML = '<div class="t">'+String(d.getHours()).padStart(2,'0')+':00 — '+fmtBytes(data[idx])+'</div>';
    tip.style.display = 'block';
    const tx = Math.min(rect.width - 90, Math.max(4, (pts[idx][0]/W)*rect.width - 40));
    tip.style.left = tx + 'px';
    tip.style.top = '0px';
  };
  svg.onmouseleave = () => { tip.style.display = 'none'; };
}

// ─── STATS ──────────────────────────────────────────────────────────
async function loadStats(){
  try{
    const s = await api('/api/stats');
    STATS = s;
    const onlineDelta = (s.online||0) - (LAST_STATS.online||0);
    const trendUp = onlineDelta >= 0;
    const trafficPct = s.total_limit_bytes ? Math.min(100, (s.total_used_bytes/s.total_limit_bytes)*100) : 0;
    const reqPct = s.requests_limit ? Math.min(100, (s.requests_today/s.requests_limit)*100) : 0;
    document.getElementById('stats').innerHTML = \`
      <div class="stat">
        <div class="stat-icon">${IC_DASH_CONFIG}</div>
        <div class="stat-num" id="stCfg">0</div>
        <div class="stat-lbl">کانفیگ (\${faNum(s.active_configs||0)} فعال)</div>
        <div class="stat-bar"><i style="width:\${(s.active_configs/(s.config_count||1)*100).toFixed(0)}%"></i></div>
      </div>
      <div class="stat">
        <div class="stat-icon green">${IC_DASH_ONLINE}</div>
        <div class="stat-num" style="color:var(--online)" id="stOnline">0</div>
        <div class="stat-lbl">آنلاین هم‌اکنون</div>
        <span class="stat-trend \${trendUp?'up':'down'}" id="stTrend">\${onlineDelta!==0?(trendUp?'▲ +':'▼ ')+faNum(Math.abs(onlineDelta)):''}</span>
        <svg class="stat-spark" viewBox="0 0 100 30" preserveAspectRatio="none">\${sparkline((s.traffic_series||[]).map(x=>x.bytes), '#34e89e')}</svg>
      </div>
      <div class="stat">
        <div class="stat-icon pink">${IC_DASH_TRAFFIC}</div>
        <div class="stat-num" id="stTraffic">0</div>
        <div class="stat-lbl">ترافیک کل\${s.total_limit_bytes ? ' / '+fmtBytes(s.total_limit_bytes) : ''}</div>
        <div class="stat-bar"><i class="\${trafficPct>=90?'over':trafficPct>=70?'hot':''}" style="width:\${trafficPct.toFixed(0)}%"></i></div>
      </div>
      <div class="stat">
        <div class="stat-icon cyan">${IC_DASH_REQ}</div>
        <div class="stat-num" id="stReq">0</div>
        <div class="stat-lbl">درخواست امروز (\${faNum((reqPct).toFixed(0))}٪)</div>
        <div class="stat-bar"><i class="\${reqPct>=90?'over':reqPct>=70?'hot':''}" style="width:\${reqPct.toFixed(0)}%"></i></div>
      </div>
      <div class="stat">
        <div class="stat-icon gold">${IC_DASH_BACKEND}</div>
        <div class="stat-num" style="font-size:14px" class="mono">\${s.backend}</div>
        <div class="stat-lbl">بک‌اند · \${fmtUptime(s.uptime_sec)}</div>
      </div>
    \`;
    animateNum(document.getElementById('stCfg'), s.config_count||0, v=>faNum(Math.round(v)));
    animateNum(document.getElementById('stOnline'), s.online||0, v=>faNum(Math.round(v)));
    animateNum(document.getElementById('stTraffic'), s.total_used_bytes||0, v=>fmtBytes(v));
    animateNum(document.getElementById('stReq'), s.requests_today||0, v=>faNum(Math.round(v).toLocaleString('en-US')));
    LAST_STATS = { online: s.online||0, total_used_bytes: s.total_used_bytes||0 };
    renderRequestUsage(s);
    renderTrafficChart(s.traffic_series);
    const upEl2 = document.getElementById('sidebarUptime');
    if(upEl2) upEl2.textContent = 'UP ' + fmtUptime(s.uptime_sec);
    // nav badges
    const nc = document.getElementById('navCfgCount'); if(nc) nc.textContent = faNum(s.config_count||0);
    const no = document.getElementById('navOnlineCount'); if(no) no.textContent = faNum(s.online||0);
  }catch(e){
    // ignore stats error to keep page functional
  }
}

// sparkline SVG path
function sparkline(arr, color){
  if(!arr || !arr.length) return '';
  const max = Math.max(...arr, 1);
  const w = 100, h = 30;
  const step = w / Math.max(1, arr.length-1);
  const pts = arr.map((v,i) => (i*step).toFixed(1)+','+(h - (v/max)*h*0.9 - 2).toFixed(1));
  return '<polyline fill="none" stroke="'+(color||'#7c5cff')+'" stroke-width="1.5" points="'+pts.join(' ')+'"/>';
}

function renderRequestUsage(s){
  const used = s.requests_today || 0;
  const limit = s.requests_limit || 100000;
  const pct = Math.min(100, (used/limit)*100);
  const bar = document.getElementById('reqUsageBar');
  bar.style.width = pct.toFixed(1)+'%';
  bar.className = 'progress-bar ' + (pct >= 90 ? 'danger' : pct >= 70 ? 'warn' : '');
  document.getElementById('reqUsageText').textContent = faNum(used.toLocaleString('en-US')) + ' / ' + faNum(limit.toLocaleString('en-US')) + ' (' + pct.toFixed(1) + '%)';
  const limitInput = document.getElementById('reqLimitInput');
  if(document.activeElement !== limitInput) limitInput.value = limit;
  const hist = s.requests_history || [];
  document.getElementById('reqUsageHistory').innerHTML = hist.map(h => '<span class="tag dim" style="margin-inline-end:4px">' + h.day.slice(5) + ': ' + faNum(h.count.toLocaleString('en-US')) + '</span>').join('');
}

async function saveRequestLimit(){
  const val = parseInt(document.getElementById('reqLimitInput').value, 10);
  if(!val || val < 1) return;
  await api('/api/request-limit', {method:'POST', body: JSON.stringify({limit: val})});
  toast('سقف روزانه ذخیره شد', 'ok');
  loadStats();
}

// ─── CONFIGS ────────────────────────────────────────────────────────
async function loadConfigs(){
  let data;
  try{
    data = await api('/api/configs');
  }catch(e){
    const banner = document.getElementById('configLoadError');
    if(banner){ banner.style.display='block'; banner.textContent = 'خطا در دریافت لیست کانفیگ‌ها: ' + e.message; }
    return;
  }
  const banner = document.getElementById('configLoadError');
  if(banner) banner.style.display='none';
  CONFIGS = data.configs;
  const sel = document.getElementById('logFilter');
  sel.innerHTML = '<option value="">همه</option>' + CONFIGS.map(c=>'<option value="'+c.id+'">'+escHtml(c.name)+'</option>').join('');
  renderConfigRows();
  const nc = document.getElementById('navCfgCount'); if(nc) nc.textContent = faNum(CONFIGS.length);
}

function renderConfigRows(){
  const q = (document.getElementById('cfgSearch')?.value || '').trim().toLowerCase();
  const rows = CONFIGS.filter(c => !q || c.name.toLowerCase().includes(q) || (c.location||'').toLowerCase().includes(q) || (c.uuid||'').toLowerCase().includes(q));
  const tbody = document.getElementById('configRows');
  const bulkCol = document.getElementById('thBulk');
  if(bulkCol) bulkCol.style.display = BULK_MODE ? '' : 'none';
  if(!rows.length){
    tbody.innerHTML = '<tr><td colspan="'+(BULK_MODE?7:6)+'" style="text-align:center;padding:36px;color:var(--ink-dim)">'+(q ? 'موردی مطابق جستجو پیدا نشد' : 'هنوز کانفیگی نساختی — با دکمه‌ی «کانفیگ جدید» شروع کن')+'</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(c=>{
    const usedPct = c.traffic_limit_bytes ? Math.min(100, (c.used_bytes/c.traffic_limit_bytes)*100) : 0;
    const barCls = usedPct >= 90 ? 'over' : (usedPct >= 70 ? 'hot' : '');
    const flag = c.location ? '<span class="flag-badge">'+flagEmoji(c.location)+'</span>' : '';
    const nameHtml = escHtml(c.name);
    const bulkCell = BULK_MODE ? '<td style="width:34px"><input type="checkbox" data-id="'+c.id+'" '+(SELECTED.has(c.id)?'checked':'')+' onchange="onBulkSelect(this)" style="width:auto"></td>' : '';
    return '<tr class="'+(SELECTED.has(c.id)?'selected':'')+'">'+bulkCell+
      '<td><span class="cfg-name">'+flag+nameHtml+'</span>'+(c.traffic_limit_bytes?('<div class="cfg-usage-bar"><i class="'+barCls+'" style="width:'+usedPct.toFixed(1)+'%"></i></div>'):'')+'</td>'+
      '<td><span class="pill '+(c.enabled?'on':'off')+'">'+(c.enabled?'فعال':'غیرفعال')+'</span></td>'+
      '<td>'+(c.online>0?'<span class="pill on">'+faNum(c.online)+'</span>':'<span style="color:var(--ink-mute)">۰</span>')+'</td>'+
      '<td>'+fmtBytes(c.used_bytes)+(c.traffic_limit_bytes?' / '+fmtBytes(c.traffic_limit_bytes):'')+'</td>'+
      '<td style="font-size:11.5px">'+fmtDate(c.expires_at)+'</td>'+
      '<td style="white-space:nowrap"><div class="row-actions">'+
        '<button class="btn-ghost" onclick="showLink('+escJsonId(c.id)+')" title="لینک">لینک</button>'+
        '<button class="btn-ghost" onclick="showSub('+escJsonId(c.id)+')" title="ساب">ساب</button>'+
        '<button class="btn-ghost" onclick="editConfig('+escJsonId(c.id)+')">ویرایش</button>'+
        '<button class="btn-ghost '+(c.enabled?'warn':'success')+'" onclick="toggleConfig('+escJsonId(c.id)+', '+(!c.enabled)+')">'+(c.enabled?'خاموش':'روشن')+'</button>'+
        '<button class="btn-ghost" onclick="resetUsage('+escJsonId(c.id)+')">ریست</button>'+
        '<button class="btn-ghost" onclick="filterLogsFor('+escJsonId(c.id)+')">لاگ</button>'+
        '<button class="btn-ghost danger" onclick="deleteConfig('+escJsonId(c.id)+')">حذف</button>'+
      '</div></td></tr>';
  }).join('');
}
function escJsonId(s){ return "'"+String(s).replace(/'/g,"\\'")+"'"; }

function filterLogsFor(id){
  goPage('logs');
  document.getElementById('logFilter').value = id;
  loadLogs();
}

// ─── BULK OPERATIONS ────────────────────────────────────────────────
function toggleBulkMode(){
  BULK_MODE = !BULK_MODE;
  SELECTED.clear();
  const btn = document.getElementById('bulkModeBtn');
  btn.innerHTML = BULK_MODE ? ' بستن انتخاب گروهی' : ' انتخاب گروهی';
  document.getElementById('bulkBar').classList.toggle('show', false);
  renderConfigRows();
}
function onBulkSelect(cb){
  const id = cb.dataset.id;
  if(cb.checked) SELECTED.add(id); else SELECTED.delete(id);
  document.getElementById('bulkBar').classList.toggle('show', SELECTED.size > 0);
  document.getElementById('bbCount').textContent = faNum(SELECTED.size);
  cb.closest('tr').classList.toggle('selected', cb.checked);
}
function toggleSelectAll(cb){
  const visible = (CONFIGS.filter(c => {
    const q = (document.getElementById('cfgSearch')?.value || '').trim().toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || (c.location||'').toLowerCase().includes(q);
  }));
  visible.forEach(c => { if(cb.checked) SELECTED.add(c.id); else SELECTED.delete(c.id); });
  document.getElementById('bulkBar').classList.toggle('show', SELECTED.size > 0);
  document.getElementById('bbCount').textContent = faNum(SELECTED.size);
  renderConfigRows();
}
async function bulkToggle(enable){
  if(!SELECTED.size) return;
  if(!confirm(enable?'روشن کردن '+SELECTED.size+' کانفیگ؟':'خاموش کردن '+SELECTED.size+' کانفیگ؟')) return;
  for(const id of SELECTED){
    try{ await api('/api/configs/'+id, {method:'PATCH', body: JSON.stringify({enabled: enable})}); }catch(e){}
  }
  toast((enable?'روشن':'خاموش')+' شدند', 'ok');
  await Promise.all([loadConfigs(), loadStats()]);
}
async function bulkResetUsage(){
  if(!SELECTED.size) return;
  if(!confirm('ریست مصرف '+SELECTED.size+' کانفیگ؟')) return;
  for(const id of SELECTED){
    try{ await api('/api/configs/'+id, {method:'PATCH', body: JSON.stringify({reset_usage: true})}); }catch(e){}
  }
  toast('مصرف ریست شد', 'ok');
  await Promise.all([loadConfigs(), loadStats()]);
}
async function bulkDelete(){
  if(!SELECTED.size) return;
  if(!confirm('حذف '+SELECTED.size+' کانفیگ؟ این عمل قابل بازگشت نیست!')) return;
  for(const id of SELECTED){
    try{ await api('/api/configs/'+id, {method:'DELETE'}); }catch(e){}
  }
  toast('حذف شدند', 'ok');
  SELECTED.clear();
  document.getElementById('bulkBar').classList.remove('show');
  await Promise.all([loadConfigs(), loadStats()]);
}

// ─── CSV EXPORT ─────────────────────────────────────────────────────
function exportConfigsCsv(){
  if(!CONFIGS.length){ toast('کانفیگی نیست', 'warn'); return; }
  const rows = [['name','enabled','online','used_bytes','traffic_limit_bytes','expires_at','ip_limit','port','location','uuid','sub_url','link']];
  CONFIGS.forEach(c => {
    rows.push([c.name, c.enabled?'yes':'no', c.online||0, c.used_bytes||0, c.traffic_limit_bytes||0, c.expires_at||'', c.ip_limit||0, c.port||443, c.location||'', c.uuid, c.sub_url, c.link]);
  });
  const csv = rows.map(r => r.map(v => '"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\\n');
  const blob = new Blob(['\\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'chop-configs-'+Date.now()+'.csv';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('CSV دانلود شد', 'ok');
}

// ─── LOGS ───────────────────────────────────────────────────────────
async function loadLogs(){
  try{
    const cid = document.getElementById('logFilter').value;
    const data = await api('/api/logs'+(cid?('?config_id='+cid):''));
    LOGS = data.logs || [];
    renderLogRows();
  }catch(e){ toast('خطا در دریافت لاگ‌ها', 'err'); }
}
function renderLogRows(){
  const q = (document.getElementById('logSearch')?.value || '').trim().toLowerCase();
  const filtered = LOGS.filter(l => !q || (l.ip||'').toLowerCase().includes(q) || (l.address||'').toLowerCase().includes(q) || (l.config_name||'').toLowerCase().includes(q));
  document.getElementById('logRows').innerHTML = filtered.map(l=>
    '<tr><td class="mono" style="font-size:11px">'+fmtDate(l.ts)+'</td><td>'+escHtml(l.config_name||'')+'</td><td class="mono" dir="ltr">'+escHtml(l.ip||'')+'</td>'+
    '<td class="mono" dir="ltr">'+escHtml(l.address||'')+':'+l.port+'</td><td>'+fmtBytes(l.bytes)+'</td></tr>'
  ).join('') || '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--ink-dim)">رکوردی نیست</td></tr>';
}

// ─── ACTIVITY FEED ──────────────────────────────────────────────────
async function loadActivityFeed(){
  try{
    const data = await api('/api/logs?limit=15');
    renderActivityFeed('activityFeed', data.logs || []);
  }catch(e){
    const el = document.getElementById('activityFeed');
    if(el) el.innerHTML = '<div class="empty-state"><div class="es-title">خطا در دریافت فعالیت</div></div>';
  }
}
function renderActivityFeed(elId, logs){
  const el = document.getElementById(elId);
  if(!el) return;
  if(!logs.length){
    el.innerHTML = '<div class="empty-state"><div class="es-title">فعالیتی ثبت نشده</div><div class="es-sub">هنگام اتصال کاربران، اینجا نمایش داده می‌شود</div></div>';
    return;
  }
  el.innerHTML = logs.map(l => {
    const dotCls = l.bytes > 1000000 ? 'warn' : 'info';
    return '<div class="activity-item"><div class="ai-dot '+dotCls+'"></div><div class="ai-content"><b>'+escHtml(l.config_name||'—')+'</b> از <span class="mono" dir="ltr">'+escHtml(l.ip||'—')+'</span> به <span class="mono" dir="ltr">'+escHtml(l.address||'—')+':'+l.port+'</span> — '+fmtBytes(l.bytes)+'<div class="ai-time">'+fmtDate(l.ts)+'</div></div></div>';
  }).join('');
}

async function loadActivityLive(){
  try{
    const [logs, stats] = await Promise.all([api('/api/logs?limit=30'), api('/api/stats')]);
    renderActivityFeed('activityLiveFeed', logs.logs || []);
    // connection distribution
    const configs = await api('/api/configs');
    const dist = (configs.configs||[]).map(c => ({name: c.name, online: c.online||0, used: c.used_bytes||0})).sort((a,b)=>b.online-a.online).slice(0,8);
    const maxOnline = Math.max(...dist.map(d=>d.online), 1);
    document.getElementById('connDistBox').innerHTML = dist.map(d => 
      '<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>'+escHtml(d.name)+'</span><span class="mono">'+faNum(d.online)+'</span></div><div class="progress" style="height:6px"><div class="progress-bar" style="width:'+(d.online/maxOnline*100).toFixed(0)+'%"></div></div></div>'
    ).join('') || '<div class="empty-state"><div class="es-title">کانفیگی نیست</div></div>';
  }catch(e){
    document.getElementById('activityLiveFeed').innerHTML = '<div class="empty-state"><div class="es-title">خطا</div></div>';
  }
}

// ─── SYSTEM INFO ────────────────────────────────────────────────────
async function loadSystemInfo(){
  try{
    const data = await api('/api/system-info');
    const uptime = fmtUptime(data.uptime_sec);
    const memPct = data.mem_percent || 0;
    const loadAvg = data.load_avg || [];
    document.getElementById('systemInfoBox').innerHTML = \`
      <div style="display:flex;flex-direction:column;gap:14px">
        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px"><span>آپ‌تایم</span><span class="mono">\${uptime}</span></div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px"><span>حافظه</span><span class="mono">\${(memPct).toFixed(0)}٪</span></div>
          <div class="progress"><div class="progress-bar \${memPct>=85?'danger':memPct>=70?'warn':''}" style="width:\${memPct}%"></div></div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px"><span>بار سیستم (Load)</span><span class="mono">\${loadAvg.map(x=>x.toFixed(2)).join(' · ')||'—'}</span></div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px"><span>تعداد اتصال WS</span><span class="mono">\${faNum(data.ws_connections||0)}</span></div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px"><span>Node نسخه</span><span class="mono">\${data.node_version||'—'}</span></div>
        </div>
      </div>
    \`;
  }catch(e){
    document.getElementById('systemInfoBox').innerHTML = '<div style="color:var(--ink-dim);font-size:12px">اطلاعات سیستم در دسترس نیست</div>';
  }
}

// ─── CONFIG MODAL ───────────────────────────────────────────────────
const CHOP_COUNTRIES = [
  ["DE","آلمان"],["NL","هلند"],["FR","فرانسه"],["GB","بریتانیا"],["US","آمریکا"],["CA","کانادا"],
  ["TR","ترکیه"],["AE","امارات"],["SG","سنگاپور"],["JP","ژاپن"],["FI","فنلاند"],["SE","سوئد"],
  ["RU","روسیه"],["IN","هند"],["AU","استرالیا"],["BR","برزیل"],["ES","اسپانیا"],["IT","ایتالیا"],
  ["PL","لهستان"],["CH","سوئیس"],["UA","اوکراین"],["RO","رومانی"],["CZ","چک"],["BG","بلغارستان"],
];
function flagEmoji(cc){
  if(!cc) return '🌐';
  const up = String(cc).toUpperCase().replace(/[^A-Z]/g,'');
  if(up.length!==2) return '🌐';
  const pts = [...up].map(c=>127397+c.charCodeAt(0));
  return String.fromCodePoint.apply(null, pts);
}
function fillCountrySelect(el, mode){
  const special = mode === 'fetch' ? [["ALL","🌐 همه"]] : [["","بدون برچسب"]];
  const rows = special.concat(CHOP_COUNTRIES);
  el.innerHTML = rows.map(([code,name])=>{
    const label = code && code!=='ALL' ? (flagEmoji(code)+' '+name+' ('+code+')') : name;
    return '<option value="'+code+'">'+label+'</option>';
  }).join('');
}

function openConfigModal(){
  document.getElementById('modalTitle').textContent='کانفیگ جدید';
  document.getElementById('cfgId').value='';
  document.getElementById('cfgName').value='';
  document.getElementById('cfgTraffic').value=0;
  document.getElementById('cfgExpires').value=0;
  document.getElementById('cfgIpLimit').value=0;
  document.getElementById('cfgPort').value=443;
  document.getElementById('cfgFp').value='chrome';
  document.getElementById('cfgAlpn').value='http/1.1';
  document.getElementById('cfgProxies').value='';
  document.getElementById('cfgCleanIps').value='';
  document.getElementById('cfgBlocklist').value='';
  document.getElementById('cleanIpsTestResult').innerHTML='';
  document.getElementById('cfgIpOperator').value='all';
  document.getElementById('cfgIpCount').value='20';
  document.getElementById('cfgAutoRotate').value='0';
  document.getElementById('cfgRotateMinutes').value='0';
  updateAutoRotateSummary();
  fillCountrySelect(document.getElementById('cfgLocation'), 'location');
  document.getElementById('cfgLocation').value='';
  document.getElementById('configModalBg').style.display='flex';
  setTimeout(()=>document.getElementById('cfgName').focus(), 100);
}
function closeConfigModal(){ document.getElementById('configModalBg').style.display='none'; }

function editConfig(id){
  const c = CONFIGS.find(x=>x.id===id);
  if(!c) return;
  document.getElementById('modalTitle').textContent='ویرایش کانفیگ';
  document.getElementById('cfgId').value=c.id;
  document.getElementById('cfgName').value=c.name;
  document.getElementById('cfgTraffic').value=(c.traffic_limit_bytes/1073741824)||0;
  document.getElementById('cfgExpires').value = c.expires_at ? Math.max(1, Math.ceil((c.expires_at - Date.now()/1000)/86400)) : 0;
  document.getElementById('cfgIpLimit').value=c.ip_limit||0;
  document.getElementById('cfgPort').value=c.port||443;
  document.getElementById('cfgFp').value=c.fingerprint||'chrome';
  document.getElementById('cfgAlpn').value=c.alpn||'http/1.1';
  document.getElementById('cfgProxies').value=(c.proxies||[]).join('\\n');
  document.getElementById('cfgCleanIps').value=(c.clean_ips||[]).join('\\n');
  document.getElementById('cfgBlocklist').value=(c.blocklist||[]).join('\\n');
  document.getElementById('cleanIpsTestResult').innerHTML='';
  document.getElementById('cfgIpOperator').value=c.ip_operator||'all';
  document.getElementById('cfgIpCount').value=c.ip_count||20;
  document.getElementById('cfgAutoRotate').value=c.auto_rotate_ip?'1':'0';
  document.getElementById('cfgRotateMinutes').value=c.rotate_minutes||0;
  updateAutoRotateSummary();
  fillCountrySelect(document.getElementById('cfgLocation'), 'location');
  document.getElementById('cfgLocation').value=c.location||'';
  document.getElementById('configModalBg').style.display='flex';
}

async function testCleanIps(){
  const raw = document.getElementById('cfgCleanIps').value;
  const ips = raw.split(/[\\n,]+/).map(s=>s.trim()).filter(Boolean);
  const box = document.getElementById('cleanIpsTestResult');
  if(!ips.length){ box.innerHTML = '<div style="color:var(--ink-dim)">چیزی برای تست وارد نشده</div>'; return; }
  const btn = document.getElementById('testIpsBtn');
  btn.disabled = true; btn.textContent = 'در حال تست...';
  box.innerHTML = ips.map(ip=>'<div id="testrow-'+cssEsc(ip)+'">⏳ '+escHtml(ip)+' — در حال بررسی…</div>').join('');
  await Promise.all(ips.map(async ip=>{
    const row = document.getElementById('testrow-'+cssEsc(ip));
    try{
      const data = await api('/api/test-clean-ip', {method:'POST', body: JSON.stringify({ip})});
      if(data.ok){ row.innerHTML = '✅ '+escHtml(ip)+' — سالم ('+data.ms+'ms)'; row.style.color='var(--online)'; }
      else { row.innerHTML = '❌ '+escHtml(ip)+' — '+(data.error || ('کد '+data.status)); row.style.color='var(--danger)'; }
    }catch(e){ row.innerHTML = '❌ '+escHtml(ip)+' — خطا'; row.style.color='var(--danger)'; }
  }));
  btn.disabled = false; btn.textContent = 'تست آی‌پی‌ها';
}

// ─── PROXY PICKER ───────────────────────────────────────────────────
function openProxyPicker(){
  document.getElementById('proxyPickerBg').style.display='flex';
  document.getElementById('proxyListRows').innerHTML='';
  document.getElementById('proxyListStatus').textContent='';
  fillCountrySelect(document.getElementById('proxyPickerCountry'), 'fetch');
  const cur = document.getElementById('cfgLocation').value;
  document.getElementById('proxyPickerCountry').value = cur && cur!=='' ? cur : 'ALL';
  loadProxyListUrl();
}
function closeProxyPicker(){ document.getElementById('proxyPickerBg').style.display='none'; }

async function loadProxyListUrl(){
  try{ const data = await api('/api/proxy-list-url'); document.getElementById('proxyListUrl').value = data.url || ''; }catch(e){}
}
async function saveProxyListUrl(){
  const url = document.getElementById('proxyListUrl').value.trim();
  await api('/api/proxy-list-url', {method:'POST', body: JSON.stringify({url})});
  document.getElementById('proxyListStatus').textContent = 'ذخیره شد.';
}

async function fetchProxyList(){
  const btn = document.getElementById('fetchProxyListBtn');
  const status = document.getElementById('proxyListStatus');
  const rows = document.getElementById('proxyListRows');
  const country = document.getElementById('proxyPickerCountry').value || 'ALL';
  btn.disabled = true; btn.textContent = 'در حال دریافت...';
  rows.innerHTML = '';
  status.style.color = 'var(--ink-dim)';
  status.textContent = 'در حال دریافت لیست...';
  try{
    const data = await api('/api/proxy-list?country='+encodeURIComponent(country));
    const proxies = data.proxies || [];
    window.PROXY_LIST_CACHE = proxies;
    const flag = flagEmoji(country);
    if(!proxies.length){
      status.textContent = 'لیست خالی بود.';
    } else {
      status.innerHTML = faNum(proxies.length) + ' پروکسی ' + flag + ' پیدا شد — یکی رو انتخاب کن یا از «انتخاب تصادفی» استفاده کن:';
      rows.innerHTML = proxies.map((p, i) => {
        const safe = escHtml(p);
        return '<button type="button" class="btn-ghost mono" style="text-align:left;justify-content:flex-start;direction:ltr;width:100%" onclick="selectProxyIdx('+i+')">'+flag+' '+safe+'</button>';
      }).join('');
    }
  }catch(e){
    status.style.color = 'var(--danger)';
    status.textContent = e.message || 'خطا در دریافت لیست';
  }
  btn.disabled = false; btn.textContent = 'دریافت لیست';
}

function syncLocationFromPicker(){
  const country = document.getElementById('proxyPickerCountry').value;
  if(country && country !== 'ALL'){
    document.getElementById('cfgLocation').value = country;
  }
}

function selectProxyIdx(i){
  const p = (window.PROXY_LIST_CACHE||[])[i];
  if(!p) return;
  appendProxies([p]);
  syncLocationFromPicker();
  closeProxyPicker();
}

function pickRandomProxies(){
  const all = window.PROXY_LIST_CACHE || [];
  if(!all.length){ document.getElementById('proxyListStatus').textContent = 'اول لیست رو دریافت کن.'; return; }
  const n = Math.max(1, parseInt(document.getElementById('proxyPickCount').value || '1', 10));
  const shuffled = all.slice().sort(()=>Math.random()-0.5);
  const picked = shuffled.slice(0, Math.min(n, shuffled.length));
  appendProxies(picked);
  syncLocationFromPicker();
  document.getElementById('proxyListStatus').textContent = faNum(picked.length) + ' پروکسی اضافه شد.';
  closeProxyPicker();
}

function appendProxies(list){
  const ta = document.getElementById('cfgProxies');
  const existing = ta.value.split(/[\\n,]+/).map(s=>s.trim()).filter(Boolean);
  const merged = existing.concat(list.filter(p => existing.indexOf(p) === -1));
  ta.value = merged.join('\\n');
}

// ─── CLEAN IP PICKER ────────────────────────────────────────────────
function updateAutoRotateSummary(){
  const el = document.getElementById('autoRotateSummary');
  const on = document.getElementById('cfgAutoRotate').value==='1';
  const mins = document.getElementById('cfgRotateMinutes').value;
  el.textContent = on ? ('چرخش خودکار فعاله — هر '+mins+' دقیقه یک‌بار.') : '';
}

function openCleanIpPicker(){
  document.getElementById('cleanIpPickerBg').style.display='flex';
  document.getElementById('cleanIpListStatus').textContent='';
  document.getElementById('ipOperatorSelect').innerHTML='<option value="all">همه (توصیه‌شده)</option>';
  document.getElementById('ipCountInput').value = document.getElementById('cfgIpCount').value || 20;
  const isAuto = document.getElementById('cfgAutoRotate').value==='1';
  document.getElementById('autoRotateToggle').checked = isAuto;
  document.getElementById('autoRotateMinutes').value = document.getElementById('cfgRotateMinutes').value || 60;
  toggleAutoRotateInputs();
  loadCleanIpListUrl();
}
function closeCleanIpPicker(){ document.getElementById('cleanIpPickerBg').style.display='none'; }

function toggleAutoRotateInputs(){
  const on = document.getElementById('autoRotateToggle').checked;
  document.getElementById('autoRotateMinutesWrap').style.display = on ? '' : 'none';
}

// Scan from clean IP picker modal
async function scanCleanIpsNow2(){
  const btn = document.getElementById('scanIpsBtn2');
  const status = document.getElementById('scanIpsStatus2');
  const box = document.getElementById('scanIpsResult2');
  let want = parseInt(document.getElementById('scanWantInput2').value, 10);
  if(isNaN(want) || want < 1) want = 10;
  const provider = document.getElementById('scanProviderSelect2').value === 'vercel' ? 'vercel' : 'cloudflare';
  btn.disabled = true; btn.textContent = 'در حال اسکن...';
  status.style.color = 'var(--ink-dim)';
  status.textContent = 'در حال تست آی‌پی‌ها...';
  box.innerHTML = '';
  window.SCANNED_CLEAN_IPS = [];
  try{
    const data = await api('/api/scan-clean-ips', {method:'POST', body: JSON.stringify({want, provider})});
    const found = data.found || [];
    window.SCANNED_CLEAN_IPS = found.map(r=>r.ip);
    status.style.color = found.length ? 'var(--online)' : 'var(--danger)';
    status.textContent = found.length ? (faNum(found.length) + ' آی‌پی سالم از ' + faNum(data.tested) + ' تست پیدا شد.') : ('هیچ‌کدوم از ' + faNum(data.tested) + ' آی‌پی جواب ندادن.');
    box.innerHTML = found.map(r => '<div style="display:flex;justify-content:space-between;padding:4px 0"><span class="mono">'+escHtml(r.ip)+'</span><span style="color:var(--online)">'+r.ms+'ms</span></div>').join('');
    if(found.length){
      const applyBtn = document.createElement('button');
      applyBtn.className = 'btn-ghost success';
      applyBtn.style.marginTop = '8px';
      applyBtn.textContent = 'استفاده از این آی‌پی‌ها';
      applyBtn.onclick = applyScannedCleanIps;
      box.appendChild(applyBtn);
    }
  }catch(e){
    status.style.color = 'var(--danger)';
    status.textContent = e.message || 'خطا در اسکن';
  }
  btn.disabled = false; btn.textContent = 'اسکن و پیدا کردن';
}

// Scan from scan page
async function scanCleanIpsNow(){
  const btn = document.getElementById('scanIpsBtn');
  const status = document.getElementById('scanIpsStatus');
  const box = document.getElementById('scanIpsResult');
  let want = parseInt(document.getElementById('scanWantInput').value, 10);
  if(isNaN(want) || want < 1) want = 10;
  const provider = document.getElementById('scanProviderSelect').value === 'vercel' ? 'vercel' : 'cloudflare';
  btn.disabled = true; btn.textContent = 'در حال اسکن...';
  status.style.color = 'var(--ink-dim)';
  status.textContent = provider === 'vercel' ? 'در حال تست آی‌پی‌های Vercel...' : 'در حال تست آی‌پی‌های Cloudflare...';
  box.innerHTML = '';
  window.SCANNED_CLEAN_IPS = [];
  try{
    const data = await api('/api/scan-clean-ips', {method:'POST', body: JSON.stringify({want, provider})});
    const found = data.found || [];
    window.SCANNED_CLEAN_IPS = found.map(r=>r.ip);
    status.style.color = found.length ? 'var(--online)' : 'var(--danger)';
    status.textContent = found.length ? (faNum(found.length) + ' آی‌پی سالم از ' + faNum(data.tested) + ' تست پیدا شد.') : ('هیچ‌کدوم از ' + faNum(data.tested) + ' آی‌پی جواب ندادن. اگه دامنه‌ت پشت Cloudflare نیست، این روش جواب نمی‌ده.');
    box.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;margin-top:8px">' + found.map(r => '<div class="card card-pad" style="padding:10px 12px;display:flex;justify-content:space-between;align-items:center"><span class="mono" style="font-size:11.5px">'+escHtml(r.ip)+'</span><span class="tag green">'+r.ms+'ms</span></div>').join('') + '</div>';
    if(found.length){
      const applyRow = document.createElement('div');
      applyRow.style.cssText = 'margin-top:12px;display:flex;gap:8px;flex-wrap:wrap';
      applyRow.innerHTML = '<button class="btn-primary" onclick="copyScannedIps()">کپی همه</button><button class="btn-ghost" onclick="openConfigModal()">افزودن به کانفیگ جدید</button>';
      box.appendChild(applyRow);
    }
  }catch(e){
    status.style.color = 'var(--danger)';
    status.textContent = e.message || 'خطا در اسکن';
  }
  btn.disabled = false; btn.textContent = 'اسکن و پیدا کردن';
}
function copyScannedIps(){
  const ips = window.SCANNED_CLEAN_IPS || [];
  if(!ips.length) return;
  const text = ips.join('\\n');
  navigator.clipboard.writeText(text).then(()=>toast('کپی شد', 'ok')).catch(()=>toast('کپی نشد', 'err'));
}
function applyScannedCleanIps(){
  const ips = window.SCANNED_CLEAN_IPS || [];
  if(!ips.length) return;
  document.getElementById('cfgCleanIps').value = ips.join('\\n');
  document.getElementById('cfgIpCount').value = ips.length;
  closeCleanIpPicker();
  toast(faNum(ips.length)+' آی‌پی اضافه شد', 'ok');
}

async function loadCleanIpListUrl(){
  try{ const data = await api('/api/clean-ip-list-url'); document.getElementById('cleanIpListUrl').value = data.url || ''; }catch(e){}
}
async function saveCleanIpListUrl(){
  const url = document.getElementById('cleanIpListUrl').value.trim();
  await api('/api/clean-ip-list-url', {method:'POST', body: JSON.stringify({url})});
  document.getElementById('cleanIpListStatus').textContent = 'ذخیره شد.';
}

async function fetchCleanIpOperators(){
  const btn = document.getElementById('fetchCleanIpsBtn');
  const status = document.getElementById('cleanIpListStatus');
  const sel = document.getElementById('ipOperatorSelect');
  const prevValue = sel.value;
  btn.disabled = true; btn.textContent = 'در حال دریافت...';
  status.style.color = 'var(--ink-dim)';
  status.textContent = 'در حال دریافت لیست...';
  try{
    const data = await api('/api/clean-ip-list');
    const operators = data.operators || {};
    window.CLEAN_IP_OPERATORS = operators;
    const keys = Object.keys(operators);
    sel.innerHTML = '<option value="all">همه (توصیه‌شده)</option>' + keys.map(k=>'<option value="'+escHtml(k)+'">'+escHtml(k)+'</option>').join('');
    sel.value = keys.indexOf(prevValue) !== -1 || prevValue==='all' ? prevValue : 'all';
    const total = keys.reduce((s,k)=>s+operators[k].length,0);
    status.textContent = faNum(keys.length) + ' گروه، ' + faNum(total) + ' آی‌پی پیدا شد.';
  }catch(e){
    status.style.color = 'var(--danger)';
    status.textContent = e.message || 'خطا در دریافت لیست';
  }
  btn.disabled = false; btn.textContent = 'دریافت لیست';
}

function applySelectedCleanIps(){
  const operators = window.CLEAN_IP_OPERATORS || {};
  const operator = document.getElementById('ipOperatorSelect').value;
  let count = parseInt(document.getElementById('ipCountInput').value, 10);
  if(isNaN(count) || count < 1) count = 10;
  let pool = [];
  if(operator === 'all'){
    Object.values(operators).forEach(ips => { pool = pool.concat(ips); });
  } else {
    pool = operators[operator] || [];
  }
  pool = [...new Set(pool)];
  if(!pool.length){
    document.getElementById('cleanIpListStatus').textContent = 'اول لیست رو دریافت کن.';
    return;
  }
  let selected;
  if(count >= pool.length){ selected = pool; }
  else {
    const shuffled = pool.slice();
    for(let i=shuffled.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]; }
    selected = shuffled.slice(0, count);
  }
  document.getElementById('cfgCleanIps').value = selected.join('\\n');
  document.getElementById('cfgIpOperator').value = operator;
  document.getElementById('cfgIpCount').value = count;
  const isAuto = document.getElementById('autoRotateToggle').checked;
  document.getElementById('cfgAutoRotate').value = isAuto ? '1' : '0';
  document.getElementById('cfgRotateMinutes').value = document.getElementById('autoRotateMinutes').value || 0;
  updateAutoRotateSummary();
  closeCleanIpPicker();
  toast(faNum(selected.length)+' آی‌پی اعمال شد', 'ok');
}

async function saveConfig(){
  const id = document.getElementById('cfgId').value;
  const body = {
    name: document.getElementById('cfgName').value,
    traffic_limit_gb: parseFloat(document.getElementById('cfgTraffic').value||0),
    expires_days: parseInt(document.getElementById('cfgExpires').value||0),
    ip_limit: parseInt(document.getElementById('cfgIpLimit').value||0),
    port: parseInt(document.getElementById('cfgPort').value||443),
    fingerprint: document.getElementById('cfgFp').value,
    alpn: document.getElementById('cfgAlpn').value,
    proxies: document.getElementById('cfgProxies').value,
    clean_ips: document.getElementById('cfgCleanIps').value,
    location: document.getElementById('cfgLocation').value,
    ip_operator: document.getElementById('cfgIpOperator').value,
    ip_count: parseInt(document.getElementById('cfgIpCount').value||20),
    auto_rotate_ip: document.getElementById('cfgAutoRotate').value==='1',
    rotate_minutes: parseInt(document.getElementById('cfgRotateMinutes').value||0),
    blocklist: document.getElementById('cfgBlocklist').value,
  };
  try{
    if(id){
      await api('/api/configs/'+id, {method:'PATCH', body: JSON.stringify(body)});
    } else {
      await api('/api/configs', {method:'POST', body: JSON.stringify(body)});
    }
    toast(id ? 'کانفیگ به‌روزرسانی شد' : 'کانفیگ ساخته شد', 'ok');
    closeConfigModal();
    await Promise.all([loadConfigs(), loadStats()]);
  }catch(e){ toast(e.message, 'err'); }
}

async function toggleConfig(id, enabled){
  await api('/api/configs/'+id, {method:'PATCH', body: JSON.stringify({enabled})});
  toast(enabled ? 'کانفیگ روشن شد' : 'کانفیگ خاموش شد', 'ok');
  loadConfigs();
}
async function resetUsage(id){
  if(!confirm('ریست مصرف این کانفیگ؟')) return;
  await api('/api/configs/'+id, {method:'PATCH', body: JSON.stringify({reset_usage:true})});
  toast('مصرف ریست شد', 'ok');
  loadConfigs(); loadStats();
}
async function deleteConfig(id){
  if(!confirm('این کانفیگ حذف شود؟')) return;
  await api('/api/configs/'+id, {method:'DELETE'});
  toast('کانفیگ حذف شد', 'ok');
  loadConfigs(); loadStats();
}

// ─── QR & LINK ──────────────────────────────────────────────────────
function renderQr(text){
  const box = document.getElementById('qrBox');
  if(!box) return;
  box.innerHTML = '';
  if(!text || text.length > 2000 || typeof qrcode === 'undefined'){ box.style.display = 'none'; return; }
  try{
    box.style.display = 'flex';
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    const svgTag = qr.createSvgTag({ cellSize: 4, margin: 4, scalable: true });
    box.innerHTML = svgTag;
    const svgEl = box.querySelector('svg');
    if(svgEl){ svgEl.style.width = '180px'; svgEl.style.height = '180px'; svgEl.removeAttribute('width'); svgEl.removeAttribute('height'); svgEl.style.background='#fff'; svgEl.style.borderRadius='8px'; }
  }catch(e){ box.style.display = 'none'; }
}

function showLink(id){
  const c = CONFIGS.find(x=>x.id===id);
  if(!c) return;
  const links = (c.links && c.links.length ? c.links : [c.link]);
  document.getElementById('linkText').value = links.join('\\n\\n');
  document.getElementById('linkCount').textContent = links.length>1 ? (faNum(links.length)+' لینک (به ازای هر آی‌پی تمیز، یک لینک)') : '';
  renderQr(links[0]);
  document.getElementById('linkModalBg').style.display='flex';
}
function showSub(id){
  const c = CONFIGS.find(x=>x.id===id);
  if(!c) return;
  document.getElementById('linkText').value = c.sub_url;
  const n = (c.clean_ips && c.clean_ips.length) ? c.clean_ips.length : 1;
  document.getElementById('linkCount').textContent = 'لینک سابسکریپشن — شامل '+faNum(n)+' کانفیگ.';
  renderQr(c.sub_url);
  document.getElementById('linkModalBg').style.display='flex';
}
function downloadLinkTxt(){
  const t = document.getElementById('linkText').value;
  if(!t) return;
  const blob = new Blob([t], {type:'text/plain;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'chop-link.txt';
  a.click();
  URL.revokeObjectURL(a.href);
}
async function copyLink(){
  const t = document.getElementById('linkText').value;
  if(!t) return;
  let ok = false;
  try{ await navigator.clipboard.writeText(t); ok = true; }catch{
    const ta = document.getElementById('linkText'); ta.select();
    try{ ok = document.execCommand('copy'); }catch{ ok = false; }
  }
  toast(ok ? 'کپی شد' : 'کپی نشد', ok ? 'ok' : 'err');
}

// ─── BOT ────────────────────────────────────────────────────────────
async function loadBotSettings(){
  try{
    const s = await api('/api/bot/settings');
    document.getElementById('botEnabled').checked = s.enabled;
    document.getElementById('botToken').placeholder = s.token_masked || '123456:ABC-...';
    document.getElementById('botStatus').textContent = s.webhook_url ? ('Webhook: ' + s.webhook_url) : '';
    document.getElementById('adminList').innerHTML = s.admins.map(a=>
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--line)"><span class="mono">'+escHtml(a.id)+'</span><button class="btn-ghost danger" onclick="removeBotAdmin(\\''+a.id+'\\')">حذف</button></div>'
    ).join('') || '<div style="color:var(--ink-dim);padding:8px 0">ادمینی ثبت نشده</div>';
  }catch(e){}
}
async function saveBotSettings(){
  const token = document.getElementById('botToken').value.trim();
  const enabled = document.getElementById('botEnabled').checked;
  try{
    await api('/api/bot/settings', {method:'POST', body: JSON.stringify({token, enabled})});
    toast('تنظیمات ذخیره شد', 'ok');
    loadBotSettings();
  }catch(e){ toast(e.message, 'err'); }
}
async function addBotAdmin(){
  const id = document.getElementById('newAdminId').value.trim();
  if(!id) return;
  try{
    await api('/api/bot/admins', {method:'POST', body: JSON.stringify({id})});
    document.getElementById('newAdminId').value='';
    toast('ادمین اضافه شد', 'ok');
    loadBotSettings();
  }catch(e){ toast(e.message, 'err'); }
}
async function removeBotAdmin(id){
  if(!confirm('حذف ادمین؟')) return;
  await api('/api/bot/admins/'+id, {method:'DELETE'});
  toast('حذف شد', 'ok');
  loadBotSettings();
}

function timeAgoFa(ts){
  if(!ts) return '—';
  const diff = Date.now()/1000 - ts;
  if(diff < 60) return 'همین الان';
  if(diff < 3600) return faNum(Math.floor(diff/60)) + ' دقیقه پیش';
  if(diff < 86400) return faNum(Math.floor(diff/3600)) + ' ساعت پیش';
  return faNum(Math.floor(diff/86400)) + ' روز پیش';
}
async function loadBotMembers(){
  try{
    const data = await api('/api/bot/members');
    const members = data.members || [];
    document.getElementById('memberCount').textContent = 'اعضای ثبت‌شده: ' + faNum(members.length);
    document.getElementById('memberRows').innerHTML = members.map(m=>
      '<tr><td>'+escHtml(m.first_name||'—')+'</td><td class="mono">'+(m.username ? '@'+escHtml(m.username) : '—')+'</td><td class="mono">'+escHtml(m.id)+'</td><td class="mono" style="color:var(--ink-dim)">'+timeAgoFa(m.last_seen)+'</td><td><button class="btn-ghost" onclick="openDmModal(\\''+m.id+'\\', \\''+escHtml(m.first_name||m.id).replace(/'/g,"\\\\'")+'\\')">پیام</button></td></tr>'
    ).join('') || '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--ink-dim)">هنوز عضوی نداری</td></tr>';
  }catch(e){}
}
async function sendBroadcast(){
  const text = document.getElementById('broadcastText').value.trim();
  const target = document.getElementById('broadcastTarget').value;
  const status = document.getElementById('broadcastStatus');
  const btn = document.getElementById('broadcastBtn');
  if(!text){ status.style.color='var(--danger)'; status.textContent='متن پیام رو بنویس'; return; }
  if(!confirm('ارسال به «'+(target==='all'?'همه‌ی اعضا':'فقط ادمین‌ها')+'»؟')) return;
  btn.disabled = true; btn.textContent = 'در حال ارسال...';
  status.style.color = 'var(--ink-dim)'; status.textContent = 'در حال ارسال...';
  try{
    const data = await api('/api/bot/broadcast', {method:'POST', body: JSON.stringify({text, target})});
    status.style.color = 'var(--online)';
    status.textContent = faNum(data.sent) + ' نفر دریافت کردن، ' + faNum(data.failed) + ' ناموفق' + (data.removed?(' ('+faNum(data.removed)+' نفر بلاک کرده بودن)'):'') + '.';
    document.getElementById('broadcastText').value='';
    if(data.removed) loadBotMembers();
    toast('ارسال شد', 'ok');
  }catch(e){ status.style.color='var(--danger)'; status.textContent = e.message; toast('خطا در ارسال', 'err'); }
  finally{ btn.disabled=false; btn.textContent='ارسال'; }
}
let dmTargetId = null;
function openDmModal(id, label){
  dmTargetId = id;
  document.getElementById('dmTargetLabel').textContent = label;
  document.getElementById('dmText').value = '';
  document.getElementById('dmStatus').textContent = '';
  document.getElementById('dmModal').style.display = 'flex';
}
function closeDmModal(){ document.getElementById('dmModal').style.display = 'none'; dmTargetId = null; }
async function sendDm(){
  const text = document.getElementById('dmText').value.trim();
  const status = document.getElementById('dmStatus');
  if(!text || !dmTargetId) return;
  status.style.color = 'var(--ink-dim)'; status.textContent = 'در حال ارسال...';
  try{
    const data = await api('/api/bot/broadcast', {method:'POST', body: JSON.stringify({text, target:[dmTargetId]})});
    if(data.sent > 0){ closeDmModal(); toast('ارسال شد', 'ok'); }
    else { status.style.color='var(--danger)'; status.textContent = 'ارسال نشد — احتمالاً کاربر ربات رو بلاک کرده.'; loadBotMembers(); }
  }catch(e){ status.style.color='var(--danger)'; status.textContent = e.message; }
}

// ─── BACKUP ─────────────────────────────────────────────────────────
async function doRestore(){
  const file = document.getElementById('restoreFile').files[0];
  const status = document.getElementById('restoreStatus');
  if(!file){ status.textContent='یک فایل انتخاب کنید'; return; }
  const mode = document.querySelector('input[name=mode]:checked').value;
  try{
    const text = await file.text();
    const backup = JSON.parse(text);
    status.style.color='var(--ink-dim)'; status.textContent = 'در حال بازیابی...';
    const data = await api('/api/backup/restore', {method:'POST', body: JSON.stringify({backup, mode})});
    status.style.color='var(--online)';
    status.textContent = 'انجام شد: '+faNum(data.counters.configs)+' کانفیگ، '+faNum(data.counters.admins)+' ادمین، '+faNum(data.counters.members)+' عضو';
    toast('بازیابی انجام شد', 'ok');
    loadConfigs(); loadStats();
  }catch(e){ status.style.color='var(--danger)'; status.textContent = e.message; toast('خطا در بازیابی', 'err'); }
}

// ─── COMMAND PALETTE ────────────────────────────────────────────────
function buildCmdItems(){
  CMD_ITEMS = [
    {ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>', name:'رفتن به داشبورد', key:'G', action:()=>goPage('dashboard')},
    {ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>', name:'رفتن به کانفیگ‌ها', key:'C', action:()=>goPage('configs')},
    {ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/></svg>', name:'رفتن به لاگ‌ها', key:'L', action:()=>goPage('logs')},
    {ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>', name:'فعالیت زنده', key:'', action:()=>goPage('activity')},
    {ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/></svg>', name:'رفتن به ربات تلگرام', key:'B', action:()=>goPage('bot')},
    {ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/></svg>', name:'اسکن آی‌پی تمیز', key:'', action:()=>goPage('scan')},
    {ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/></svg>', name:'بکاپ و بازیابی', key:'', action:()=>goPage('backup')},
    {ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9"/></svg>', name:'تنظیمات', key:'', action:()=>goPage('settings')},
    {ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>', name:'کانفیگ جدید', key:'N', action:()=>openConfigModal()},
    {ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/></svg>', name:'بروزرسانی همه', key:'R', action:()=>refreshAll()},
    {ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>', name:'انتخاب گروهی کانفیگ‌ها', key:'', action:()=>{goPage('configs'); setTimeout(()=>toggleBulkMode(),200);}},
    {ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/></svg>', name:'دانلود بکاپ', key:'', action:()=>location.href='/api/backup'},
    {ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></svg>', name:'خروجی CSV', key:'', action:()=>exportConfigsCsv()},
    {ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>', name:'خروج از پنل', key:'', action:()=>logout()},
  ];
}
function openCmdPalette(){
  document.getElementById('cmdPalette').classList.add('show');
  const inp = document.getElementById('cmdInput');
  inp.value = ''; inp.focus();
  renderCmdList('');
}
function closeCmdPalette(){ document.getElementById('cmdPalette').classList.remove('show'); }
function renderCmdList(q){
  q = (q||'').trim().toLowerCase();
  const items = CMD_ITEMS.filter(c => !q || c.name.toLowerCase().includes(q));
  CMD_ACTIVE_IDX = 0;
  const list = document.getElementById('cmdList');
  list.innerHTML = items.map((c,i)=>
    '<div class="cmd-item '+(i===0?'active':'')+'" data-idx="'+i+'" onclick="execCmd('+i+')"><span class="ci-ic">'+c.ic+'</span><span>'+c.name+'</span>'+(c.key?'<span class="ci-key">'+c.key+'</span>':'')+'</div>'
  ).join('') || '<div class="cmd-item" style="opacity:.6">موردی پیدا نشد</div>';
  list._filtered = items;
}
function filterCmdList(){ renderCmdList(document.getElementById('cmdInput').value); }
function execCmd(i){
  const items = document.getElementById('cmdList')._filtered || [];
  const item = items[i]; if(!item) return;
  closeCmdPalette();
  item.action();
}
function onCmdKey(e){
  const list = document.getElementById('cmdList');
  const items = list._filtered || [];
  if(e.key === 'ArrowDown'){ e.preventDefault(); CMD_ACTIVE_IDX = Math.min(items.length-1, CMD_ACTIVE_IDX+1); updateCmdActive(); }
  else if(e.key === 'ArrowUp'){ e.preventDefault(); CMD_ACTIVE_IDX = Math.max(0, CMD_ACTIVE_IDX-1); updateCmdActive(); }
  else if(e.key === 'Enter'){ e.preventDefault(); execCmd(CMD_ACTIVE_IDX); }
  else if(e.key === 'Escape'){ closeCmdPalette(); }
}
function updateCmdActive(){
  document.querySelectorAll('#cmdList .cmd-item').forEach((el,i)=>el.classList.toggle('active', i===CMD_ACTIVE_IDX));
  const active = document.querySelector('#cmdList .cmd-item.active');
  if(active) active.scrollIntoView({block:'nearest'});
}

// ─── GLOBAL SEARCH ──────────────────────────────────────────────────
function onGlobalSearch(v){
  // route to configs page and filter
  if(!v) return;
  goPage('configs');
  const cfgSearch = document.getElementById('cfgSearch');
  if(cfgSearch){ cfgSearch.value = v; renderConfigRows(); }
}
function onSearchKey(e){
  if(e.key === 'Enter'){
    const v = e.target.value;
    if(v) onGlobalSearch(v);
  }
}

// ─── KEYBOARD SHORTCUTS ─────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  // Ignore shortcuts when typing in inputs
  const tag = (e.target.tagName || '').toLowerCase();
  const inInput = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
  
  // Ctrl/Cmd + K — command palette
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){
    e.preventDefault();
    openCmdPalette();
    return;
  }
  if(e.key === 'Escape'){
    // close any open modal
    document.querySelectorAll('.modal-bg').forEach(m => { if(m.style.display === 'flex' || m.style.display === '') m.style.display = 'none'; });
    closeCmdPalette();
    return;
  }
  if(inInput) return;
  
  const k = e.key.toLowerCase();
  if(k === 'g') goPage('dashboard');
  else if(k === 'c') goPage('configs');
  else if(k === 'l') goPage('logs');
  else if(k === 'b') goPage('bot');
  else if(k === 'a') goPage('activity');
  else if(k === 's') goPage('scan');
  else if(k === 'n'){ e.preventDefault(); openConfigModal(); }
  else if(k === 'r') refreshAll();
  else if(k === '/'){ e.preventDefault(); document.getElementById('globalSearch').focus(); }
  else if(k === '?'){ goPage('settings'); }
});

// ─── PARTICLE BACKGROUND ────────────────────────────────────────────
(function(){
  const c = document.getElementById('particleCanvas');
  if(!c || !c.getContext) return;
  const ctx = c.getContext('2d');
  let w=0,h=0,particles=[],mouse={x:-1000,y:-1000};
  function resize(){ w=c.width=innerWidth; h=c.height=innerHeight; particles=[]; const n=Math.min(50,Math.floor(w*h/28000)); for(let i=0;i<n;i++) particles.push({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,r:Math.random()*1.6+.3,c:['124,92,255','94,234,212','255,110,199','92,200,255'][Math.floor(Math.random()*4)]}); }
  function frame(){
    ctx.clearRect(0,0,w,h);
    if(!PARTICLES_ON) { requestAnimationFrame(frame); return; }
    for(const p of particles){
      // mouse attraction
      const dx = mouse.x - p.x, dy = mouse.y - p.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if(dist < 140){ p.vx += dx/dist * 0.02; p.vy += dy/dist * 0.02; }
      p.vx *= 0.99; p.vy *= 0.99;
      p.x += p.vx; p.y += p.vy;
      if(p.x<0||p.x>w) p.vx*=-1;
      if(p.y<0||p.y>h) p.vy*=-1;
      ctx.fillStyle = 'rgba('+p.c+',0.55)';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
    }
    // connections
    for(let i=0;i<particles.length;i++){
      for(let j=i+1;j<particles.length;j++){
        const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d<120){ ctx.strokeStyle='rgba(124,92,255,'+(1-d/120)*.18+')'; ctx.lineWidth=.5; ctx.beginPath(); ctx.moveTo(particles[i].x,particles[i].y); ctx.lineTo(particles[j].x,particles[j].y); ctx.stroke(); }
      }
    }
    if(!document.hidden) requestAnimationFrame(frame);
  }
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', (e)=>{ mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mouseleave', ()=>{ mouse.x = -1000; mouse.y = -1000; });
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){ resize(); frame(); }
})();

// ─── CLOCK ──────────────────────────────────────────────────────────
function tickClock(){
  const n = new Date();
  const p = x => String(x).padStart(2,'0');
  const up = document.getElementById('sidebarUptime');
  // we already update uptime from stats; only refresh if stats not yet loaded
}

// ─── REFRESH ALL ────────────────────────────────────────────────────
function refreshAll(){
  loadStats(); loadConfigs();
  if(CURRENT_PAGE === 'logs') loadLogs();
  if(CURRENT_PAGE === 'dashboard') loadActivityFeed();
  if(CURRENT_PAGE === 'activity') loadActivityLive();
  if(CURRENT_PAGE === 'bot'){ loadBotSettings(); loadBotMembers(); }
  loadSystemInfo();
  snd('click');
}

// ─── AUTO REFRESH ───────────────────────────────────────────────────
setInterval(()=>{
  if(!document.hidden && AUTO_REFRESH){
    loadStats().catch(()=>{});
    loadConfigs().catch(()=>{});
    if(CURRENT_PAGE === 'dashboard') loadActivityFeed().catch(()=>{});
    if(CURRENT_PAGE === 'activity') loadActivityLive().catch(()=>{});
  }
}, 20000);
document.addEventListener('visibilitychange', ()=>{
  if(!document.hidden && AUTO_REFRESH){
    loadStats().catch(()=>{});
    loadConfigs().catch(()=>{});
  }
});

// ─── INIT ───────────────────────────────────────────────────────────
loadPrefs();
buildCmdItems();
loadStats();
loadConfigs();
loadActivityFeed();
loadSystemInfo();
setInterval(loadSystemInfo, 30000);

// Click outside to close modals
document.addEventListener('click', (e)=>{
  if(e.target.classList && e.target.classList.contains('modal-bg')){
    e.target.style.display = 'none';
  }
  if(e.target.id === 'cmdPalette'){
    closeCmdPalette();
  }
});
</script>
</body>
</html>`;
}
