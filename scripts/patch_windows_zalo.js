/**
 * Patch 82 Emoji Reaction for Windows Native Zalo
 * Can run standalone or be invoked automatically upon Windows boot.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const fallbackRaw = [
  [5, "/-heart"], [3, "/-strong"], [0, ":>"], [32, ":o"], [2, ":-(("], [20, ":-h"],
  [1, "--b"], [6, ":d"], [7, ":')"], [8, ":-*"], [9, ":3"], [10, ":b"], [17, ":)"], [18, ":p"], [19, ":$"], [21, "x-)"], [22, "8-)"], [23, ";-d"], [24, ":q"], [26, "b-)"], [45, ";-)"], [62, ":))"], [63, "$-)"], [133, "/-loveu"],
  [4, "/-weak"], [12, ":~"], [16, ":(("], [25, ":("], [35, "p-("], [39, ":wipe"], [44, "&-("], [61, ":-<"], [65, "/-break"],
  [13, ";p"], [14, ":*"], [15, ";o"], [29, ";xx"], [31, ";g"], [33, ":z"], [34, ":l"], [36, ":-bye"], [37, ":x"], [40, ":!"], [42, ":-dig"], [43, ":t"], [46, ":handclap"], [50, ":-r"], [56, ";!"], [59, ":v"], [66, "/-shit"],
  [27, ";?"], [28, ":|"], [30, ":--|"], [38, "|-)"], [41, "8*"], [47, ">-|"], [48, ":-f"], [49, ":-l"], [51, ";-/"], [52, ";-x"], [53, ":-o"], [54, ";-s"], [57, ";f"], [58, ":;"], [60, ";-a"],
  [67, "/-li"], [68, "/-ok"], [69, "/-v"], [70, "/-thanks"], [71, "/-punch"], [72, "/-share"], [73, "_()_"], [84, "\u2603"], [86, "\u26c4"], [95, "\ud83c\udf81"], [120, "/-rose"], [121, "/-fade"], [126, "/-bd"], [127, "/-bome"], [131, "/-no"], [132, "/-bad"]
];

const groupDefaults = [5, 3, 0, 32, 2, 20];
const groupHappy = [1, 6, 7, 8, 9, 10, 17, 18, 19, 21, 22, 23, 24, 26, 45, 62, 63, 133];
const groupSad = [4, 12, 16, 25, 35, 39, 44, 61, 65];
const groupFunny = [13, 14, 15, 29, 31, 33, 34, 36, 37, 40, 42, 43, 46, 50, 56, 59, 66];
const groupThinking = [27, 28, 30, 38, 41, 47, 48, 49, 51, 52, 53, 54, 57, 58, 60];
const groupActions = [67, 68, 69, 70, 71, 72, 73, 84, 86, 95, 120, 121, 126, 127, 131, 132];

const allRTypes = [
  ...groupDefaults,
  ...groupHappy,
  ...groupSad,
  ...groupFunny,
  ...groupThinking,
  ...groupActions
];

const cssOverride = `
/* === ZALO 82 EMOJI GRID WINDOWS/LINUX PATCH V10 === */

/* 1. Reset animation, transform, and opacity for reaction popup icons */
.emoji-list-wrapper .reaction-emoji-icon,
.emoji-list-wrapper.show-elist .reaction-emoji-icon,
.message-reaction-container-v2 .emoji-list-wrapper .reaction-emoji-icon,
.message-reaction-container-v2 .emoji-list-wrapper.show-elist .reaction-emoji-icon,
.zadark-reaction__emoji {
    animation: none !important;
    animation-delay: 0ms !important;
    transition: none !important;
    transform: scale(1) !important;
    opacity: 1 !important;
    visibility: visible !important;
}

