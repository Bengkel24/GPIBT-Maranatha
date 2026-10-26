/* =========================================================
   Tata Ibadah — editor, slide & cetak
   ========================================================= */
'use strict';

function starterLiturgyItems() {
  return [
    { bagian: 'Pembukaan', petugas: 'Liturgos', keterangan: 'Jemaat berdiri.\nSalam pembuka, doa pembukaan, dan pengarahan ibadah.', durasi: 5 },
    { bagian: 'Nyanyian Pembukaan', petugas: 'Tim Musik & Paduan Suara', keterangan: 'KJ 12 — "Hai Mari Sembah Tuhan"', durasi: 5 },
    { bagian: 'Pembacaan Alkitab', petugas: '', keterangan: '', durasi: 5 },
    { bagian: 'Khotbah', petugas: DB.settings.pendeta, keterangan: '', durasi: 30 },
    { bagian: 'Doa Syafaat', petugas: '', keterangan: '', durasi: 8 },
    { bagian: 'Persembahan', petugas: '', keterangan: 'Persembahan kantong I & II.', durasi: 8 },
    { bagian: 'Pengutusan & Berkat', petugas: DB.settings.pendeta, keterangan: 'Jemaat berdiri. Amin.', durasi: 5 },
  ].map((item) => ({ id: uid('li'), ...item }));
}

function renderIbadah() {
  const all = sortedIbadah();
  const upcoming = all.filter((l) => l.tanggal >= todayISO()).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  const past = all.filter((l) => l.tanggal < todayISO());
  const featured = nextLiturgy();

  const card = (l) => `
    <article class="card ibadah-card ${l.status === 'Draft' ? 'draft' : 'final'}">
      <div class="ibadah-top">
        <div class="ibadah-date"><b>${parseISO(l.tanggal).getDate()}</b><span>${MONTHS_SHORT[parseISO(l.tanggal).getMonth()]}</span></div>
        <div class="ibadah-title">
          <h3>${esc(l.judul)}</h3>
          <p><span>${icon('calendar')} ${dayName(l.tanggal)}</span><span>${icon('clock')} ${esc(l.jam)} WITA</span></p>
        </div>
        ${statusBadge(l.status)}
      </div>
      <div class="ibadah-theme">
        <small>Tema Ibadah</small>
        <b>“${esc(l.tema)}”</b>
        <span>${esc(l.ayat)}</span>
      </div>
      <div class="ibadah-meta">
        <span>${icon('users')} ${esc(l.pengkhotbah)}</span>
        <span>${icon('book')} ${esc(l.liturgos)}</span>
        <span>${icon('layers')} ${l.items.length} bagian</span>
        <span>${icon('clock')} ± ${l.items.reduce((s, it) => s + (Number(it.durasi) || 0), 0)} menit</span>
      </div>
      <div class="ibadah-actions">
        <button class="btn btn-primary btn-sm" data-action="present-liturgy" data-id="${l.id}">${icon('play')} Slide</button>
        <button class="btn btn-outline btn-sm" data-action="ibadah-pptx" data-id="${l.id}">${icon('download')} PPTX</button>
        <a class="btn btn-outline btn-sm" href="#/ibadah/edit/${l.id}">${icon('edit')} Edit</a>
        <span class="spacer"></span>
        <button class="icon-btn" data-action="ibadah-print" data-id="${l.id}" title="Cetak tata ibadah">${icon('print')}</button>
        <button class="icon-btn" data-action="ibadah-duplicate" data-id="${l.id}" title="Duplikasi">${icon('duplicate')}</button>
        <button class="icon-btn danger" data-action="ibadah-delete" data-id="${l.id}" title="Hapus">${icon('trash')}</button>
      </div>
    </article>`;

  return `
    ${pageHead('Ibadah & Liturgi', 'Tata Ibadah', 'Susun tata ibadah, tampilkan sebagai slide 16:9 di proyektor, atau unduh sebagai file PowerPoint.', `
      <a class="btn btn-primary" href="#/ibadah/edit/baru">${icon('plus')} Buat Tata Ibadah</a>
    `)}

    ${featured ? `
    <div class="card pad" style="margin-bottom:16px;overflow:hidden">
      <div class="card-head">
        <div><h3>Pratinjau Slide Ibadah Terdekat</h3><p>${dateLong(featured.tanggal)} · ${esc(featured.jam)} WITA · ${esc(featured.tema)}</p></div>
        <div class="head-right">
          <button class="btn btn-outline btn-sm" data-action="ibadah-pptx" data-id="${featured.id}">${icon('download')} Unduh PPTX</button>
          <button class="btn btn-primary btn-sm" data-action="present-liturgy" data-id="${featured.id}">${icon('play')} Tayangkan</button>
        </div>
      </div>
      <div class="grid grid-2">
        <div class="slide-preview">${slideHTML(buildLiturgySlides(featured)[0], 0, buildLiturgySlides(featured).length)}</div>
        <div class="slide-preview">${slideHTML(buildLiturgySlides(featured)[1], 1, buildLiturgySlides(featured).length)}</div>
      </div>
      <p class="form-note" style="margin-top:10px">${icon('layers')} Slide disusun otomatis dari susunan ibadah: sampul, tema, setiap bagian, dan penutup. Tekan <b>F</b> saat presentasi untuk layar penuh, <b>O</b> untuk melihat semua slide.</p>
    </div>` : ''}

    ${upcoming.length ? `<div class="section-label">Ibadah Mendatang</div><div class="ibadah-grid" style="margin-bottom:18px">${upcoming.map(card).join('')}</div>` : ''}
    ${past.length ? `<div class="section-label">Arsip Tata Ibadah</div><div class="ibadah-grid">${past.map(card).join('')}</div>` : ''}
    ${!all.length ? `<div class="card pad">${emptyState('Belum ada tata ibadah', 'Buat susunan tata ibadah pertama untuk ibadah minggu.', 'book')}</div>` : ''}`;
}

