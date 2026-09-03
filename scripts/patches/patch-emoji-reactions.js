const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

const APP_DIR = path.join(__dirname, '..', '..', 'app');

async function main() {
  const pcDistDir = path.join(APP_DIR, 'pc-dist');

  if (!fs.existsSync(pcDistDir)) {
    logger.warn('pc-dist directory not found, skipping emoji reaction patch');
    return;
  }

  // Fallback 82 emoji mapping
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

  let jsFilesPatched = 0;

  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const fullPath = path.join(dir, f);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (f.endsWith('.js') && !f.endsWith('.bak')) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let patched = false;

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

          // 1. Patch default array fallback: reactionMsgInfo:[{rType:0...}]
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

          // 2. Patch server override: d.default.reactionMsgInfo=t.setttings.features.reaction_setting.reactionMsgInfo
          const overrideKey = 'd.default.reactionMsgInfo=t.setttings.features.reaction_setting.reactionMsgInfo';
          if (content.includes(overrideKey)) {
            content = content.replace(overrideKey, () => `d.default.reactionMsgInfo=${orderedJson}`);
            patched = true;
          }

          // 3. Dynamic adaptive positioning for reaction popover
          const refTarget = 'ref:e=>this._eList=e';
          const refReplacement = 'ref:e=>{this._eList=e;e&&setTimeout((()=>{try{let p=e.parentElement;if(!p)return;let r=p.getBoundingClientRect(),w=window.innerWidth,s=p.closest(".chat-message-list")||p.closest(".chat-view")||p.closest("#chat-box")||document.body,c=s.getBoundingClientRect();w-r.left<280||c.right-r.left<280?(p.style.setProperty("left","auto","important"),p.style.setProperty("right","0px","important")):(p.style.setProperty("left","0px","important"),p.style.setProperty("right","auto","important"));r.top<270?(p.style.setProperty("top","35px","important"),p.style.setProperty("bottom","auto","important")):(p.style.setProperty("top","-265px","important"),p.style.setProperty("bottom","auto","important"))}catch(_){}}),0)}';
          if (content.includes(refTarget)) {
            content = content.replace(refTarget, () => refReplacement);
            patched = true;
          }
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
          }
        ];

        for (const rt of recallTargets) {
          if (content.includes(rt.target)) {
            content = content.replace(rt.target, () => rt.replacement);
            patched = true;
          }
        }

        if (patched) {
          try {
            new Function(content);
            fs.writeFileSync(fullPath, content, 'utf8');
            logger.success(`Patched JS: ${path.basename(fullPath)}`);
            jsFilesPatched++;
          } catch (e) {
            logger.error(`Syntax error after patching ${path.basename(fullPath)}: ${e.message}`);
          }
        }
      }
    }
  }

  walkDir(pcDistDir);

  if (jsFilesPatched === 0) {
    logger.warn('No JS files matched reaction pattern for emoji patch');
  }

  // 2. Patch CSS files
  const cssOverride = `
/* === ZALO 82 EMOJI GRID WINDOWS/LINUX PATCH V6 === */

/* 1. Reset animation and opacity for reaction popup icons */
.emoji-list-wrapper .reaction-emoji-icon,
.zadark-reaction__emoji {
    animation: none !important;
    animation-delay: 0ms !important;
    transition: none !important;
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
    left: 0 !important;
    top: 0 !important;
    transform: none !important;
}

/* 3. ZaDark Reaction Popover Grid */
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

/* 4. Position adjustment for expanded popover */
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
body.zadark-amoled,
body.zadark-amoled #chat-view,
body.zadark-amoled .chat-message-list,
body.zadark-amoled .conv-item__unread,
body.zadark-amoled .chat-input__content,
body.zadark-amoled #chat-box,
body.zadark-amoled .main-nav,
body.zadark-amoled .sidebar {
    background-color: #000000 !important;
    color: #e4e6eb !important;
}

body.zadark-amoled .card,
body.zadark-amoled .msg-item {
    background-color: #0a0a0a !important;
    border-color: #1a1a1a !important;
}
`;

  function walkCss(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const fullPath = path.join(dir, f);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walkCss(fullPath);
      } else if (f.endsWith('.css')) {
        let cssContent = fs.readFileSync(fullPath, 'utf8');
        if (cssContent.includes('/* === ZALO 82 EMOJI GRID WINDOWS/LINUX PATCH')) {
          cssContent = cssContent.replace(/\/\* === ZALO 82 EMOJI GRID WINDOWS\/LINUX PATCH[\s\S]*$/, '');
        }
        cssContent += '\n' + cssOverride;
        fs.writeFileSync(fullPath, cssContent, 'utf8');
        logger.dim(`Injected V6 reaction CSS grid into: ${path.basename(fullPath)}`);
      }
    }
  }

  walkCss(pcDistDir);
  logger.success('Completed 82 Emoji Reaction & Anti-Recall patch for Linux');
}

if (require.main === module) {
  main();
}

module.exports = { main };
