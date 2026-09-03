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
            content = content.replace(overrideKey, `d.default.reactionMsgInfo=${orderedJson}`);
            patched = true;
          }

          if (patched) {
            fs.writeFileSync(fullPath, content, 'utf8');
            logger.success(`Patched 82 emoji reactions in JS: ${path.basename(fullPath)}`);
            jsFilesPatched++;
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
/* === ZALO 82 EMOJI GRID WINDOWS/LINUX PATCH === */

/* 1. Reset animation and opacity for reaction popup icons */
.emoji-list-wrapper .reaction-emoji-icon,
.zadark-reaction__emoji {
    animation: none !important;
    animation-delay: 0ms !important;
    transition: none !important;
    opacity: 1 !important;
    visibility: visible !important;
}

/* 2. Quick Reaction Hover Bar (Single Horizontal Line of 6 Icons) */
.emoji-list-wrapper:not(.show-elist) .reaction-emoji-list {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    width: auto !important;
    max-width: none !important;
    height: 36px !important;
    border-radius: 20px !important;
    padding: 0 6px !important;
    overflow: visible !important;
}

.emoji-list-wrapper:not(.show-elist) .reaction-emoji-icon {
    display: inline-flex !important;
    flex: 0 0 24px !important;
    width: 24px !important;
    height: 24px !important;
    margin: 0 3px !important;
    position: relative !important;
}

/* 3. Expanded Reaction Grid (6 Icons per Row) */
.emoji-list-wrapper.show-elist .reaction-emoji-list {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: wrap !important;
    align-content: flex-start !important;
    align-items: center !important;
    justify-content: flex-start !important;
    width: 252px !important;
    max-width: 252px !important;
    min-width: 252px !important;
    max-height: 200px !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    padding: 6px !important;
    border-radius: 12px !important;
    background-color: var(--reaction-background, #22262B) !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    box-sizing: border-box !important;
}

.emoji-list-wrapper.show-elist .reaction-emoji-icon {
    display: inline-flex !important;
    flex: 0 0 36px !important;
    width: 36px !important;
    max-width: 36px !important;
    height: 36px !important;
    max-height: 36px !important;
    margin: 2px !important;
    padding: 0 !important;
    align-items: center !important;
    justify-content: center !important;
    box-sizing: border-box !important;
    float: left !important;
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
}

/* Position adjustment for expanded popover */
div[style*="position: relative"] > .emoji-list-wrapper.show-elist,
div[style*="position:relative"] > .emoji-list-wrapper.show-elist {
    position: absolute !important;
    top: -215px !important;
    left: 0 !important;
    right: auto !important;
    z-index: 999999 !important;
}

.emoji-list-wrapper .clear-react,
.emoji-list-wrapper .reaction-emoji-icon i.clear-react {
    display: inline-flex !important;
    width: 36px !important;
    height: 36px !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 16px !important;
    color: #ff4d4f !important;
    cursor: pointer !important;
    border-radius: 6px !important;
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