/* ---------------- editor ---------------- */
function renderIbadahEditor(id) {
  const isNew = !id || id === 'baru';
  const existing = isNew ? null : DB.ibadah.find((x) => x.id === id);
  if (!isNew && !existing) {
    return `<a class="back-link" href="#/ibadah">${icon('chevron-left')} Kembali</a>${emptyState('Tata ibadah tidak ditemukan', 'Data mungkin sudah dihapus.', 'book')}`;
  }
  const l = existing || {
    id: '', tanggal: nextSundayISO(0), jam: '09.00', judul: 'Ibadah Minggu',
    tema: '', ayat: '', pengkhotbah: DB.settings.pendeta, liturgos: '',
    tempat: 'Gedung Gereja Maranatha Tolitoli', status: 'Draft', catatan: '',
    items: starterLiturgyItems(),
  };
  const totalDuration = (l.items || []).reduce((s, it) => s + (Number(it.durasi) || 0), 0);
  const savedId = existing ? existing.id : '';

  return `
    <a class="back-link" href="#/ibadah">${icon('chevron-left')} Kembali ke Tata Ibadah</a>
    ${pageHead('Editor Liturgi', isNew ? 'Buat Tata Ibadah Baru' : 'Edit Tata Ibadah', 'Susunan ini akan menjadi slide presentasi dan dapat diunduh sebagai file PowerPoint.', `
      <button class="btn btn-outline" data-action="editor-preview">${icon('play')} Pratinjau Slide</button>
      <button class="btn btn-primary" type="submit" form="liturgyForm">${icon('check')} Simpan</button>
    `)}

    <form id="liturgyForm" data-id="${esc(savedId)}">
      <div class="editor-layout">
        <div class="stack">
          <div class="card pad">
            <div class="card-head"><div><h3>Informasi Ibadah</h3><p>Tampil pada sampul slide dan dokumen cetak.</p></div></div>
            <div class="form-grid three">
              <label class="field">Tanggal <span class="req">*</span>
                <input type="date" name="tanggal" required value="${esc(l.tanggal)}">
              </label>
              <label class="field">Waktu
                <input name="jam" value="${esc(l.jam)}" placeholder="09.00">
              </label>
              <label class="field">Status
                <select name="status"><option ${l.status === 'Draft' ? 'selected' : ''}>Draft</option><option ${l.status === 'Final' ? 'selected' : ''}>Final</option></select>
              </label>
              <label class="field span2">Judul Ibadah
                <input name="judul" value="${esc(l.judul)}" placeholder="cth: Ibadah Minggu">
              </label>
              <label class="field">Tempat
                <input name="tempat" value="${esc(l.tempat)}">
              </label>
              <label class="field span2">Tema Ibadah
                <input name="tema" value="${esc(l.tema)}" placeholder="cth: Kasih yang Melayani">
              </label>
              <label class="field">Bacaan Alkitab
                <input name="ayat" value="${esc(l.ayat)}" placeholder="cth: Yohanes 13:1-17">
              </label>
              <label class="field">Pengkhotbah
                <input name="pengkhotbah" value="${esc(l.pengkhotbah)}">
              </label>
              <label class="field">Liturgos
                <input name="liturgos" value="${esc(l.liturgos)}">
              </label>
              <label class="field span2">Catatan Ibadah
                <input name="catatan" value="${esc(l.catatan || '')}" placeholder="cth: Perjamuan Kudus pada ibadah ini">
              </label>
            </div>
          </div>

          <div class="card pad">
            <div class="card-head">
              <div><h3>Susunan Ibadah</h3><p>Setiap bagian menjadi satu slide. Gunakan keterangan untuk teks yang ditampilkan.</p></div>
              <button type="button" class="btn btn-primary btn-sm" data-action="item-add">${icon('plus')} Tambah Bagian</button>
            </div>
            <div class="lit-items" id="litItems">
              ${(l.items || []).length ? (l.items || []).map((it, i) => liturgyItemRow(it, i)).join('') : `<div class="lit-empty">Belum ada bagian. Klik “Tambah Bagian”.</div>`}
            </div>
            <div class="form-note">${icon('layers')} Gunakan tombol panah untuk mengatur urutan. Durasi dipakai untuk memperkirakan total waktu ibadah.</div>
          </div>
        </div>

        <aside class="editor-side">
          <div class="card pad">
            <div class="card-head"><div><h3>Ringkasan</h3><p>Otomatis menjadi slide</p></div>${icon('layers')}</div>
            <div class="editor-summary">
              <div>Jumlah bagian: <b id="litCount">${(l.items || []).length}</b></div>
              <div>Perkiraan durasi: <b id="litDuration">± ${totalDuration} menit</b></div>
              <div>Jumlah slide: <b id="litSlides">${(l.items || []).length + 3}</b></div>
            </div>
            <div style="display:flex;flex-direction:column;gap:7px;margin-top:14px">
              <button type="button" class="btn btn-primary btn-block" data-action="editor-preview">${icon('play')} Pratinjau Slide</button>
              <button type="button" class="btn btn-outline btn-block" data-action="editor-pptx">${icon('download')} Unduh PowerPoint</button>
            </div>
          </div>

          <div class="card pad">
            <div class="slide-note">
              <b>${icon('layers')} Tampilan seperti PowerPoint</b>
              Slide 16:9 dengan navigasi panah, daftar semua slide, layar penuh, dan putar otomatis. File .pptx dapat dibuka di Microsoft PowerPoint, Google Slides, atau WPS.
            </div>
          </div>

          <div class="card pad">
            <div class="card-head"><div><h3>Tips Liturgi</h3></div></div>
            <ul style="margin:0;padding-left:16px;font-size:10.5px;color:var(--muted);line-height:1.65">
              <li>Tulis teks nyanyian di kolom keterangan agar tampil di slide.</li>
              <li>Gunakan satu bagian untuk setiap perpindahan dalam ibadah.</li>
              <li>Isi petugas agar jemaat mengetahui siapa yang melayani.</li>
              <li>Simpan sebagai <b>Final</b> jika susunan sudah disetujui.</li>
            </ul>
          </div>
        </aside>
      </div>

      <div class="form-actions" style="margin-top:18px">
        <a class="btn btn-outline" href="#/ibadah">Batal</a>
        <button type="submit" class="btn btn-primary">${icon('check')} Simpan Tata Ibadah</button>
      </div>
    </form>`;
}