/* 2. Full 82 Emoji Reaction Grid (6 Icons per Row, perfectly balanced & symmetrical) */
.emoji-list-wrapper .reaction-emoji-list,
.message-reaction-container-v2 .emoji-list-wrapper .reaction-emoji-list {
    display: grid !important;
    grid-template-columns: repeat(6, 36px) !important;
    gap: 4px !important;
    justify-content: center !important;
    align-content: start !important;
    width: auto !important;
    max-width: fit-content !important;
    min-width: unset !important;
    max-height: 245px !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    padding: 8px !important;
    padding-bottom: 24px !important;
    border-radius: 12px !important;
    background-color: var(--reaction-background, #22262B) !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    box-sizing: border-box !important;
    scrollbar-width: thin !important;
}

.emoji-list-wrapper .reaction-emoji-list::-webkit-scrollbar,
.message-reaction-container-v2 .emoji-list-wrapper .reaction-emoji-list::-webkit-scrollbar {
    width: 4px !important;
}

.emoji-list-wrapper .reaction-emoji-list::-webkit-scrollbar-thumb,
.message-reaction-container-v2 .emoji-list-wrapper .reaction-emoji-list::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.25) !important;
    border-radius: 4px !important;
}

.emoji-list-wrapper .reaction-emoji-icon:not(:has(.clear-react)),
.message-reaction-container-v2 .emoji-list-wrapper .reaction-emoji-icon:not(:has(.clear-react)) {
    display: flex !important;
    width: 36px !important;
    height: 36px !important;
    margin: 0 !important;
    padding: 0 !important;
    align-items: center !important;
    justify-content: center !important;
    box-sizing: border-box !important;
    transform: scale(1) !important;
    opacity: 1 !important;
    visibility: visible !important;
    border-radius: 6px !important;
    cursor: pointer !important;
    transition: background-color 0.15s ease, transform 0.15s ease !important;
}

.emoji-list-wrapper .reaction-emoji-icon:not(:has(.clear-react)):hover,
.message-reaction-container-v2 .emoji-list-wrapper .reaction-emoji-icon:not(:has(.clear-react)):hover {
    background-color: rgba(255, 255, 255, 0.12) !important;
    transform: scale(1.15) !important;
    z-index: 10 !important;
}

.emoji-list-wrapper .reaction-emoji-icon > span,
.message-reaction-container-v2 .emoji-list-wrapper .reaction-emoji-icon > span {
    display: inline-flex !important;
    position: relative !important;
    left: auto !important;
    transform: scale(1) !important;
    opacity: 1 !important;
    visibility: visible !important;
}

/* 4. ZaDark Reaction Popover Grid (6 Icons per Row) */
.zadark-reaction__popover-content__list {
    display: grid !important;
    grid-template-columns: repeat(6, 34px) !important;
    gap: 2px !important;
    width: 224px !important;
    max-height: 180px !important;
    overflow-y: auto !important;
    padding: 4px !important;
    box-sizing: border-box !important;
}

.zadark-reaction__emoji {
    display: flex !important;
    width: 34px !important;
    height: 34px !important;
    align-items: center !important;
    justify-content: center !important;
    margin: 0 !important;
    transform: scale(1) !important;
    opacity: 1 !important;
    visibility: visible !important;
}

/* Position adjustment for expanded popover */
.emoji-list-wrapper,
div[style*="position: relative"] > .emoji-list-wrapper,
div[style*="position:relative"] > .emoji-list-wrapper {
    position: absolute !important;
    transform: none !important;
    z-index: 999999 !important;
}

