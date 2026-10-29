/* =========================================================
   Router & interaksi aplikasi
   ========================================================= */
'use strict';

const UI = {
  jemaat: { q: '', wilayah: '', kategori: '', status: '' },
  keuangan: { bulan: currentMonth(), jenis: '', q: '', kas: '' },
  warta: { kategori: '' },
  jadwal: { tab: 'jadwal' },
  kegiatan: { filter: 'akan' },
};

const PAGE_META = {
  beranda: { crumb: 'Beranda', title: 'Beranda' },
  jemaat: { crumb: 'Data Jemaat', title: 'Data Jemaat' },
  keuangan: { crumb: 'Keuangan', title: 'Keuangan' },
  ibadah: { crumb: 'Tata Ibadah', title: 'Tata Ibadah' },
  warta: { crumb: 'Warta Jemaat', title: 'Warta Jemaat' },
  jadwal: { crumb: 'Jadwal Pelayanan', title: 'Jadwal Pelayanan' },
  kegiatan: { crumb: 'Kegiatan Jemaat', title: 'Kegiatan Jemaat' },
  struktur: { crumb: 'Struktur Organisasi', title: 'Struktur Organisasi' },
  pengaturan: { crumb: 'Pengaturan', title: 'Pengaturan' },
};

const ROUTES = {
  beranda: renderDashboard,
  jemaat: renderJemaat,
  keuangan: renderKeuangan,
  ibadah: renderIbadah,
  warta: renderWarta,
  jadwal: renderJadwal,
  kegiatan: renderKegiatan,
  struktur: renderStruktur,
  pengaturan: renderPengaturan,
};

function getRoute() {
  const raw = String(window.location.hash || '').replace(/^#\/?/, '');
  if (!raw) return { page: 'beranda', params: [] };
  const parts = raw.split('/').filter(Boolean);
  return { page: parts[0] || 'beranda', params: parts.slice(1) };
}

let _lastPage = '';

function render(opts = {}) {
  const { keepScroll = false, focus = null } = opts;
  const scrollY = window.scrollY;
  const { page, params } = getRoute();
  const key = ROUTES[page] ? page : 'beranda';
  const editing = key === 'ibadah' && params[0] === 'edit';
  let html = '';
  try {
    html = editing ? renderIbadahEditor(params[1] || 'baru') : ROUTES[key]();
  } catch (err) {
    console.error(err);
    html = `<div class="card pad">${emptyState('Terjadi kesalahan', 'Muat ulang halaman atau periksa data aplikasi.', 'alert')}</div>`;
  }
  document.getElementById('app').innerHTML = html;

  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === key));
  const meta = PAGE_META[key];
  document.getElementById('crumbPage').textContent = editing ? 'Edit Tata Ibadah' : meta.crumb;
  document.title = `${editing ? 'Edit Tata Ibadah' : meta.title} — ${DB.settings.nama}`;
  document.getElementById('todayDate').textContent = `${dayName(todayISO())}, ${dateMedium(todayISO())}`;
  updateSidebar();

  if (!keepScroll) window.scrollTo(0, 0);
  else window.scrollTo(0, scrollY);

  if (focus) {
    const el = document.querySelector(focus);
    if (el) {
      el.focus();
      if (typeof el.setSelectionRange === 'function') {
        const len = String(el.value || '').length;
        try { el.setSelectionRange(len, len); } catch (e) { /* ignore */ }
      }
    }
  }
  _lastPage = key;
}

function rerender(opts = {}) {
  render({ keepScroll: true, ...opts });
}

function updateSidebar() {
  const next = nextSchedule();
  const lit = nextLiturgy();
  const serviceEl = document.getElementById('sideNextService');
  const themeEl = document.getElementById('sideNextTheme');
  if (next) {
    serviceEl.textContent = `${dateShort(next.tanggal)} · ${next.jam} WITA`;
    themeEl.textContent = lit ? lit.tema : next.ibadah;
  } else {
    serviceEl.textContent = 'Belum ada jadwal';
    themeEl.textContent = 'Tambahkan jadwal pelayanan';
  }
}

/* ---------------- sidebar mobile ---------------- */
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarScrim').classList.add('show');
  document.body.classList.add('modal-open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarScrim').classList.remove('show');
  if (!document.getElementById('modalRoot').innerHTML) document.body.classList.remove('modal-open');
}
function toggleSidebar() {
  document.getElementById('sidebar').classList.contains('open') ? closeSidebar() : openSidebar();
}

/* ---------------- filters ---------------- */
const debouncedJemaatSearch = debounce(() => rerender({ focus: '#jemaatSearch' }), 220);
const debouncedTxSearch = debounce(() => rerender({ focus: '#txSearch' }), 220);

/* ---------------- import / export ---------------- */
function exportAllData() {
  downloadJSON(`Maranatha-Backup-${todayISO()}.json`, DB);
  toast('Cadangan data diunduh.');
}