function liturgyItemRow(item = {}, index = 0) {
  return `<div class="lit-item" data-id="${esc(item.id || '')}">
    <div class="lit-item-head">
      <span class="lit-num">${index + 1}</span>
      <input class="lit-bagian" value="${esc(item.bagian || '')}" placeholder="Nama bagian, cth: Pembukaan">
      <div class="lit-tools">
        <button type="button" class="icon-btn" data-action="item-up" title="Naikkan">${icon('arrow-up')}</button>
        <button type="button" class="icon-btn" data-action="item-down" title="Turunkan">${icon('arrow-down')}</button>
        <button type="button" class="icon-btn danger" data-action="item-remove" title="Hapus bagian">${icon('trash')}</button>
      </div>
    </div>
    <div class="form-grid">
      <label class="field">Petugas
        <input class="lit-petugas" value="${esc(item.petugas || '')}" placeholder="cth: Pnt. Debora A. Rante">
      </label>
      <label class="field">Durasi (menit)
        <input class="lit-durasi" type="number" min="0" step="1" value="${esc(item.durasi || '')}" placeholder="5">
      </label>
      <label class="field span2">Keterangan / teks slide
        <textarea class="lit-keterangan" rows="2" placeholder="cth: KJ 12 — &quot;Hai Mari Sembah Tuhan&quot;">${esc(item.keterangan || '')}</textarea>
      </label>
    </div>
  </div>`;
}

