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
/* === ZALO 82 EMOJI GRID WINDOWS/LINUX PATCH V5 === */

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

/* 2. Quick Reaction Hover Bar (Show only first 6 icons in horizontal bar) */
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
    overflow: hidden !important;
}

.emoji-list-wrapper:not(.show-elist) .reaction-emoji-icon {
    display: inline-flex !important;
    flex: 0 0 24px !important;
    width: 24px !important;
    height: 24px !important;
    margin: 0 3px !important;
    position: relative !important;
    transform: scale(1) !important;
    opacity: 1 !important;
    visibility: visible !important;
}

.emoji-list-wrapper:not(.show-elist) .reaction-emoji-icon:nth-child(n+7) {
    display: none !important;
}

/* 3. Expanded Reaction Grid (6 Icons per Row, perfectly balanced & symmetrical) */
.emoji-list-wrapper.show-elist .reaction-emoji-list,
.message-reaction-container-v2 .emoji-list-wrapper.show-elist .reaction-emoji-list {
    display: grid !important;
    grid-template-columns: repeat(6, 36px) !important;
    gap: 4px !important;
    justify-content: center !important;
    align-content: start !important;
    width: auto !important;
    max-width: fit-content !important;
    min-width: unset !important;
    max-height: 230px !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    padding: 8px !important;
    border-radius: 12px !important;
    background-color: var(--reaction-background, #22262B) !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    box-sizing: border-box !important;
    scrollbar-width: thin !important;
}

.emoji-list-wrapper.show-elist .reaction-emoji-list::-webkit-scrollbar,
.message-reaction-container-v2 .emoji-list-wrapper.show-elist .reaction-emoji-list::-webkit-scrollbar {
    width: 4px !important;
}

.emoji-list-wrapper.show-elist .reaction-emoji-list::-webkit-scrollbar-thumb,
.message-reaction-container-v2 .emoji-list-wrapper.show-elist .reaction-emoji-list::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.25) !important;
    border-radius: 4px !important;
}

.emoji-list-wrapper.show-elist .reaction-emoji-icon,
.message-reaction-container-v2 .emoji-list-wrapper.show-elist .reaction-emoji-icon {
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
.emoji-list-wrapper.show-elist,
div[style*="position: relative"] > .emoji-list-wrapper.show-elist,
div[style*="position:relative"] > .emoji-list-wrapper.show-elist {
    position: absolute !important;
    transform: none !important;
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
      if (content.includes('/* === ZALO 82 EMOJI GRID WINDOWS/LINUX PATCH V5 === */')) {
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
            content = content.replace(overrideKey, `d.default.reactionMsgInfo=${orderedJson}`);
            patched = true;
          }

          // Dynamic adaptive positioning for reaction popover
          const refTarget = 'ref:e=>this._eList=e';
          const refReplacement = 'ref:e=>{this._eList=e;e&&setTimeout((()=>{try{let p=e.parentElement;if(!p||!p.classList.contains("show-elist"))return;let r=p.getBoundingClientRect(),w=window.innerWidth,s=p.closest(".chat-message-list")||p.closest(".chat-view")||p.closest("#chat-box")||document.body,c=s.getBoundingClientRect();w-r.left<280||c.right-r.left<280?(p.style.setProperty("left","auto","important"),p.style.setProperty("right","0px","important")):(p.style.setProperty("left","0px","important"),p.style.setProperty("right","auto","important"));r.top<260?(p.style.setProperty("top","35px","important"),p.style.setProperty("bottom","auto","important")):(p.style.setProperty("top","-245px","important"),p.style.setProperty("bottom","auto","important"))}catch(_){}}),0)}';
          if (content.includes(refTarget)) {
            content = content.replace(refTarget, refReplacement);
            patched = true;
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