function handleImportFile(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!data || typeof data !== 'object' || !data.settings || !Array.isArray(data.jemaat)) {
        throw new Error('Format tidak sesuai');
      }
      confirmDialog({
        title: 'Impor Data',
        message: `Impor data dari <b>${esc(file.name)}</b>? Data saat ini (${DB.jemaat.length} jemaat, ${DB.transaksi.length} transaksi) akan diganti.`,
        confirmText: 'Impor & Ganti Data',
        danger: false,
        onConfirm: () => {
          data.meta = data.meta || {};
          data.meta.updatedAt = new Date().toISOString();
          ['transaksi', 'ibadah', 'jadwal', 'pelayan', 'warta', 'kegiatan', 'struktur'].forEach((k) => {
            if (!Array.isArray(data[k])) data[k] = [];
          });
          replaceDB(data);
          UI.jemaat = { q: '', wilayah: '', kategori: '', status: '' };
          UI.keuangan = { bulan: currentMonth(), jenis: '', q: '', kas: '' };
          UI.warta = { kategori: '' };
          render();
          toast('Data berhasil diimpor.');
        },
      });
    } catch (err) {
      console.error(err);
      toast('File tidak valid. Gunakan file JSON hasil ekspor aplikasi.', 'error');
    } finally {
      input.value = '';
    }
  };
  reader.readAsText(file);
}

/* ---------------- forms ---------------- */
document.addEventListener('submit', (e) => {
  const form = e.target;
  const handlers = {
    jemaatForm: saveJemaatForm,
    txForm: saveTxForm,
    wartaForm: saveWartaForm,
    jadwalForm: saveJadwalForm,
    pelayanForm: savePelayanForm,
    kegiatanForm: saveKegiatanForm,
    orgForm: saveOrgForm,
    liturgyForm: saveLiturgyForm,
    settingsForm: saveSettingsForm,
    saldoKasForm: saveSaldoKasForm,
  };
  const handler = handlers[form.id];
  if (!handler) return;
  e.preventDefault();
  handler(form);
});

/* ---------------- input / change ---------------- */
document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.id === 'jemaatSearch') {
    UI.jemaat.q = t.value;
    debouncedJemaatSearch();
  } else if (t.id === 'txSearch') {
    UI.keuangan.q = t.value;
    debouncedTxSearch();
  } else if (t.classList && t.classList.contains('lit-durasi')) {
    updateLiturgySummary();
  }
});

document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.id === 'jemaatWilayah') { UI.jemaat.wilayah = t.value; rerender({ keepScroll: true }); }
  else if (t.id === 'jemaatKategori') { UI.jemaat.kategori = t.value; rerender({ keepScroll: true }); }
  else if (t.id === 'jemaatStatus') { UI.jemaat.status = t.value; rerender({ keepScroll: true }); }
  else if (t.id === 'txMonth') { UI.keuangan.bulan = t.value || currentMonth(); rerender({ keepScroll: true }); }
  else if (t.id === 'txKasFilter') { UI.keuangan.kas = t.value; rerender({ keepScroll: true }); }
  else if (t.id === 'txJenisFilter') { UI.keuangan.jenis = t.value; rerender({ keepScroll: true }); }
  else if (t.id === 'txJenis') { refreshTxCategories(); }
  else if (t.id === 'importFile') { handleImportFile(t); }
});