function addLiturgyRow() {
  const wrap = document.getElementById('litItems');
  if (!wrap) return;
  const empty = wrap.querySelector('.lit-empty');
  if (empty) empty.remove();
  const index = wrap.querySelectorAll('.lit-item').length;
  wrap.insertAdjacentHTML('beforeend', liturgyItemRow({}, index));
  const row = wrap.lastElementChild;
  const input = row.querySelector('.lit-bagian');
  if (input) input.focus();
  renumberLiturgyRows();
}

function renumberLiturgyRows() {
  const wrap = document.getElementById('litItems');
  if (!wrap) return;
  const rows = [...wrap.querySelectorAll('.lit-item')];
  rows.forEach((row, i) => {
    const n = row.querySelector('.lit-num');
    if (n) n.textContent = i + 1;
  });
  if (!rows.length) wrap.innerHTML = `<div class="lit-empty">Belum ada bagian. Klik “Tambah Bagian”.</div>`;
  updateLiturgySummary();
}

function updateLiturgySummary() {
  const wrap = document.getElementById('litItems');
  if (!wrap) return;
  const rows = [...wrap.querySelectorAll('.lit-item')];
  const total = rows.reduce((s, row) => s + (Number(row.querySelector('.lit-durasi')?.value) || 0), 0);
  const count = document.getElementById('litCount');
  const dur = document.getElementById('litDuration');
  const slides = document.getElementById('litSlides');
  if (count) count.textContent = rows.length;
  if (dur) dur.textContent = `± ${total} menit`;
  if (slides) slides.textContent = rows.length + 3;
}

function moveLiturgyRow(btn, dir) {
  const row = btn.closest('.lit-item');
  if (!row) return;
  if (dir < 0 && row.previousElementSibling) row.parentNode.insertBefore(row, row.previousElementSibling);
  if (dir > 0 && row.nextElementSibling) row.parentNode.insertBefore(row.nextElementSibling, row);
  renumberLiturgyRows();
}

function removeLiturgyRow(btn) {
  const row = btn.closest('.lit-item');
  if (!row) return;
  row.remove();
  renumberLiturgyRows();
}

function collectLiturgyForm() {
  const form = document.getElementById('liturgyForm');
  if (!form) return null;
  const fd = new FormData(form);
  const items = [...form.querySelectorAll('.lit-item')].map((row) => ({
    id: row.dataset.id || uid('li'),
    bagian: row.querySelector('.lit-bagian').value.trim(),
    petugas: row.querySelector('.lit-petugas').value.trim(),
    durasi: Number(row.querySelector('.lit-durasi').value) || 0,
    keterangan: row.querySelector('.lit-keterangan').value,
  })).filter((it) => it.bagian || it.keterangan);
  return {
    id: form.dataset.id || '',
    tanggal: fd.get('tanggal') || todayISO(),
    jam: String(fd.get('jam') || '09.00').trim(),
    judul: String(fd.get('judul') || 'Ibadah Minggu').trim(),
    status: fd.get('status') || 'Draft',
    tempat: String(fd.get('tempat') || '').trim(),
    tema: String(fd.get('tema') || '').trim(),
    ayat: String(fd.get('ayat') || '').trim(),
    pengkhotbah: String(fd.get('pengkhotbah') || '').trim(),
    liturgos: String(fd.get('liturgos') || '').trim(),
    catatan: String(fd.get('catatan') || '').trim(),
    items,
  };
}

function saveLiturgyForm(form) {
  const data = collectLiturgyForm();
  if (!data) return;
  if (!data.tanggal) { toast('Tanggal ibadah wajib diisi.', 'error'); return; }
  if (!data.judul) { toast('Judul ibadah wajib diisi.', 'error'); return; }
  const existing = data.id ? DB.ibadah.find((x) => x.id === data.id) : null;
  if (existing) {
    Object.assign(existing, data);
  } else {
    DB.ibadah.push({ ...data, id: uid('ib') });
  }
  saveDB();
  toast(existing ? 'Tata ibadah diperbarui.' : 'Tata ibadah baru disimpan.');
  window.location.hash = '#/ibadah';
}

function presentLiturgy(id) {
  const l = DB.ibadah.find((x) => x.id === id);
  if (!l) { toast('Tata ibadah tidak ditemukan.', 'error'); return; }
  openPresentation(buildLiturgySlides(l), {
    title: `Tata Ibadah · ${dateShort(l.tanggal)}`,
    pptx: () => exportLiturgyPPTX(l),
  });
}

