const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

const APP_DIR = path.join(__dirname, '..', '..', 'app');

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

    // 4. Activity Action Logs
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

async function main() {
  if (!fs.existsSync(APP_DIR)) {
    logger.warn('app directory not found, skipping privacy blocker patch');
    return;
  }

  // 1. Write privacy-blocker.js
  const blockerPath = path.join(APP_DIR, 'privacy-blocker.js');
  fs.writeFileSync(blockerPath, privacyBlockerCode, 'utf8');
  logger.success('Created privacy-blocker.js in app root');

  // 2. Inject into bootstrap.js if exists
  const bootstrapPath = path.join(APP_DIR, 'bootstrap.js');
  if (fs.existsSync(bootstrapPath)) {
    let content = fs.readFileSync(bootstrapPath, 'utf8');
    if (!content.includes('./privacy-blocker')) {
      content = "require('./privacy-blocker');\n" + content;
      fs.writeFileSync(bootstrapPath, content, 'utf8');
      logger.success('Injected privacy-blocker into bootstrap.js');
    }
  }

  // 3. Inject into main-dist/main.js if exists
  const mainDistPath = path.join(APP_DIR, 'main-dist', 'main.js');
  if (fs.existsSync(mainDistPath)) {
    let content = fs.readFileSync(mainDistPath, 'utf8');
    if (!content.includes('privacy-blocker')) {
      content = "try { require('../privacy-blocker'); } catch (_) {}\n" + content;
      fs.writeFileSync(mainDistPath, content, 'utf8');
      logger.success('Injected privacy-blocker fallback into main-dist/main.js');
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
