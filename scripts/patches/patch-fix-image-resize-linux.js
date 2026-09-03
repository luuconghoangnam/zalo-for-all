const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

const APP_DIR = path.join(__dirname, '..', '..', 'app');

// Zalo's native photo-resize library ("zimage", app/native/nativelibs/zimage)
// can fail or be missing on certain platforms/formats (e.g. clipboard paste,
// Wayland, or unsupported color profiles). When the native resize call fails,
// Zalo throws IMAGE_LOAD_FAILED ("IMG element failed to load image"), which
// makes the renderer fall back to sending the photo as a generic file
// attachment ("Có lỗi xảy ra trong quá trình xử lý ảnh. Ảnh sau sẽ được gửi dưới dạng file").
// This patch makes the resize task fall back to the original, unresized image
// bytes when the native resize call fails, instead of throwing — ensuring the
// image is ALWAYS sent as a real inline photo!
async function main() {
  const mediaJsPath = path.join(APP_DIR, 'main-dist', 'utility-process-media.js');

  if (!fs.existsSync(mediaJsPath)) {
    logger.warn('utility-process-media.js not present, skipping image-resize fallback patch');
    return;
  }

  let content = fs.readFileSync(mediaJsPath, 'utf8');

  // Universal regex matching across all Zalo versions (handles changing minified variable names and zsymb hashes)
  const regex = /try\{const t=await Y\.resizeImage\(c,n,r,i,"image\/jpeg"===o\?"jpeg":"png"\);if\(null==t\)throw [^;]+,new q;if\(s\)try\{await ([^.]+)\.a\.promises\.writeFile\(s,new Uint8Array\(t\)\)\}catch\([^)]+\)\{[^}]+\}\}catch\([^)]+\)\{throw [^;]+,new q\}/;
  const match = content.match(regex);

  if (match) {
    const fsObj = match[1];
    const replacement = `try{let t;try{t=await Y.resizeImage(c,n,r,i,"image/jpeg"===o?"jpeg":"png")}catch(_){t=null}if(null==t){t=c}if(s)try{await ${fsObj}.a.promises.writeFile(s,new Uint8Array(t))}catch(u){}}catch(l){if(s)try{await ${fsObj}.a.promises.writeFile(s,c)}catch(_){}}`;
    content = content.replace(match[0], replacement);
    fs.writeFileSync(mediaJsPath, content, 'utf8');
    logger.success('Patched utility-process-media.js: safe fallback to original image bytes on resize failure');
  } else if (content.includes('catch(zNativeErr)') || content.includes('if(null==t){t=c}')) {
    logger.dim('utility-process-media.js already patched with image resize fallback');
  } else {
    logger.warn('Pattern for resize-handler not found in utility-process-media.js');
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
