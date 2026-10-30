/* =========================================================
   Kunci akses administrator (login lokal)
   ---------------------------------------------------------
   Kata sandi disimpan sebagai hash di localStorage perangkat.
   Ini adalah kunci tampilan aplikasi, bukan enkripsi data.
   ========================================================= */
'use strict';

const AUTH_STORAGE_KEY = 'gm_tolitoli_auth_v1';
const AUTH_SESSION_KEY = 'gm_tolitoli_session';
const AUTH_TRUST_KEY = 'gm_tolitoli_trust';
const AUTH_DEFAULT_PASSWORD = 'maranatha2026';
const AUTH_TRUST_DAYS = 30;
const AUTH_VERSION = 1;

function authRandomSalt() {
  const bytes = new Uint8Array(16);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* Cadangan bila Web Crypto tidak tersedia (mis. browser lama) */
function fnv1aHash(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

async function authHash(password, salt) {
  const payload = `${salt}:${password}`;
  try {
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
      return 'sha256$' + Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) { /* lanjut ke cadangan */ }
  return 'fnv$' + fnv1aHash(payload);
}

function authRead() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !data.hash || !data.salt) return null;
    return data;
  } catch (err) {
    return null;
  }
}

function authSave(data) {
  data.v = AUTH_VERSION;
  data.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    toast('Gagal menyimpan kata sandi di perangkat ini.', 'error');
  }
}

async function authEnsure() {
  const existing = authRead();
  if (existing) return existing;
  const salt = authRandomSalt();
  const data = { salt, hash: await authHash(AUTH_DEFAULT_PASSWORD, salt), isDefault: true };
  authSave(data);
  return data;
}

