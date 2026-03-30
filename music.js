// ============================================================
// music.js — Moon Story 音乐模块
// 用法：主文件引入后调用 MusicModule.open() / MusicModule.close()
// ============================================================
const MusicModule = (() => {

  // ── 注入 CSS（全部 scope 在 #music-root 下）──
  const _injectCSS = () => {
    if (document.getElementById('music-module-style')) return;
    const style = document.createElement('style');
    style.id = 'music-module-style';
    style.textContent = `
      #music-root {
        --ms-bg: #030305;
        --ms-text-main: #f4f4f5;
        --ms-text-sub: #888890;
        --ms-accent: #d4d4d8;
        --ms-border: rgba(255,255,255,0.15);
        --ms-glass: rgba(10,10,15,0.75);
        --ms-font-en: 'Cinzel', serif;
        --ms-font-zh: 'Noto Sans SC', sans-serif;

        position: fixed; inset: 0; z-index: 1000;
        background: var(--ms-bg);
        color: var(--ms-text-main);
        font-family: var(--ms-font-zh);
        overflow: hidden;
        transform: translateY(100%);
        transition: transform 0.45s cubic-bezier(0.19,1,0.22,1);
      }
      #music-root.ms-open { transform: translateY(0); }

      #music-root * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
      #music-root ::-webkit-scrollbar { display: none; }

      /* 噪点 */
      #ms-noise { position: absolute; inset: 0; pointer-events: none; z-index: 9999; opacity: 0.04;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }

      /* 星空画布 */
      #ms-canvas { position: absolute; inset: 0; z-index: 0; pointer-events: none; }

      /* 关闭按钮 */
      #ms-close-btn {
        position: fixed; top: calc(env(safe-area-inset-top, 0px) + 14px); left: 20px;
        z-index: 10001; color: rgba(255,255,255,0.5); font-size: 1.6rem; cursor: pointer;
        padding: 6px; transition: color 0.2s;
      }
      #ms-close-btn:active { color: #fff; }

      /* view 切换 */
      #music-root .ms-view {
        position: absolute; inset: 0; overflow-y: auto; padding-bottom: 120px;
        opacity: 0; pointer-events: none; transition: opacity 0.5s ease; z-index: 10;
      }
      #music-root .ms-view.active { opacity: 1; pointer-events: auto; }

      /* 通用字体 */
      #music-root .ms-title-en { font-family: var(--ms-font-en); font-size: 2rem; letter-spacing: 4px; font-weight: 400; text-transform: uppercase; }
      #music-root .ms-text-light { color: var(--ms-text-sub); font-size: 0.85rem; font-weight: 300; }

      /* header */
      #music-root .ms-header { display:flex; align-items:center; justify-content:space-between; padding:25px; position:sticky; top:0;
        background: linear-gradient(to bottom,rgba(3,3,5,1) 0%,rgba(3,3,5,0) 100%); z-index:20; }
      #music-root .ms-back-btn { font-size:1.5rem; color:var(--ms-text-main); cursor:pointer; }
      #music-root .ms-icon-btn { font-size:1.4rem; color:var(--ms-text-main); cursor:pointer; transition:color 0.3s; padding:5px; }
      #music-root .ms-icon-btn:active { color:var(--ms-text-sub); }

      /* input / select */
      #music-root input[type="text"],
      #music-root input[type="password"] {
        background:transparent; border:none; border-bottom:1px solid var(--ms-border);
        color:var(--ms-text-main); padding:12px 0; font-family:var(--ms-font-zh);
        outline:none; width:100%; transition:border-color 0.3s; font-size:1rem;
      }
      #music-root input:focus { border-bottom-color: var(--ms-accent); }
      #music-root input::placeholder { color:rgba(255,255,255,0.2); font-weight:300; }
      #music-root .ms-btn-ghost {
        background:transparent; border:1px solid var(--ms-border); color:var(--ms-text-main);
        padding:12px 24px; border-radius:30px; font-family:var(--ms-font-zh); font-weight:300;
        letter-spacing:1px; cursor:pointer; transition:all 0.3s; backdrop-filter:blur(5px);
      }
      #music-root .ms-btn-ghost:active { background:rgba(255,255,255,0.1); }

      /* ── 本地 Hub ── */
      #ms-local-view { padding:0; }
      #music-root .ms-local-top-bar { display:flex; justify-content:space-between; align-items:center; padding:calc(env(safe-area-inset-top,0px) + 35px) 25px 20px; position:sticky; top:0; z-index:20; background:linear-gradient(to bottom,rgba(3,3,5,1) 30%,rgba(3,3,5,0) 100%); }
      #music-root .ms-local-top-bar .ms-title-en { font-size:1.5rem; letter-spacing:3px; }
      #music-root .ms-top-bar-actions { display:flex; gap:15px; }
      #music-root .ms-local-page-title { padding:10px 25px 30px; }
      #music-root .ms-local-page-title h2 { font-family:var(--ms-font-en); font-size:2.2rem; font-weight:400; color:#fff; letter-spacing:2px; line-height:1.2; }
      #music-root .ms-local-page-title p { color:var(--ms-text-sub); font-size:0.85rem; margin-top:8px; letter-spacing:2px; text-transform:uppercase; font-family:var(--ms-font-en); }
      #ms-local-pl-render { padding:0 25px; display:flex; flex-direction:column; gap:20px; }

      /* 画册风歌单卡片 */
      #music-root .ms-art-card { display:flex; align-items:stretch; gap:20px; padding:15px 0; border-bottom:1px solid rgba(255,255,255,0.06); cursor:pointer; transition:background 0.3s; }
      #music-root .ms-art-card:active { background:rgba(255,255,255,0.02); }
      #music-root .ms-art-cover-wrap { position:relative; width:110px; height:110px; flex-shrink:0; border:1px solid rgba(255,255,255,0.1); border-radius:4px; overflow:hidden; }
      #music-root .ms-art-cover { width:100%; height:100%; background-size:cover; background-position:center; filter:grayscale(20%); transition:filter 0.4s,transform 0.4s; }
      #music-root .ms-art-card:hover .ms-art-cover { filter:grayscale(0%); transform:scale(1.05); }
      #music-root .ms-art-edit-btn { position:absolute; bottom:5px; right:5px; background:rgba(0,0,0,0.7); width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.9rem; backdrop-filter:blur(2px); }
      #music-root .ms-art-edit-btn:active { background:#fff; color:#000; }
      #music-root .ms-art-info { flex:1; display:flex; flex-direction:column; justify-content:space-between; padding:2px 0; }
      #music-root .ms-art-top { display:flex; justify-content:space-between; align-items:flex-start; }
      #music-root .ms-art-num { font-family:var(--ms-font-en); font-size:0.9rem; color:rgba(255,255,255,0.3); font-weight:700; }
      #music-root .ms-art-title-en { font-family:var(--ms-font-en); font-size:1.4rem; letter-spacing:2px; font-weight:400; line-height:1.1; margin-top:5px; color:#fff; }
      #music-root .ms-art-bottom { display:flex; justify-content:space-between; align-items:flex-end; }
      #music-root .ms-art-title-zh { font-size:0.8rem; color:var(--ms-text-sub); letter-spacing:1px; font-weight:300; }
      #music-root .ms-art-count { font-family:var(--ms-font-en); font-size:0.75rem; color:var(--ms-text-main); border-bottom:1px solid rgba(255,255,255,0.3); padding-bottom:2px; letter-spacing:1px; }

      /* ── API 连接页 ── */
      #ms-api-login-view { display:flex; flex-direction:column; justify-content:center; padding:40px 30px; }
      #music-root .ms-api-login-box { text-align:center; animation:ms-fadeUp 0.6s ease forwards; }
      #music-root .ms-api-input-wrap { position:relative; margin:40px 0 30px; }
      #music-root .ms-api-input-wrap i { position:absolute; left:0; top:50%; transform:translateY(-50%); color:var(--ms-text-sub); font-size:1.2rem; }
      #music-root .ms-api-input-wrap input { padding-left:35px; }

      /* ── 登录页 ── */
      #music-root .ms-login-tabs { display:flex; justify-content:center; gap:25px; margin-bottom:40px; }
      #music-root .ms-login-tab { color:var(--ms-text-sub); font-size:0.9rem; cursor:pointer; transition:color 0.3s; position:relative; padding-bottom:5px; }
      #music-root .ms-login-tab.active { color:var(--ms-text-main); }
      #music-root .ms-login-tab.active::after { content:''; position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:15px; height:2px; background:var(--ms-text-main); border-radius:2px; }
      #music-root .ms-login-panel { display:none; flex-direction:column; gap:25px; align-items:center; }
      #music-root .ms-login-panel.active { display:flex; animation:ms-fadeUp 0.5s ease forwards; }
      #music-root .ms-qr-box { width:160px; height:160px; background:rgba(255,255,255,0.03); border:1px solid var(--ms-border); display:flex; align-items:center; justify-content:center; border-radius:15px; position:relative; overflow:hidden; }
      #music-root .ms-qr-img { width:85%; height:85%; background:repeating-linear-gradient(45deg,rgba(255,255,255,0.4) 0,rgba(255,255,255,0.4) 2px,transparent 2px,transparent 5px); }

      /* ── 主页 ── */
      #ms-home-view { padding:40px 0; }
      #music-root .ms-user-profile { display:flex; align-items:center; justify-content:space-between; padding:0 25px; margin-bottom:35px; }
      #music-root .ms-user-info { display:flex; align-items:center; gap:15px; }
      #music-root .ms-avatar { width:45px; height:45px; border-radius:50%; background-color:#333; background-size:cover; background-position:center; border:1px solid rgba(255,255,255,0.2); }
      #music-root .ms-greeting { font-size:1.1rem; font-weight:300; }
      #music-root .ms-header-actions { display:flex; gap:15px; }
      #music-root .ms-home-grid { padding:0 25px 40px; display:flex; flex-direction:column; gap:15px; }
      #music-root .ms-grid-card { position:relative; border-radius:16px; overflow:hidden; cursor:pointer; border:1px solid rgba(255,255,255,0.08); box-shadow:0 8px 25px rgba(0,0,0,0.5); background-size:cover; background-position:center; transition:transform 0.2s; }
      #music-root .ms-grid-card:active { transform:scale(0.97); }
      #music-root .ms-card-overlay { position:absolute; inset:0; background:linear-gradient(135deg,rgba(15,15,20,0.85) 0%,rgba(15,15,20,0.4) 50%,rgba(15,15,20,0.8) 100%); backdrop-filter:blur(2px); z-index:1; pointer-events:none; }
      #music-root .ms-card-content { position:relative; z-index:2; padding:22px; display:flex; flex-direction:column; height:100%; justify-content:space-between; }
      #music-root .ms-card-icon-top { align-self:flex-end; font-size:1.5rem; color:rgba(255,255,255,0.4); }
      #music-root .ms-card-text { margin-top:auto; }
      #music-root .ms-card-title-en { font-family:var(--ms-font-en); font-size:1.5rem; letter-spacing:2px; margin-bottom:4px; color:var(--ms-text-main); text-shadow:0 2px 10px rgba(0,0,0,0.8); }
      #music-root .ms-card-title-zh { font-size:0.85rem; color:#a0a0a5; font-weight:300; letter-spacing:1px; }
      #music-root .ms-card-main { height:180px; }
      #music-root .ms-card-sub-group { display:flex; gap:15px; }
      #music-root .ms-card-sub { flex:1; height:150px; }
      #music-root .ms-card-sub .ms-card-title-en { font-size:1.1rem; letter-spacing:1px; }

      /* ── 歌单列表 ── */
      #ms-playlists-view,#ms-songlist-view,#ms-search-view { padding:0; }
      #music-root .ms-pl-list { padding:0 20px; display:flex; flex-direction:column; gap:20px; }
      #music-root .ms-pl-card { display:flex; align-items:center; gap:15px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer; }
      #music-root .ms-pl-cover { width:65px; height:65px; border-radius:12px; background-color:#222; background-size:cover; background-position:center; border:1px solid rgba(255,255,255,0.1); flex-shrink:0; }
      #music-root .ms-pl-info { flex:1; }
      #music-root .ms-pl-name { font-size:1.05rem; margin-bottom:6px; letter-spacing:1px; }

      /* ── 歌曲列表页 ── */
      #music-root .ms-sl-header { width:100%; height:35vh; background-size:cover; background-position:center; position:relative; display:flex; flex-direction:column; justify-content:flex-end; padding:30px 25px; }
      #music-root .ms-sl-header::after { content:''; position:absolute; inset:0; background:linear-gradient(to bottom,transparent 0%,var(--ms-bg) 100%); pointer-events:none; }
      #music-root .ms-sl-top-bar { position:absolute; top:25px; left:25px; right:25px; z-index:10; display:flex; justify-content:space-between; align-items:center; }
      #music-root .ms-sl-title-box { position:relative; z-index:2; margin-bottom:10px; }
      #music-root .ms-sl-title { font-size:2.2rem; font-family:var(--ms-font-en); margin-bottom:8px; text-shadow:0 2px 15px rgba(0,0,0,0.9); }
      #music-root .ms-song-list { padding:10px 25px; }
      #music-root .ms-song-item { display:flex; align-items:center; padding:16px 0; border-bottom:1px solid rgba(255,255,255,0.03); cursor:pointer; }
      #music-root .ms-song-index { width:35px; font-family:var(--ms-font-en); color:rgba(255,255,255,0.3); font-size:1rem; }
      #music-root .ms-song-info { flex:1; overflow:hidden; }
      #music-root .ms-song-name { font-size:1.05rem; margin-bottom:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:400; }
      #music-root .ms-song-artist { font-size:0.8rem; color:var(--ms-text-sub); }
      #music-root .ms-song-item.playing .ms-song-name { color:#fff; text-shadow:0 0 8px rgba(255,255,255,0.5); }
      #music-root .ms-song-item.playing .ms-song-index { color:#fff; }

      /* ── 搜索 ── */
      #music-root .ms-search-box { position:relative; margin:20px 25px; }
      #music-root .ms-search-icon { position:absolute; left:0; top:50%; transform:translateY(-50%); color:var(--ms-text-sub); font-size:1.2rem; }
      #music-root .ms-search-box input { padding-left:35px; font-size:1.1rem; border-bottom:2px solid rgba(255,255,255,0.2); }

      /* ── 弹窗 ── */
      #music-root .ms-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:10100; opacity:0; pointer-events:none; transition:opacity 0.3s; }
      #music-root .ms-modal-overlay.active { opacity:1; pointer-events:auto; }
      #music-root .ms-modal-content { background:rgba(15,15,20,0.9); width:85%; padding:30px; border-radius:20px; border:1px solid var(--ms-border); box-shadow:0 0 40px rgba(0,0,0,0.8); position:relative; }
      #music-root .ms-modal-title { margin-bottom:25px; font-weight:400; text-align:center; letter-spacing:2px; }
      #music-root .ms-upload-area { border:1px dashed var(--ms-border); padding:20px; text-align:center; border-radius:10px; margin-bottom:20px; color:var(--ms-text-sub); font-size:0.95rem; cursor:pointer; transition:background 0.2s; }
      #music-root .ms-upload-area:active { background:rgba(255,255,255,0.05); }
      #music-root .ms-modal-actions { display:flex; justify-content:space-between; margin-top:30px; }
      #music-root .ms-modal-btn { padding:10px 25px; border-radius:25px; border:1px solid var(--ms-border); background:transparent; color:#fff; cursor:pointer; }

      /* ── 上传工作台 ── */
      #music-root .ms-action-sheet { position:absolute; bottom:-100%; left:0; width:100%; background:rgba(15,15,20,0.95); backdrop-filter:blur(20px); border-top-left-radius:20px; border-top-right-radius:20px; padding:25px 25px 40px; transition:bottom 0.4s cubic-bezier(0.2,0.8,0.2,1); border-top:1px solid rgba(255,255,255,0.1); box-shadow:0 -10px 40px rgba(0,0,0,0.5); }
      #music-root .ms-modal-overlay.active .ms-action-sheet { bottom:0; }
      #music-root .ms-sheet-btn { flex:1; padding:12px; border-radius:10px; border:1px dashed rgba(255,255,255,0.2); text-align:center; color:var(--ms-text-main); font-size:0.95rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; background:rgba(255,255,255,0.02); }
      #music-root .ms-sheet-btn:active { background:rgba(255,255,255,0.08); }
      #ms-pending-list { max-height:180px; overflow-y:auto; margin:15px 0; border-radius:10px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.05); }
      #music-root .ms-pending-item { display:flex; align-items:center; justify-content:space-between; padding:12px 15px; border-bottom:1px solid rgba(255,255,255,0.03); }
      #music-root .ms-pending-item:last-child { border-bottom:none; }
      #music-root .ms-pending-name { font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px; }
      #music-root .ms-pending-type { font-size:0.7rem; color:var(--ms-text-sub); font-family:var(--ms-font-en); background:rgba(255,255,255,0.1); padding:3px 6px; border-radius:4px; margin-right:10px; }
      #music-root .ms-pending-del { color:rgba(255,255,255,0.4); cursor:pointer; font-size:1.2rem; }
      #music-root .ms-pending-del:active { color:#ff6b6b; }
      #music-root .ms-sheet-confirm { width:100%; padding:16px; border-radius:30px; background:var(--ms-text-main); color:var(--ms-bg); font-weight:500; font-size:1.05rem; border:none; cursor:pointer; letter-spacing:2px; margin-top:10px; }
      #music-root .ms-sheet-confirm:active { transform:scale(0.98); }

      /* ── 迷你播放器 ── */
      #ms-mini-player {
        position:absolute; bottom:-90px; left:15px; right:15px; height:65px;
        background:var(--ms-glass); backdrop-filter:blur(15px); -webkit-backdrop-filter:blur(15px);
        border:1px solid var(--ms-border); border-radius:35px; display:flex; align-items:center;
        padding:0 15px 0 10px; z-index:40; transition:bottom 0.5s cubic-bezier(0.2,0.8,0.2,1);
        cursor:pointer; box-shadow:0 10px 30px rgba(0,0,0,0.5);
      }
      #ms-mini-player.visible { bottom:20px; }
      #music-root .ms-mp-cover { width:45px; height:45px; border-radius:50%; background-color:#333; background-size:cover; margin-right:15px; border:1px solid rgba(255,255,255,0.2); animation:ms-rotateCover 12s linear infinite; animation-play-state:paused; }
      #music-root .ms-mp-cover.spinning { animation-play-state:running; }
      #music-root .ms-mp-info { flex:1; overflow:hidden; display:flex; flex-direction:column; justify-content:center; }
      #music-root .ms-mp-title { font-size:0.95rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:3px; font-weight:400; }
      #music-root .ms-mp-artist { font-size:0.75rem; color:var(--ms-text-sub); }
      #music-root .ms-mp-controls { display:flex; align-items:center; gap:12px; color:var(--ms-text-main); font-size:1.8rem; padding-right:5px; }
      #music-root .ms-mp-btn { cursor:pointer; transition:transform 0.2s; }
      #music-root .ms-mp-btn:active { transform:scale(0.9); }
      #music-root .ms-mp-btn.play-pause { font-size:2.2rem; }

      /* ── 全屏播放器 ── */
      #ms-full-player {
        position:absolute; top:100%; left:0; width:100%; height:100%;
        background:rgba(3,3,5,0.85); backdrop-filter:blur(25px); -webkit-backdrop-filter:blur(25px);
        z-index:50; transition:top 0.5s cubic-bezier(0.2,0.8,0.2,1);
        display:flex; flex-direction:column; padding:25px 20px;
      }
      #ms-full-player.expanded { top:0; }
      #music-root .ms-fp-header { display:flex; justify-content:space-between; align-items:center; padding:10px 0; }
      #music-root .ms-fp-header i { font-size:1.6rem; cursor:pointer; padding:10px; }
      #music-root .ms-fp-title-area { text-align:center; }
      #music-root .ms-fp-source { font-size:0.65rem; color:var(--ms-text-sub); letter-spacing:2px; text-transform:uppercase; margin-bottom:4px; }
      #music-root .ms-fp-art-wrap { flex:1; display:flex; align-items:center; justify-content:center; margin-top:2vh; }
      #music-root .ms-fp-art { width:280px; height:280px; border-radius:50%; background-size:cover; background-position:center; box-shadow:0 0 50px rgba(255,255,255,0.08),inset 0 0 30px rgba(0,0,0,0.6); animation:ms-rotateCover 25s linear infinite; animation-play-state:paused; position:relative; border:1px solid rgba(255,255,255,0.1); }
      #music-root .ms-fp-art::before { content:''; position:absolute; inset:-2px; border-radius:50%; background:radial-gradient(circle at 30% 30%,rgba(255,255,255,0.15),transparent 60%); pointer-events:none; }
      #music-root .ms-fp-art.spinning { animation-play-state:running; }
      #music-root .ms-fp-info { margin-bottom:25px; text-align:center; }
      #music-root .ms-fp-song-title { font-size:1.8rem; font-family:var(--ms-font-en); margin-bottom:8px; text-shadow:0 0 10px rgba(255,255,255,0.2); }
      #music-root .ms-fp-song-artist { font-size:0.95rem; color:var(--ms-text-sub); font-weight:300; }
      #music-root .ms-fp-lyrics { height:70px; overflow:hidden; text-align:center; margin-bottom:30px; position:relative; }
      #music-root .ms-lyric-line { font-size:0.9rem; transition:all 0.4s ease; position:absolute; width:100%; top:25px; opacity:0; color:rgba(255,255,255,0.4); font-weight:300; }
      #music-root .ms-lyric-line.active { color:#fff; font-size:1.05rem; opacity:1; transform:translateY(0); text-shadow:0 0 8px rgba(255,255,255,0.3); }
      #music-root .ms-lyric-line.prev { transform:translateY(-25px); opacity:0; }
      #music-root .ms-lyric-line.next { transform:translateY(25px); opacity:0; }

      /* 进度条 */
      #music-root .ms-progress-wrap { display:flex; align-items:center; gap:15px; margin-bottom:40px; font-size:0.75rem; color:var(--ms-text-sub); font-family:'Cinzel',monospace; }
      #music-root .ms-progress-bar-wrap { flex:1; position:relative; height:24px; display:flex; align-items:center; }
      #music-root input[type="range"] { -webkit-appearance:none; width:100%; background:transparent; height:100%; position:absolute; z-index:3; margin:0; outline:none; }
      #music-root input[type="range"]::-webkit-slider-thumb { -webkit-appearance:none; width:14px; height:14px; background:#fff; border-radius:50%; box-shadow:0 0 10px rgba(255,255,255,1); cursor:pointer; }
      #music-root input[type="range"]:active::-webkit-slider-thumb { transform:scale(1.3); }
      #music-root .ms-progress-track { position:absolute; width:100%; height:3px; background:rgba(255,255,255,0.1); border-radius:2px; z-index:1; }
      #music-root .ms-progress-fill { position:absolute; height:3px; border-radius:2px; z-index:2; width:0%; background:linear-gradient(90deg,rgba(255,255,255,0.3) 0%,rgba(255,255,255,1) 50%,rgba(255,255,255,0.3) 100%); background-size:200% 100%; box-shadow:0 0 8px rgba(255,255,255,0.6); animation:ms-flowLight 2s linear infinite; }

      /* 控制按钮 */
      #music-root .ms-fp-controls { display:flex; align-items:center; justify-content:space-between; padding:0 10px 30px; }
      #music-root .ms-ctrl-icon { font-size:1.6rem; color:var(--ms-text-sub); cursor:pointer; transition:all 0.2s; padding:10px; }
      #music-root .ms-ctrl-icon:active { color:var(--ms-text-main); transform:scale(0.9); }
      #music-root .ms-ctrl-icon.active { color:var(--ms-text-main); text-shadow:0 0 10px rgba(255,255,255,0.5); }
      #music-root .ms-ctrl-main { display:flex; align-items:center; gap:20px; }
      #music-root .ms-ctrl-play { font-size:3.8rem; color:var(--ms-text-main); text-shadow:0 0 20px rgba(255,255,255,0.2); }
      #music-root .ms-ctrl-step { font-size:2.5rem; color:var(--ms-text-main); }

      /* 动画 */
      @keyframes ms-rotateCover { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes ms-fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      @keyframes ms-fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      @keyframes ms-flowLight { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
      #music-root .ms-fade-in { animation:ms-fadeIn 0.6s ease forwards; opacity:0; }
    `;
    document.head.appendChild(style);
  };

  // ── 注入 HTML ──
  const _injectHTML = () => {
    if (document.getElementById('music-root')) return;
    const root = document.createElement('div');
    root.id = 'music-root';
    root.innerHTML = `
      <div id="ms-noise"></div>
      <div id="ms-canvas"></div>
      <i class="ph ph-caret-down" id="ms-close-btn"></i>
      <audio id="ms-audio" preload="metadata" style="display:none"></audio>
      <input type="file" id="ms-file-img" accept="image/*" style="display:none">
      <input type="file" id="ms-file-music" accept="audio/*" multiple style="display:none">
      <input type="file" id="ms-file-lrc" accept=".lrc,.txt" multiple style="display:none">

      <!-- 本地 Hub -->
      <div id="ms-local-view" class="ms-view active">
        <div class="ms-local-top-bar">
          <div class="ms-title-en" style="font-size:1.5rem;letter-spacing:3px;">Moon</div>
          <div class="ms-top-bar-actions">
            <i class="ph ph-plus ms-icon-btn" id="ms-btn-create-pl" title="新建故事"></i>
            <i class="ph ph-link ms-icon-btn" id="ms-btn-go-api" title="云端连接"></i>
          </div>
        </div>
        <div class="ms-local-page-title ms-fade-in">
          <h2>LOCAL<br>SPACE</h2>
          <p>独立星空 • 你的私人音乐库</p>
        </div>
        <div id="ms-local-pl-render" class="ms-fade-in" style="animation-delay:0.1s;"></div>
      </div>

      <!-- API 连接页 -->
      <div id="ms-api-login-view" class="ms-view">
        <div class="ms-header">
          <i class="ph ph-caret-left ms-back-btn" id="ms-btn-api-back"></i>
        </div>
        <div class="ms-api-login-box">
          <i class="ph ph-planet" style="font-size:3.5rem;color:var(--ms-text-sub);margin-bottom:20px;"></i>
          <h2 class="ms-title-en" style="margin-bottom:10px;font-size:1.8rem;">CLOUD CONNECT</h2>
          <p class="ms-text-light" style="margin-bottom:20px;">连接网易云，同步你的音乐宇宙</p>
          <div class="ms-api-input-wrap">
            <i class="ph ph-globe"></i>
            <input type="text" id="ms-api-url-input" placeholder="输入 API 地址，如 https://api.example.com" value="https://api-enhanced-phi.vercel.app">
          </div>
          <button class="ms-btn-ghost" style="width:100%;margin-bottom:25px;padding:15px;font-size:1.05rem;" id="ms-btn-connect-api">确 认 连 接</button>
        </div>
      </div>

      <!-- 账号登录页 -->
      <div id="ms-login-view" class="ms-view">
        <div class="ms-header">
          <i class="ph ph-caret-left ms-back-btn" id="ms-btn-login-back"></i>
        </div>
        <div style="display:flex;flex-direction:column;justify-content:center;padding:0 30px;height:80vh;">
          <div class="ms-title-en" style="margin-bottom:50px;font-size:2.5rem;text-shadow:0 0 20px rgba(255,255,255,0.2);text-align:center;">Moon<br>Story</div>
          <div class="ms-login-tabs">
            <div class="ms-login-tab active" data-tab="qr">扫码登录</div>
            <div class="ms-login-tab" data-tab="pwd">密码登录</div>
            <div class="ms-login-tab" data-tab="code">验证码</div>
          </div>
          <div id="ms-login-qr" class="ms-login-panel active">
            <div class="ms-qr-box">
              <img id="ms-qr-img" style="width:85%;height:85%;display:block;" src="" alt="">
              <div id="ms-qr-loading" style="position:absolute;inset:0;background:rgba(0,0,0,0.6);border-radius:15px;display:flex;align-items:center;justify-content:center;">
                <i class="ph ph-spinner" style="font-size:24px;color:#fff;animation:ms-spin 1s linear infinite;"></i>
              </div>
            </div>
            <p class="ms-text-light" id="ms-qr-status" style="letter-spacing:1px;">等待扫码</p>
            <button class="ms-btn-ghost" style="padding:8px 20px;font-size:0.8rem;" id="ms-btn-refresh-qr">刷新二维码</button>
          </div>
          <div id="ms-login-pwd" class="ms-login-panel">
            <input type="text" id="ms-pwd-phone" placeholder="输入手机号">
            <input type="password" id="ms-pwd-pass" placeholder="输入密码">
            <button class="ms-btn-ghost" style="width:100%;margin-top:20px;" id="ms-btn-pwd-login">登 录</button>
          </div>
          <div id="ms-login-code" class="ms-login-panel">
            <input type="text" id="ms-code-phone" placeholder="输入手机号">
            <div style="display:flex;width:100%;gap:15px;align-items:flex-end;">
              <input type="text" id="ms-code-val" placeholder="验证码" style="flex:1;">
              <button class="ms-btn-ghost" style="padding:10px 15px;font-size:0.8rem;white-space:nowrap;border-radius:10px;" id="ms-btn-send-code">获取</button>
            </div>
            <button class="ms-btn-ghost" style="width:100%;margin-top:20px;" id="ms-btn-code-login">登 录</button>
          </div>
        </div>
      </div>

      <!-- 主页 -->
      <div id="ms-home-view" class="ms-view">
        <div class="ms-user-profile">
          <div class="ms-user-info">
            <div class="ms-avatar" id="ms-user-avatar"></div>
            <div>
              <div class="ms-text-light" style="font-size:0.65rem;letter-spacing:1px;">CLOUD CONNECTED</div>
              <div class="ms-greeting ms-title-en" style="font-size:1.1rem;" id="ms-user-name">—</div>
            </div>
          </div>
          <div class="ms-header-actions">
            <i class="ph ph-sign-out ms-icon-btn" id="ms-btn-logout" title="退出登录"></i>
          </div>
        </div>
        <div class="ms-home-grid">
          <div class="ms-grid-card ms-card-main" id="ms-card-playlist" style="background-image:url('https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80');">
            <div class="ms-card-overlay"></div>
            <div class="ms-card-content">
              <i class="ph ph-vinyl-record ms-card-icon-top"></i>
              <div class="ms-card-text">
                <div class="ms-card-title-en">MY PLAYLISTS</div>
                <div class="ms-card-title-zh">我的歌单</div>
              </div>
            </div>
          </div>
          <div class="ms-card-sub-group">
            <div class="ms-grid-card ms-card-sub" id="ms-card-daily" style="background-image:url('https://images.unsplash.com/photo-1532767153582-b1a0e5145009?auto=format&fit=crop&w=600&q=80');">
              <div class="ms-card-overlay"></div>
              <div class="ms-card-content">
                <i class="ph ph-moon ms-card-icon-top"></i>
                <div class="ms-card-text">
                  <div class="ms-card-title-en">DAILY<br>ECHO</div>
                  <div class="ms-card-title-zh">每日推荐</div>
                </div>
              </div>
            </div>
            <div class="ms-grid-card ms-card-sub" id="ms-card-search" style="background-image:url('https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&w=600&q=80');" onclick="MusicModule._navTo('ms-search-view')">
              <div class="ms-card-overlay"></div>
              <div class="ms-card-content">
                <i class="ph ph-magnifying-glass ms-card-icon-top"></i>
                <div class="ms-card-text">
                  <div class="ms-card-title-en">SEEK<br>STARS</div>
                  <div class="ms-card-title-zh">搜索</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 歌单列表页 -->
      <div id="ms-playlists-view" class="ms-view">
        <div class="ms-header">
          <i class="ph ph-caret-left ms-back-btn" id="ms-btn-pl-back"></i>
          <span class="ms-title-en" style="font-size:1.2rem;">Playlists</span>
          <div style="width:24px;"></div>
        </div>
        <div class="ms-pl-list" id="ms-pl-list-render"></div>
      </div>

      <!-- 歌曲列表页 -->
      <div id="ms-songlist-view" class="ms-view">
        <div class="ms-sl-header" id="ms-sl-header-bg">
          <div class="ms-sl-top-bar">
            <i class="ph ph-caret-left ms-back-btn" id="ms-btn-sl-back" style="text-shadow:0 2px 4px rgba(0,0,0,0.8);"></i>
            <i class="ph ph-upload-simple ms-icon-btn" id="ms-sl-upload-btn" style="text-shadow:0 2px 4px rgba(0,0,0,0.8);display:none;"></i>
          </div>
          <div class="ms-sl-title-box">
            <h2 class="ms-sl-title" id="ms-sl-title">标题</h2>
            <div class="ms-text-light" id="ms-sl-desc" style="color:rgba(255,255,255,0.7);">描述</div>
          </div>
        </div>
        <div class="ms-song-list" id="ms-song-list-render"></div>
      </div>

      <!-- 搜索页 -->
      <div id="ms-search-view" class="ms-view">
        <div class="ms-header">
          <i class="ph ph-caret-left ms-back-btn" id="ms-btn-search-back"></i>
          <span class="ms-title-en" style="font-size:1.2rem;">Search</span>
          <div style="width:24px;"></div>
        </div>
        <div class="ms-search-box">
          <i class="ph ph-magnifying-glass ms-search-icon"></i>
          <input type="text" id="ms-search-input" placeholder="输入歌名或歌手...">
        </div>
        <div class="ms-song-list" id="ms-search-results"></div>
      </div>

      <!-- 迷你播放器 -->
      <div id="ms-mini-player">
        <div class="ms-mp-cover" id="ms-mp-cover"></div>
        <div class="ms-mp-info">
          <div class="ms-mp-title" id="ms-mp-title">未播放</div>
          <div class="ms-mp-artist" id="ms-mp-artist">—</div>
        </div>
        <div class="ms-mp-controls" id="ms-mp-controls">
          <i class="ph ph-skip-back-circle ms-mp-btn" id="ms-mp-prev"></i>
          <i class="ph ph-play-circle ms-mp-btn play-pause" id="ms-mp-play"></i>
          <i class="ph ph-skip-forward-circle ms-mp-btn" id="ms-mp-next"></i>
        </div>
      </div>

      <!-- 全屏播放器 -->
      <div id="ms-full-player">
        <div class="ms-fp-header">
          <i class="ph ph-caret-down ms-ctrl-icon" id="ms-fp-close"></i>
          <div class="ms-fp-title-area">
            <div class="ms-fp-source">PLAYING NOW</div>
            <div class="ms-text-light" id="ms-fp-pl-name" style="font-size:0.8rem;color:#fff;"></div>
          </div>
          <i class="ph ph-dots-three ms-ctrl-icon"></i>
        </div>
        <div class="ms-fp-art-wrap">
          <div class="ms-fp-art" id="ms-fp-art"></div>
        </div>
        <div class="ms-fp-info">
          <div class="ms-fp-song-title" id="ms-fp-title">Title</div>
          <div class="ms-fp-song-artist" id="ms-fp-artist">Artist</div>
        </div>
        <div class="ms-fp-lyrics">
          <div class="ms-lyric-line prev" id="ms-lyric-prev"></div>
          <div class="ms-lyric-line active" id="ms-lyric-curr">纯音乐</div>
          <div class="ms-lyric-line next" id="ms-lyric-next"></div>
        </div>
        <div class="ms-progress-wrap">
          <span id="ms-time-current">00:00</span>
          <div class="ms-progress-bar-wrap">
            <div class="ms-progress-track"></div>
            <div class="ms-progress-fill" id="ms-progress-fill"></div>
            <input type="range" id="ms-progress-bar" value="0" min="0" max="100" step="0.1">
          </div>
          <span id="ms-time-total">00:00</span>
        </div>
        <div class="ms-fp-controls">
          <i class="ph ph-repeat ms-ctrl-icon" id="ms-mode-btn"></i>
          <div class="ms-ctrl-main">
            <i class="ph ph-skip-back-circle ms-ctrl-icon ms-ctrl-step" id="ms-fp-prev"></i>
            <i class="ph ph-play-circle ms-ctrl-icon ms-ctrl-play" id="ms-fp-play"></i>
            <i class="ph ph-skip-forward-circle ms-ctrl-icon ms-ctrl-step" id="ms-fp-next"></i>
          </div>
          <i class="ph ph-list ms-ctrl-icon" id="ms-fp-to-list"></i>
        </div>
      </div>

      <!-- 新建歌单弹窗 -->
      <div class="ms-modal-overlay" id="ms-modal-create-pl">
        <div class="ms-modal-content">
          <h3 class="ms-modal-title ms-title-en" style="font-size:1.2rem;">NEW STORY</h3>
          <div class="ms-upload-area" id="ms-new-pl-cover" style="background-size:cover;background-position:center;height:120px;display:flex;align-items:center;justify-content:center;">
            <span><i class="ph ph-camera"></i> 点击上传封面</span>
          </div>
          <input type="text" id="ms-new-pl-name" placeholder="为这段故事命名">
          <div class="ms-modal-actions">
            <button class="ms-modal-btn" id="ms-btn-cancel-create" style="border-color:transparent;color:var(--ms-text-sub);">取消</button>
            <button class="ms-modal-btn" id="ms-btn-confirm-create">创 建</button>
          </div>
        </div>
      </div>

      <!-- 上传工作台 -->
      <div class="ms-modal-overlay" id="ms-modal-upload">
        <div class="ms-action-sheet">
          <div style="width:40px;height:4px;background:rgba(255,255,255,0.2);border-radius:2px;margin:0 auto 20px;"></div>
          <div style="text-align:center;font-family:var(--ms-font-en);letter-spacing:2px;font-size:1.1rem;margin-bottom:15px;">UPLOAD CENTER</div>
          <div style="display:flex;gap:10px;margin-bottom:15px;">
            <div class="ms-sheet-btn" id="ms-btn-add-music"><i class="ph ph-music-notes-plus" style="font-size:1.2rem;"></i> 添加音乐</div>
            <div class="ms-sheet-btn" id="ms-btn-add-lrc"><i class="ph ph-text-aa" style="font-size:1.2rem;"></i> 导入歌词</div>
          </div>
          <div id="ms-pending-list"></div>
          <button class="ms-sheet-confirm" id="ms-btn-confirm-upload">确 认 上 传</button>
        </div>
      </div>
    `;
    document.body.appendChild(root);
  };

  // ── 状态 ──
  let _apiBase = 'https://api-enhanced-phi.vercel.app';
  let _cookie = '';
  let _isLoggedIn = false;
  let _qrKey = '';
  let _qrTimer = null;

  let _localPlaylists = [
    { id: 'l1', name: '默认漫游指南', titleEn: 'DEFAULT', count: 0, cover: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80', songs: [], isLocal: true }
  ];
  let _currentPlaylistObj = null;
  let _currentPlaylist = [];
  let _currentIdx = -1;
  let _isPlaying = false;
  let _playMode = 0; // 0 顺序 1 随机 2 单曲循环
  let _isDragging = false;
  let _contextIsLocal = true;
  let _pendingFiles = [];
  let _uploadImgTargetId = null;
  let _tempCover = '';
  const _playModeIcons = ['ph-repeat', 'ph-shuffle', 'ph-repeat-once'];

  // DOM 快捷访问
  const _$ = id => document.getElementById(id);

  // ── 导航 ──
  function _navTo(viewId) {
    document.querySelectorAll('#music-root .ms-view').forEach(v => v.classList.remove('active'));
    _$(viewId)?.classList.add('active');
    if (viewId === 'ms-local-view') _contextIsLocal = true;
    if (viewId === 'ms-home-view') _contextIsLocal = false;
  }
  function _openModal(id) { _$(id)?.classList.add('active'); }
  function _closeModal(id) { _$(id)?.classList.remove('active'); }
  function _toggleFullPlayer() { _$('ms-full-player')?.classList.toggle('expanded'); }

  // ── API 请求 ──
  async function _api(path) {
    const sep = path.includes('?') ? '&' : '?';
    const cookieParam = _cookie ? `${sep}cookie=${encodeURIComponent(_cookie)}` : '';
    const res = await fetch(`${_apiBase}${path}${cookieParam}`);
    return res.json();
  }

  // ── 扫码登录 ──
  async function _startQR() {
    _$('ms-qr-loading').style.display = 'flex';
    _$('ms-qr-status').textContent = '获取二维码中...';
    try {
      const keyData = await _api('/login/qr/key?timestamp=' + Date.now());
      _qrKey = keyData.data?.unikey;
      const qrData = await _api(`/login/qr/create?key=${_qrKey}&qrimg=true&timestamp=${Date.now()}`);
      const img = _$('ms-qr-img');
      img.src = qrData.data?.qrimg || '';
      _$('ms-qr-loading').style.display = 'none';
      _$('ms-qr-status').textContent = '请用网易云 App 扫码';
      _pollQR();
    } catch(e) {
      _$('ms-qr-status').textContent = '获取失败，请检查 API 地址';
      _$('ms-qr-loading').style.display = 'none';
    }
  }

  function _pollQR() {
    if (_qrTimer) clearInterval(_qrTimer);
    _qrTimer = setInterval(async () => {
      try {
        const data = await _api(`/login/qr/check?key=${_qrKey}&timestamp=${Date.now()}`);
        const code = data.code;
        if (code === 800) { _$('ms-qr-status').textContent = '二维码已过期，请刷新'; clearInterval(_qrTimer); }
        if (code === 801) { _$('ms-qr-status').textContent = '等待扫码...'; }
        if (code === 802) { _$('ms-qr-status').textContent = '已扫码，请在手机确认'; }
        if (code === 803) {
          clearInterval(_qrTimer);
          _cookie = data.cookie || '';
          await _afterLogin();
        }
      } catch(e) {}
    }, 2000);
  }

  async function _afterLogin() {
    try {
      const data = await _api('/user/account');
      const profile = data.profile;
      _isLoggedIn = true;
      _$('ms-user-name').textContent = profile?.nickname || '—';
      const avatar = _$('ms-user-avatar');
      if (avatar && profile?.avatarUrl) avatar.style.backgroundImage = `url('${profile.avatarUrl}')`;
      _navTo('ms-home-view');
    } catch(e) { _navTo('ms-home-view'); }
  }

  // ── 渲染本地歌单 ──
  function _renderLocalPlaylists() {
    const container = _$('ms-local-pl-render');
    if (!container) return;
    container.innerHTML = '';
    _localPlaylists.forEach((pl, i) => {
      const el = document.createElement('div');
      el.className = 'ms-art-card ms-fade-in';
      el.style.animationDelay = `${i * 0.08}s`;
      const idx = String(i + 1).padStart(2, '0');
      el.innerHTML = `
        <div class="ms-art-cover-wrap">
          <div class="ms-art-cover" id="ms-lpl-cover-${i}" style="background-image:url('${pl.cover}')"></div>
          <div class="ms-art-edit-btn" id="ms-lpl-edit-${i}"><i class="ph ph-camera"></i></div>
        </div>
        <div class="ms-art-info">
          <div class="ms-art-top">
            <h3 class="ms-art-title-en">${pl.titleEn || 'RECORD'}</h3>
            <span class="ms-art-num">${idx}</span>
          </div>
          <div class="ms-art-bottom">
            <p class="ms-art-title-zh">${pl.name}</p>
            <p class="ms-art-count">${pl.count} TRACKS</p>
          </div>
        </div>`;
      el.onclick = () => _openSongList(pl);
      el.querySelector(`#ms-lpl-edit-${i}`).onclick = e => {
        e.stopPropagation();
        _uploadImgTargetId = `ms-lpl-cover-${i}`;
        _$('ms-file-img').click();
      };
      container.appendChild(el);
    });
  }

  // ── 云端歌单列表 ──
  async function _loadCloudPlaylists() {
    _navTo('ms-playlists-view');
    const container = _$('ms-pl-list-render');
    container.innerHTML = '<div class="ms-text-light" style="text-align:center;padding:40px;">加载中...</div>';
    try {
      const data = await _api('/user/playlist');
      const lists = data.playlist || [];
      container.innerHTML = '';
      lists.forEach((pl, i) => {
        const el = document.createElement('div');
        el.className = 'ms-pl-card ms-fade-in';
        el.style.animationDelay = `${i * 0.05}s`;
        el.innerHTML = `
          <div class="ms-pl-cover" style="background-image:url('${pl.coverImgUrl}')"></div>
          <div class="ms-pl-info">
            <div class="ms-pl-name">${pl.name}</div>
            <div class="ms-text-light" style="font-size:0.75rem;">${pl.trackCount} 首</div>
          </div>
          <i class="ph ph-caret-right ms-text-light" style="padding:10px;"></i>`;
        el.onclick = () => _loadCloudSongList(pl);
        container.appendChild(el);
      });
    } catch(e) {
      container.innerHTML = '<div class="ms-text-light" style="text-align:center;padding:40px;">加载失败</div>';
    }
  }

  async function _loadDailyRec() {
    _navTo('ms-songlist-view');
    _$('ms-sl-title').textContent = 'DAILY ECHO';
    _$('ms-sl-desc').textContent = '每日推荐';
    _$('ms-sl-upload-btn').style.display = 'none';
    const container = _$('ms-song-list-render');
    container.innerHTML = '<div class="ms-text-light" style="text-align:center;padding:40px;">加载中...</div>';
    try {
      const data = await _api('/recommend/songs');
      const songs = (data.data?.dailySongs || []).map(s => ({
        id: s.id, title: s.name,
        artist: s.ar?.map(a => a.name).join(' / ') || '',
        cover: s.al?.picUrl || '', isCloud: true
      }));
      _currentPlaylist = songs;
      _currentPlaylistObj = { name: '每日推荐', isLocal: false };
      _$('ms-fp-pl-name').textContent = '每日推荐';
      _renderSongList(songs, container);
    } catch(e) {
      container.innerHTML = '<div class="ms-text-light" style="text-align:center;padding:40px;">加载失败</div>';
    }
  }

  async function _loadCloudSongList(pl) {
    _navTo('ms-songlist-view');
    _$('ms-sl-title').textContent = pl.name.toUpperCase().slice(0, 16);
    _$('ms-sl-desc').textContent = `${pl.name} • ${pl.trackCount} 首`;
    _$('ms-sl-header-bg').style.backgroundImage = `url('${pl.coverImgUrl}')`;
    _$('ms-fp-pl-name').textContent = pl.name;
    _$('ms-sl-upload-btn').style.display = 'none';
    const container = _$('ms-song-list-render');
    container.innerHTML = '<div class="ms-text-light" style="text-align:center;padding:40px;">加载中...</div>';
    try {
      const data = await _api(`/playlist/track/all?id=${pl.id}&limit=100`);
      const songs = (data.songs || []).map(s => ({
        id: s.id, title: s.name,
        artist: s.ar?.map(a => a.name).join(' / ') || '',
        cover: s.al?.picUrl || '', isCloud: true
      }));
      _currentPlaylist = songs;
      _currentPlaylistObj = pl;
      _renderSongList(songs, container);
    } catch(e) {
      container.innerHTML = '<div class="ms-text-light" style="text-align:center;padding:40px;">加载失败</div>';
    }
  }

  function _openSongList(pl) {
    _currentPlaylistObj = pl;
    _navTo('ms-songlist-view');
    _$('ms-sl-title').textContent = (pl.titleEn || 'STORY').toUpperCase();
    _$('ms-sl-desc').textContent = `${pl.name} • ${pl.count} Tracks`;
    _$('ms-sl-header-bg').style.backgroundImage = `url('${pl.cover}')`;
    _$('ms-fp-pl-name').textContent = pl.name;
    _$('ms-sl-upload-btn').style.display = pl.isLocal ? 'block' : 'none';
    _currentPlaylist = pl.songs;
    const container = _$('ms-song-list-render');
    _renderSongList(pl.songs, container);
  }

  function _renderSongList(songs, container) {
    container.innerHTML = '';
    if (!songs.length) {
      container.innerHTML = '<div class="ms-text-light" style="text-align:center;padding:40px;">这片星域有些安静</div>';
      return;
    }
    songs.forEach((song, i) => {
      const el = document.createElement('div');
      el.className = 'ms-song-item ms-fade-in';
      el.style.animationDelay = `${i * 0.03}s`;
      el.innerHTML = `
        <div class="ms-song-index">${String(i + 1).padStart(2, '0')}</div>
        <div class="ms-song-info">
          <div class="ms-song-name">${song.title || song.name}</div>
          <div class="ms-song-artist">${song.artist || ''}</div>
        </div>
        <i class="ph ph-play-circle ms-text-light"></i>`;
      el.onclick = () => _playSong(i);
      container.appendChild(el);
    });
  }

  // ── 搜索 ──
  async function _handleSearch() {
    const q = _$('ms-search-input')?.value.trim();
    const container = _$('ms-search-results');
    if (!q) { container.innerHTML = '<div class="ms-text-light" style="text-align:center;padding:40px;">在这片云端寻找你的声音</div>'; return; }
    container.innerHTML = '<div class="ms-text-light" style="text-align:center;padding:40px;">搜索中...</div>';
    try {
      const data = await _api(`/search?keywords=${encodeURIComponent(q)}&limit=30`);
      const songs = (data.result?.songs || []).map(s => ({
        id: s.id, title: s.name,
        artist: s.artists?.map(a => a.name).join(' / ') || '',
        cover: '', isCloud: true
      }));
      _currentPlaylist = songs;
      container.innerHTML = '';
      if (!songs.length) { container.innerHTML = '<div class="ms-text-light" style="text-align:center;padding:40px;">未发现相关信号</div>'; return; }
      songs.forEach((song, i) => {
        const el = document.createElement('div');
        el.className = 'ms-song-item ms-fade-in';
        el.innerHTML = `
          <div class="ms-song-info" style="margin-left:10px;">
            <div class="ms-song-name">${song.title}</div>
            <div class="ms-song-artist">${song.artist}</div>
          </div>`;
        el.onclick = () => { _playSong(i); _toggleFullPlayer(); };
        container.appendChild(el);
      });
    } catch(e) {
      container.innerHTML = '<div class="ms-text-light" style="text-align:center;padding:40px;">搜索失败</div>';
    }
  }

  // ── 播放器 ──
  async function _playSong(idx) {
    if (idx < 0 || idx >= _currentPlaylist.length) return;
    _currentIdx = idx;
    const song = _currentPlaylist[idx];
    const audio = _$('ms-audio');

    // 更新 UI
    const title = song.title || song.name || '—';
    const artist = song.artist || '—';
    _$('ms-mp-title').textContent = title;
    _$('ms-mp-artist').textContent = artist;
    _$('ms-fp-title').textContent = title;
    _$('ms-fp-artist').textContent = artist;
    if (song.cover) {
      _$('ms-mp-cover').style.backgroundImage = `url('${song.cover}')`;
      _$('ms-fp-art').style.backgroundImage = `url('${song.cover}')`;
    }

    // 获取播放链接
    let url = song.url || '';
    if (song.isCloud && song.id) {
      try {
        const data = await _api(`/song/url/v1?id=${song.id}&level=exhigh&randomCNIP=true`);
        url = data.data?.[0]?.url || '';
        // 顺便拉封面
        if (!song.cover) {
          const detail = await _api(`/song/detail?ids=${song.id}`);
          const pic = detail.songs?.[0]?.al?.picUrl;
          if (pic) {
            _currentPlaylist[idx].cover = pic;
            _$('ms-mp-cover').style.backgroundImage = `url('${pic}')`;
            _$('ms-fp-art').style.backgroundImage = `url('${pic}')`;
          }
        }
      } catch(e) {}
    }

    if (!url) { console.warn('[MusicModule] 无法获取播放链接'); return; }
    audio.src = url;
    audio.play().then(() => {
      _isPlaying = true;
      _updatePlayUI();
      _$('ms-mini-player').classList.add('visible');
      document.querySelectorAll('#ms-song-list-render .ms-song-item').forEach(el => el.classList.remove('playing'));
      const items = document.querySelectorAll('#ms-song-list-render .ms-song-item');
      if (items[idx]) items[idx].classList.add('playing');
    }).catch(e => { console.warn('[MusicModule] 播放失败', e); _isPlaying = false; _updatePlayUI(); });
  }

  function _togglePlay() {
    const audio = _$('ms-audio');
    if (!audio.src && _currentPlaylist.length) { _playSong(0); return; }
    _isPlaying ? audio.pause() : audio.play();
    _isPlaying = !_isPlaying;
    _updatePlayUI();
  }

  function _nextSong() {
    if (!_currentPlaylist.length) return;
    let next = _currentIdx + 1;
    if (_playMode === 1) next = Math.floor(Math.random() * _currentPlaylist.length);
    else if (next >= _currentPlaylist.length) next = 0;
    _playSong(next);
  }

  function _prevSong() {
    const audio = _$('ms-audio');
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    let prev = _currentIdx - 1;
    if (prev < 0) prev = _currentPlaylist.length - 1;
    _playSong(prev);
  }

  function _toggleMode() {
    _playMode = (_playMode + 1) % 3;
    const btn = _$('ms-mode-btn');
    if (btn) btn.className = `ph ${_playModeIcons[_playMode]} ms-ctrl-icon`;
    _$('ms-audio').loop = (_playMode === 2);
  }

  function _updatePlayUI() {
    const play = _isPlaying;
    const mpPlay = _$('ms-mp-play');
    const fpPlay = _$('ms-fp-play');
    const cover = _$('ms-mp-cover');
    const art = _$('ms-fp-art');
    if (mpPlay) mpPlay.className = `ph ${play ? 'ph-pause-circle' : 'ph-play-circle'} ms-mp-btn play-pause`;
    if (fpPlay) fpPlay.className = `ph ${play ? 'ph-pause-circle' : 'ph-play-circle'} ms-ctrl-icon ms-ctrl-play`;
    play ? cover?.classList.add('spinning') : cover?.classList.remove('spinning');
    play ? art?.classList.add('spinning') : art?.classList.remove('spinning');
  }

  function _fmtTime(s) {
    if (isNaN(s) || s === Infinity) return '00:00';
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  }

  // ── 上传逻辑 ──
  function _renderPendingList() {
    const container = _$('ms-pending-list');
    if (!container) return;
    if (!_pendingFiles.length) {
      container.innerHTML = '<div style="text-align:center;padding:25px;color:rgba(255,255,255,0.3);font-size:0.85rem;">暂未选择文件</div>';
      return;
    }
    container.innerHTML = '';
    _pendingFiles.forEach(item => {
      const el = document.createElement('div');
      el.className = 'ms-pending-item ms-fade-in';
      el.innerHTML = `
        <div style="display:flex;align-items:center;flex:1;overflow:hidden;margin-right:10px;">
          <span class="ms-pending-type">${item.type}</span>
          <span class="ms-pending-name">${item.file.name}</span>
        </div>
        <i class="ph ph-x-circle ms-pending-del" data-id="${item.id}"></i>`;
      el.querySelector('.ms-pending-del').onclick = () => {
        _pendingFiles = _pendingFiles.filter(f => f.id != item.id);
        _renderPendingList();
      };
      container.appendChild(el);
    });
  }

  function _confirmUpload() {
    if (!_pendingFiles.length) return;
    if (!_currentPlaylistObj) return;
    let added = 0;
    _pendingFiles.filter(f => f.type === 'AUDIO').forEach(item => {
      const song = {
        id: 'local_' + Date.now() + Math.random(),
        title: item.file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Local',
        cover: _currentPlaylistObj.cover,
        url: URL.createObjectURL(item.file),
        isCloud: false
      };
      _currentPlaylistObj.songs.push(song);
      _currentPlaylistObj.count = _currentPlaylistObj.songs.length;
      added++;
    });
    if (added > 0) { _renderLocalPlaylists(); _openSongList(_currentPlaylistObj); }
    _pendingFiles = [];
    _closeModal('ms-modal-upload');
  }

  // ── Three.js 星空 ──
  let _threeRenderer = null;
  function _initThree() {
    if (_threeRenderer) return;
    if (!window.THREE) return;
    const container = _$('ms-canvas');
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030305, 0.002);
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 30, 80); camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const canvas2d = document.createElement('canvas'); canvas2d.width = 16; canvas2d.height = 16;
    const ctx = canvas2d.getContext('2d');
    const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    g.addColorStop(0.5, 'rgba(200,220,255,0.2)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 16, 16);

    const count = 2000, geo = new THREE.BufferGeometry(), pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 120, sa = r * 1, ba = (i % 3) / 3 * Math.PI * 2;
      const rnd = v => Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * v;
      pos[i*3] = Math.cos(ba+sa)*r + rnd(0.5*r);
      pos[i*3+1] = rnd(0.25*r);
      pos[i*3+2] = Math.sin(ba+sa)*r + rnd(0.5*r);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ size: 1.2, map: new THREE.CanvasTexture(canvas2d), transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xe0e8ff });
    const galaxy = new THREE.Points(geo, mat); galaxy.rotation.x = 0.2; scene.add(galaxy);

    const clock = new THREE.Clock(); let mx = 0;
    document.addEventListener('touchmove', e => { mx = (e.touches[0].clientX - window.innerWidth / 2) * 0.05; }, { passive: true });
    (function animate() { requestAnimationFrame(animate); galaxy.rotation.y = clock.getElapsedTime() * 0.05; camera.position.x += (mx - camera.position.x) * 0.05; camera.lookAt(0, 0, 0); renderer.render(scene, camera); })();
    _threeRenderer = renderer;
  }

  // ── 绑定所有事件 ──
  const _bindEvents = () => {
    const audio = _$('ms-audio');

    // 关闭音乐模块
    _$('ms-close-btn').onclick = () => close();

    // 本地页
    _$('ms-btn-create-pl').onclick = () => _openModal('ms-modal-create-pl');
    _$('ms-btn-go-api').onclick = () => _navTo('ms-api-login-view');

    // API 连接页
    _$('ms-btn-api-back').onclick = () => _navTo('ms-local-view');
    _$('ms-btn-connect-api').onclick = () => {
      const url = _$('ms-api-url-input')?.value.trim();
      if (url) _apiBase = url.replace(/\/$/, '');
      _navTo('ms-login-view');
      _startQR();
    };

    // 登录页
    _$('ms-btn-login-back').onclick = () => { if (_qrTimer) clearInterval(_qrTimer); _navTo('ms-api-login-view'); };
    _$('ms-btn-refresh-qr').onclick = () => _startQR();
    document.querySelectorAll('#music-root .ms-login-tab').forEach(tab => {
      tab.onclick = function() {
        document.querySelectorAll('#music-root .ms-login-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('#music-root .ms-login-panel').forEach(p => p.classList.remove('active'));
        this.classList.add('active');
        _$('ms-login-' + this.dataset.tab)?.classList.add('active');
        if (this.dataset.tab === 'qr' && !_qrKey) _startQR();
      };
    });

    // 主页卡片
    _$('ms-card-playlist').onclick = () => _loadCloudPlaylists();
    _$('ms-card-daily').onclick = () => _loadDailyRec();
    _$('ms-btn-logout').onclick = () => { _isLoggedIn = false; _cookie = ''; _qrKey = ''; _navTo('ms-local-view'); };

    // 歌单列表 back
    _$('ms-btn-pl-back').onclick = () => _navTo('ms-home-view');

    // 歌曲列表 back
    _$('ms-btn-sl-back').onclick = () => { _contextIsLocal ? _navTo('ms-local-view') : _navTo('ms-playlists-view'); };
    _$('ms-sl-upload-btn').onclick = () => { _pendingFiles = []; _renderPendingList(); _openModal('ms-modal-upload'); };

    // 搜索
    _$('ms-btn-search-back').onclick = () => _navTo('ms-home-view');
    _$('ms-search-input').oninput = _handleSearch;

    // 播放器
    _$('ms-mini-player').onclick = () => _toggleFullPlayer();
    _$('ms-mp-controls').onclick = e => e.stopPropagation();
    _$('ms-mp-prev').onclick = _prevSong;
    _$('ms-mp-play').onclick = _togglePlay;
    _$('ms-mp-next').onclick = _nextSong;
    _$('ms-fp-close').onclick = _toggleFullPlayer;
    _$('ms-fp-prev').onclick = _prevSong;
    _$('ms-fp-play').onclick = _togglePlay;
    _$('ms-fp-next').onclick = _nextSong;
    _$('ms-mode-btn').onclick = _toggleMode;
    _$('ms-fp-to-list').onclick = () => { _toggleFullPlayer(); _navTo('ms-songlist-view'); };

    // 进度条
    const bar = _$('ms-progress-bar');
    const fill = _$('ms-progress-fill');
    bar.addEventListener('input', e => {
      _isDragging = true; fill.style.width = `${e.target.value}%`;
      if (audio.duration) _$('ms-time-current').textContent = _fmtTime((e.target.value / 100) * audio.duration);
    });
    bar.addEventListener('change', e => {
      _isDragging = false;
      if (audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration;
    });

    // audio 事件
    audio.addEventListener('timeupdate', () => {
      if (_isDragging || !audio.duration) return;
      const pct = (audio.currentTime / audio.duration) * 100;
      bar.value = pct; fill.style.width = `${pct}%`;
      _$('ms-time-current').textContent = _fmtTime(audio.currentTime);
    });
    audio.addEventListener('loadedmetadata', () => { _$('ms-time-total').textContent = _fmtTime(audio.duration); });
    audio.addEventListener('ended', () => { if (_playMode !== 2) _nextSong(); });

    // 文件上传
    _$('ms-file-img').onchange = e => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const el = _$(_uploadImgTargetId);
        if (el) { el.style.backgroundImage = `url('${ev.target.result}')`; }
        if (_uploadImgTargetId === 'ms-new-pl-cover') {
          _tempCover = ev.target.result;
          _$('ms-new-pl-cover').innerHTML = '';
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    };
    _$('ms-file-music').onchange = e => {
      Array.from(e.target.files).forEach(f => _pendingFiles.push({ id: Date.now() + Math.random(), type: 'AUDIO', file: f }));
      _renderPendingList(); e.target.value = '';
    };
    _$('ms-file-lrc').onchange = e => {
      Array.from(e.target.files).forEach(f => _pendingFiles.push({ id: Date.now() + Math.random(), type: 'LRC', file: f }));
      _renderPendingList(); e.target.value = '';
    };
    _$('ms-btn-add-music').onclick = () => _$('ms-file-music').click();
    _$('ms-btn-add-lrc').onclick = () => _$('ms-file-lrc').click();
    _$('ms-btn-confirm-upload').onclick = _confirmUpload;

    // 新建歌单
    _$('ms-btn-cancel-create').onclick = () => _closeModal('ms-modal-create-pl');
    _$('ms-new-pl-cover').onclick = () => { _uploadImgTargetId = 'ms-new-pl-cover'; _$('ms-file-img').click(); };
    _$('ms-btn-confirm-create').onclick = () => {
      const name = _$('ms-new-pl-name')?.value.trim();
      if (!name) return;
      _localPlaylists.push({ id: 'p_' + Date.now(), name, titleEn: 'NEW RECORD', count: 0, cover: _tempCover || 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=600&q=80', songs: [], isLocal: true });
      _renderLocalPlaylists();
      _$('ms-new-pl-name').value = ''; _tempCover = '';
      _$('ms-new-pl-cover').innerHTML = '<span><i class="ph ph-camera"></i> 点击上传封面</span>';
      _closeModal('ms-modal-create-pl');
    };

    // 关闭弹窗点背景
    ['ms-modal-create-pl', 'ms-modal-upload'].forEach(id => {
      _$(id).onclick = e => { if (e.target === _$(id)) _closeModal(id); };
    });
  };

  // ── 公开方法 ──
  function open() {
    _injectCSS();
    _injectHTML();
    _bindEvents();
    _renderLocalPlaylists();
    setTimeout(() => document.getElementById('music-root')?.classList.add('ms-open'), 20);
    // 需要 Three.js 时懒加载
    if (window.THREE) _initThree();
    else {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      s.onload = _initThree;
      document.head.appendChild(s);
    }
  }

  function close() {
    const root = document.getElementById('music-root');
    if (root) {
      root.classList.remove('ms-open');
    }
  }

  return { open, close, _navTo };
})();