/* ---------------- click actions ---------------- */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  const id = el.dataset.id;

  if (action === 'modal-backdrop') {
    if (e.target === el) closeModal();
    return;
  }
  if (action === 'modal-close') { closeModal(); return; }
  if (action === 'confirm-yes') { runConfirm(); return; }

  switch (action) {
    /* presentation */
    case 'present-liturgy': presentLiturgy(id); break;
    case 'present-jadwal': presentJadwal(); break;
    case 'present-prev': presentGo(-1); break;
    case 'present-next': presentGo(1); break;
    case 'present-close': closePresentation(); break;
    case 'present-full': toggleFullscreen(); break;
    case 'present-auto': toggleAutoPresent(); break;
    case 'present-overview': toggleOverview(); break;
    case 'present-overview-close': toggleOverview(false); break;
    case 'present-goto': presentGoTo(el.dataset.index); break;
    case 'present-pptx': if (presentState.pptx) presentState.pptx(); break;
    case 'quick-warta-slide':
      openPresentation(buildWartaSlides(), { title: 'Warta Jemaat', pptx: () => exportWartaPPTX() });
      break;

    /* jemaat */
    case 'jemaat-add': openJemaatForm(); break;
    case 'jemaat-view': viewJemaat(id); break;
    case 'jemaat-edit': openJemaatForm(id); break;
    case 'jemaat-delete': deleteJemaat(id); break;
    case 'jemaat-export': exportJemaatCSV(); break;
    case 'jemaat-reset-filter':
      UI.jemaat = { q: '', wilayah: '', kategori: '', status: '' };
      rerender({ keepScroll: true });
      break;

    /* keuangan */
    case 'tx-add': openTxForm(); break;
    case 'tx-edit': openTxForm(id); break;
    case 'tx-delete': deleteTx(id); break;
    case 'tx-export': exportTxCSV(); break;
    case 'tx-reset-filter':
      UI.keuangan = { bulan: currentMonth(), jenis: '', q: '', kas: '' };
      rerender({ keepScroll: true });
      break;
    case 'kas-filter':
      UI.keuangan.kas = UI.keuangan.kas === el.dataset.kas ? '' : el.dataset.kas;
      rerender({ keepScroll: true });
      break;
    case 'kas-open':
      UI.keuangan.kas = el.dataset.kas || '';
      break;
    case 'kas-saldo': openSaldoKasForm(); break;
    case 'finance-print': printFinanceReport(); break;

    /* warta */
    case 'warta-add': openWartaForm(); break;
    case 'warta-view': viewWarta(id); break;
    case 'warta-edit': openWartaForm(id); break;
    case 'warta-delete': deleteWarta(id); break;
    case 'warta-present': presentWarta(); break;
    case 'warta-pptx': exportWartaPPTX(filteredWarta()); break;
    case 'warta-print': printWarta(); break;
    case 'warta-filter':
      UI.warta.kategori = el.dataset.kategori || '';
      rerender({ keepScroll: true });
      break;

    /* ibadah */
    case 'ibadah-pptx': {
      const l = DB.ibadah.find((x) => x.id === id);
      if (l) exportLiturgyPPTX(l);
      break;
    }
    case 'ibadah-print': printLiturgy(id); break;
    case 'ibadah-duplicate': duplicateLiturgy(id); break;
    case 'ibadah-delete': deleteLiturgy(id); break;
    case 'item-add': addLiturgyRow(); break;
    case 'item-up': moveLiturgyRow(el, -1); break;
    case 'item-down': moveLiturgyRow(el, 1); break;
    case 'item-remove': removeLiturgyRow(el); break;
    case 'editor-preview': previewLiturgyEditor(); break;
    case 'editor-pptx': {
      const data = collectLiturgyForm();
      if (data) exportLiturgyPPTX(data);
      break;
    }

    /* jadwal */
    case 'jadwal-tab':
      UI.jadwal.tab = el.dataset.tab || 'jadwal';
      rerender({ keepScroll: true });
      break;
    case 'jadwal-add': openJadwalForm(); break;
    case 'jadwal-edit': openJadwalForm(id); break;
    case 'jadwal-delete': deleteJadwal(id); break;
    case 'jadwal-present': presentJadwal(); break;
    case 'jadwal-pptx': exportJadwalPPTX(); break;
    case 'pelayan-add': openPelayanForm(); break;
    case 'pelayan-edit': openPelayanForm(id); break;
    case 'pelayan-delete': deletePelayan(id); break;

    /* kegiatan */
    case 'kegiatan-add': openKegiatanForm(); break;
    case 'kegiatan-edit': openKegiatanForm(id); break;
    case 'kegiatan-delete': deleteKegiatan(id); break;
    case 'kegiatan-filter':
      UI.kegiatan.filter = el.dataset.filter || 'akan';
      rerender({ keepScroll: true });
      break;

    /* struktur */
    case 'org-add': openOrgForm(); break;
    case 'org-add-child': openOrgForm('', id); break;
    case 'org-edit': openOrgForm(id); break;
    case 'org-delete': deleteOrg(id); break;

    /* pengaturan */
    case 'data-export': exportAllData(); break;
    case 'data-import': {
      const input = document.getElementById('importFile');
      if (input) input.click();
      break;
    }
    case 'data-reset':
      confirmDialog({
        title: 'Reset ke Data Contoh',
        message: 'Seluruh data saat ini akan dihapus dan diganti dengan data contoh awal. Ekspor cadangan terlebih dahulu jika diperlukan.',
        confirmText: 'Reset Data',
        onConfirm: () => {
          resetDB();
          UI.jemaat = { q: '', wilayah: '', kategori: '', status: '' };
          UI.keuangan = { bulan: currentMonth(), jenis: '', q: '', kas: '' };
          UI.warta = { kategori: '' };
          UI.jadwal = { tab: 'jadwal' };
          UI.kegiatan = { filter: 'akan' };
          render();
          toast('Data contoh berhasil dipulihkan.');
        },
      });
      break;

    default:
      break;
  }
});

/* ---------------- sidebar & escape ---------------- */
document.getElementById('menuBtn').addEventListener('click', toggleSidebar);
document.getElementById('sidebarScrim').addEventListener('click', closeSidebar);
document.querySelectorAll('.sidebar a').forEach((a) => a.addEventListener('click', closeSidebar));

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (document.body.classList.contains('presenting')) return;
  closeSidebar();
  if (document.getElementById('modalRoot').innerHTML) closeModal();
});

/* ---------------- boot ---------------- */
window.addEventListener('hashchange', () => {
  closeSidebar();
  render();
});

render();
