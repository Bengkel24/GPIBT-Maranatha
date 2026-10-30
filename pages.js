/* =========================================================
   Halaman aplikasi
   ========================================================= */
'use strict';

function pageHead(eyebrow, title, desc, actions = '') {
  return `<div class="page-head">
    <div>
      <p class="eyebrow">${eyebrow}</p>
      <h1>${title}</h1>
      <p>${desc}</p>
    </div>
    ${actions ? `<div class="head-actions">${actions}</div>` : ''}
  </div>`;
}

function financeChartHTML(count = 6, kasId = '') {
  const data = monthsBack(count).map((m) => ({ ...m, ...monthTotals(m.key, kasId || undefined) }));
  const max = Math.max(...data.flatMap((d) => [d.masuk, d.keluar]), 1);
  return `<div class="chart-wrap">
    <div class="chart">
      ${data.map((d) => `
        <div class="chart-col">
          <div class="chart-bars">
            <div class="chart-bar in" style="height:${Math.max(3, (d.masuk / max) * 100)}%" data-label="Masuk ${money(d.masuk)}"></div>
            <div class="chart-bar out" style="height:${Math.max(3, (d.keluar / max) * 100)}%" data-label="Keluar ${money(d.keluar)}"></div>
          </div>
          <span class="chart-label">${monthShort(d.key)}</span>
        </div>`).join('')}
    </div>
    <div class="chart-legend">
      <span><i class="in"></i> Pemasukan</span>
      <span><i class="out"></i> Pengeluaran</span>
    </div>
  </div>`;
}

/* =========================================================
   BERANDA
   ========================================================= */
function renderDashboard() {
  const aktif = activeJemaat();
  const kk = new Set(aktif.map((j) => j.keluarga).filter(Boolean)).size;
  const saldo = saldoKas();
  const month = currentMonth();
  const mt = monthTotals(month);
  const jadwal = sortedJadwal(true);
  const next = jadwal[0];
  const lit = nextLiturgy();
  const upcoming = sortedKegiatan().filter((k) => k.tanggal >= todayISO()).slice(0, 4);
  const birthdays = birthdaysThisMonth();
  const warta = sortedWarta().filter((w) => w.penting).slice(0, 3);
  const nextKegiatan = upcoming[0];

  return `
    ${pageHead('Sekretariat Jemaat', `${greeting()}, Majelis & Jemaat`, 'Ringkasan pelayanan, keuangan, dan informasi jemaat Gereja Maranatha Tolitoli.', `
      <a class="btn btn-outline" href="#/warta">${icon('megaphone')} Warta Jemaat</a>
      <button class="btn btn-primary" data-action="quick-warta-slide">${icon('play')} Mode Slide</button>
    `)}

    <div class="stats">
      <div class="stat">
        <div class="stat-ico">${icon('users')}</div>
        <div class="stat-body">
          <div class="stat-label">Jemaat Aktif</div>
          <div class="stat-value">${num(aktif.length)} <span style="font-size:11px;font-weight:600;color:var(--muted)">orang</span></div>
          <div class="stat-hint">${num(kk)} kepala keluarga · ${new Set(aktif.map((j) => j.wilayah)).size} kolom</div>
        </div>
      </div>
      <div class="stat green">
        <div class="stat-ico">${icon('wallet')}</div>
        <div class="stat-body">
          <div class="stat-label">Total Saldo Kas</div>
          <div class="stat-value">${money(saldo)}</div>
          <div class="stat-hint">${KAS_LIST.length} kas · bulan ini ${mt.net >= 0 ? '+' : ''}${money(mt.net)}</div>
        </div>
      </div>
      <div class="stat gold">
        <div class="stat-ico">${icon('calendar')}</div>
        <div class="stat-body">
          <div class="stat-label">Pelayanan Terdekat</div>
          <div class="stat-value sm">${next ? dateShort(next.tanggal) : 'Belum ada'}</div>
          <div class="stat-hint">${next ? `${esc(next.ibadah)} · ${esc(next.jam)} WITA` : 'Tambahkan jadwal pelayanan'}</div>
        </div>
      </div>
      <div class="stat red">
        <div class="stat-ico">${icon('heart')}</div>
        <div class="stat-body">
          <div class="stat-label">Kegiatan Mendatang</div>
          <div class="stat-value">${num(upcoming.length)}</div>
          <div class="stat-hint">${nextKegiatan ? esc(nextKegiatan.nama) : 'Belum ada kegiatan'}</div>
        </div>
      </div>
    </div>

    <div class="card pad" style="margin-bottom:16px">
      <div class="card-head">
        <div><h3>Saldo per Kas</h3><p>Kas jemaat, kas kolom 1–5, komisi duka, dan komisi pembangunan</p></div>
        <a class="link" href="#/keuangan">Kelola keuangan ${icon('chevron-right')}</a>
      </div>
      <div class="kas-grid">
        ${kasSaldoList().map((k) => `
          <a class="kas-card tone-${k.tone}" href="#/keuangan" data-action="kas-open" data-kas="${k.id}" title="${esc(k.desc)}">
            <span class="kas-name">${esc(k.nama)}</span>
            <b class="kas-amount">${money(k.saldo)}</b>
            <span class="kas-meta ${k.net < 0 ? 'neg' : ''}">${k.net >= 0 ? '+' : ''}${money(k.net)} bulan ini</span>
          </a>`).join('')}
      </div>
    </div>

    <section class="hero-panel">
      <div class="hero-copy">
        <div class="hero-eyebrow">${lit ? dateLong(lit.tanggal) : 'Pelayanan Jemaat'}</div>
        <h2>${lit ? esc(lit.tema) : 'Kasih yang Melayani'}</h2>
        <p>${lit
          ? `Ibadah ${esc(lit.judul)} pukul ${esc(lit.jam)} WITA di ${esc(lit.tempat)}. Pelayan firman: ${esc(lit.pengkhotbah)}.`
          : 'Belum ada tata ibadah yang disiapkan. Silakan susun tata ibadah untuk ibadah mendatang.'}</p>
        <div class="hero-meta">
          <span>${icon('calendar')} ${lit ? dateLong(lit.tanggal) : '—'}</span>
          <span>${icon('clock')} ${lit ? `${esc(lit.jam)} WITA` : '—'}</span>
          <span>${icon('book')} ${lit ? esc(lit.ayat) : '—'}</span>
          <span>${icon('users')} ${lit ? esc(lit.liturgos) : '—'}</span>
        </div>
        <div class="hero-actions">
          ${lit ? `<button class="btn btn-gold" data-action="present-liturgy" data-id="${lit.id}">${icon('play')} Tayangkan Tata Ibadah</button>
          <a class="btn btn-outline" style="background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.18);color:#fff" href="#/ibadah">Lihat Susunan</a>` : `<a class="btn btn-gold" href="#/ibadah">${icon('plus')} Buat Tata Ibadah</a>`}
        </div>
      </div>
      <div class="hero-verse">
        <div class="quote">“Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku.”</div>
        <div class="ref">Filipi 4 : 13</div>
        <div class="next">
          <b>${DB.settings.ibadah}</b>
          ${esc(DB.settings.alamat)}
        </div>
      </div>
    </section>

    <div class="dash-grid">
      <div class="card pad">
        <div class="card-head">
          <div><h3>Keuangan ${monthsBack(6).length} Bulan Terakhir</h3><p>Pemasukan dan pengeluaran kas gereja</p></div>
          <a class="link" href="#/keuangan">Lihat detail ${icon('chevron-right')}</a>
        </div>
        ${financeChartHTML(6)}
        <div class="chart-summary">
          <div><small>Saldo saat ini</small><b>${money(saldo)}</b></div>
          <div><small>Pemasukan bulan ini</small><b class="in">${money(mt.masuk)}</b></div>
          <div><small>Pengeluaran bulan ini</small><b class="out">${money(mt.keluar)}</b></div>
        </div>
      </div>

      <div class="card pad">
        <div class="card-head">
          <div><h3>Jadwal Pelayanan</h3><p>Pendeta & majelis jemaat</p></div>
          <a class="link" href="#/jadwal">Semua ${icon('chevron-right')}</a>
        </div>
        <div class="list">
          ${jadwal.slice(0, 3).map((j) => `
            <div class="list-item">
              <div class="list-date"><b>${parseISO(j.tanggal).getDate()}</b><span>${MONTHS_SHORT[parseISO(j.tanggal).getMonth()]}</span></div>
              <div class="list-body">
                <b>${esc(j.ibadah)} · ${esc(j.jam)} WITA</b>
                <p>${esc(j.pengkhotbah)}</p>
                <div class="list-meta">
                  <span>${icon('book')} ${esc(j.liturgos)}</span>
                  <span>${icon('clock')} ${dayName(j.tanggal)}</span>
                </div>
              </div>
            </div>`).join('') || emptyState('Belum ada jadwal', 'Tambahkan jadwal pelayanan untuk ibadah mendatang.', 'calendar')}
        </div>
      </div>
    </div>

    <div class="dash-grid-3">
      <div class="card pad">
        <div class="card-head">
          <div><h3>Warta Penting</h3><p>Informasi yang perlu diperhatikan jemaat</p></div>
          <a class="link" href="#/warta">Semua ${icon('chevron-right')}</a>
        </div>
        <div class="list">
          ${warta.map((w) => `
            <div class="list-item">
              <div class="list-date" style="background:var(--gold-soft);color:#9b7a0d"><b>${parseISO(w.tanggal).getDate()}</b><span>${MONTHS_SHORT[parseISO(w.tanggal).getMonth()]}</span></div>
              <div class="list-body">
                <b>${esc(w.judul)}</b>
                <p>${esc(String(w.isi).slice(0, 92))}${w.isi.length > 92 ? '…' : ''}</p>
                <div class="list-meta"><span class="badge gold">${esc(w.kategori)}</span><span>${icon('megaphone')} Warta Jemaat</span></div>
              </div>
            </div>`).join('') || emptyState('Belum ada warta', 'Tambahkan warta jemaat terbaru.', 'megaphone')}
        </div>
      </div>

      <div class="card pad">
        <div class="card-head">
          <div><h3>Kegiatan Mendatang</h3><p>Agenda pelayanan jemaat</p></div>
          <a class="link" href="#/kegiatan">Semua ${icon('chevron-right')}</a>
        </div>
        <div class="list">
          ${upcoming.slice(0, 4).map((k) => `
            <div class="list-item">
              <div class="list-date" style="background:var(--green-soft);color:var(--green)"><b>${parseISO(k.tanggal).getDate()}</b><span>${MONTHS_SHORT[parseISO(k.tanggal).getMonth()]}</span></div>
              <div class="list-body">
                <b>${esc(k.nama)}</b>
                <p>${esc(k.waktu)} WITA · ${esc(k.tempat)}</p>
              </div>
            </div>`).join('') || emptyState('Belum ada kegiatan', 'Tambahkan agenda kegiatan jemaat.', 'heart')}
        </div>
      </div>

      <div class="card pad">
        <div class="card-head">
          <div><h3>Ulang Tahun</h3><p>${monthLabel(currentMonth())}</p></div>
          ${icon('star')}
        </div>
        <div class="birthday-list">
          ${birthdays.slice(0, 6).map((j) => `
            <div class="birthday-item">
              ${avatarHTML(j.nama, 'avatar-sm')}
              <div><b>${esc(j.nama)}</b><small>${j.kategori} · ${esc(j.wilayah)}</small></div>
              <div class="day">${parseISO(j.tglLahir).getDate()} ${MONTHS_SHORT[parseISO(j.tglLahir).getMonth()]}</div>
            </div>`).join('') || `<p style="font-size:11.5px;color:var(--muted);margin:0">Tidak ada ulang tahun jemaat bulan ini.</p>`}
        </div>
        ${birthdays.length > 6 ? `<a class="link" href="#/jemaat" style="margin-top:12px">Lihat semua jemaat ${icon('chevron-right')}</a>` : ''}
      </div>
    </div>`;
}

/* =========================================================
   DATA JEMAAT
   ========================================================= */
