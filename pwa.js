/* =========================================================
   PWA — pasang aplikasi, layar penuh, dan akses offline
   ---------------------------------------------------------
   Service worker hanya aktif bila aplikasi dibuka lewat
   http/https (mis. GitHub Pages), bukan dari file lokal.
   ========================================================= */
'use strict';

let pwaInstallEvent = null;

function pwaStandalone() {
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
  return window.navigator.standalone === true;
}

function pwaFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function pwaFullscreenSupported() {
  const el = document.documentElement;
  return !!(el.requestFullscreen || el.webkitRequestFullscreen);
}

function pwaToggleFullscreen() {
  const el = document.documentElement;
  if (pwaFullscreenElement()) {
    try {
      const exit = document.exitFullscreen ? document.exitFullscreen() : (document.webkitExitFullscreen && document.webkitExitFullscreen());
      if (exit && typeof exit.catch === 'function') exit.catch(() => {});
    } catch (err) { /* abaikan */ }
    pwaRefreshUI();
    return;
  }
  const request = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!request) {
    toast('Browser ini belum mendukung layar penuh. Pasang aplikasi ke layar utama untuk tampilan penuh.', 'error');
    return;
  }
  try {
    const result = request.call(el);
    if (result && typeof result.then === 'function') {
      result
        .then(() => toast('Layar penuh aktif. Tekan Esc untuk keluar.'))
        .catch(() => toast('Layar penuh tidak dapat diaktifkan di browser ini.', 'error'));
    } else {
      toast('Layar penuh aktif.');
    }
  } catch (err) {
    toast('Layar penuh tidak dapat diaktifkan di browser ini.', 'error');
  }
  pwaRefreshUI();
}

function pwaAppUrl() {
  if (location.protocol === 'http:' || location.protocol === 'https:') {
    return `${location.origin}${location.pathname}`;
  }
  return 'https://bengkel24.github.io/GPIBT-Maranatha-Tolitoli/';
}

function pwaInstallHelp() {
  openModal({
    title: 'Pasang Aplikasi',
    subtitle: 'Buka lebih cepat lewat ikon di layar utama',
    body: `
      <div class="install-steps">
        <div class="install-step">
          <span class="install-num">1</span>
          <div><b>HP Android (Chrome)</b><p>Buka menu <b>⋮</b> → <b>Instal aplikasi</b> atau <b>Tambahkan ke layar utama</b>.</p></div>
        </div>
        <div class="install-step">
          <span class="install-num">2</span>
          <div><b>iPhone / iPad (Safari)</b><p>Ketuk tombol <b>Bagikan</b> → <b>Tambah ke Layar Utama</b>.</p></div>
        </div>
        <div class="install-step">
          <span class="install-num">3</span>
          <div><b>Laptop (Chrome / Edge)</b><p>Klik ikon <b>instal</b> di kanan address bar, atau menu <b>⋮</b> → <b>Instal Sekretariat…</b>. Setelah terpasang, klik kanan ikon di taskbar → <b>Sematkan ke taskbar</b>.</p></div>
        </div>
      </div>
      <div class="detail-note" style="margin-top:4px">
        ${icon('alert')} Buka aplikasi dari alamat <b>${esc(pwaAppUrl())}</b> (bukan file yang diunduh). Setelah terpasang, aplikasi dapat dibuka tanpa internet dan data tetap tersimpan di perangkat.
      </div>`,
    footer: `<button class="btn btn-primary" data-action="modal-close">Mengerti</button>`,
  });
}

async function pwaInstall() {
  if (pwaStandalone()) {
    toast('Aplikasi sudah terpasang di perangkat ini.');
    return;
  }
  if (pwaInstallEvent) {
    pwaInstallEvent.prompt();
    try {
      const choice = await pwaInstallEvent.userChoice;
      if (choice && choice.outcome === 'accepted') {
        toast('Aplikasi dipasang. Cari ikon Maranatha di layar utama.');
      }
    } catch (err) { /* abaikan */ }
    pwaInstallEvent = null;
    pwaRefreshUI();
    return;
  }
  pwaInstallHelp();
}

function pwaRefreshUI() {
  const standalone = pwaStandalone();
  const fs = !!pwaFullscreenElement();
  document.querySelectorAll('[data-pwa-install]').forEach((el) => {
    el.classList.toggle('hidden', standalone);
  });
  document.querySelectorAll('[data-pwa-installed]').forEach((el) => {
    el.classList.toggle('hidden', !standalone);
  });
  document.querySelectorAll('[data-pwa-fullscreen-label]').forEach((el) => {
    el.textContent = fs ? 'Keluar Layar Penuh' : 'Layar Penuh';
  });
  document.querySelectorAll('[data-pwa-fullscreen-icon]').forEach((el) => {
    el.setAttribute('href', fs ? '#i-minimize' : '#i-maximize');
  });
  document.querySelectorAll('[data-pwa-state]').forEach((el) => {
    el.textContent = standalone ? 'Terpasang' : (pwaInstallEvent ? 'Siap dipasang' : 'Belum dipasang');
    el.className = `badge ${standalone ? 'green' : (pwaInstallEvent ? 'gold' : 'gray')}`;
  });
  document.body.classList.toggle('pwa-standalone', standalone);
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  pwaInstallEvent = e;
  pwaRefreshUI();
});

window.addEventListener('appinstalled', () => {
  pwaInstallEvent = null;
  pwaRefreshUI();
  toast('Aplikasi berhasil dipasang di perangkat ini.');
});

document.addEventListener('fullscreenchange', pwaRefreshUI);
document.addEventListener('webkitfullscreenchange', pwaRefreshUI);

if (window.matchMedia) {
  const mq = window.matchMedia('(display-mode: standalone)');
  if (mq.addEventListener) mq.addEventListener('change', pwaRefreshUI);
}

if ('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('Service worker gagal didaftarkan:', err);
    });
  });
}

pwaRefreshUI();