/* 5. Cancel / Remove Reaction Button (Nút hủy reaction tinh tế, màu Zalo chuẩn, không bị đúp background) */
.emoji-list-wrapper .reaction-emoji-list > .reaction-emoji-icon:has(.clear-react),
.emoji-list-wrapper .reaction-emoji-list > .clear-react {
    grid-column: 1 / -1 !important;
    order: -1 !important;
    position: sticky !important;
    top: -8px !important;
    display: inline-flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 8px !important;
    width: 100% !important;
    max-width: 100% !important;
    height: 30px !important;
    min-height: 30px !important;
    margin: 0 0 8px 0 !important;
    padding: 0 12px !important;
    background: rgba(255, 255, 255, 0.06) !important;
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
    border-radius: 16px !important;
    color: var(--text-secondary, #a6b2c0) !important;
    cursor: pointer !important;
    z-index: 100 !important;
    backdrop-filter: blur(12px) !important;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
    box-sizing: border-box !important;
    white-space: nowrap !important;
    overflow: hidden !important;
}

.emoji-list-wrapper .reaction-emoji-list > .reaction-emoji-icon:has(.clear-react):hover,
.emoji-list-wrapper .reaction-emoji-list > .clear-react:hover {
    background: rgba(239, 68, 68, 0.16) !important;
    border-color: rgba(239, 68, 68, 0.4) !important;
    color: #ff7875 !important;
    transform: translateY(-1px) !important;
}

.emoji-list-wrapper .clear-react,
.emoji-list-wrapper .reaction-emoji-icon i.clear-react,
.emoji-list-wrapper i.clear-react {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: auto !important;
    height: auto !important;
    background: transparent !important;
    background-color: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    margin: 0 !important;
    padding: 0 !important;
    font-size: 13px !important;
    color: var(--icon-secondary, #8c98a6) !important;
    line-height: 1 !important;
}

.emoji-list-wrapper .reaction-emoji-list > .reaction-emoji-icon:has(.clear-react):hover i.clear-react,
.emoji-list-wrapper .reaction-emoji-list > .clear-react:hover i.clear-react {
    color: #ff7875 !important;
}

.emoji-list-wrapper .reaction-emoji-icon:has(.clear-react)::after,
.emoji-list-wrapper .reaction-emoji-list > .clear-react::after {
    content: "Hủy bày tỏ cảm xúc" !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    color: inherit !important;
    line-height: 1 !important;
    letter-spacing: 0.1px !important;
    white-space: nowrap !important;
}

/* === AMOLED PITCH BLACK THEME OVERRIDE === */
:root .dark,
body.dark,
.dark {
    --surface-background: #000000 !important;
    --surface-background-subtle: #050505 !important;
    --surface-alt: #0a0a0a !important;
    --surface-background-overlay: #000000 !important;
    --layer-background: #0a0a0a !important;
    --layer-background-subtle: #050505 !important;
    --layer-background-hover: #141414 !important;
    --layer-background-selected: #1c1c1c !important;
    --bg-default: #000000 !important;
    --bg-subtle: #050505 !important;
    --main-background: #000000 !important;
    --N0: #000000 !important;
    --N5: #040404 !important;
    --N10: #080808 !important;
    --N15: #0f0f0f !important;
    --N20: #171717 !important;
    --DN0: #000000 !important;
    --DN5: #040404 !important;
    --DN10: #080808 !important;
    --DN15: #0d0d0d !important;
    --DN20: #141414 !important;
    --NG10: #000000 !important;
    --NG15: #060606 !important;
    --NG20: #0d0d0d !important;
    --border: #181818 !important;
    --border-subtle: #101010 !important;
    --border-bold: #242424 !important;
}

body.dark,
.dark #chatView,
.dark .chat-view,
.dark #chat-box,
.dark .chat-message-list,
.dark .chat-message-list__container,
.dark #contact-list,
.dark .nav-tabs,
.dark #nav-tabs,
.dark .left-menu,
.dark #sidebar,
.dark .conversation-item:not(:hover):not(.active) {
    background-color: #000000 !important;
}

.dark .bubble-message:not(.me) {
    background-color: #111111 !important;
    border: 1px solid #1a1a1a !important;
}

.dark .chat-input__content,
.dark .chat-box-input__area,
.dark #chat-input-text {
    background-color: #080808 !important;
}
`;

function findZaloAsarPaths() {
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const zaloProgramsDir = path.join(localAppData, 'Programs', 'Zalo');
  if (!fs.existsSync(zaloProgramsDir)) return [];

  const results = [];
  const entries = fs.readdirSync(zaloProgramsDir);
  for (const entry of entries) {
    if (entry.startsWith('Zalo-')) {
      const asarPath = path.join(zaloProgramsDir, entry, 'resources', 'app.asar');
      if (fs.existsSync(asarPath)) {
        results.push({ versionDir: path.join(zaloProgramsDir, entry), asarPath });
      }
    }
  }
  return results;
}

async function isAsarPatched(asar, asarPath) {
  try {
    const files = asar.listPackage(asarPath);
    const cssFile = files.find(f => f.includes('compact-app-pc') && f.endsWith('.css'));
    if (cssFile) {
      const rel = cssFile.startsWith('/') || cssFile.startsWith('\\') ? cssFile.slice(1) : cssFile;
      const content = asar.extractFile(asarPath, rel).toString('utf8');
      if (content.includes('/* === ZALO 82 EMOJI GRID WINDOWS/LINUX PATCH V10 === */')) {
        return true;
      }
    }
  } catch (e) {
    console.error('[Patch] Error checking asar patch status:', e.message);
  }
  return false;
}

function patchDirectory(extractedDir) {
  const pcDistDir = path.join(extractedDir, 'pc-dist');
  if (!fs.existsSync(pcDistDir)) {
    console.error('[Patch] pc-dist not found in extracted directory!');
    return false;
  }

  // 1. Patch JS files
  let jsPatched = 0;
  function walkJs(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) {
        walkJs(full);
      } else if (item.endsWith('.js')) {
        let content = fs.readFileSync(full, 'utf8');
        if (content.includes('reactionMsgInfo') || content.includes('reaction_setting')) {
          const emojiMap = {};
          fallbackRaw.forEach(([rt, ic]) => { emojiMap[rt] = ic; });

          let idx = content.indexOf('c=[{rType:0,rIcon:":>"}');
          if (idx === -1) idx = content.indexOf('rType:0,rIcon:":>"');
          if (idx !== -1) {
            const endIdx = content.indexOf('];', idx);
            if (endIdx !== -1) {
              const exactArrayStr = content.substring(idx + 2, endIdx + 1);
              const itemsRegex = /rType:(\d+),rIcon:"([^"]+)"/g;
              let match;
              while ((match = itemsRegex.exec(exactArrayStr)) !== null) {
                emojiMap[parseInt(match[1], 10)] = match[2];
              }
            }
          }

          const orderedArray = allRTypes
            .filter(rt => emojiMap[rt] !== undefined)
            .map(rt => ({ rType: rt, rIcon: emojiMap[rt] }));
          const orderedJson = JSON.stringify(orderedArray);

          let patched = false;
          // Fallback array: reactionMsgInfo:[{rType:0...}]
          const fallbackKey = 'reactionMsgInfo:[{rType:0,rIcon:":>"';
          let fbIdx = content.indexOf(fallbackKey);
          if (fbIdx !== -1) {
            const startBracket = content.indexOf('[', fbIdx);
            const endBracket = content.indexOf(']', startBracket);
            if (startBracket !== -1 && endBracket !== -1) {
              content = content.substring(0, startBracket) + orderedJson + content.substring(endBracket + 1);
              patched = true;
            }
          }

          // Server override: d.default.reactionMsgInfo=...
          const overrideKey = 'd.default.reactionMsgInfo=t.setttings.features.reaction_setting.reactionMsgInfo';
          if (content.includes(overrideKey)) {
            content = content.replace(overrideKey, () => `d.default.reactionMsgInfo=${orderedJson}`);
            patched = true;
          }

          // Dynamic adaptive positioning for reaction popover
          const refTarget = 'ref:e=>this._eList=e';
          const refReplacement = 'ref:e=>{this._eList=e;e&&setTimeout((()=>{try{let p=e.parentElement;if(!p)return;let r=p.getBoundingClientRect(),w=window.innerWidth,s=p.closest(".chat-message-list")||p.closest(".chat-view")||p.closest("#chat-box")||document.body,c=s.getBoundingClientRect();w-r.left<280||c.right-r.left<280?(p.style.setProperty("left","auto","important"),p.style.setProperty("right","0px","important")):(p.style.setProperty("left","0px","important"),p.style.setProperty("right","auto","important"));r.top<270?(p.style.setProperty("top","35px","important"),p.style.setProperty("bottom","auto","important")):(p.style.setProperty("top","-265px","important"),p.style.setProperty("bottom","auto","important"))}catch(_){}}),0)}';
          if (content.includes(refTarget)) {
            content = content.replace(refTarget, () => refReplacement);
            patched = true;
          }

          // Anti-Recall patch: Keep recalled messages visible with [Đã thu hồi] tag
          const recallTargets = [
            {
              target: ':t.message="[Tin nhắn đã được thu hồi]"',
              replacement: ':t.isRecalled=true,t.message=typeof t.message==="string"?(t.message.startsWith("[Đã thu hồi]")?t.message:"[Đã thu hồi] "+t.message):t.message'
            },
            {
              target: ':t.message="[Tin nhắn đã bị xóa]"',
              replacement: ':t.isRecalled=true,t.message=typeof t.message==="string"?(t.message.startsWith("[Đã xóa]")?t.message:"[Đã xóa] "+t.message):t.message'
            },
            {
              target: 't.type==s.FetchActions.DELETE_EVERYONE?(n=c.default.convertToDelEveryone(n),n.uidSenderDel=t.payload.uidSenderDel):"0"!==n.fromUid&&(n=c.default.convertToRecalled(n))',
              replacement: '"0"!==n.fromUid?(n=c.default.convertToRecalled(n),n.msgType=e.msgType):t.type==s.FetchActions.DELETE_EVERYONE?(n=c.default.convertToDelEveryone(n),n.uidSenderDel=t.payload.uidSenderDel):(n=c.default.convertToRecalled(n))'
            },
            {
              target: 'r.c.equal(n.globalMsgId,e.msgId)?("0"!==e.fromUid&&h.default.convertToRecalled(e),e.msgType=n.msgType,e.v=n.v,i=e.sendDttm)',
              replacement: 'r.c.equal(n.globalMsgId,e.msgId)?("0"!==e.fromUid?h.default.convertToRecalled(e):(e.msgType=n.msgType,e.v=n.v,i=e.sendDttm))'
            },
            {
              target: 'a.msgType=h.MSG_UNDO,a.originMsgType="chat.undo","0"!==a.fromUid&&(a=b.default.convertToRecalled(a))',
              replacement: 'if("0"!==a.fromUid){a=b.default.convertToRecalled(a);n.Core.Message.insert(a,{replace:!0}).catch(()=>{});continue}a.msgType=h.MSG_UNDO,a.originMsgType="chat.undo"'
            },
            // Anti-Vanish (Chặn tin nhắn tự xóa)
            {
              target: 'async vanishMessages(e,t,n=(()=>{})){if(!t.length)return;',
              replacement: 'async vanishMessages(e,t,n=(()=>{})){return;if(!t.length)return;'
            },
            {
              target: 'const{key:o,conversationId:l,isTTL:c,batch:d}=t;l&&v.a.clearCache(l)',
              replacement: 'const{key:o,conversationId:l,isTTL:c,batch:d}=t;if(c)return a({ok:!0,value:[]});l&&v.a.clearCache(l)'
            },
            // Force Expanded 82 Emoji Grid on hover (both Modern & Legacy components)
            {
              target: 'r.a.useRef(0),[i,l]=r.a.useState(!1)',
              replacement: 'r.a.useRef(0),[i,l]=r.a.useState(!0)'
            },
            {
              target: 'this.state={showEList:!1,isShow:!1',
              replacement: 'this.state={showEList:!0,isShow:!1'
            }
          ];

          for (const rt of recallTargets) {
            if (content.includes(rt.target)) {
              content = content.replace(rt.target, () => rt.replacement);
              patched = true;
            }
          }

          if (patched) {
            fs.writeFileSync(full, content, 'utf8');
            console.log(`[Patch] Patched JS: ${item}`);
            jsPatched++;
          }
        }
      }
    }
  }
  walkJs(pcDistDir);

  // 2. Patch CSS files
  let cssPatched = 0;
  function walkCss(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) {
        walkCss(full);
      } else if (item.endsWith('.css')) {
        let content = fs.readFileSync(full, 'utf8');
        if (content.includes('/* === ZALO 82 EMOJI GRID WINDOWS/LINUX PATCH')) {
          content = content.replace(/\/\* === ZALO 82 EMOJI GRID WINDOWS\/LINUX PATCH[\s\S]*$/, '');
        }
        content += '\n' + cssOverride;
        fs.writeFileSync(full, content, 'utf8');
        console.log(`[Patch] Injected V2 CSS into: ${item}`);
        cssPatched++;
      }
    }
  }
  walkCss(pcDistDir);

  // 3. Inject Privacy Blocker (Block Typing indicator & Delivered receipt)
  const privacyBlockerCode = `// Privacy Shield: Block Typing, Delivered, Seen, Telemetry & Unlock DevTools
const { app, session, globalShortcut } = require('electron');

const blockFilter = {
  urls: [
    // 1. Typing indicator
    '*://*.zalo.me/api/message/typing*',
    '*://*.zalo.me/api/group/typing*',
    '*://*.zaloapp.com/api/message/typing*',
    '*://*.zaloapp.com/api/group/typing*',

    // 2. Delivered receipt (Đã nhận)
    '*://*.zalo.me/api/message/deliveredv2*',
    '*://*.zalo.me/api/group/deliveredv2*',
    '*://*.zalo.me/api/e2ee/pc/t/message/delivered*',
    '*://*.zaloapp.com/api/message/deliveredv2*',
    '*://*.zaloapp.com/api/group/deliveredv2*',
    '*://*.zaloapp.com/api/e2ee/pc/t/message/delivered*',

    // 3. Seen receipt (Đã xem)
    '*://*.zalo.me/api/message/seenv2*',
    '*://*.zalo.me/api/group/seenv2*',
    '*://*.zalo.me/api/message/seen*',
    '*://*.zalo.me/api/group/seen*',
    '*://*.zaloapp.com/api/message/seenv2*',
    '*://*.zaloapp.com/api/group/seenv2*',
    '*://*.zaloapp.com/api/message/seen*',
    '*://*.zaloapp.com/api/group/seen*',

    // 4. Activity Action Logs (Do not match /api/login)
    '*://*.zalo.me/api/login/actlistv2*',
    '*://*.zaloapp.com/api/login/actlistv2*'
  ]
};

app.whenReady().then(() => {
  // 1. WebRequest Interceptor
  const attachBlocker = (sess) => {
    if (!sess || !sess.webRequest) return;
    sess.webRequest.onBeforeRequest(blockFilter, (details, callback) => {
      const u = details.url;
      if (
        u.includes('/typing') ||
        u.includes('/delivered') ||
        u.includes('/seen') ||
        u.includes('actlistv2')
      ) {
        return callback({ cancel: true });
      }
      callback({ cancel: false });
    });
  };

  attachBlocker(session.defaultSession);
  try {
    attachBlocker(session.fromPartition('persist:zalo'));
  } catch (_) {}

  // 2. Unlock DevTools (F12 & Ctrl+Shift+I)
  try {
    globalShortcut.register('F12', () => {
      const win = require('electron').BrowserWindow.getFocusedWindow();
      if (win) win.webContents.toggleDevTools();
    });
    globalShortcut.register('CommandOrControl+Shift+I', () => {
      const win = require('electron').BrowserWindow.getFocusedWindow();
      if (win) win.webContents.toggleDevTools();
    });
  } catch (_) {}

  app.on('web-contents-created', (event, contents) => {
    contents.on('before-input-event', (event, input) => {
      if (input.type === 'keyDown') {
        if (input.key === 'F12' || (input.control && input.shift && input.key && input.key.toLowerCase() === 'i')) {
          contents.toggleDevTools();
          event.preventDefault();
        }
      }
    });
  });

  console.log('[Privacy] Anti-Typing, Anti-Delivered, Anti-Seen, Anti-Tracking & F12 DevTools active!');
});
`;

  fs.writeFileSync(path.join(extractedDir, 'privacy-blocker.js'), privacyBlockerCode, 'utf8');
  const bFile = path.join(extractedDir, 'bootstrap.js');
  if (fs.existsSync(bFile)) {
    let bContent = fs.readFileSync(bFile, 'utf8');
    if (!bContent.includes('./privacy-blocker')) {
      bContent = "require('./privacy-blocker');\n" + bContent;
      fs.writeFileSync(bFile, bContent, 'utf8');
      console.log('[Patch] Injected privacy blocker into bootstrap.js');
    }
  }

  console.log(`[Patch] JS files patched: ${jsPatched}, CSS files patched: ${cssPatched}`);
  return (jsPatched > 0 || cssPatched > 0);
}

async function patchAsarFile(asar, asarPath) {
  console.log(`[Patch] Checking ${asarPath}...`);
  if (await isAsarPatched(asar, asarPath)) {
    console.log('[Patch] Already patched with 82 emoji reactions!');
    return true;
  }

  console.log('[Patch] Unpatched version detected! Applying 82 emoji patch...');
  const tempExtractDir = path.join(os.tmpdir(), `zalo_patch_${Date.now()}`);
  const tempPatchedAsar = path.join(os.tmpdir(), `app_${Date.now()}.asar`);

  try {
    // 1. Extract asar
    const backupPath = asarPath + '.orig';
    if (!fs.existsSync(backupPath)) {
      console.log(`[Patch] Creating original backup at ${backupPath}...`);
      fs.copyFileSync(asarPath, backupPath);
    } else {
      console.log(`[Patch] Restoring pristine app.asar from ${backupPath}...`);
      try {
        fs.copyFileSync(backupPath, asarPath);
      } catch (e) {
        console.warn(`[Patch] Could not overwrite asarPath directly (${e.message}), continuing...`);
      }
    }
    console.log(`[Patch] Extracting ${asarPath}...`);
    asar.extractAll(asarPath, tempExtractDir);

    // 2. Patch files
    console.log('[Patch] Patching files in extracted directory...');
    const ok = patchDirectory(tempExtractDir);
    if (!ok) {
      throw new Error('Failed to patch extracted files');
    }

    // 3. Repack to temp asar
    console.log('[Patch] Repacking to patched asar...');
    await asar.createPackage(tempExtractDir, tempPatchedAsar);


    // 5. Replace app.asar
    console.log('[Patch] Overwriting app.asar with patched version...');
    try {
      fs.copyFileSync(tempPatchedAsar, asarPath);
      console.log('[Patch] Successfully applied 82 emoji reactions to Windows Zalo!');
      const pending = asarPath + '.pending_patch';
      if (fs.existsSync(pending)) fs.unlinkSync(pending);
      return true;
    } catch (e) {
      if (e.code === 'EBUSY' || e.code === 'EPERM') {
        const pendingPath = asarPath + '.pending_patch';
        fs.copyFileSync(tempPatchedAsar, pendingPath);
        console.log('[Patch] Zalo is currently running (file is locked).');
        console.log(`[Patch] Saved patched version to: ${pendingPath}`);
        console.log('[Patch] It will be automatically applied as soon as Zalo restarts!');
        return true;
      }
      throw e;
    }
  } catch (err) {
    console.error('[Patch] Failed to patch app.asar:', err);
    return false;
  } finally {
    // Cleanup temporary files
    try {
      if (fs.existsSync(tempExtractDir)) fs.rmSync(tempExtractDir, { recursive: true, force: true });
      if (fs.existsSync(tempPatchedAsar)) fs.unlinkSync(tempPatchedAsar);
    } catch (_) {}
  }
}

function applyPendingPatches() {
  const zaloInstallations = findZaloAsarPaths();
  for (const inst of zaloInstallations) {
    const pending = inst.asarPath + '.pending_patch';
    if (fs.existsSync(pending)) {
      try {
        fs.copyFileSync(pending, inst.asarPath);
        fs.unlinkSync(pending);
        console.log(`[Patch] Successfully applied pending patch to: ${inst.asarPath}`);
      } catch (_) {}
    }
  }
}

async function main() {
  applyPendingPatches();
  const asar = await import('@electron/asar');
  const zaloInstallations = findZaloAsarPaths();
  if (zaloInstallations.length === 0) {
    console.log('[Patch] No Windows Zalo installations found.');
    return;
  }

  for (const inst of zaloInstallations) {
    await patchAsarFile(asar, inst.asarPath);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, findZaloAsarPaths, isAsarPatched, patchAsarFile, applyPendingPatches };