function authTrusted() {
  try {
    const raw = localStorage.getItem(AUTH_TRUST_KEY);
    if (!raw) return false;
    const trust = JSON.parse(raw);
    if (!trust || !trust.exp || Date.now() > trust.exp) {
      localStorage.removeItem(AUTH_TRUST_KEY);
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

function authSessionActive() {
  try {
    return sessionStorage.getItem(AUTH_SESSION_KEY) === '1';
  } catch (err) {
    return false;
  }
}

function authUnlocked() {
  return authSessionActive() || authTrusted();
}

async function authVerify(password) {
  const data = await authEnsure();
  const hash = await authHash(password, data.salt);
  return hash === data.hash;
}

/* ---------------- layar login ---------------- */
function authLoginHTML() {
  const info = authRead();
  const isDefault = !info || info.isDefault;
  return `
    <div class="login-card">
      <div class="login-brand">
        <div class="brand-mark">✝</div>
        <div>
          <b>Maranatha</b>
          <span>Tolitoli</span>
        </div>
      </div>
      <h2>Sekretariat Jemaat</h2>
      <p class="lead">Masukkan kata sandi administrator untuk membuka aplikasi.</p>
      <form id="loginForm" autocomplete="on">
        <label class="field">Kata Sandi
          <span class="pw-field">
            <input type="password" name="password" id="loginPassword" required autocomplete="current-password" placeholder="Masukkan kata sandi">
            <button type="button" class="pw-toggle" data-action="auth-toggle-pw" aria-label="Tampilkan kata sandi">${icon('eye')}</button>
          </span>
        </label>
        <label class="login-remember">
          <input type="checkbox" name="remember" value="1">
          <span>Ingat perangkat ini selama ${AUTH_TRUST_DAYS} hari</span>
        </label>
        <p class="login-error" id="loginError" role="alert"></p>
        <button type="submit" class="btn btn-gold btn-block">${icon('lock')} Masuk</button>
      </form>
      ${isDefault ? `<p class="login-hint">${icon('alert')}<span>Kata sandi bawaan: <b>${AUTH_DEFAULT_PASSWORD}</b>. Segera ganti melalui menu <b>Pengaturan → Keamanan Aplikasi</b>.</span></p>` : ''}
    </div>
    <div class="login-foot">© 2026 Gereja Maranatha Tolitoli · Sistem Informasi Jemaat</div>`;
}

function showLoginScreen() {
  const root = document.getElementById('loginRoot');
  if (!root) return;
  root.innerHTML = authLoginHTML();
  root.classList.remove('hidden');
  document.body.classList.add('locked');
  const input = root.querySelector('#loginPassword');
  if (input) {
    try { input.focus({ preventScroll: true }); } catch (err) { input.focus(); }
  }
}

function hideLoginScreen() {
  const root = document.getElementById('loginRoot');
  if (root) {
    root.classList.add('hidden');
    root.innerHTML = '';
  }
  document.body.classList.remove('locked');
}

function togglePasswordField(btn) {
  const wrap = btn.closest('.pw-field');
  const input = wrap && wrap.querySelector('input');
  if (!input) return;
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  btn.innerHTML = icon(show ? 'eye-off' : 'eye');
  btn.setAttribute('aria-label', show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
  input.focus();
}

async function submitLogin(form) {
  const fd = new FormData(form);
  const password = String(fd.get('password') || '');
  const remember = fd.get('remember') === '1';
  const errorEl = form.querySelector('#loginError');
  const button = form.querySelector('button[type=submit]');

  if (!password) {
    if (errorEl) errorEl.textContent = 'Kata sandi wajib diisi.';
    return;
  }
  if (button) { button.disabled = true; button.classList.add('is-loading'); }
  if (errorEl) errorEl.textContent = '';

  const ok = await authVerify(password);

  if (button) { button.disabled = false; button.classList.remove('is-loading'); }

  if (!ok) {
    if (errorEl) errorEl.textContent = 'Kata sandi salah. Silakan coba lagi.';
    const input = form.querySelector('#loginPassword');
    if (input) { input.value = ''; input.focus(); }
    return;
  }

  try { sessionStorage.setItem(AUTH_SESSION_KEY, '1'); } catch (err) { /* abaikan */ }
  if (remember) {
    try {
      localStorage.setItem(AUTH_TRUST_KEY, JSON.stringify({ exp: Date.now() + AUTH_TRUST_DAYS * 86400000 }));
    } catch (err) { /* abaikan */ }
  }

  hideLoginScreen();
  form.reset();
  if (typeof render === 'function') render();
  if (typeof toast === 'function') toast('Selamat datang, Majelis Jemaat.');
}

function lockApp() {
  try { sessionStorage.removeItem(AUTH_SESSION_KEY); } catch (err) { /* abaikan */ }
  try { localStorage.removeItem(AUTH_TRUST_KEY); } catch (err) { /* abaikan */ }
  if (document.body.classList.contains('presenting') && typeof closePresentation === 'function') closePresentation();
  if (typeof closeModal === 'function') closeModal();
  if (typeof closeSidebar === 'function') closeSidebar();
  const app = document.getElementById('app');
  if (app) app.innerHTML = '';
  showLoginScreen();
  if (typeof toast === 'function') toast('Aplikasi dikunci.');
}

async function savePasswordForm(form) {
  const fd = new FormData(form);
  const current = String(fd.get('current') || '');
  const next = String(fd.get('next') || '');
  const confirm = String(fd.get('confirm') || '');

  if (!current) { toast('Masukkan kata sandi saat ini.', 'error'); return; }
  if (!(await authVerify(current))) { toast('Kata sandi saat ini salah.', 'error'); return; }
  if (next.length < 6) { toast('Kata sandi baru minimal 6 karakter.', 'error'); return; }
  if (next !== confirm) { toast('Konfirmasi kata sandi baru tidak sama.', 'error'); return; }

  const salt = authRandomSalt();
  authSave({ salt, hash: await authHash(next, salt), isDefault: false });
  try { sessionStorage.setItem(AUTH_SESSION_KEY, '1'); } catch (err) { /* abaikan */ }
  form.reset();
  if (typeof rerender === 'function') rerender({ keepScroll: true });
  toast('Kata sandi administrator diperbarui.');
}

/* ---------------- boot ---------------- */
async function startApp() {
  await authEnsure();
  if (authUnlocked()) {
    hideLoginScreen();
    if (typeof render === 'function') render();
  } else {
    showLoginScreen();
  }
}

document.addEventListener('submit', (e) => {
  const form = e.target;
  if (!form || form.id !== 'loginForm') return;
  e.preventDefault();
  submitLogin(form);
});