function filteredJemaat() {
  const { q = '', wilayah = '', kategori = '', status = '' } = UI.jemaat;
  const term = q.toLowerCase().trim();
  return DB.jemaat
    .filter((j) => {
      if (wilayah && j.wilayah !== wilayah) return false;
      if (kategori && j.kategori !== kategori) return false;
      if (status && j.status !== status) return false;
      if (term) {
        const hay = [j.nama, j.panggilan, j.keluarga, j.telepon, j.alamat, j.pekerjaan, j.wilayah].join(' ').toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    })
    .sort((a, b) => String(a.nama).localeCompare(String(b.nama), 'id'));
}

function renderJemaat() {
  const list = filteredJemaat();
  const aktif = activeJemaat();
  const kk = new Set(aktif.map((j) => j.keluarga).filter(Boolean)).size;
  const baptis = DB.jemaat.filter((j) => j.baptis).length;
  const birthdays = birthdaysThisMonth().length;

  return `
    ${pageHead('Data & Administrasi', 'Data Jemaat', 'Buku jemaat digital: data keluarga, kolom pelayanan, baptis, sidi, dan kontak jemaat.', `
      <button class="btn btn-outline" data-action="jemaat-export">${icon('download')} Ekspor CSV</button>
      <button class="btn btn-primary" data-action="jemaat-add">${icon('user-plus')} Tambah Jemaat</button>
    `)}

    <div class="stats">
      <div class="stat">
        <div class="stat-ico">${icon('users')}</div>
        <div class="stat-body"><div class="stat-label">Total Jemaat</div><div class="stat-value">${num(DB.jemaat.length)}</div><div class="stat-hint">${num(aktif.length)} aktif · ${num(DB.jemaat.length - aktif.length)} pindah/meninggal</div></div>
      </div>
      <div class="stat green">
        <div class="stat-ico">${icon('home')}</div>
        <div class="stat-body"><div class="stat-label">Kepala Keluarga</div><div class="stat-value">${num(kk)}</div><div class="stat-hint">${WILAYAH.length} kolom pelayanan</div></div>
      </div>
      <div class="stat gold">
        <div class="stat-ico">${icon('book')}</div>
        <div class="stat-body"><div class="stat-label">Sudah Dibaptis</div><div class="stat-value">${num(baptis)}</div><div class="stat-hint">${DB.jemaat.length ? Math.round((baptis / DB.jemaat.length) * 100) : 0}% dari total jemaat</div></div>
      </div>
      <div class="stat red">
        <div class="stat-ico">${icon('star')}</div>
        <div class="stat-body"><div class="stat-label">Ulang Tahun</div><div class="stat-value">${num(birthdays)}</div><div class="stat-hint">Jemaat berulang tahun bulan ini</div></div>
      </div>
    </div>

    ${birthdayWeekMiniCard()}

    <div class="card pad">
      <div class="filters">
        <div class="search">
          ${icon('search')}
          <input id="jemaatSearch" value="${esc(UI.jemaat.q)}" placeholder="Cari nama, keluarga, telepon, alamat…" autocomplete="off">
        </div>
        <select id="jemaatWilayah" style="width:auto;min-width:180px">
          <option value="">Semua kolom</option>
          ${WILAYAH.map((w) => `<option value="${esc(w)}" ${UI.jemaat.wilayah === w ? 'selected' : ''}>${esc(w)}</option>`).join('')}
        </select>
        <select id="jemaatKategori" style="width:auto;min-width:150px">
          <option value="">Semua kategori</option>
          ${KATEGORI_JEMAAT.map((k) => `<option value="${esc(k)}" ${UI.jemaat.kategori === k ? 'selected' : ''}>${esc(k)}</option>`).join('')}
        </select>
        <select id="jemaatStatus" style="width:auto;min-width:130px">
          <option value="">Semua status</option>
          ${['Aktif', 'Pindah', 'Meninggal'].map((s) => `<option value="${s}" ${UI.jemaat.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        ${(UI.jemaat.q || UI.jemaat.wilayah || UI.jemaat.kategori || UI.jemaat.status) ? `<button class="btn btn-ghost btn-sm" data-action="jemaat-reset-filter">Reset</button>` : ''}
      </div>

      <div class="table-scroll">
        <table class="data">
          <thead><tr>
            <th>Nama Jemaat</th><th>Kolom</th><th>Kategori</th><th>Usia</th><th>Kontak</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            ${list.map((j) => `
              <tr>
                <td>
                  <div class="cell-main">
                    ${avatarHTML(j.nama, 'avatar-sm')}
                    <div><b>${esc(j.nama)}</b><small>${esc(j.keluarga || '—')} · ${esc(j.peranKK || '—')}</small></div>
                  </div>
                </td>
                <td><span class="mini-tag">${esc(j.wilayah)}</span></td>
                <td><span class="badge gray">${esc(j.kategori)}</span></td>
                <td>${j.tglLahir ? `${ageOf(j.tglLahir)} th` : '—'}</td>
                <td><span class="mini-tag">${esc(j.telepon || '—')}</span></td>
                <td>${statusBadge(j.status)}</td>
                <td class="actions">
                  <button class="icon-btn" data-action="jemaat-view" data-id="${j.id}" title="Lihat detail">${icon('eye')}</button>
                  <button class="icon-btn" data-action="jemaat-edit" data-id="${j.id}" title="Edit">${icon('edit')}</button>
                  <button class="icon-btn danger" data-action="jemaat-delete" data-id="${j.id}" title="Hapus">${icon('trash')}</button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      ${list.length ? `<div class="table-foot"><span>Menampilkan <b>${list.length}</b> dari ${DB.jemaat.length} jemaat</span><span>Ulang tahun berikutnya: <b>${nextBirthdayText((list[0] || {}).tglLahir)}</b></span></div>` : emptyState('Jemaat tidak ditemukan', 'Coba ubah kata kunci atau filter pencarian.', 'search')}
    </div>`;
}

function openJemaatForm(id = '') {
  const j = DB.jemaat.find((x) => x.id === id) || {};
  const isEdit = Boolean(id);
  openModal({
    title: isEdit ? 'Edit Data Jemaat' : 'Tambah Jemaat',
    subtitle: 'Data pribadi, keluarga, dan pelayanan sakramen.',
    wide: true,
    body: `<form id="jemaatForm" data-id="${esc(id)}">
      <div class="form-section">
        <div class="form-section-title">Identitas Pribadi</div>
        <div class="form-grid">
          <label class="field span2">Nama Lengkap <span class="req">*</span>
            <input name="nama" required value="${esc(j.nama || '')}" placeholder="cth: Samuel L. Tangkilisan">
          </label>
          <label class="field">Nama Panggilan
            <input name="panggilan" value="${esc(j.panggilan || '')}" placeholder="cth: Samuel">
          </label>
          <label class="field">Jenis Kelamin
            <select name="gender"><option value="L" ${j.gender === 'L' ? 'selected' : ''}>Laki-laki</option><option value="P" ${j.gender === 'P' ? 'selected' : ''}>Perempuan</option></select>
          </label>
          <label class="field">Tanggal Lahir
            <input type="date" name="tglLahir" value="${esc(j.tglLahir || '')}">
          </label>
          <label class="field">Kategori Usia
            <select name="kategori">${KATEGORI_JEMAAT.map((k) => `<option ${j.kategori === k ? 'selected' : ''}>${k}</option>`).join('')}</select>
          </label>
          <label class="field">Pekerjaan
            <input name="pekerjaan" value="${esc(j.pekerjaan || '')}" placeholder="cth: Guru">
          </label>
          <label class="field">Status Jemaat
            <select name="status">${['Aktif', 'Pindah', 'Meninggal'].map((s) => `<option ${j.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
          </label>
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-title">Keluarga & Kolom</div>
        <div class="form-grid">
          <label class="field">Keluarga (KK)
            <input name="keluarga" value="${esc(j.keluarga || '')}" placeholder="cth: KK Tangkilisan">
          </label>
          <label class="field">Peran dalam Keluarga
            <select name="peranKK">${['Kepala Keluarga', 'Istri', 'Anak', 'Orang Tua', 'Lainnya'].map((p) => `<option ${j.peranKK === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
          </label>
          <label class="field">Kolom Pelayanan
            <select name="wilayah">${WILAYAH.map((w) => `<option ${j.wilayah === w ? 'selected' : ''}>${w}</option>`).join('')}</select>
          </label>
          <label class="field">Telepon / WhatsApp
            <input name="telepon" value="${esc(j.telepon || '')}" placeholder="cth: 0812-xxxx-xxxx">
          </label>
          <label class="field span2">Alamat
            <input name="alamat" value="${esc(j.alamat || '')}" placeholder="cth: Jl. Trans Sulawesi No. 45, Baolan">
          </label>
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-title">Sakramen & Catatan</div>
        <div class="form-grid">
          <label class="field">Tanggal Baptis
            <input type="date" name="baptis" value="${esc(j.baptis || '')}">
          </label>
          <label class="field">Tanggal Sidi
            <input type="date" name="sidi" value="${esc(j.sidi || '')}">
          </label>
          <label class="field span2">Catatan
            <textarea name="catatan" rows="2" placeholder="cth: Aktif di Komisi Pemuda">${esc(j.catatan || '')}</textarea>
          </label>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-outline" data-action="modal-close">Batal</button>
        <button type="submit" class="btn btn-primary">${icon('check')} Simpan Data</button>
      </div>
    </form>`,
  });
}

function saveJemaatForm(form) {
  const fd = new FormData(form);
  const id = form.dataset.id;
  const nama = String(fd.get('nama') || '').trim();
  if (!nama) { toast('Nama jemaat wajib diisi.', 'error'); return; }
  const data = {
    nama,
    panggilan: String(fd.get('panggilan') || '').trim(),
    gender: fd.get('gender') || 'L',
    tglLahir: fd.get('tglLahir') || '',
    kategori: fd.get('kategori') || 'Dewasa',
    pekerjaan: String(fd.get('pekerjaan') || '').trim(),
    status: fd.get('status') || 'Aktif',
    keluarga: String(fd.get('keluarga') || '').trim(),
    peranKK: fd.get('peranKK') || 'Kepala Keluarga',
    wilayah: fd.get('wilayah') || WILAYAH[0],
    telepon: String(fd.get('telepon') || '').trim(),
    alamat: String(fd.get('alamat') || '').trim(),
    baptis: fd.get('baptis') || '',
    sidi: fd.get('sidi') || '',
    catatan: String(fd.get('catatan') || '').trim(),
  };
  if (id) {
    const idx = DB.jemaat.findIndex((j) => j.id === id);
    if (idx >= 0) DB.jemaat[idx] = { ...DB.jemaat[idx], ...data };
  } else {
    DB.jemaat.push({ id: uid('j'), ...data });
  }
  saveDB();
  closeModal();
  rerender({ keepScroll: true });
  toast(id ? 'Data jemaat diperbarui.' : 'Jemaat baru ditambahkan.');
}

function viewJemaat(id) {
  const j = DB.jemaat.find((x) => x.id === id);
  if (!j) return;
  openModal({
    wide: true,
    title: 'Detail Jemaat',
    body: `
      <div class="modal-profile">
        ${avatarHTML(j.nama)}
        <div style="min-width:0">
          <h3>${esc(j.nama)}</h3>
          <p>${esc(j.keluarga || '—')} · ${esc(j.peranKK || '—')} · ${esc(j.wilayah)}</p>
          <div style="display:flex;gap:5px;margin-top:5px;flex-wrap:wrap">${statusBadge(j.status)}<span class="badge gray">${esc(j.kategori)}</span>${j.baptis ? '<span class="badge green">Sudah baptis</span>' : '<span class="badge amber">Belum baptis</span>'}${j.sidi ? '<span class="badge green">Sudah sidi</span>' : ''}</div>
        </div>
      </div>
      <div class="detail-grid">
        <div><small>Nama Panggilan</small><b>${esc(j.panggilan || '—')}</b></div>
        <div><small>Jenis Kelamin</small><b>${j.gender === 'P' ? 'Perempuan' : 'Laki-laki'}</b></div>
        <div><small>Tanggal Lahir</small><b>${j.tglLahir ? `${dateMedium(j.tglLahir)} (${ageOf(j.tglLahir)} tahun)` : '—'}</b></div>
        <div><small>Pekerjaan</small><b>${esc(j.pekerjaan || '—')}</b></div>
        <div><small>Telepon / WhatsApp</small><b>${esc(j.telepon || '—')}</b></div>
        <div><small>Kolom</small><b>${esc(j.wilayah || '—')}</b></div>
        <div class="full"><small>Alamat</small><b>${esc(j.alamat || '—')}</b></div>
        <div><small>Tanggal Baptis</small><b>${j.baptis ? dateMedium(j.baptis) : '—'}</b></div>
        <div><small>Tanggal Sidi</small><b>${j.sidi ? dateMedium(j.sidi) : '—'}</b></div>
        ${j.catatan ? `<div class="full"><small>Catatan</small><b>${esc(j.catatan)}</b></div>` : ''}
      </div>
      ${j.tglLahir ? `<div class="detail-note">${icon('star')} Ulang tahun berikutnya: <b>${nextBirthdayText(j.tglLahir)}</b> · Usia saat ini ${ageOf(j.tglLahir)} tahun.</div>` : ''}
    `,
    footer: `<button class="btn btn-outline" data-action="modal-close">Tutup</button>
             <button class="btn btn-primary" data-action="jemaat-edit" data-id="${j.id}">${icon('edit')} Edit Data</button>`,
  });
}

function deleteJemaat(id) {
  const j = DB.jemaat.find((x) => x.id === id);
  if (!j) return;
  confirmDialog({
    title: 'Hapus Data Jemaat',
    message: `Hapus data <b>${esc(j.nama)}</b> dari buku jemaat? Tindakan ini tidak dapat dibatalkan.`,
    confirmText: 'Hapus Jemaat',
    onConfirm: () => {
      DB.jemaat = DB.jemaat.filter((x) => x.id !== id);
      saveDB();
      rerender({ keepScroll: true });
      toast('Data jemaat dihapus.');
    },
  });
}

function exportJemaatCSV() {
  const rows = [
    ['Nama Lengkap', 'Panggilan', 'Jenis Kelamin', 'Tanggal Lahir', 'Usia', 'Kategori', 'Keluarga', 'Peran', 'Kolom', 'Telepon', 'Pekerjaan', 'Alamat', 'Baptis', 'Sidi', 'Status', 'Catatan'],
    ...DB.jemaat.map((j) => [
      j.nama, j.panggilan, j.gender === 'P' ? 'Perempuan' : 'Laki-laki', j.tglLahir, j.tglLahir ? ageOf(j.tglLahir) : '',
      j.kategori, j.keluarga, j.peranKK, j.wilayah, j.telepon, j.pekerjaan, j.alamat, j.baptis, j.sidi, j.status, j.catatan,
    ]),
  ];
  downloadCSV(`Data-Jemaat-Maranatha-${todayISO()}.csv`, rows);
  toast('Data jemaat diekspor ke CSV.');
}

/* =========================================================
   KEUANGAN
   ========================================================= */
function filteredTransactions() {
  const { bulan = '', jenis = '', q = '', kas = '' } = UI.keuangan;
  const term = q.toLowerCase().trim();
  return DB.transaksi
    .filter((t) => {
      if (bulan && monthKeyOf(t.tanggal) !== bulan) return false;
      if (kas && txKas(t) !== kas) return false;
      if (jenis && t.jenis !== jenis) return false;
      if (term && !`${t.keterangan} ${t.kategori} ${t.metode}`.toLowerCase().includes(term)) return false;
      return true;
    })
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.id.localeCompare(a.id));
}

function renderKeuangan() {
  const bulan = UI.keuangan.bulan || currentMonth();
  const kasFilter = UI.keuangan.kas || '';
  const mt = monthTotals(bulan, kasFilter || undefined);
  const saldo = saldoKas(kasFilter || undefined);
  const list = filteredTransactions();
  const filteredTotal = list.reduce((s, t) => s + (t.jenis === 'masuk' ? Number(t.jumlah) : -Number(t.jumlah)), 0);
  const expenseByCat = {};
  DB.transaksi.forEach((t) => {
    if (monthKeyOf(t.tanggal) !== bulan || t.jenis !== 'keluar') return;
    if (kasFilter && txKas(t) !== kasFilter) return;
    expenseByCat[t.kategori] = (expenseByCat[t.kategori] || 0) + Number(t.jumlah);
  });
  const catList = Object.entries(expenseByCat).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCat = Math.max(...catList.map((c) => c[1]), 1);
  const catColors = ['', 'green', 'gold', 'violet', 'red'];
  const kasActive = kasFilter ? kasInfo(kasFilter) : null;

  return `
    ${pageHead('Administrasi Keuangan', 'Keuangan Gereja', 'Pencatatan penerimaan dan pengeluaran kas, laporan bulanan, dan transparansi persembahan jemaat.', `
      <button class="btn btn-outline" data-action="tx-export">${icon('download')} Ekspor CSV</button>
      <button class="btn btn-outline" data-action="finance-print">${icon('print')} Cetak Laporan</button>
      <button class="btn btn-primary" data-action="tx-add">${icon('plus')} Tambah Transaksi</button>
    `)}

    <div class="stats">
      <div class="stat green">
        <div class="stat-ico">${icon('arrow-down')}</div>
        <div class="stat-body"><div class="stat-label">Pemasukan ${monthLabel(bulan, true)}</div><div class="stat-value">${money(mt.masuk)}</div><div class="stat-hint">${kasActive ? esc(kasActive.nama) : 'Persembahan & penerimaan kas'}</div></div>
      </div>
      <div class="stat red">
        <div class="stat-ico">${icon('arrow-up')}</div>
        <div class="stat-body"><div class="stat-label">Pengeluaran ${monthLabel(bulan, true)}</div><div class="stat-value">${money(mt.keluar)}</div><div class="stat-hint">${kasActive ? esc(kasActive.nama) : 'Operasional & pelayanan'}</div></div>
      </div>
      <div class="stat gold">
        <div class="stat-ico">${icon('wallet')}</div>
        <div class="stat-body"><div class="stat-label">${kasActive ? `Saldo ${kasActive.short}` : 'Total Saldo Kas'}</div><div class="stat-value">${money(saldo)}</div><div class="stat-hint">Saldo awal ${money(saldoAwalKas(kasFilter || undefined))}</div></div>
      </div>
      <div class="stat">
        <div class="stat-ico">${icon('check')}</div>
        <div class="stat-body"><div class="stat-label">Selisih Bulan Ini</div><div class="stat-value ${mt.net < 0 ? 'neg' : ''}" style="color:${mt.net < 0 ? 'var(--red)' : 'var(--green)'}">${mt.net >= 0 ? '+' : ''}${money(mt.net)}</div><div class="stat-hint">${mt.masuk ? Math.round((mt.net / mt.masuk) * 100) : 0}% dari pemasukan</div></div>
      </div>
    </div>

    <div class="card pad" style="margin-bottom:16px">
      <div class="card-head">
        <div><h3>Saldo per Kas</h3><p>Setiap kas dicatat terpisah. Klik kartu untuk melihat transaksi kas tersebut.</p></div>
        <div class="head-right">
          <button class="btn btn-outline btn-sm" data-action="kas-saldo">${icon('settings')} Atur Saldo Awal</button>
        </div>
      </div>
      <div class="kas-grid">
        ${kasSaldoList().map((k) => `
          <button type="button" class="kas-card tone-${k.tone} ${kasFilter === k.id ? 'active' : ''}" data-action="kas-filter" data-kas="${k.id}" title="${esc(k.desc)}">
            <span class="kas-name">${esc(k.nama)}</span>
            <b class="kas-amount">${money(k.saldo)}</b>
            <span class="kas-meta ${k.net < 0 ? 'neg' : ''}">${k.net >= 0 ? '+' : ''}${money(k.net)} bulan ini</span>
          </button>`).join('')}
      </div>
    </div>

    <div class="dash-grid">
      <div class="card pad">
        <div class="card-head">
          <div><h3>Arus Kas ${monthsBack(6).length} Bulan${kasActive ? ` · ${esc(kasActive.short)}` : ''}</h3><p>Perbandingan pemasukan dan pengeluaran${kasActive ? ` ${esc(kasActive.nama)}` : ''}</p></div>
          <span class="badge outline">${monthLabel(currentMonth())}</span>
        </div>
        ${financeChartHTML(6, kasFilter)}
      </div>
      <div class="card pad">
        <div class="card-head"><div><h3>Pengeluaran per Kategori</h3><p>${monthLabel(bulan)}</p></div></div>
        ${catList.length ? catList.map(([cat, val], i) => `
          <div class="progress-row ${catColors[i] || ''}">
            <div class="progress-top"><span>${esc(cat)}</span><b>${money(val)}</b></div>
            <div class="progress-track"><div class="progress-fill" style="width:${Math.max(2, (val / maxCat) * 100)}%"></div></div>
          </div>`).join('') : emptyState('Belum ada pengeluaran', 'Belum ada transaksi pengeluaran pada bulan ini.', 'wallet')}
      </div>
    </div>

    <div class="card pad" style="margin-top:16px">
      <div class="filters">
        <input type="month" id="txMonth" value="${esc(bulan)}" style="width:auto;min-width:150px">
        <select id="txKasFilter" style="width:auto;min-width:190px">
          <option value="">Semua kas</option>
          ${KAS_LIST.map((k) => `<option value="${k.id}" ${kasFilter === k.id ? 'selected' : ''}>${esc(k.nama)}</option>`).join('')}
        </select>
        <select id="txJenisFilter" style="width:auto;min-width:140px">
          <option value="">Semua jenis</option>
          <option value="masuk" ${UI.keuangan.jenis === 'masuk' ? 'selected' : ''}>Pemasukan</option>
          <option value="keluar" ${UI.keuangan.jenis === 'keluar' ? 'selected' : ''}>Pengeluaran</option>
        </select>
        <div class="search">
          ${icon('search')}
          <input id="txSearch" value="${esc(UI.keuangan.q)}" placeholder="Cari keterangan atau kategori…" autocomplete="off">
        </div>
        ${(UI.keuangan.q || UI.keuangan.jenis || kasFilter) ? `<button class="btn btn-ghost btn-sm" data-action="tx-reset-filter">Reset</button>` : ''}
      </div>

      <div class="table-scroll">
        <table class="data">
          <thead><tr><th>Tanggal</th><th>Keterangan</th><th>Kas</th><th>Kategori</th><th>Metode</th><th class="num">Jumlah</th><th></th></tr></thead>
          <tbody>
            ${list.map((t) => `
              <tr>
                <td><span class="mini-tag">${dateShort(t.tanggal)}</span></td>
                <td><div class="cell-main"><div><b>${esc(t.keterangan)}</b><small>${t.jenis === 'masuk' ? 'Penerimaan' : 'Pengeluaran'} · ${esc(kasInfo(txKas(t)).nama)}</small></div></div></td>
                <td><span class="badge ${kasInfo(txKas(t)).tone}">${esc(kasInfo(txKas(t)).short)}</span></td>
                <td><span class="badge ${t.jenis === 'masuk' ? 'green' : 'red'}">${esc(t.kategori)}</span></td>
                <td><span class="mini-tag">${esc(t.metode)}</span></td>
                <td class="num ${t.jenis === 'masuk' ? 'money-in' : 'money-out'}">${t.jenis === 'masuk' ? '+' : '−'}${money(t.jumlah)}</td>
                <td class="actions">
                  <button class="icon-btn" data-action="tx-edit" data-id="${t.id}" title="Edit">${icon('edit')}</button>
                  <button class="icon-btn danger" data-action="tx-delete" data-id="${t.id}" title="Hapus">${icon('trash')}</button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      ${list.length ? `<div class="table-foot"><span>Menampilkan <b>${list.length}</b> transaksi</span><span>Total terfilter: <b style="color:${filteredTotal < 0 ? 'var(--red)' : 'var(--green)'}">${filteredTotal >= 0 ? '+' : ''}${money(filteredTotal)}</b></span></div>` : emptyState('Tidak ada transaksi', 'Ubah filter bulan atau tambahkan transaksi baru.', 'wallet')}
    </div>`;
}

function txCategoryOptions(jenis, selected = '') {
  const opts = KATEGORI_KEUANGAN[jenis] || KATEGORI_KEUANGAN.masuk;
  return opts.map((k) => `<option ${selected === k ? 'selected' : ''}>${k}</option>`).join('');
}

function openTxForm(id = '') {
  const t = DB.transaksi.find((x) => x.id === id) || {};
  const jenis = t.jenis || 'masuk';
  const kas = t.kas || UI.keuangan.kas || 'jemaat';
  openModal({
    title: id ? 'Edit Transaksi' : 'Tambah Transaksi',
    subtitle: 'Catat penerimaan atau pengeluaran pada kas yang sesuai.',
    body: `<form id="txForm" data-id="${esc(id)}">
      <div class="form-grid">
        <label class="field">Tanggal <span class="req">*</span>
          <input type="date" name="tanggal" required value="${esc(t.tanggal || todayISO())}">
        </label>
        <label class="field">Jenis <span class="req">*</span>
          <select name="jenis" id="txJenis">
            <option value="masuk" ${jenis === 'masuk' ? 'selected' : ''}>Pemasukan</option>
            <option value="keluar" ${jenis === 'keluar' ? 'selected' : ''}>Pengeluaran</option>
          </select>
        </label>
        <label class="field">Kas / Pos <span class="req">*</span>
          <select name="kas">
            ${KAS_LIST.map((k) => `<option value="${k.id}" ${kas === k.id ? 'selected' : ''}>${esc(k.nama)}</option>`).join('')}
          </select>
        </label>
        <label class="field">Kategori
          <select name="kategori" id="txKategori">${txCategoryOptions(jenis, t.kategori)}</select>
        </label>
        <label class="field">Metode
          <select name="metode">${METODE_BAYAR.map((m) => `<option ${t.metode === m ? 'selected' : ''}>${m}</option>`).join('')}</select>
        </label>
        <label class="field">Jumlah (Rp) <span class="req">*</span>
          <input type="number" name="jumlah" min="0" step="1000" required value="${t.jumlah || ''}" placeholder="cth: 4850000">
        </label>
        <label class="field span2">Keterangan <span class="req">*</span>
          <input name="keterangan" required value="${esc(t.keterangan || '')}" placeholder="cth: Persembahan ibadah Minggu I">
        </label>
      </div>
      <p class="form-note">${icon('alert')} Pilih kas yang tepat agar laporan saldo per kas tetap akurat.</p>
      <div class="form-actions">
        <button type="button" class="btn btn-outline" data-action="modal-close">Batal</button>
        <button type="submit" class="btn btn-primary">${icon('check')} Simpan Transaksi</button>
      </div>
    </form>`,
  });
}

function refreshTxCategories() {
  const jenisEl = document.getElementById('txJenis');
  const catEl = document.getElementById('txKategori');
  if (!jenisEl || !catEl) return;
  catEl.innerHTML = txCategoryOptions(jenisEl.value);
}

function saveTxForm(form) {
  const fd = new FormData(form);
  const id = form.dataset.id;
  const jumlah = Number(fd.get('jumlah') || 0);
  const keterangan = String(fd.get('keterangan') || '').trim();
  if (!keterangan) { toast('Keterangan wajib diisi.', 'error'); return; }
  if (!(jumlah > 0)) { toast('Jumlah harus lebih dari 0.', 'error'); return; }
  const data = {
    tanggal: fd.get('tanggal') || todayISO(),
    jenis: fd.get('jenis') || 'masuk',
    kas: KAS_IDS.includes(fd.get('kas')) ? fd.get('kas') : 'jemaat',
    kategori: fd.get('kategori') || 'Lainnya',
    keterangan,
    jumlah,
    metode: fd.get('metode') || 'Tunai',
  };
  if (id) {
    const idx = DB.transaksi.findIndex((t) => t.id === id);
    if (idx >= 0) DB.transaksi[idx] = { ...DB.transaksi[idx], ...data };
  } else {
    DB.transaksi.push({ id: uid('tx'), ...data });
  }
  if (!UI.keuangan.bulan) UI.keuangan.bulan = monthKeyOf(data.tanggal);
  saveDB();
  closeModal();
  rerender({ keepScroll: true });
  toast(id ? 'Transaksi diperbarui.' : 'Transaksi baru dicatat.');
}

function deleteTx(id) {
  const t = DB.transaksi.find((x) => x.id === id);
  if (!t) return;
  confirmDialog({
    title: 'Hapus Transaksi',
    message: `Hapus transaksi <b>${esc(t.keterangan)}</b> sebesar <b>${money(t.jumlah)}</b>?`,
    confirmText: 'Hapus Transaksi',
    onConfirm: () => {
      DB.transaksi = DB.transaksi.filter((x) => x.id !== id);
      saveDB();
      rerender({ keepScroll: true });
      toast('Transaksi dihapus.');
    },
  });
}

function exportTxCSV() {
  const list = filteredTransactions();
  const rows = [
    ['Tanggal', 'Kas', 'Jenis', 'Kategori', 'Keterangan', 'Metode', 'Jumlah'],
    ...list.map((t) => [t.tanggal, kasInfo(txKas(t)).nama, t.jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran', t.kategori, t.keterangan, t.metode, t.jumlah]),
  ];
  const suffix = UI.keuangan.kas ? `-${kasInfo(UI.keuangan.kas).short}` : '';
  downloadCSV(`Keuangan-Maranatha-${UI.keuangan.bulan || currentMonth()}${suffix}.csv`, rows);
  toast('Transaksi keuangan diekspor ke CSV.');
}

function printFinanceReport() {
  const bulan = UI.keuangan.bulan || currentMonth();
  const kasFilter = UI.keuangan.kas || '';
  const kasActive = kasFilter ? kasInfo(kasFilter) : null;
  const list = DB.transaksi
    .filter((t) => monthKeyOf(t.tanggal) === bulan && (!kasFilter || txKas(t) === kasFilter))
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  const masuk = list.filter((t) => t.jenis === 'masuk');
  const keluar = list.filter((t) => t.jenis === 'keluar');
  const totalMasuk = masuk.reduce((s, t) => s + Number(t.jumlah), 0);
  const totalKeluar = keluar.reduce((s, t) => s + Number(t.jumlah), 0);
  const saldo = saldoKas(kasFilter || undefined);
  const allMonth = monthTotals(bulan);
  const rows = (arr) => arr.map((t, i) => `<tr><td>${i + 1}</td><td>${esc(t.keterangan)}</td><td>${esc(kasInfo(txKas(t)).short)}</td><td>${esc(t.kategori)}</td><td>${esc(t.metode)}</td><td class="num">${num(t.jumlah)}</td></tr>`).join('');
  const kasRows = KAS_LIST.map((k) => {
    const kmt = monthTotals(bulan, k.id);
    return `<tr${kasFilter === k.id ? ' style="background:#f5f8fc"' : ''}><td>${esc(k.nama)}</td><td class="num">${num(saldoAwalKas(k.id))}</td><td class="num">${num(kmt.masuk)}</td><td class="num">${num(kmt.keluar)}</td><td class="num"><b>${num(saldoKas(k.id))}</b></td></tr>`;
  }).join('');
  printHTML(`
    <div class="print-doc">
      <div class="print-head">
        <div class="print-logo">✝</div>
        <div>
          <h1>${esc(DB.settings.nama)}</h1>
          <p>${esc(DB.settings.alamat)} · ${esc(DB.settings.telepon)}</p>
        </div>
      </div>
      <h2>Laporan Keuangan Bulanan</h2>
      <p class="print-sub">Bulan ${monthLabel(bulan)}${kasActive ? ` · ${esc(kasActive.nama)}` : ' · Semua Kas'} · Dicetak ${dateLong(todayISO())}</p>

      <h3>1. Penerimaan</h3>
      <table><thead><tr><th style="width:32px">No</th><th>Uraian</th><th>Kas</th><th>Kategori</th><th>Metode</th><th class="num" style="width:110px">Jumlah (Rp)</th></tr></thead>
        <tbody>${masuk.length ? rows(masuk) : '<tr><td colspan="6">Tidak ada penerimaan pada bulan ini.</td></tr>'}
        <tr class="total"><td colspan="5">TOTAL PENERIMAAN</td><td class="num">${num(totalMasuk)}</td></tr></tbody>
      </table>

      <h3>2. Pengeluaran</h3>
      <table><thead><tr><th style="width:32px">No</th><th>Uraian</th><th>Kas</th><th>Kategori</th><th>Metode</th><th class="num" style="width:110px">Jumlah (Rp)</th></tr></thead>
        <tbody>${keluar.length ? rows(keluar) : '<tr><td colspan="6">Tidak ada pengeluaran pada bulan ini.</td></tr>'}
        <tr class="total"><td colspan="5">TOTAL PENGELUARAN</td><td class="num">${num(totalKeluar)}</td></tr></tbody>
      </table>

      <h3>3. Saldo per Kas</h3>
      <table>
        <thead><tr><th>Kas / Pos</th><th class="num">Saldo Awal</th><th class="num">Penerimaan Bulan Ini</th><th class="num">Pengeluaran Bulan Ini</th><th class="num">Saldo Saat Ini</th></tr></thead>
        <tbody>
          ${kasRows}
          <tr class="total"><td>TOTAL</td><td class="num">${num(saldoAwalKas())}</td><td class="num">${num(allMonth.masuk)}</td><td class="num">${num(allMonth.keluar)}</td><td class="num">${num(saldoKas())}</td></tr>
        </tbody>
      </table>
      <p style="font-size:9px;color:#6b768c">${kasActive ? `Saldo ${esc(kasActive.nama)} saat ini: <b>${money(saldo)}</b>. ` : ''}Laporan ini disusun berdasarkan pencatatan transaksi pada sistem informasi jemaat. Audit internal dilakukan oleh Majelis Jemaat setiap akhir bulan.</p>

      <div class="print-sign">
        <div>Mengetahui,<br>Ketua Majelis Jemaat<div class="line">${esc((DB.struktur.find((s) => s.jabatan === 'Ketua Majelis') || {}).nama || '________________')}</div></div>
        <div>Tolitoli, ${dateMedium(todayISO())}<br>Bendahara<div class="line">${esc((DB.struktur.find((s) => /Bendahara/.test(s.jabatan)) || {}).nama || '________________')}</div></div>
      </div>
    </div>`);
}

function openSaldoKasForm() {
  const map = DB.settings.saldoAwalKas || {};
  openModal({
    title: 'Saldo Awal per Kas',
    subtitle: 'Saldo sebelum transaksi yang tercatat di aplikasi. Total dihitung otomatis.',
    wide: true,
    body: `<form id="saldoKasForm">
      <div class="form-grid">
        ${KAS_LIST.map((k) => `
          <label class="field">${esc(k.nama)}
            <input type="number" name="kas_${k.id}" min="0" step="1000" value="${Number(map[k.id]) || 0}">
          </label>`).join('')}
      </div>
      <p class="form-note">${icon('alert')} Saldo awal dipakai sebagai titik mulai perhitungan pada masing-masing kas. Perubahan tidak memengaruhi transaksi yang sudah tercatat.</p>
      <div class="form-actions">
        <button type="button" class="btn btn-outline" data-action="modal-close">Batal</button>
        <button type="submit" class="btn btn-primary">${icon('check')} Simpan Saldo Awal</button>
      </div>
    </form>`,
  });
}

function saveSaldoKasForm(form) {
  const fd = new FormData(form);
  const map = {};
  KAS_LIST.forEach((k) => { map[k.id] = Math.max(0, Number(fd.get(`kas_${k.id}`)) || 0); });
  DB.settings.saldoAwalKas = map;
  DB.settings.saldoAwal = totalSaldoAwal();
  saveDB();
  closeModal();
  rerender({ keepScroll: true });
  toast('Saldo awal per kas disimpan.');
}

/* =========================================================
   WARTA JEMAAT
   ========================================================= */
function filteredWarta() {
  const kat = UI.warta.kategori;
  const list = sortedWarta();
  return kat ? list.filter((w) => w.kategori === kat) : list;
}

function wartaBadgeTone(cat) {
  return { Ibadah: 'green', Kegiatan: 'violet', Diakonia: 'amber', Keuangan: 'blue', 'Ulang Tahun': 'gold', Umum: 'gray' }[cat] || 'gray';
}

/* ---------------- Rekap ulang tahun pekan berjalan ---------------- */
function birthdayWeekText(refISO = todayISO()) {
  const { start, end } = weekRangeISO(refISO);
  const list = birthdaysThisWeek(refISO);
  const head = `Tuhan memberkati jemaat yang berulang tahun pada pekan ini (${dateMedium(start)} – ${dateMedium(end)}):`;
  if (!list.length) return `${head}\n\nTidak ada jemaat yang berulang tahun pada pekan ini.`;
  const lines = list.map((j) => `• ${dayName(j.ulangTahunISO)}, ${dateMedium(j.ulangTahunISO)} — ${j.nama} (${j.usiaBaru} tahun) — ${j.wilayah}`);
  return `${head}\n\n${lines.join('\n')}\n\nMajelis jemaat mengucapkan selamat ulang tahun dan mendoakan agar senantiasa bertumbuh dalam kasih Kristus. Tuhan Yesus memberkati.`;
}

function birthdayWeekListHTML(list, compact = false) {
  if (!list.length) {
    return `<p class="bweek-empty">${icon('star')} Tidak ada jemaat yang berulang tahun pada pekan ini.</p>`;
  }
  return `<div class="bweek-list${compact ? ' compact' : ''}">
    ${list.map((j) => `
      <div class="bweek-item">
        <div class="bweek-date"><b>${parseISO(j.ulangTahunISO).getDate()}</b><span>${MONTHS_SHORT[parseISO(j.ulangTahunISO).getMonth()]}</span></div>
        <div class="bweek-body">
          ${avatarHTML(j.nama, 'avatar-sm')}
          <div>
            <b>${esc(j.nama)}</b>
            <small>${dayName(j.ulangTahunISO)} · ${j.usiaBaru} tahun · ${esc(j.keluarga || j.wilayah)}</small>
          </div>
        </div>
        <span class="badge ${j.kategori ? 'gray' : 'outline'}">${esc(j.kategori || 'Jemaat')}</span>
      </div>`).join('')}
  </div>`;
}

function birthdayWeekCard() {
  const { start, end } = weekRangeISO();
  const list = birthdaysThisWeek();
  return `<div class="card pad bweek-card">
    <div class="card-head">
      <div>
        <h3>${icon('star')} Ulang Tahun Jemaat Pekan Ini</h3>
        <p>${dateLong(start)} – ${dateLong(end)} · ${list.length} jemaat berulang tahun</p>
      </div>
      <div class="head-right">
        <button class="btn btn-outline btn-sm" data-action="birthday-copy">${icon('file')} Salin Rekap</button>
        <button class="btn btn-primary btn-sm" data-action="warta-birthday">${icon('plus')} Jadikan Warta</button>
      </div>
    </div>
    ${birthdayWeekListHTML(list)}
    <p class="form-note">Rekap otomatis dari tanggal lahir jemaat aktif pada pekan berjalan (Minggu–Sabtu). Klik <b>Jadikan Warta</b> untuk mengisi warta ulang tahun tanpa mengetik ulang, atau <b>Salin Rekap</b> untuk ditempel ke WhatsApp.</p>
  </div>`;
}

function copyBirthdayRecap() {
  const text = birthdayWeekText();
  const done = () => toast('Rekap ulang tahun pekan ini disalin.');
  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (err) { toast('Gagal menyalin rekap.', 'error'); }
    ta.remove();
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(fallback);
  } else {
    fallback();
  }
}

function birthdayWeekMiniCard() {
  const { start, end } = weekRangeISO();
  const list = birthdaysThisWeek();
  return `<div class="card pad bweek-card mini" style="margin-bottom:16px">
    <div class="card-head" style="margin-bottom:10px">
      <div><h3>Ulang Tahun Pekan Ini</h3><p>${dateMedium(start)} – ${dateMedium(end)}</p></div>
      <a class="link" href="#/warta">Buat warta ${icon('chevron-right')}</a>
    </div>
    ${list.length
      ? `<div class="bweek-pills">${list.map((j) => `<span class="bweek-pill">${icon('star')}<b>${esc(j.panggilan || j.nama)}</b> ${dayName(j.ulangTahunISO)} · ${j.usiaBaru} th</span>`).join('')}</div>`
      : `<p class="bweek-empty">${icon('star')} Tidak ada jemaat yang berulang tahun pada pekan ini.</p>`}
  </div>`;
}

function renderWarta() {
  const list = filteredWarta();
  return `
    ${pageHead('Informasi Jemaat', 'Warta Jemaat', 'Warta, pengumuman, dan informasi pelayanan yang dapat dicetak maupun ditayangkan sebagai slide PowerPoint.', `
      <button class="btn btn-outline" data-action="warta-print">${icon('print')} Cetak</button>
      <button class="btn btn-outline" data-action="warta-pptx">${icon('download')} Unduh PPTX</button>
      <button class="btn btn-primary" data-action="warta-present">${icon('play')} Mode Slide</button>
    `)}

    <div style="margin-bottom:16px">${birthdayWeekCard()}</div>

    <div class="filter-chips">
      <button class="chip ${!UI.warta.kategori ? 'active' : ''}" data-action="warta-filter" data-kategori="">Semua <span class="count">${DB.warta.length}</span></button>
      ${KATEGORI_WARTA.map((k) => {
        const count = DB.warta.filter((w) => w.kategori === k).length;
        return count ? `<button class="chip ${UI.warta.kategori === k ? 'active' : ''}" data-action="warta-filter" data-kategori="${esc(k)}">${esc(k)} <span class="count">${count}</span></button>` : '';
      }).join('')}
      <button class="btn btn-primary btn-sm" data-action="warta-add" style="margin-left:auto">${icon('plus')} Tambah Warta</button>
    </div>

    ${list.length ? `<div class="warta-grid">
      ${list.map((w) => `
        <article class="card warta-card ${w.penting ? 'penting' : ''}">
          <div class="warta-top">
            <span class="badge ${wartaBadgeTone(w.kategori)}">${esc(w.kategori)}</span>
            ${w.penting ? '<span class="badge gold">Penting</span>' : ''}
            <span class="warta-date">${dateMedium(w.tanggal)}</span>
          </div>
          <h3>${esc(w.judul)}</h3>
          <p class="warta-text">${esc(w.isi)}</p>
          <div class="warta-foot">
            <button class="btn btn-ghost btn-sm" data-action="warta-view" data-id="${w.id}">${icon('eye')} Baca</button>
            <div class="actions">
              <button class="icon-btn" data-action="warta-edit" data-id="${w.id}" title="Edit">${icon('edit')}</button>
              <button class="icon-btn danger" data-action="warta-delete" data-id="${w.id}" title="Hapus">${icon('trash')}</button>
            </div>
          </div>
        </article>`).join('')}
    </div>` : `<div class="card pad">${emptyState('Belum ada warta', 'Tambahkan warta jemaat atau ubah filter kategori.', 'megaphone')}</div>`}

    <div class="card pad" style="margin-top:16px">
      <div class="card-head">
        <div><h3>Tampilkan di Proyektor</h3><p>Warta jemaat disusun otomatis menjadi slide 16:9, siap ditayangkan atau diunduh sebagai file PowerPoint.</p></div>
        <div class="head-right">
          <button class="btn btn-outline btn-sm" data-action="warta-pptx">${icon('download')} Unduh PPTX</button>
          <button class="btn btn-primary btn-sm" data-action="warta-present">${icon('play')} Mulai Slide</button>
        </div>
      </div>
      <div class="slide-note">
        <b>${icon('layers')} ${list.length + 2} slide siap tayang</b>
        Sampul → ${list.length} slide warta → penutup. Gunakan tombol panah, spasi, atau klik untuk berpindah slide. Tekan <b>F</b> untuk layar penuh, <b>O</b> untuk melihat semua slide.
      </div>
    </div>`;
}

function openWartaForm(id = '', preset = null) {
  const w = DB.warta.find((x) => x.id === id) || preset || {};
  openModal({
    title: id ? 'Edit Warta' : 'Tambah Warta Jemaat',
    subtitle: 'Informasi akan muncul di halaman warta dan slide proyektor.',
    wide: true,
    body: `<form id="wartaForm" data-id="${esc(id)}">
      <div class="form-grid">
        <label class="field span2">Judul Warta <span class="req">*</span>
          <input name="judul" required value="${esc(w.judul || '')}" placeholder="cth: Perjamuan Kudus Minggu Ini">
        </label>
        <label class="field">Tanggal
          <input type="date" name="tanggal" value="${esc(w.tanggal || todayISO())}">
        </label>
        <label class="field">Kategori
          <select name="kategori">${KATEGORI_WARTA.map((k) => `<option ${w.kategori === k ? 'selected' : ''}>${k}</option>`).join('')}</select>
        </label>
        <label class="field span2">Isi Warta <span class="req">*</span>
          <textarea name="isi" rows="6" required placeholder="Tuliskan isi warta jemaat…">${esc(w.isi || '')}</textarea>
        </label>
        <label class="field span2" style="flex-direction:row;align-items:center;gap:8px;font-weight:600;cursor:pointer">
          <input type="checkbox" name="penting" value="1" style="width:16px;height:16px" ${w.penting ? 'checked' : ''}>
          <span>Tandai sebagai warta penting ${icon('star')}</span>
        </label>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-outline" data-action="modal-close">Batal</button>
        <button type="submit" class="btn btn-primary">${icon('check')} Simpan Warta</button>
      </div>
    </form>`,
  });
}

function saveWartaForm(form) {
  const fd = new FormData(form);
  const id = form.dataset.id;
  const judul = String(fd.get('judul') || '').trim();
  const isi = String(fd.get('isi') || '').trim();
  if (!judul || !isi) { toast('Judul dan isi warta wajib diisi.', 'error'); return; }
  const data = {
    judul, isi,
    tanggal: fd.get('tanggal') || todayISO(),
    kategori: fd.get('kategori') || 'Umum',
    penting: fd.get('penting') === '1',
  };
  if (id) {
    const idx = DB.warta.findIndex((w) => w.id === id);
    if (idx >= 0) DB.warta[idx] = { ...DB.warta[idx], ...data };
  } else {
    DB.warta.push({ id: uid('w'), ...data });
  }
  saveDB();
  closeModal();
  rerender({ keepScroll: true });
  toast(id ? 'Warta diperbarui.' : 'Warta jemaat ditambahkan.');
}

function viewWarta(id) {
  const w = DB.warta.find((x) => x.id === id);
  if (!w) return;
  openModal({
    wide: true,
    title: w.judul,
    subtitle: `${w.kategori} · ${dateLong(w.tanggal)}`,
    body: `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">${w.penting ? '<span class="badge gold">Warta Penting</span>' : ''}<span class="badge ${wartaBadgeTone(w.kategori)}">${esc(w.kategori)}</span></div>
      <p style="white-space:pre-line;font-size:13px;line-height:1.75;color:var(--ink-2);margin:0">${esc(w.isi)}</p>`,
    footer: `<button class="btn btn-outline" data-action="modal-close">Tutup</button>
             <button class="btn btn-primary" data-action="warta-edit" data-id="${w.id}">${icon('edit')} Edit</button>`,
  });
}

function deleteWarta(id) {
  const w = DB.warta.find((x) => x.id === id);
  if (!w) return;
  confirmDialog({
    title: 'Hapus Warta',
    message: `Hapus warta <b>${esc(w.judul)}</b>?`,
    confirmText: 'Hapus Warta',
    onConfirm: () => {
      DB.warta = DB.warta.filter((x) => x.id !== id);
      saveDB();
      rerender({ keepScroll: true });
      toast('Warta dihapus.');
    },
  });
}

function presentWarta(list = null) {
  const data = list || filteredWarta();
  openPresentation(buildWartaSlides(data), {
    title: 'Warta Jemaat',
    pptx: () => exportWartaPPTX(data),
  });
}

function printWarta() {
  const list = filteredWarta();
  const jadwal = sortedJadwal(true).slice(0, 3);
  const kegiatan = sortedKegiatan().filter((k) => k.tanggal >= todayISO()).slice(0, 6);
  const mt = monthTotals(currentMonth());
  const bweek = birthdaysThisWeek();
  const bweekRange = weekRangeISO();
  printHTML(`
    <div class="print-doc">
      <div class="print-head">
        <div class="print-logo">✝</div>
        <div>
          <h1>${esc(DB.settings.nama)}</h1>
          <p>${esc(DB.settings.alamat)} · ${esc(DB.settings.telepon)} · ${esc(DB.settings.email)}</p>
        </div>
      </div>
      <h2>Warta Jemaat</h2>
      <p class="print-sub">Edisi ${dateLong(todayISO())} · ${esc(DB.settings.ibadah)}</p>

      ${list.map((w) => `
        <div class="print-warta-item">
          <div class="wt">${esc(w.kategori)}${w.penting ? ' · PENTING' : ''}</div>
          <div class="wdate">${dateMedium(w.tanggal)}</div>
          <h4>${esc(w.judul)}</h4>
          <p>${esc(w.isi)}</p>
        </div>`).join('')}

      <h3>Ulang Tahun Jemaat Pekan Ini (${dateMedium(bweekRange.start)} – ${dateMedium(bweekRange.end)})</h3>
      <table>
        <thead><tr><th style="width:30px">No</th><th>Hari / Tanggal</th><th>Nama Jemaat</th><th>Usia</th><th>Kolom</th></tr></thead>
        <tbody>${bweek.length
          ? bweek.map((j, i) => `<tr><td>${i + 1}</td><td>${dayName(j.ulangTahunISO)}, ${dateMedium(j.ulangTahunISO)}</td><td>${esc(j.nama)}</td><td>${j.usiaBaru} th</td><td>${esc(j.wilayah)}</td></tr>`).join('')
          : '<tr><td colspan="5">Tidak ada jemaat yang berulang tahun pada pekan ini.</td></tr>'}</tbody>
      </table>

      <div class="print-two" style="margin-top:18px">
        <div>
          <h3>Jadwal Pelayanan</h3>
          <table>
            <thead><tr><th>Tanggal</th><th>Ibadah</th><th>Pengkhotbah</th><th>Liturgos</th></tr></thead>
            <tbody>${jadwal.map((j) => `<tr><td>${dateShort(j.tanggal)}</td><td>${esc(j.ibadah)}</td><td>${esc(j.pengkhotbah)}</td><td>${esc(j.liturgos)}</td></tr>`).join('') || '<tr><td colspan="4">Belum ada jadwal.</td></tr>'}</tbody>
          </table>
        </div>
        <div>
          <h3>Kegiatan Mendatang</h3>
          <table>
            <thead><tr><th>Tanggal</th><th>Kegiatan</th><th>Waktu</th></tr></thead>
            <tbody>${kegiatan.map((k) => `<tr><td>${dateShort(k.tanggal)}</td><td>${esc(k.nama)}<br><span style="color:#7c8494;font-size:8.5px">${esc(k.tempat)}</span></td><td>${esc(k.waktu)}</td></tr>`).join('') || '<tr><td colspan="3">Belum ada kegiatan.</td></tr>'}</tbody>
          </table>
        </div>
      </div>

      <h3>Ringkasan Keuangan Bulan Ini (${monthLabel(currentMonth())})</h3>
      <table>
        <tbody>
          <tr><td>Penerimaan</td><td class="num">${num(mt.masuk)}</td></tr>
          <tr><td>Pengeluaran</td><td class="num">${num(mt.keluar)}</td></tr>
          <tr class="total"><td>Saldo kas gereja saat ini</td><td class="num">${num(saldoKas())}</td></tr>
        </tbody>
      </table>
      <p style="font-size:8.5px;color:#6b768c">Persembahan dapat disalurkan melalui kantong persembahan atau transfer ke rekening gereja. Laporan lengkap tersedia di sekretariat.</p>

      <div class="print-sign">
        <div>Tolitoli, ${dateMedium(todayISO())}<br>Sekretaris Majelis<div class="line">${esc((DB.struktur.find((s) => /Sekretaris/.test(s.jabatan)) || {}).nama || '________________')}</div></div>
        <div>Mengetahui,<br>Ketua Majelis<div class="line">${esc((DB.struktur.find((s) => s.jabatan === 'Ketua Majelis') || {}).nama || '________________')}</div></div>
      </div>
      <div class="print-slide-note">Warta ini juga dapat ditayangkan sebagai slide melalui menu Warta Jemaat → Mode Slide.</div>
    </div>`);
}

/* =========================================================
   JADWAL PELAYANAN
   ========================================================= */
function renderJadwal() {
  const tab = UI.jadwal.tab || 'jadwal';
  const list = sortedJadwal();

  return `
    ${pageHead('Pelayanan', 'Jadwal Pelayanan', 'Jadwal petugas ibadah, pendeta, penatua, diaken, dan pelayan jemaat lainnya.', `
      <button class="btn btn-outline" data-action="jadwal-pptx">${icon('download')} Unduh PPTX</button>
      <button class="btn btn-outline" data-action="jadwal-present">${icon('play')} Mode Slide</button>
      ${tab === 'jadwal' ? `<button class="btn btn-primary" data-action="jadwal-add">${icon('plus')} Tambah Jadwal</button>` : `<button class="btn btn-primary" data-action="pelayan-add">${icon('user-plus')} Tambah Pelayan</button>`}
    `)}

    <div class="tabs">
      <button class="tab ${tab === 'jadwal' ? 'active' : ''}" data-action="jadwal-tab" data-tab="jadwal">Jadwal Ibadah</button>
      <button class="tab ${tab === 'pelayan' ? 'active' : ''}" data-action="jadwal-tab" data-tab="pelayan">Daftar Pelayan</button>
    </div>

    ${tab === 'pelayan' ? `
      <div class="card pad">
        <div class="card-head"><div><h3>Pendeta, Penatua, Diaken & Pelayan</h3><p>${DB.pelayan.filter((p) => p.aktif !== false).length} pelayan aktif</p></div>
          <button class="btn btn-primary btn-sm" data-action="pelayan-add">${icon('plus')} Tambah Pelayan</button>
        </div>
        <div class="table-scroll">
          <table class="data">
            <thead><tr><th>Nama Pelayan</th><th>Jabatan</th><th>Bidang</th><th>Kontak</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${DB.pelayan.map((p) => `
                <tr>
                  <td><div class="cell-main">${avatarHTML(p.nama, 'avatar-sm')}<div><b>${esc(p.nama)}</b><small>${esc(p.bidang || '—')}</small></div></div></td>
                  <td><span class="badge gray">${esc(p.jabatan)}</span></td>
                  <td>${esc(p.bidang || '—')}</td>
                  <td><span class="mini-tag">${esc(p.telepon || '—')}</span></td>
                  <td>${p.aktif !== false ? '<span class="badge green">Aktif</span>' : '<span class="badge gray">Nonaktif</span>'}</td>
                  <td class="actions">
                    <button class="icon-btn" data-action="pelayan-edit" data-id="${p.id}" title="Edit">${icon('edit')}</button>
                    <button class="icon-btn danger" data-action="pelayan-delete" data-id="${p.id}" title="Hapus">${icon('trash')}</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>` : `
      ${list.length ? `<div class="schedule-grid">
        ${list.map((j) => {
          const past = j.tanggal < todayISO();
          return `<article class="card schedule-card">
            <div class="schedule-head">
              <div class="schedule-date" ${past ? 'style="background:#7b8699;box-shadow:none"' : ''}><b>${parseISO(j.tanggal).getDate()}</b><span>${MONTHS_SHORT[parseISO(j.tanggal).getMonth()]}</span></div>
              <div class="schedule-title">
                <h3>${esc(j.ibadah)} ${past ? '<span class="badge gray" style="margin-left:4px">Selesai</span>' : ''}</h3>
                <p><span>${icon('calendar')} ${dateLong(j.tanggal)}</span><span>${icon('clock')} ${esc(j.jam)} WITA</span></p>
              </div>
              <button class="icon-btn" data-action="jadwal-edit" data-id="${j.id}" title="Edit jadwal">${icon('edit')}</button>
            </div>
            <div class="role-grid">
              <div class="role"><span>Pengkhotbah</span><b>${esc(j.pengkhotbah || '—')}</b></div>
              <div class="role"><span>Liturgos</span><b>${esc(j.liturgos || '—')}</b></div>
              <div class="role"><span>Singer</span><b>${esc(j.singer || '—')}</b></div>
              <div class="role"><span>Pemusik</span><b>${esc(j.pemusik || '—')}</b></div>
              <div class="role"><span>Kolektan</span><b>${esc(j.kolektan || '—')}</b></div>
              <div class="role"><span>Multimedia</span><b>${esc(j.multimedia || '—')}</b></div>
              <div class="role"><span>Sekolah Minggu</span><b>${esc(j.sekolahMinggu || '—')}</b></div>
              <div class="role"><span>Aksi</span><b><button class="link" data-action="jadwal-delete" data-id="${j.id}" style="color:var(--red);background:none;border:0;padding:0;cursor:pointer">Hapus jadwal</button></b></div>
            </div>
            ${j.catatan ? `<div class="schedule-note">${icon('alert')} ${esc(j.catatan)}</div>` : ''}
          </article>`;
        }).join('')}
      </div>` : `<div class="card pad">${emptyState('Belum ada jadwal', 'Tambahkan jadwal pelayanan untuk ibadah mendatang.', 'calendar')}</div>`}
    `}`;
}

function pelayanDatalist() {
  return `<datalist id="pelayanList">${pelayanOptions().map((n) => `<option value="${esc(n)}"></option>`).join('')}</datalist>`;
}

function openJadwalForm(id = '') {
  const j = DB.jadwal.find((x) => x.id === id) || {};
  openModal({
    title: id ? 'Edit Jadwal Pelayanan' : 'Tambah Jadwal Pelayanan',
    subtitle: 'Tentukan petugas pelayanan untuk ibadah mendatang.',
    wide: true,
    body: `<form id="jadwalForm" data-id="${esc(id)}">
      ${pelayanDatalist()}
      <div class="form-grid">
        <label class="field">Tanggal <span class="req">*</span>
          <input type="date" name="tanggal" required value="${esc(j.tanggal || nextSundayISO(0))}">
        </label>
        <label class="field">Waktu
          <input name="jam" value="${esc(j.jam || '09.00')}" placeholder="09.00">
        </label>
        <label class="field span2">Nama Ibadah
          <input name="ibadah" value="${esc(j.ibadah || 'Ibadah Minggu')}" placeholder="cth: Ibadah Minggu">
        </label>
        <label class="field">Pengkhotbah
          <input name="pengkhotbah" list="pelayanList" value="${esc(j.pengkhotbah || DB.settings.pendeta)}">
        </label>
        <label class="field">Liturgos
          <input name="liturgos" list="pelayanList" value="${esc(j.liturgos || '')}">
        </label>
        <label class="field">Singer
          <input name="singer" value="${esc(j.singer || '')}">
        </label>
        <label class="field">Pemusik
          <input name="pemusik" value="${esc(j.pemusik || '')}">
        </label>
        <label class="field">Kolektan / Usher
          <input name="kolektan" value="${esc(j.kolektan || '')}">
        </label>
        <label class="field">Multimedia / Soundman
          <input name="multimedia" list="pelayanList" value="${esc(j.multimedia || '')}">
        </label>
        <label class="field span2">Sekolah Minggu
          <input name="sekolahMinggu" list="pelayanList" value="${esc(j.sekolahMinggu || '')}">
        </label>
        <label class="field span2">Catatan
          <textarea name="catatan" rows="2" placeholder="cth: Perjamuan Kudus">${esc(j.catatan || '')}</textarea>
        </label>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-outline" data-action="modal-close">Batal</button>
        <button type="submit" class="btn btn-primary">${icon('check')} Simpan Jadwal</button>
      </div>
    </form>`,
  });
}

function saveJadwalForm(form) {
  const fd = new FormData(form);
  const id = form.dataset.id;
  const data = {
    tanggal: fd.get('tanggal') || todayISO(),
    jam: String(fd.get('jam') || '09.00').trim(),
    ibadah: String(fd.get('ibadah') || 'Ibadah Minggu').trim(),
    pengkhotbah: String(fd.get('pengkhotbah') || '').trim(),
    liturgos: String(fd.get('liturgos') || '').trim(),
    singer: String(fd.get('singer') || '').trim(),
    pemusik: String(fd.get('pemusik') || '').trim(),
    kolektan: String(fd.get('kolektan') || '').trim(),
    multimedia: String(fd.get('multimedia') || '').trim(),
    sekolahMinggu: String(fd.get('sekolahMinggu') || '').trim(),
    catatan: String(fd.get('catatan') || '').trim(),
  };
  if (id) {
    const idx = DB.jadwal.findIndex((j) => j.id === id);
    if (idx >= 0) DB.jadwal[idx] = { ...DB.jadwal[idx], ...data };
  } else {
    DB.jadwal.push({ id: uid('jd'), ...data });
  }
  saveDB();
  closeModal();
  rerender({ keepScroll: true });
  toast(id ? 'Jadwal pelayanan diperbarui.' : 'Jadwal pelayanan ditambahkan.');
}

function deleteJadwal(id) {
  const j = DB.jadwal.find((x) => x.id === id);
  if (!j) return;
  confirmDialog({
    title: 'Hapus Jadwal',
    message: `Hapus jadwal <b>${esc(j.ibadah)}</b> tanggal <b>${dateMedium(j.tanggal)}</b>?`,
    confirmText: 'Hapus Jadwal',
    onConfirm: () => {
      DB.jadwal = DB.jadwal.filter((x) => x.id !== id);
      saveDB();
      rerender({ keepScroll: true });
      toast('Jadwal pelayanan dihapus.');
    },
  });
}

function openPelayanForm(id = '') {
  const p = DB.pelayan.find((x) => x.id === id) || {};
  openModal({
    title: id ? 'Edit Pelayan' : 'Tambah Pelayan',
    subtitle: 'Daftar pendeta, penatua, diaken, dan pelayan jemaat.',
    body: `<form id="pelayanForm" data-id="${esc(id)}">
      <div class="form-grid">
        <label class="field span2">Nama Lengkap <span class="req">*</span>
          <input name="nama" required value="${esc(p.nama || '')}" placeholder="cth: Pnt. Samuel L. Tangkilisan">
        </label>
        <label class="field">Jabatan
          <input name="jabatan" value="${esc(p.jabatan || '')}" placeholder="cth: Penatua" list="jabatanList">
          <datalist id="jabatanList">
            ${['Pendeta Jemaat', 'Penatua', 'Diaken', 'Penatua / Ketua Majelis', 'Penatua / Sekretaris', 'Diaken / Bendahara', 'Guru Sekolah Minggu', 'Pengurus Pemuda', 'Pengurus Komisi'].map((x) => `<option value="${x}"></option>`).join('')}
          </datalist>
        </label>
        <label class="field">Bidang Pelayanan
          <input name="bidang" value="${esc(p.bidang || '')}" placeholder="cth: Diakonia">
        </label>
        <label class="field">Telepon
          <input name="telepon" value="${esc(p.telepon || '')}" placeholder="cth: 0812-xxxx-xxxx">
        </label>
        <label class="field">Status
          <select name="aktif"><option value="1" ${p.aktif !== false ? 'selected' : ''}>Aktif</option><option value="0" ${p.aktif === false ? 'selected' : ''}>Nonaktif</option></select>
        </label>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-outline" data-action="modal-close">Batal</button>
        <button type="submit" class="btn btn-primary">${icon('check')} Simpan Pelayan</button>
      </div>
    </form>`,
  });
}

function savePelayanForm(form) {
  const fd = new FormData(form);
  const id = form.dataset.id;
  const nama = String(fd.get('nama') || '').trim();
  if (!nama) { toast('Nama pelayan wajib diisi.', 'error'); return; }
  const data = {
    nama,
    jabatan: String(fd.get('jabatan') || 'Pelayan').trim(),
    bidang: String(fd.get('bidang') || '').trim(),
    telepon: String(fd.get('telepon') || '').trim(),
    aktif: fd.get('aktif') !== '0',
  };
  if (id) {
    const idx = DB.pelayan.findIndex((p) => p.id === id);
    if (idx >= 0) DB.pelayan[idx] = { ...DB.pelayan[idx], ...data };
  } else {
    DB.pelayan.push({ id: uid('pl'), ...data });
  }
  saveDB();
  closeModal();
  rerender({ keepScroll: true });
  toast(id ? 'Data pelayan diperbarui.' : 'Pelayan ditambahkan.');
}

function deletePelayan(id) {
  const p = DB.pelayan.find((x) => x.id === id);
  if (!p) return;
  confirmDialog({
    title: 'Hapus Pelayan',
    message: `Hapus <b>${esc(p.nama)}</b> dari daftar pelayan?`,
    confirmText: 'Hapus Pelayan',
    onConfirm: () => {
      DB.pelayan = DB.pelayan.filter((x) => x.id !== id);
      saveDB();
      rerender({ keepScroll: true });
      toast('Data pelayan dihapus.');
    },
  });
}

/* =========================================================
   KEGIATAN
   ========================================================= */
function filteredKegiatan() {
  const mode = UI.kegiatan.filter || 'akan';
  const list = sortedKegiatan();
  if (mode === 'akan') return list.filter((k) => k.tanggal >= todayISO());
  if (mode === 'selesai') return list.filter((k) => k.tanggal < todayISO()).reverse();
  return list;
}

function renderKegiatan() {
  const list = filteredKegiatan();
  const all = DB.kegiatan;
  const upcomingCount = all.filter((k) => k.tanggal >= todayISO()).length;
  return `
    ${pageHead('Agenda Jemaat', 'Kegiatan Jemaat', 'Agenda ibadah, persekutuan, pelayanan diakonia, dan kegiatan komisi jemaat.', `
      <button class="btn btn-primary" data-action="kegiatan-add">${icon('plus')} Tambah Kegiatan</button>
    `)}

    <div class="stats">
      <div class="stat green"><div class="stat-ico">${icon('calendar')}</div><div class="stat-body"><div class="stat-label">Kegiatan Mendatang</div><div class="stat-value">${num(upcomingCount)}</div><div class="stat-hint">Agenda yang akan datang</div></div></div>
      <div class="stat"><div class="stat-ico">${icon('check')}</div><div class="stat-body"><div class="stat-label">Kegiatan Selesai</div><div class="stat-value">${num(all.length - upcomingCount)}</div><div class="stat-hint">Telah dilaksanakan</div></div></div>
      <div class="stat gold"><div class="stat-ico">${icon('users')}</div><div class="stat-body"><div class="stat-label">Kategori</div><div class="stat-value">${num(new Set(all.map((k) => k.kategori)).size)}</div><div class="stat-hint">Bidang kegiatan jemaat</div></div></div>
      <div class="stat red"><div class="stat-ico">${icon('clock')}</div><div class="stat-body"><div class="stat-label">Agenda Terdekat</div><div class="stat-value sm">${upcomingCount ? dateShort(sortedKegiatan().filter((k) => k.tanggal >= todayISO())[0].tanggal) : '—'}</div><div class="stat-hint">${upcomingCount ? esc(sortedKegiatan().filter((k) => k.tanggal >= todayISO())[0].nama) : 'Belum ada kegiatan'}</div></div></div>
    </div>

    <div class="filter-chips">
      <button class="chip ${UI.kegiatan.filter === 'akan' ? 'active' : ''}" data-action="kegiatan-filter" data-filter="akan">Mendatang</button>
      <button class="chip ${UI.kegiatan.filter === 'semua' ? 'active' : ''}" data-action="kegiatan-filter" data-filter="semua">Semua</button>
      <button class="chip ${UI.kegiatan.filter === 'selesai' ? 'active' : ''}" data-action="kegiatan-filter" data-filter="selesai">Selesai</button>
    </div>

    ${list.length ? `<div class="activity-grid">
      ${list.map((k) => {
        const d = daysUntil(k.tanggal);
        const countdown = d === 0 ? 'Hari ini' : d > 0 ? `${d} hari lagi` : `${Math.abs(d)} hari lalu`;
        return `<article class="card activity-card">
          <div class="activity-top">
            <div class="activity-date"><b>${parseISO(k.tanggal).getDate()}</b><span>${MONTHS_SHORT[parseISO(k.tanggal).getMonth()]}</span></div>
            <div class="activity-title">
              <h3>${esc(k.nama)}</h3>
              <div class="mini-tag">${icon('calendar')} ${dateLong(k.tanggal)}</div>
            </div>
            <span class="countdown ${d < 0 ? 'past' : ''}">${countdown}</span>
          </div>
          <p>${esc(k.deskripsi || '')}</p>
          <div class="activity-meta">
            <span>${icon('clock')} ${esc(k.waktu)} WITA</span>
            <span>${icon('pin')} ${esc(k.tempat)}</span>
            <span>${icon('users')} ${esc(k.penanggungjawab || '—')}</span>
          </div>
          <div class="activity-foot">
            <span class="badge ${wartaBadgeTone(k.kategori)}">${esc(k.kategori)}</span>
            <div class="actions">
              <button class="icon-btn" data-action="kegiatan-edit" data-id="${k.id}" title="Edit">${icon('edit')}</button>
              <button class="icon-btn danger" data-action="kegiatan-delete" data-id="${k.id}" title="Hapus">${icon('trash')}</button>
            </div>
          </div>
        </article>`;
      }).join('')}
    </div>` : `<div class="card pad">${emptyState('Belum ada kegiatan', 'Tambahkan agenda kegiatan atau ubah filter.', 'heart')}</div>`}`;
}

function openKegiatanForm(id = '') {
  const k = DB.kegiatan.find((x) => x.id === id) || {};
  openModal({
    title: id ? 'Edit Kegiatan' : 'Tambah Kegiatan',
    subtitle: 'Agenda pelayanan dan persekutuan jemaat.',
    wide: true,
    body: `<form id="kegiatanForm" data-id="${esc(id)}">
      <div class="form-grid">
        <label class="field span2">Nama Kegiatan <span class="req">*</span>
          <input name="nama" required value="${esc(k.nama || '')}" placeholder="cth: Ibadah Rumah Tangga Kolom 1">
        </label>
        <label class="field">Tanggal <span class="req">*</span>
          <input type="date" name="tanggal" required value="${esc(k.tanggal || dateFromToday(7))}">
        </label>
        <label class="field">Waktu
          <input name="waktu" value="${esc(k.waktu || '19.00')}" placeholder="19.00">
        </label>
        <label class="field">Tempat
          <input name="tempat" value="${esc(k.tempat || '')}" placeholder="cth: Aula Gereja">
        </label>
        <label class="field">Kategori
          <input name="kategori" value="${esc(k.kategori || 'Kegiatan')}" placeholder="cth: Komisi Pemuda" list="kategoriKegiatanList">
          <datalist id="kategoriKegiatanList">
            ${['Ibadah Kolom', 'Komisi Wanita', 'Komisi Pemuda', 'Komisi Anak', 'Musik & Pujian', 'Diakonia', 'Rapat', 'Kegiatan'].map((x) => `<option value="${x}"></option>`).join('')}
          </datalist>
        </label>
        <label class="field span2">Penanggung Jawab
          <input name="penanggungjawab" list="pelayanListKegiatan" value="${esc(k.penanggungjawab || '')}" placeholder="cth: Pnt. Samuel L. Tangkilisan">
          <datalist id="pelayanListKegiatan">${pelayanOptions().map((n) => `<option value="${esc(n)}"></option>`).join('')}</datalist>
        </label>
        <label class="field span2">Deskripsi
          <textarea name="deskripsi" rows="3" placeholder="Keterangan singkat kegiatan…">${esc(k.deskripsi || '')}</textarea>
        </label>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-outline" data-action="modal-close">Batal</button>
        <button type="submit" class="btn btn-primary">${icon('check')} Simpan Kegiatan</button>
      </div>
    </form>`,
  });
}

function saveKegiatanForm(form) {
  const fd = new FormData(form);
  const id = form.dataset.id;
  const nama = String(fd.get('nama') || '').trim();
  if (!nama) { toast('Nama kegiatan wajib diisi.', 'error'); return; }
  const data = {
    nama,
    tanggal: fd.get('tanggal') || todayISO(),
    waktu: String(fd.get('waktu') || '09.00').trim(),
    tempat: String(fd.get('tempat') || '').trim(),
    kategori: String(fd.get('kategori') || 'Kegiatan').trim(),
    penanggungjawab: String(fd.get('penanggungjawab') || '').trim(),
    deskripsi: String(fd.get('deskripsi') || '').trim(),
  };
  if (id) {
    const idx = DB.kegiatan.findIndex((k) => k.id === id);
    if (idx >= 0) DB.kegiatan[idx] = { ...DB.kegiatan[idx], ...data };
  } else {
    DB.kegiatan.push({ id: uid('k'), ...data });
  }
  saveDB();
  closeModal();
  rerender({ keepScroll: true });
  toast(id ? 'Kegiatan diperbarui.' : 'Kegiatan ditambahkan.');
}

function deleteKegiatan(id) {
  const k = DB.kegiatan.find((x) => x.id === id);
  if (!k) return;
  confirmDialog({
    title: 'Hapus Kegiatan',
    message: `Hapus kegiatan <b>${esc(k.nama)}</b>?`,
    confirmText: 'Hapus Kegiatan',
    onConfirm: () => {
      DB.kegiatan = DB.kegiatan.filter((x) => x.id !== id);
      saveDB();
      rerender({ keepScroll: true });
      toast('Kegiatan dihapus.');
    },
  });
}

/* =========================================================
   STRUKTUR ORGANISASI
   ========================================================= */
function orgTreeData() {
  const map = new Map();
  DB.struktur.slice().sort((a, b) => (a.urutan || 0) - (b.urutan || 0)).forEach((n) => map.set(n.id, { ...n, children: [] }));
  const roots = [];
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) map.get(node.parentId).children.push(node);
    else roots.push(node);
  });
  const sortRec = (nodes) => {
    nodes.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

function renderOrgNode(node, depth = 0) {
  return `<li>
    <div class="org-node ${depth === 0 ? 'root' : depth === 1 ? 'leader' : ''}">
      <div class="org-avatar">${esc(initials(node.nama))}</div>
      <div class="org-jabatan">${esc(node.jabatan)}</div>
      <div class="org-nama">${esc(node.nama)}</div>
      <div class="org-periode">${esc(node.periode || '')}</div>
      <div class="org-actions">
        <button class="icon-btn" data-action="org-add-child" data-id="${node.id}" title="Tambah bawahan">${icon('plus')}</button>
        <button class="icon-btn" data-action="org-edit" data-id="${node.id}" title="Edit">${icon('edit')}</button>
        <button class="icon-btn danger" data-action="org-delete" data-id="${node.id}" title="Hapus">${icon('trash')}</button>
      </div>
    </div>
    ${node.children.length ? `<ul>${node.children.map((c) => renderOrgNode(c, depth + 1)).join('')}</ul>` : ''}
  </li>`;
}

function renderStruktur() {
  const roots = orgTreeData();
  return `
    ${pageHead('Organisasi Jemaat', 'Struktur Organisasi', 'Susunan kepemimpinan dan pelayanan majelis jemaat beserta komisi dan tim pelayanan.', `
      <button class="btn btn-primary" data-action="org-add">${icon('plus')} Tambah Jabatan</button>
    `)}

    <div class="card pad">
      <div class="org-toolbar">
        <div>
          <div class="card-head" style="margin-bottom:4px"><div><h3>Majelis Jemaat ${new Date().getFullYear()}</h3><p>Klik ikon pada kartu untuk menambah, mengubah, atau menghapus jabatan.</p></div></div>
        </div>
        <div class="org-legend">
          <span><i class="gold"></i> Pimpinan</span>
          <span><i class="blue"></i> Majelis & pelayanan</span>
        </div>
      </div>
      ${roots.length ? `<div class="org-scroll"><ul class="org">${roots.map((r) => renderOrgNode(r, 0)).join('')}</ul></div>` : emptyState('Struktur belum diatur', 'Tambahkan jabatan puncak terlebih dahulu.', 'sitemap')}
      <div class="form-note" style="margin-top:4px">${icon('alert')} Bagan dapat digeser ke samping pada layar kecil. Data jabatan bersifat contoh dan dapat disesuaikan dengan kondisi jemaat.</div>
    </div>`;
}

function orgDescendants(id) {
  const out = new Set();
  const walk = (pid) => {
    DB.struktur.filter((n) => n.parentId === pid).forEach((n) => { out.add(n.id); walk(n.id); });
  };
  walk(id);
  return out;
}

function orgParentOptions(selected = '', excludeId = '') {
  const excluded = excludeId ? orgDescendants(excludeId) : new Set();
  if (excludeId) excluded.add(excludeId);
  return `<option value="">— Tanpa atasan (puncak) —</option>` +
    DB.struktur
      .filter((n) => !excluded.has(n.id))
      .sort((a, b) => (a.urutan || 0) - (b.urutan || 0))
      .map((n) => `<option value="${n.id}" ${selected === n.id ? 'selected' : ''}>${esc(n.jabatan)} — ${esc(n.nama)}</option>`)
      .join('');
}

function openOrgForm(id = '', presetParent = '') {
  const node = DB.struktur.find((x) => x.id === id) || {};
  const selectedParent = id ? node.parentId || '' : presetParent || '';
  openModal({
    title: id ? 'Edit Jabatan Organisasi' : 'Tambah Jabatan Organisasi',
    subtitle: 'Lengkapi nama, jabatan, dan atasan langsung dalam struktur.',
    body: `<form id="orgForm" data-id="${esc(id)}">
      <div class="form-grid">
        <label class="field span2">Nama Lengkap <span class="req">*</span>
          <input name="nama" required value="${esc(node.nama || '')}" placeholder="cth: Pnt. Samuel L. Tangkilisan">
        </label>
        <label class="field">Jabatan <span class="req">*</span>
          <input name="jabatan" required value="${esc(node.jabatan || '')}" placeholder="cth: Ketua Majelis">
        </label>
        <label class="field">Periode
          <input name="periode" value="${esc(node.periode || '2024–2028')}" placeholder="cth: 2024–2028">
        </label>
        <label class="field span2">Atasan Langsung
          <select name="parentId">${orgParentOptions(selectedParent, id)}</select>
        </label>
        <label class="field">Telepon
          <input name="telepon" value="${esc(node.telepon || '')}" placeholder="cth: 0812-xxxx-xxxx">
        </label>
        <label class="field">Urutan Tampil
          <input type="number" name="urutan" min="1" value="${esc(node.urutan || 1)}">
        </label>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-outline" data-action="modal-close">Batal</button>
        <button type="submit" class="btn btn-primary">${icon('check')} Simpan Jabatan</button>
      </div>
    </form>`,
  });
}

function saveOrgForm(form) {
  const fd = new FormData(form);
  const id = form.dataset.id;
  const nama = String(fd.get('nama') || '').trim();
  const jabatan = String(fd.get('jabatan') || '').trim();
  if (!nama || !jabatan) { toast('Nama dan jabatan wajib diisi.', 'error'); return; }
  const parentId = fd.get('parentId') || null;
  if (id && parentId) {
    if (id === parentId || orgDescendants(id).has(parentId)) {
      toast('Atasan tidak boleh dirinya sendiri atau bawahannya.', 'error');
      return;
    }
  }
  const data = {
    nama, jabatan, parentId,
    periode: String(fd.get('periode') || '').trim(),
    telepon: String(fd.get('telepon') || '').trim(),
    urutan: Number(fd.get('urutan') || 1),
  };
  if (id) {
    const idx = DB.struktur.findIndex((s) => s.id === id);
    if (idx >= 0) DB.struktur[idx] = { ...DB.struktur[idx], ...data };
  } else {
    DB.struktur.push({ id: uid('s'), ...data });
  }
  saveDB();
  closeModal();
  rerender({ keepScroll: true });
  toast(id ? 'Jabatan diperbarui.' : 'Jabatan ditambahkan ke struktur.');
}

function deleteOrg(id) {
  const node = DB.struktur.find((x) => x.id === id);
  if (!node) return;
  const children = DB.struktur.filter((n) => n.parentId === id);
  if (children.length) {
    toast('Pindahkan atau hapus jabatan di bawahnya terlebih dahulu.', 'error');
    return;
  }
  confirmDialog({
    title: 'Hapus Jabatan',
    message: `Hapus jabatan <b>${esc(node.jabatan)}</b> (${esc(node.nama)}) dari struktur organisasi?`,
    confirmText: 'Hapus Jabatan',
    onConfirm: () => {
      DB.struktur = DB.struktur.filter((x) => x.id !== id);
      saveDB();
      rerender({ keepScroll: true });
      toast('Jabatan dihapus dari struktur.');
    },
  });
}

/* =========================================================
   PENGATURAN
   ========================================================= */
function renderPengaturan() {
  const s = DB.settings;
  const auth = typeof authRead === 'function' ? authRead() : null;
  const authDefault = !auth || auth.isDefault;
  const installed = typeof pwaStandalone === 'function' ? pwaStandalone() : false;
  const size = (() => {
    try { return new Blob([JSON.stringify(DB)]).size; } catch (e) { return 0; }
  })();
  return `
    ${pageHead('Sistem', 'Pengaturan', 'Profil gereja, data aplikasi, serta pencadangan dan pemulihan data jemaat.', '')}

    <div class="settings-grid">
      <div class="card pad">
        <div class="card-head"><div><h3>Profil Gereja</h3><p>Digunakan pada kop laporan, slide, dan dokumen cetak.</p></div></div>
        <form id="settingsForm">
          <div class="form-grid">
            <label class="field span2">Nama Gereja
              <input name="nama" value="${esc(s.nama)}" required>
            </label>
            <label class="field span2">Tagline / Motto
              <input name="tagline" value="${esc(s.tagline || '')}">
            </label>
            <label class="field span2">Alamat
              <input name="alamat" value="${esc(s.alamat)}">
            </label>
            <label class="field">Telepon / WhatsApp
              <input name="telepon" value="${esc(s.telepon)}">
            </label>
            <label class="field">Email
              <input type="email" name="email" value="${esc(s.email)}">
            </label>
            <label class="field">Pendeta Jemaat
              <input name="pendeta" value="${esc(s.pendeta)}">
            </label>
            <label class="field">Jadwal Ibadah
              <input name="ibadah" value="${esc(s.ibadah)}" placeholder="cth: Minggu, 09.00 WITA">
            </label>
            <div class="span2" style="border-top:1px dashed var(--line);padding-top:14px;margin-top:2px">
              <div class="form-section-title" style="margin-bottom:6px">Kas & Saldo Awal</div>
              <div class="info-row"><span>Total saldo awal ${KAS_LIST.length} kas</span><b>${money(saldoAwalKas())}</b></div>
              <p class="form-note" style="margin-top:6px">Saldo awal dicatat terpisah untuk Kas Jemaat, Kas Kolom 1–5, Kas Komisi Duka, dan Kas Komisi Pembangunan.</p>
              <button type="button" class="btn btn-outline btn-sm" data-action="kas-saldo">${icon('settings')} Atur Saldo Awal per Kas</button>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">${icon('check')} Simpan Pengaturan</button>
          </div>
        </form>
      </div>

      <div class="stack">
        <div class="card pad">
          <div class="card-head"><div><h3>Ringkasan Data</h3><p>Tersimpan di browser perangkat ini</p></div></div>
          <div class="info-row"><span>Data jemaat</span><b>${num(DB.jemaat.length)} orang</b></div>
          <div class="info-row"><span>Transaksi keuangan</span><b>${num(DB.transaksi.length)} transaksi</b></div>
          <div class="info-row"><span>Tata ibadah</span><b>${num(DB.ibadah.length)} susunan</b></div>
          <div class="info-row"><span>Warta jemaat</span><b>${num(DB.warta.length)} warta</b></div>
          <div class="info-row"><span>Jadwal pelayanan</span><b>${num(DB.jadwal.length)} jadwal</b></div>
          <div class="info-row"><span>Kegiatan</span><b>${num(DB.kegiatan.length)} kegiatan</b></div>
          <div class="info-row"><span>Data aset gereja</span><b>${num(DB.aset.length)} jenis</b></div>
          <div class="info-row"><span>Ukuran data</span><b>${(size / 1024).toFixed(1)} KB</b></div>
          <div class="info-row"><span>Terakhir diubah</span><b>${DB.meta.updatedAt ? dateMedium(DB.meta.updatedAt.slice(0, 10)) : '—'}</b></div>
        </div>

        <div class="card pad">
          <div class="card-head">
            <div><h3>Aplikasi & Perangkat</h3><p>Pasang di HP / laptop & tampilan layar penuh</p></div>
            <span class="badge ${installed ? 'green' : 'gray'}" data-pwa-state>${installed ? 'Terpasang' : 'Belum dipasang'}</span>
          </div>
          <div class="data-btn-grid">
            <button class="btn btn-primary" data-action="install-app" data-pwa-install>${icon('download')} Pasang Aplikasi</button>
            <button class="btn btn-outline" data-action="toggle-fullscreen">${icon('maximize')} <span data-pwa-fullscreen-label>Layar Penuh</span></button>
          </div>
          <div class="detail-note hidden" data-pwa-installed style="margin-top:10px">${icon('check')} Aplikasi sudah terpasang di perangkat ini. Buka lewat ikon <b>Maranatha</b> di layar utama atau menu aplikasi.</div>
          <p class="form-note">Di HP: buka menu browser → <b>Tambahkan ke layar utama</b>. Di laptop: klik ikon instal di address bar, lalu sematkan ke taskbar. Setelah terpasang, aplikasi bisa dibuka tanpa internet.</p>
        </div>

        <div class="card pad">
          <div class="card-head"><div><h3>Cadangan & Pemulihan</h3><p>Ekspor data ke file JSON</p></div></div>
          <div class="data-btn-grid">
            <button class="btn btn-outline" data-action="data-export">${icon('download')} Ekspor Semua Data (JSON)</button>
            <button class="btn btn-outline" data-action="data-import">${icon('upload')} Impor Data dari JSON</button>
            <input type="file" id="importFile" accept="application/json,.json" class="hidden">
          </div>
          <p class="form-note">Gunakan fitur ini untuk memindahkan data ke komputer lain atau mencadangkan data sebelum memperbarui aplikasi.</p>
        </div>

        <div class="card pad">
          <div class="card-head">
            <div><h3>Keamanan Aplikasi</h3><p>Kunci akses administrator</p></div>
            <span class="badge ${authDefault ? 'amber' : 'green'}">${authDefault ? 'Sandi bawaan' : 'Aktif'}</span>
          </div>
          <div class="info-row"><span>Status kunci</span><b>Aktif saat aplikasi dibuka</b></div>
          <div class="info-row"><span>Terakhir diubah</span><b>${auth && auth.updatedAt ? dateMedium(auth.updatedAt.slice(0, 10)) : '—'}</b></div>
          ${authDefault ? `<div class="detail-note" style="margin-top:10px">${icon('alert')} Anda masih memakai kata sandi bawaan. Segera ganti melalui formulir di bawah ini.</div>` : ''}
          <form id="passwordForm" style="margin-top:14px" autocomplete="off">
            <div class="form-grid">
              <label class="field span2">Kata sandi saat ini
                <span class="pw-field">
                  <input type="password" name="current" required autocomplete="current-password" placeholder="Kata sandi yang dipakai sekarang">
                  <button type="button" class="pw-toggle" data-action="auth-toggle-pw" aria-label="Tampilkan kata sandi">${icon('eye')}</button>
                </span>
              </label>
              <label class="field">Kata sandi baru
                <input type="password" name="next" required minlength="6" autocomplete="new-password" placeholder="Minimal 6 karakter">
              </label>
              <label class="field">Ulangi kata sandi baru
                <input type="password" name="confirm" required minlength="6" autocomplete="new-password" placeholder="Ulangi kata sandi baru">
              </label>
            </div>
            <div class="form-actions" style="justify-content:space-between">
              <button type="button" class="btn btn-outline btn-sm" data-action="lock-app">${icon('lock')} Kunci Sekarang</button>
              <button type="submit" class="btn btn-primary btn-sm">${icon('check')} Simpan Kata Sandi</button>
            </div>
          </form>
          <p class="form-note">Kata sandi disimpan dalam bentuk hash di perangkat ini dan tidak ikut terekspor bersama data jemaat. Jika lupa, teknisi dapat menghapus kunci login tanpa menghapus data.</p>
        </div>

        <div class="danger-zone">
          <b>${icon('alert')} Kembalikan Data Contoh</b>
          <p>Menghapus seluruh data saat ini dan mengembalikan data contoh awal. Ekspor cadangan terlebih dahulu.</p>
          <button class="btn btn-danger btn-sm" data-action="data-reset">${icon('trash')} Reset Data</button>
        </div>
      </div>
    </div>

    <div class="card pad" style="margin-top:16px">
      <div class="card-head"><div><h3>Tentang Aplikasi</h3><p>Sistem Informasi Jemaat Gereja Maranatha Tolitoli</p></div><span class="badge outline">v1.3</span></div>
      <p style="font-size:12px;color:var(--muted);line-height:1.7;margin:0">
        Aplikasi ini berjalan sepenuhnya luring (offline) di browser dan menyimpan data pada <b>localStorage</b> perangkat.
        Dapat dipasang di HP dan laptop (PWA) serta dibuka layar penuh tanpa koneksi internet.
        Fitur: kunci akses administrator, data jemaat, keuangan, tata ibadah dengan mode slide dan ekspor PowerPoint, warta jemaat (slide & cetak),
        rekap ulang tahun jemaat pekan berjalan, jadwal pelayanan pendeta & majelis, kegiatan jemaat, struktur organisasi,
        serta data aset dan inventaris gereja.
        Data contoh disediakan untuk memudahkan penyesuaian. Ganti data contoh dengan data jemaat yang sebenarnya melalui menu masing-masing.
      </p>
    </div>`;
}

function saveSettingsForm(form) {
  const fd = new FormData(form);
  DB.settings = {
    ...DB.settings,
    nama: String(fd.get('nama') || '').trim() || 'Gereja Maranatha Tolitoli',
    tagline: String(fd.get('tagline') || '').trim(),
    alamat: String(fd.get('alamat') || '').trim(),
    telepon: String(fd.get('telepon') || '').trim(),
    email: String(fd.get('email') || '').trim(),
    pendeta: String(fd.get('pendeta') || '').trim(),
    ibadah: String(fd.get('ibadah') || '').trim(),
    saldoAwal: saldoAwalKas(),
    saldoAwalKas: DB.settings.saldoAwalKas,
  };
  saveDB();
  rerender({ keepScroll: true });
  toast('Pengaturan gereja disimpan.');
}

/* =========================================================
   DATA ASET GEREJA
   ========================================================= */
function kondisiAsetTone(kondisi) {
  return { Baik: 'green', 'Rusak Ringan': 'amber', 'Rusak Berat': 'red' }[kondisi] || 'gray';
}

function filteredAset() {
  const { q = '', kategori = '', kondisi = '' } = UI.aset;
  const term = q.toLowerCase().trim();
  return sortedAset().filter((a) => {
    if (kategori && a.kategori !== kategori) return false;
    if (kondisi && a.kondisi !== kondisi) return false;
    if (term && !`${a.nama} ${a.kategori} ${a.lokasi} ${a.penanggungjawab} ${a.catatan}`.toLowerCase().includes(term)) return false;
    return true;
  });
}

function renderAset() {
  const list = filteredAset();
  const totalUnit = DB.aset.reduce((s, a) => s + (Number(a.jumlah) || 0), 0);
  const totalNilai = totalNilaiAset();
  const baik = DB.aset.filter((a) => a.kondisi === 'Baik').length;
  const ringan = DB.aset.filter((a) => a.kondisi === 'Rusak Ringan').length;
  const berat = DB.aset.filter((a) => a.kondisi === 'Rusak Berat').length;
  const listUnit = list.reduce((s, a) => s + (Number(a.jumlah) || 0), 0);
  const listNilai = totalNilaiAset(list);

  return `
    ${pageHead('Inventaris Jemaat', 'Data Aset Gereja', 'Pencatatan tanah, bangunan, kendaraan, peralatan ibadah, dan inventaris gereja beserta nilai perolehan dan kondisinya.', `
      <button class="btn btn-outline" data-action="aset-print">${icon('print')} Cetak Daftar</button>
      <button class="btn btn-outline" data-action="aset-export">${icon('download')} Ekspor CSV</button>
      <button class="btn btn-primary" data-action="aset-add">${icon('plus')} Tambah Aset</button>
    `)}

    <div class="stats">
      <div class="stat">
        <div class="stat-ico">${icon('box')}</div>
        <div class="stat-body">
          <div class="stat-label">Jumlah Aset</div>
          <div class="stat-value">${num(totalUnit)} <span style="font-size:11px;font-weight:600;color:var(--muted)">unit</span></div>
          <div class="stat-hint">${num(DB.aset.length)} jenis aset tercatat</div>
        </div>
      </div>
      <div class="stat green">
        <div class="stat-ico">${icon('wallet')}</div>
        <div class="stat-body">
          <div class="stat-label">Nilai Perolehan</div>
          <div class="stat-value sm">${money(totalNilai)}</div>
          <div class="stat-hint">Akumulasi seluruh aset</div>
        </div>
      </div>
      <div class="stat gold">
        <div class="stat-ico">${icon('check')}</div>
        <div class="stat-body">
          <div class="stat-label">Kondisi Baik</div>
          <div class="stat-value">${num(baik)}</div>
          <div class="stat-hint">${DB.aset.length ? Math.round((baik / DB.aset.length) * 100) : 0}% dari jenis aset</div>
        </div>
      </div>
      <div class="stat red">
        <div class="stat-ico">${icon('alert')}</div>
        <div class="stat-body">
          <div class="stat-label">Perlu Perhatian</div>
          <div class="stat-value">${num(ringan + berat)}</div>
          <div class="stat-hint">${num(ringan)} rusak ringan · ${num(berat)} rusak berat</div>
        </div>
      </div>
    </div>

    <div class="card pad">
      <div class="filters">
        <div class="search">
          ${icon('search')}
          <input id="asetSearch" value="${esc(UI.aset.q)}" placeholder="Cari nama aset, lokasi, penanggung jawab…" autocomplete="off">
        </div>
        <select id="asetKategori" style="width:auto;min-width:190px">
          <option value="">Semua kategori</option>
          ${KATEGORI_ASET.map((k) => `<option value="${esc(k)}" ${UI.aset.kategori === k ? 'selected' : ''}>${esc(k)}</option>`).join('')}
        </select>
        <select id="asetKondisi" style="width:auto;min-width:150px">
          <option value="">Semua kondisi</option>
          ${KONDISI_ASET.map((k) => `<option value="${esc(k)}" ${UI.aset.kondisi === k ? 'selected' : ''}>${esc(k)}</option>`).join('')}
        </select>
        ${(UI.aset.q || UI.aset.kategori || UI.aset.kondisi) ? `<button class="btn btn-ghost btn-sm" data-action="aset-reset-filter">Reset</button>` : ''}
      </div>

      <div class="table-scroll">
        <table class="data">
          <thead><tr>
            <th>Nama Aset</th><th>Kategori</th><th>Jumlah</th><th>Kondisi</th><th>Lokasi</th><th class="num">Nilai Perolehan</th><th></th>
          </tr></thead>
          <tbody>
            ${list.map((a) => `
              <tr>
                <td>
                  <div class="cell-main">
                    <span class="aset-ico">${icon('box')}</span>
                    <div><b>${esc(a.nama)}</b><small>${esc(a.penanggungjawab ? `PJ: ${a.penanggungjawab}` : (a.catatan || '—'))}</small></div>
                  </div>
                </td>
                <td><span class="badge blue">${esc(a.kategori)}</span></td>
                <td>${num(a.jumlah)} ${esc(a.satuan || 'unit')}</td>
                <td><span class="badge ${kondisiAsetTone(a.kondisi)}">${esc(a.kondisi)}</span></td>
                <td><span class="mini-tag">${icon('pin')} ${esc(a.lokasi || '—')}</span></td>
                <td class="num">${money(nilaiAset(a))}</td>
                <td class="actions">
                  <button class="icon-btn" data-action="aset-view" data-id="${a.id}" title="Lihat detail">${icon('eye')}</button>
                  <button class="icon-btn" data-action="aset-edit" data-id="${a.id}" title="Edit">${icon('edit')}</button>
                  <button class="icon-btn danger" data-action="aset-delete" data-id="${a.id}" title="Hapus">${icon('trash')}</button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      ${list.length
        ? `<div class="table-foot"><span>Menampilkan <b>${list.length}</b> dari ${DB.aset.length} jenis aset · ${num(listUnit)} unit</span><span>Total nilai: <b>${money(listNilai)}</b></span></div>`
        : emptyState('Belum ada data aset', 'Tambahkan aset gereja atau ubah filter pencarian.', 'box')}
    </div>`;
}

function openAsetForm(id = '') {
  const a = DB.aset.find((x) => x.id === id) || {};
  const isEdit = Boolean(id);
  openModal({
    title: isEdit ? 'Edit Data Aset' : 'Tambah Data Aset',
    subtitle: 'Inventaris properti dan perlengkapan gereja.',
    wide: true,
    body: `<form id="asetForm" data-id="${esc(id)}">
      <div class="form-section">
        <div class="form-section-title">Identitas Aset</div>
        <div class="form-grid">
          <label class="field span2">Nama Aset <span class="req">*</span>
            <input name="nama" required value="${esc(a.nama || '')}" placeholder="cth: Proyektor Epson EB-X06">
          </label>
          <label class="field">Kategori
            <select name="kategori">${KATEGORI_ASET.map((k) => `<option ${a.kategori === k ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select>
          </label>
          <label class="field">Kondisi
            <select name="kondisi">${KONDISI_ASET.map((k) => `<option ${a.kondisi === k ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select>
          </label>
          <label class="field">Jumlah
            <input type="number" min="0" step="1" name="jumlah" value="${esc(a.jumlah == null ? 1 : a.jumlah)}">
          </label>
          <label class="field">Satuan
            <input name="satuan" value="${esc(a.satuan || 'unit')}" placeholder="unit / set / bidang / eksemplar">
          </label>
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-title">Nilai & Penempatan</div>
        <div class="form-grid">
          <label class="field">Tanggal Perolehan
            <input type="date" name="tanggalPerolehan" value="${esc(a.tanggalPerolehan || '')}">
          </label>
          <label class="field">Nilai per Unit (Rp) <span class="hint-text">— total dihitung otomatis</span>
            <input type="number" min="0" step="1000" name="nilaiPerolehan" value="${esc(a.nilaiPerolehan == null ? '' : a.nilaiPerolehan)}" placeholder="cth: 7200000">
          </label>
          <label class="field span2">Lokasi / Penempatan
            <input name="lokasi" value="${esc(a.lokasi || '')}" placeholder="cth: Ruang ibadah, gudang belakang, garasi gereja">
          </label>
          <label class="field span2">Penanggung Jawab
            <input name="penanggungjawab" list="pelayanList" value="${esc(a.penanggungjawab || '')}" placeholder="cth: Pnt. Petrus L. Toding">
            ${pelayanDatalist()}
          </label>
          <label class="field span2">Catatan
            <textarea name="catatan" rows="2" placeholder="cth: Perlu servis berkala, nomor STNK, luas tanah">${esc(a.catatan || '')}</textarea>
          </label>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-outline" data-action="modal-close">Batal</button>
        <button type="submit" class="btn btn-primary">${icon('check')} Simpan Aset</button>
      </div>
    </form>`,
  });
}

function saveAsetForm(form) {
  const fd = new FormData(form);
  const id = form.dataset.id;
  const nama = String(fd.get('nama') || '').trim();
  if (!nama) { toast('Nama aset wajib diisi.', 'error'); return; }
  const data = {
    nama,
    kategori: fd.get('kategori') || KATEGORI_ASET[0],
    kondisi: fd.get('kondisi') || KONDISI_ASET[0],
    jumlah: Math.max(0, Number(fd.get('jumlah')) || 0),
    satuan: String(fd.get('satuan') || 'unit').trim() || 'unit',
    tanggalPerolehan: fd.get('tanggalPerolehan') || '',
    nilaiPerolehan: Math.max(0, Number(fd.get('nilaiPerolehan')) || 0),
    lokasi: String(fd.get('lokasi') || '').trim(),
    penanggungjawab: String(fd.get('penanggungjawab') || '').trim(),
    catatan: String(fd.get('catatan') || '').trim(),
  };
  if (id) {
    const idx = DB.aset.findIndex((a) => a.id === id);
    if (idx >= 0) DB.aset[idx] = { ...DB.aset[idx], ...data };
  } else {
    DB.aset.push({ id: uid('as'), ...data });
  }
  saveDB();
  closeModal();
  rerender({ keepScroll: true });
  toast(id ? 'Data aset diperbarui.' : 'Aset baru ditambahkan.');
}

function viewAset(id) {
  const a = DB.aset.find((x) => x.id === id);
  if (!a) return;
  openModal({
    wide: true,
    title: 'Detail Aset',
    body: `
      <div class="modal-profile">
        <span class="aset-ico lg">${icon('box')}</span>
        <div style="min-width:0">
          <h3>${esc(a.nama)}</h3>
          <p>${esc(a.kategori)} · ${esc(a.lokasi || 'Lokasi belum diisi')}</p>
          <div style="display:flex;gap:5px;margin-top:5px;flex-wrap:wrap"><span class="badge ${kondisiAsetTone(a.kondisi)}">${esc(a.kondisi)}</span><span class="badge gray">${num(a.jumlah)} ${esc(a.satuan || 'unit')}</span></div>
        </div>
      </div>
      <div class="detail-grid">
        <div><small>Kategori</small><b>${esc(a.kategori || '—')}</b></div>
        <div><small>Jumlah</small><b>${num(a.jumlah)} ${esc(a.satuan || 'unit')}</b></div>
        <div><small>Tanggal Perolehan</small><b>${a.tanggalPerolehan ? dateMedium(a.tanggalPerolehan) : '—'}</b></div>
        <div><small>Nilai per Unit</small><b>${money(a.nilaiPerolehan)}</b></div>
        <div><small>Total Nilai</small><b>${money(nilaiAset(a))}</b></div>
        <div><small>Penanggung Jawab</small><b>${esc(a.penanggungjawab || '—')}</b></div>
        <div class="full"><small>Lokasi / Penempatan</small><b>${esc(a.lokasi || '—')}</b></div>
        ${a.catatan ? `<div class="full"><small>Catatan</small><b>${esc(a.catatan)}</b></div>` : ''}
      </div>`,
    footer: `<button class="btn btn-outline" data-action="modal-close">Tutup</button>
             <button class="btn btn-primary" data-action="aset-edit" data-id="${a.id}">${icon('edit')} Edit Data</button>`,
  });
}

function deleteAset(id) {
  const a = DB.aset.find((x) => x.id === id);
  if (!a) return;
  confirmDialog({
    title: 'Hapus Data Aset',
    message: `Hapus aset <b>${esc(a.nama)}</b> dari daftar inventaris? Tindakan ini tidak dapat dibatalkan.`,
    confirmText: 'Hapus Aset',
    onConfirm: () => {
      DB.aset = DB.aset.filter((x) => x.id !== id);
      saveDB();
      rerender({ keepScroll: true });
      toast('Data aset dihapus.');
    },
  });
}

function exportAsetCSV() {
  const rows = [
    ['Nama Aset', 'Kategori', 'Jumlah', 'Satuan', 'Kondisi', 'Lokasi', 'Tanggal Perolehan', 'Nilai per Unit', 'Total Nilai', 'Penanggung Jawab', 'Catatan'],
    ...sortedAset().map((a) => [
      a.nama, a.kategori, a.jumlah, a.satuan, a.kondisi, a.lokasi, a.tanggalPerolehan,
      Number(a.nilaiPerolehan) || 0, nilaiAset(a), a.penanggungjawab, a.catatan,
    ]),
  ];
  downloadCSV(`Data-Aset-Maranatha-${todayISO()}.csv`, rows);
  toast('Data aset diekspor ke CSV.');
}

function printAsetReport() {
  const list = filteredAset();
  const totalUnit = list.reduce((s, a) => s + (Number(a.jumlah) || 0), 0);
  const totalNilai = totalNilaiAset(list);
  const kategoriDipilih = UI.aset.kategori || 'Semua Kategori';
  const rows = list.map((a, i) => `<tr>
    <td>${i + 1}</td>
    <td>${esc(a.nama)}${a.catatan ? `<br><span style="color:#7c8494;font-size:8.5px">${esc(a.catatan)}</span>` : ''}</td>
    <td>${esc(a.kategori)}</td>
    <td class="num">${num(a.jumlah)} ${esc(a.satuan || 'unit')}</td>
    <td>${esc(a.kondisi)}</td>
    <td>${esc(a.lokasi || '—')}</td>
    <td>${a.tanggalPerolehan ? dateMedium(a.tanggalPerolehan) : '—'}</td>
    <td class="num">${num(nilaiAset(a))}</td>
  </tr>`).join('');
  printHTML(`
    <div class="print-doc">
      <div class="print-head">
        <div class="print-logo">✝</div>
        <div>
          <h1>${esc(DB.settings.nama)}</h1>
          <p>${esc(DB.settings.alamat)} · ${esc(DB.settings.telepon)}</p>
        </div>
      </div>
      <h2>Daftar Inventaris & Aset Gereja</h2>
      <p class="print-sub">${esc(kategoriDipilih)} · Dicetak ${dateLong(todayISO())}</p>

      <table>
        <thead><tr><th style="width:26px">No</th><th>Nama Aset</th><th>Kategori</th><th class="num">Jumlah</th><th>Kondisi</th><th>Lokasi</th><th>Perolehan</th><th class="num" style="width:95px">Nilai (Rp)</th></tr></thead>
        <tbody>
          ${rows || '<tr><td colspan="8">Belum ada data aset.</td></tr>'}
          <tr class="total"><td colspan="3">TOTAL (${num(list.length)} jenis · ${num(totalUnit)} unit)</td><td class="num">${num(totalUnit)}</td><td colspan="3"></td><td class="num">${num(totalNilai)}</td></tr>
        </tbody>
      </table>
      <p style="font-size:9px;color:#6b768c">Nilai aset dicatat berdasarkan harga perolehan dan belum memperhitungkan penyusutan. Pemeriksaan fisik inventaris dilakukan oleh Majelis Jemaat setiap akhir tahun anggaran.</p>

      <div class="print-sign">
        <div>Mengetahui,<br>Ketua Majelis Jemaat<div class="line">${esc((DB.struktur.find((s) => s.jabatan === 'Ketua Majelis') || {}).nama || '________________')}</div></div>
        <div>Tolitoli, ${dateMedium(todayISO())}<br>Bendahara<div class="line">${esc((DB.struktur.find((s) => /Bendahara/.test(s.jabatan)) || {}).nama || '________________')}</div></div>
      </div>
    </div>`);
}
