"""
Zalo Dual-Boot Session & Cookie Synchronizer
Ensures persistent login and message loading between Windows (Official Native) and Linux (zalo-for-all).
"""
import os
import sys
import json
import base64
import sqlite3

SHARED_DIR = r"D:\ZaloDataShared\ZaloData"
COOKIES_DB = os.path.join(SHARED_DIR, "Partitions", "zalo", "Network", "Cookies")
LOCAL_STATE = os.path.join(SHARED_DIR, "Local State")
DB_CONFIG = os.path.join(SHARED_DIR, "database-config.json")

def get_windows_dpapi_aes_key():
    import ctypes
    import ctypes.wintypes
    class DATA_BLOB(ctypes.Structure):
        _fields_ = [('cbData', ctypes.wintypes.DWORD), ('pbData', ctypes.POINTER(ctypes.c_char))]
    def unprotect(data):
        blob_in = DATA_BLOB(len(data), ctypes.cast(ctypes.create_string_buffer(data), ctypes.POINTER(ctypes.c_char)))
        blob_out = DATA_BLOB()
        if ctypes.windll.crypt32.CryptUnprotectData(ctypes.byref(blob_in), None, None, None, None, 0, ctypes.byref(blob_out)):
            res = ctypes.string_at(blob_out.pbData, blob_out.cbData)
            ctypes.windll.kernel32.LocalFree(blob_out.pbData)
            return res
        return None
    if not os.path.exists(LOCAL_STATE):
        return None
    try:
        with open(LOCAL_STATE, 'r', encoding='utf-8') as f:
            s = json.load(f)
        enc_key_b64 = s.get('os_crypt', {}).get('encrypted_key')
        if not enc_key_b64:
            return None
        raw_key = base64.b64decode(enc_key_b64)[5:] # strip 'DPAPI' prefix
        return unprotect(raw_key)
    except Exception as e:
        print(f"[Sync] Error reading DPAPI key: {e}")
        return None

def encrypt_aes_gcm(plaintext, key):
    # Chromium format: b'v10' + 12-byte nonce + ciphertext + 16-byte tag
    # Using python cryptography if available, or Node.js bridge
    try:
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        aesgcm = AESGCM(key)
        nonce = os.urandom(12)
        ct = aesgcm.encrypt(nonce, plaintext.encode('utf-8'), None)
        return b'v10' + nonce + ct
    except ImportError:
        import subprocess
        script = f"""
        const crypto = require('crypto');
        const key = Buffer.from('{key.hex()}', 'hex');
        const nonce = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
        const ct = Buffer.concat([cipher.update({json.dumps(plaintext)}, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();
        const res = Buffer.concat([Buffer.from('v10'), nonce, ct, tag]);
        process.stdout.write(res.toString('base64'));
        """
        out = subprocess.check_output(['node', '-e', script])
        return base64.b64decode(out)

def sync_on_windows():
    print("[Sync] Running Windows sync routine...")
    # 1. Clean up Linux locks
    for f in ["SingletonLock", "SingletonSocket", "SingletonCookie", "lockfile"]:
        lp = os.path.join(SHARED_DIR, f)
        if os.path.exists(lp):
            try:
                os.remove(lp)
                print(f"[Sync] Removed Linux lock: {f}")
            except Exception as e:
                print(f"[Sync] Failed to remove {f}: {e}")

    # 2. Check and fix database-config.json
    if os.path.exists(DB_CONFIG):
        try:
            with open(DB_CONFIG, 'r', encoding='utf-8') as f:
                cfg = json.load(f)
            changed = False
            user_progs = cfg.get('db-enc', {}).get('userDBprogress', {})
            for uid in list(user_progs.keys()):
                if user_progs[uid] != "finished":
                    user_progs[uid] = "finished"
                    changed = True
            if changed:
                with open(DB_CONFIG, 'w', encoding='utf-8') as f:
                    json.dump(cfg, f, indent='\t')
                print("[Sync] Ensured userDBprogress is 'finished' in database-config.json")
        except Exception as e:
            print(f"[Sync] Error checking database-config.json: {e}")

    # 3. Synchronize cookies (Linux plaintext -> Windows DPAPI AES-GCM)
    if not os.path.exists(COOKIES_DB):
        print(f"[Sync] Cookies database not found at {COOKIES_DB}")
        return

    key = get_windows_dpapi_aes_key()
    if not key:
        print("[Sync] Could not retrieve Windows DPAPI key. Skipping cookie re-encryption.")
        return

    try:
        con = sqlite3.connect(COOKIES_DB)
        cur = con.cursor()
        rows = cur.execute("SELECT host_key, name, path, value, length(encrypted_value) FROM cookies WHERE name='zpw_sek'").fetchall()
        updated = 0
        for host_key, name, path, value, enc_len in rows:
            if value and (enc_len is None or enc_len == 0):
                enc = encrypt_aes_gcm(value, key)
                cur.execute("UPDATE cookies SET encrypted_value = ? WHERE host_key = ? AND name = ? AND path = ?",
                            (enc, host_key, name, path))
                updated += 1
        if updated > 0:
            con.commit()
            print(f"[Sync] Successfully encrypted {updated} zpw_sek cookies for Windows DPAPI!")
        else:
            print("[Sync] Cookies are already properly encrypted for Windows.")
        con.close()
    except Exception as e:
        print(f"[Sync] Error synchronizing cookies: {e}")

    # 4. Auto-check and patch 82 emoji reactions if unpatched or updated
    patch_script = os.path.join(os.path.dirname(__file__), "patch_windows_zalo.js")
    if not os.path.exists(patch_script):
        patch_script = r"d:\NextCloud\Repos\zalo-for-all\scripts\patch_windows_zalo.js"
    if os.path.exists(patch_script):
        try:
            import subprocess
            subprocess.run(["node", patch_script], capture_output=True, text=True, timeout=30)
            print("[Sync] Checked 82 Emoji Reaction patch status.")
        except Exception as e:
            print(f"[Sync] Emoji patch check error: {e}")

def sync_on_linux():
    print("[Sync] Running Linux sync routine...")
    for f in ["SingletonLock", "SingletonSocket", "lockfile"]:
        lp = os.path.join(SHARED_DIR, f)
        if os.path.exists(lp):
            try:
                os.remove(lp)
            except Exception:
                pass
    print("[Sync] Linux sync complete.")

if __name__ == "__main__":
    if sys.platform == "win32":
        sync_on_windows()
    else:
        sync_on_linux()
