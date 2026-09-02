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

  // 1. Find the largest znotification JS file
  let jsTarget = null;
  let maxSize = 0;

  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const fullPath = path.join(dir, f);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (f.includes('znotification') && f.endsWith('.js') && !f.endsWith('.bak')) {
        if (stat.size > maxSize) {
          maxSize = stat.size;
          jsTarget = fullPath;
        }
      }
    }
  }

  walkDir(pcDistDir);

  if (!jsTarget) {
    logger.warn('znotification JS file not found, skipping emoji reaction patch');
    return;
  }

  logger.info(`Found JS target for emoji reactions: ${path.basename(jsTarget)}`);

  let content = fs.readFileSync(jsTarget, 'utf8');

  // Extract rType -> rIcon map
  let idx = content.indexOf('c=[{rType:0,rIcon:":>"}');
  if (idx === -1) {
    idx = content.indexOf('rType:0,rIcon:":>"');
  }

  if (idx !== -1) {
    const endIdx = content.indexOf('];', idx);
    if (endIdx !== -1) {
      const exactArrayStr = content.substring(idx + 2, endIdx + 1);
      const itemsRegex = /rType:(\d+),rIcon:"([^"]+)"/g;
      const emojiMap = {};
      let match;
      while ((match = itemsRegex.exec(exactArrayStr)) !== null) {
        emojiMap[parseInt(match[1], 10)] = match[2];
      }

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

      const orderedArray = allRTypes
        .filter(rt => emojiMap[rt] !== undefined)
        .map(rt => ({ rType: rt, rIcon: emojiMap[rt] }));

      const orderedJson = JSON.stringify(orderedArray);

      const oldOverridePatterns = [
        'd.default.reactionMsgInfo=t.setttings.features.reaction_setting.reactionMsgInfo',
        'd.default.reactionMsgInfo=[{"rType":',
        'd.default.reactionMsgInfo=[{rType:'
      ];

      let patched = false;
      for (const pat of oldOverridePatterns) {
        const idxPatch = content.indexOf(pat);
        if (idxPatch !== -1) {
          const endPatch = content.indexOf(',I.b.checkIcon(d.default.reactionMsgInfo)', idxPatch);
          if (endPatch !== -1) {
            const oldFull = content.substring(idxPatch, endPatch);
            const newFull = `d.default.reactionMsgInfo=${orderedJson}`;
            content = content.replace(oldFull, newFull);
            patched = true;
            break;
          }
        }
      }

      if (patched) {
        fs.writeFileSync(jsTarget, content, 'utf8');
        logger.success('Patched JS for 82 emoji reactions!');
      } else {
        logger.warn('JS reaction pattern not matched or already patched');
      }
    }
  }

  // 2. Patch CSS files
  const cssOverride = `
/* === ZALO 82 EMOJI GRID WINDOWS/LINUX PATCH === */
.emoji-list-wrapper .reaction-emoji-icon {
    animation: none !important;
    animation-delay: 0ms !important;
    transition: none !important;
    opacity: 1 !important;
    visibility: visible !important;
    transform: none !important;
}

.emoji-list-wrapper,
.emoji-list-wrapper.show-elist,
.emoji-list-wrapper.hide-elist,
.emoji-list-wrapper.top-less,
.emoji-list-wrapper.show-on-top {
    display: block !important;
    width: max-content !important;
    max-width: 260px !important;
    height: auto !important;
    flex-direction: row !important;
    flex-wrap: wrap !important;
    white-space: normal !important;
}

.emoji-list-wrapper .reaction-emoji-list {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: wrap !important;
    width: 240px !important;
    max-width: 240px !important;
    min-width: 240px !important;
    max-height: 180px !important;
    overflow-y: auto !important;
    padding: 6px !important;
    border-radius: 12px !important;
    background-color: var(--reaction-background, #22262B) !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    box-sizing: border-box !important;
}

.emoji-list-wrapper .reaction-emoji-icon {
    display: flex !important;
    width: 32px !important;
    height: 32px !important;
    margin: 2px !important;
    align-items: center !important;
    justify-content: center !important;
}

div[style*="position: relative"] > .emoji-list-wrapper,
div[style*="position:relative"] > .emoji-list-wrapper {
    position: absolute !important;
    top: -195px !important;
    left: 0 !important;
    right: auto !important;
    transform: none !important;
    z-index: 999999 !important;
}

div[style*="position: relative"] > .emoji-list-wrapper.me,
div[style*="position:relative"] > .emoji-list-wrapper.me {
    left: auto !important;
    right: 0 !important;
    transform: none !important;
}

.chat-item,
.msg-item,
.msg-reaction-container {
    overflow: visible !important;
}

.emoji-list-wrapper .clear-react,
.emoji-list-wrapper .reaction-emoji-icon i.clear-react {
    display: inline-flex !important;
    width: 32px !important;
    height: 32px !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 16px !important;
    color: #ff4d4f !important;
    cursor: pointer !important;
    border-radius: 6px !important;
    transition: background 0.15s ease !important;
}

.emoji-list-wrapper .clear-react:hover {
    background-color: rgba(255, 77, 79, 0.2) !important;
}

.emoji-list-wrapper {
    position: absolute !important;
    top: -195px !important;
    padding-bottom: 20px !important;
    z-index: 999999 !important;
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
        if (!cssContent.includes('/* === ZALO 82 EMOJI GRID WINDOWS/LINUX PATCH === */')) {
          fs.appendFileSync(fullPath, cssOverride, 'utf8');
          logger.dim(`Injected reaction CSS grid into: ${path.basename(fullPath)}`);
        }
      }
    }
  }

  walkCss(pcDistDir);
  logger.success('Completed 82 Emoji Reaction patch');
}

if (require.main === module) {
  main();
}

module.exports = { main };