function previewLiturgyEditor() {
  const data = collectLiturgyForm();
  if (!data) return;
  data.id = data.id || 'preview';
  openPresentation(buildLiturgySlides(data), {
    title: 'Pratinjau Tata Ibadah',
    pptx: () => exportLiturgyPPTX(data),
  });
}

function saveAndPresentEditor() {
  saveLiturgyForm(document.getElementById('liturgyForm'));
}

function duplicateLiturgy(id) {
  const l = DB.ibadah.find((x) => x.id === id);
  if (!l) return;
  const copy = JSON.parse(JSON.stringify(l));
  copy.id = uid('ib');
  copy.tanggal = nextSundayISO(0);
  copy.status = 'Draft';
  copy.judul = l.judul;
  copy.items = (copy.items || []).map((it) => ({ ...it, id: uid('li') }));
  DB.ibadah.push(copy);
  saveDB();
  rerender({ keepScroll: true });
  toast('Tata ibadah diduplikasi sebagai draft. Sesuaikan tanggalnya.');
}

function deleteLiturgy(id) {
  const l = DB.ibadah.find((x) => x.id === id);
  if (!l) return;
  confirmDialog({
    title: 'Hapus Tata Ibadah',
    message: `Hapus tata ibadah <b>${esc(l.judul)}</b> tanggal <b>${dateMedium(l.tanggal)}</b>?`,
    confirmText: 'Hapus Tata Ibadah',
    onConfirm: () => {
      DB.ibadah = DB.ibadah.filter((x) => x.id !== id);
      saveDB();
      rerender({ keepScroll: true });
      toast('Tata ibadah dihapus.');
    },
  });
}

function printLiturgy(id) {
  const l = DB.ibadah.find((x) => x.id === id);
  if (!l) return;
  const total = (l.items || []).reduce((s, it) => s + (Number(it.durasi) || 0), 0);
  printHTML(`
    <div class="print-doc">
      <div class="print-head">
        <div class="print-logo">✝</div>
        <div>
          <h1>${esc(DB.settings.nama)}</h1>
          <p>${esc(DB.settings.alamat)} · ${esc(DB.settings.telepon)}</p>
        </div>
      </div>
      <h2>Tata Ibadah — ${esc(l.judul)}</h2>
      <p class="print-sub">${dateLong(l.tanggal)} · Pukul ${esc(l.jam)} WITA · ${esc(l.tempat)}</p>

      <table style="margin-bottom:12px">
        <tbody>
          <tr><th style="width:120px">Tema Ibadah</th><td><b>“${esc(l.tema)}”</b></td></tr>
          <tr><th>Bacaan Alkitab</th><td>${esc(l.ayat)}</td></tr>
          <tr><th>Pengkhotbah</th><td>${esc(l.pengkhotbah)}</td></tr>
          <tr><th>Liturgos</th><td>${esc(l.liturgos)}</td></tr>
          ${l.catatan ? `<tr><th>Catatan</th><td>${esc(l.catatan)}</td></tr>` : ''}
        </tbody>
      </table>

      <h3>Susunan Ibadah</h3>
      <table>
        <thead><tr><th style="width:28px">No</th><th style="width:150px">Bagian</th><th style="width:160px">Petugas</th><th>Keterangan</th><th class="num" style="width:55px">Menit</th></tr></thead>
        <tbody>
          ${(l.items || []).map((it, i) => `<tr><td>${i + 1}</td><td><b>${esc(it.bagian)}</b></td><td>${esc(it.petugas || '—')}</td><td style="white-space:pre-line">${esc(it.keterangan || '')}</td><td class="num">${it.durasi || '—'}</td></tr>`).join('')}
          <tr class="total"><td colspan="4">TOTAL PERKIRAAN DURASI</td><td class="num">${total}</td></tr>
        </tbody>
      </table>

      <div class="print-sign">
        <div>Liturgos<div class="line">${esc(l.liturgos || '________________')}</div></div>
        <div>Pengkhotbah<div class="line">${esc(l.pengkhotbah || '________________')}</div></div>
        <div>Ketua Majelis<div class="line">${esc((DB.struktur.find((s) => s.jabatan === 'Ketua Majelis') || {}).nama || '________________')}</div></div>
      </div>
      <div class="print-slide-note">Tata ibadah ini dapat ditayangkan sebagai slide melalui menu Tata Ibadah → Slide, atau diunduh sebagai file PowerPoint (.pptx).</div>
    </div>`);
}

function presentJadwal() {
  openPresentation(buildJadwalSlides(), {
    title: 'Jadwal Pelayanan',
    pptx: exportJadwalPPTX,
  });
}
