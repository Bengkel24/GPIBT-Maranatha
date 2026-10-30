/* =========================================================
   Slide deck (16:9) + ekspor PowerPoint (.pptx)
   ========================================================= */
'use strict';

const presentState = {
  open: false, slides: [], index: 0, title: '',
  pptx: null, timerId: null, autoId: null, auto: false, startedAt: 0,
};

/* ---------------- deck builders ---------------- */
function slideTextLength(slide) {
  return String(slide.title || '').length + String(slide.body || '').length + String(slide.subtitle || '').length;
}
function buildLiturgySlides(liturgy) {
  if (!liturgy) return [];
  const items = Array.isArray(liturgy.items) ? liturgy.items : [];
  const slides = [{
    type: 'cover',
    kicker: 'Tata Ibadah',
    title: liturgy.judul || 'Ibadah Minggu',
    subtitle: `${dateLong(liturgy.tanggal)} · Pukul ${liturgy.jam || '09.00'} WITA`,
    body: `Pengkhotbah: ${liturgy.pengkhotbah || '—'}\nLiturgos: ${liturgy.liturgos || '—'}`,
    meta: [liturgy.tempat || DB.settings.nama, `Tema: ${liturgy.tema || '—'}`, `Bacaan: ${liturgy.ayat || '—'}`],
    tag: liturgy.status === 'Draft' ? 'Draft' : 'Ibadah Minggu',
  }, {
    type: 'verse',
    kicker: 'Tema Ibadah',
    title: `“${liturgy.tema || 'Kasih yang Melayani'}”`,
    subtitle: liturgy.ayat ? `Bacaan Alkitab — ${liturgy.ayat}` : '',
    body: '',
    meta: liturgy.pengkhotbah ? [`Pelayan Firman: ${liturgy.pengkhotbah}`] : [],
    tag: 'Tema',
  }];

  items.forEach((item, i) => {
    slides.push({
      type: 'item',
      kicker: `Bagian ${i + 1} dari ${items.length}${item.durasi ? ` · ± ${item.durasi} menit` : ''}`,
      title: item.bagian || `Bagian ${i + 1}`,
      subtitle: item.petugas || '',
      body: item.keterangan || '',
      meta: item.durasi ? [`Perkiraan waktu: ${item.durasi} menit`] : [],
      tag: liturgy.jam ? `${liturgy.jam} WITA` : 'Ibadah',
    });
  });

  if (liturgy.catatan) {
    slides.push({
      type: 'verse',
      kicker: 'Catatan Pelayanan',
      title: liturgy.catatan,
      subtitle: '',
      body: '',
      meta: [],
      tag: 'Catatan',
    });
  }

  slides.push({
    type: 'closing',
    kicker: 'Penutup',
    title: 'Tuhan Yesus memberkati',
    subtitle: '',
    body: 'Terima kasih atas kehadiran, doa, dan pelayanan Anda.\nSampai jumpa pada ibadah berikutnya.',
    meta: [DB.settings.ibadah, DB.settings.alamat],
    tag: 'Amin',
  });

  return slides;
}

function buildWartaSlides(list = null) {
  const warta = (list || sortedWarta()).slice();
  const slides = [{
    type: 'cover',
    kicker: 'Warta Jemaat',
    title: DB.settings.nama,
    subtitle: dateLong(todayISO()),
    body: 'Informasi pelayanan, kegiatan, dan pelayanan jemaat.\nMohon perhatian seluruh jemaat.',
    meta: [`${warta.length} warta jemaat`, DB.settings.ibadah],
    tag: 'Warta Jemaat',
  }];

  warta.forEach((w) => {
    slides.push({
      type: 'warta',
      kicker: `${w.kategori || 'Umum'} · ${dateShort(w.tanggal)}`,
      title: w.judul,
      subtitle: '',
      body: w.isi,
      meta: w.penting ? ['Warta penting — mohon perhatian jemaat'] : [],
      tag: w.penting ? 'Penting' : 'Warta',
    });
  });

  const bdays = birthdaysThisWeek();
  if (bdays.length) {
    const range = weekRangeISO();
    slides.push({
      type: 'warta',
      kicker: `Ulang Tahun · ${dateMedium(range.start)} – ${dateMedium(range.end)}`,
      title: 'Ulang Tahun Jemaat Pekan Ini',
      subtitle: 'Tuhan memberkati, selamat ulang tahun!',
      body: bdays.map((j) => `• ${dayName(j.ulangTahunISO)}, ${dateMedium(j.ulangTahunISO)}\n   ${j.nama} (${j.usiaBaru} tahun) — ${j.wilayah}`).join('\n'),
      meta: [`${bdays.length} jemaat berulang tahun`],
      tag: 'Ulang Tahun',
    });
  }

  slides.push({
    type: 'closing',
    kicker: 'Warta Jemaat',
    title: 'Tuhan Yesus memberkati',
    subtitle: DB.settings.nama,
    body: warta.length ? 'Terima kasih atas perhatian dan dukungan seluruh jemaat.' : 'Belum ada warta untuk ditampilkan.',
    meta: [DB.settings.alamat, DB.settings.telepon],
    tag: 'Amin',
  });
  return slides;
}

function buildJadwalSlides() {
  const list = sortedJadwal(true);
  const slides = [{
    type: 'cover',
    kicker: 'Jadwal Pelayanan',
    title: 'Pelayanan Pendeta & Majelis',
    subtitle: list.length ? `${dateLong(list[0].tanggal)} — ${dateLong(list[list.length - 1].tanggal)}` : dateLong(todayISO()),
    body: 'Jadwal pelayanan ibadah minggu dan pelayanan jemaat.\nMohon dukungan doa bagi seluruh pelayan.',
    meta: [`${list.length} jadwal mendatang`, DB.settings.ibadah],
    tag: 'Pelayanan',
  }];
  list.forEach((j) => {
    slides.push({
      type: 'item',
      kicker: `${dateLong(j.tanggal)} · ${j.jam || '09.00'} WITA`,
      title: j.ibadah || 'Ibadah Minggu',
      subtitle: j.pengkhotbah || '',
      body: [
        `Liturgos: ${j.liturgos || '—'}`,
        `Singer: ${j.singer || '—'}`,
        `Pemusik: ${j.pemusik || '—'}`,
        `Kolektan: ${j.kolektan || '—'}`,
        `Multimedia: ${j.multimedia || '—'}`,
        `Sekolah Minggu: ${j.sekolahMinggu || '—'}`,
      ].join('\n'),
      meta: j.catatan ? [j.catatan] : [],
      tag: 'Jadwal',
    });
  });
  slides.push({
    type: 'closing',
    kicker: 'Pelayanan',
    title: 'Melayani dengan Hati',
    subtitle: '',
    body: '“Melayani Tuhan dengan setia adalah kehormatan bagi setiap anggota tubuh Kristus.”\n— Majelis Jemaat Maranatha Tolitoli',
    meta: [DB.settings.ibadah],
    tag: 'Amin',
  });
  return slides;
}

/* ---------------- slide HTML ---------------- */
function slideHTML(slide, index, total) {
  const type = ['cover', 'verse', 'item', 'warta', 'closing'].includes(slide.type) ? slide.type : 'item';
  const len = slideTextLength(slide);
  const lengthClass = len > 620 ? 'is-xlong' : len > 320 ? 'is-long' : '';
  const footerLeft = slide.footerLeft || (type === 'warta' ? 'Warta Jemaat · Gereja Maranatha Tolitoli' : 'Gereja Maranatha Tolitoli');
  return `
    <section class="slide slide-${type} ${lengthClass}">
      <header class="slide-head">
        <div class="church">${icon('book')}<span>${esc(DB.settings.nama)}</span></div>
        <span class="tag">${esc(slide.tag || 'Ibadah')}</span>
      </header>
      <div class="slide-body">
        ${slide.kicker ? `<div class="slide-kicker">${esc(slide.kicker)}</div>` : ''}
        <h2 class="slide-title">${esc(slide.title || '')}</h2>
        ${slide.subtitle ? `<p class="slide-subtitle">${nl2br(slide.subtitle)}</p>` : ''}
        ${slide.body ? `<div class="slide-text">${nl2br(slide.body)}</div>` : ''}
        ${Array.isArray(slide.meta) && slide.meta.length ? `<ul class="slide-meta">${slide.meta.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` : ''}
      </div>
      <footer class="slide-foot">
        <span>${esc(footerLeft)}</span>
        <span class="num">${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
      </footer>
    </section>`;
}

/* ---------------- presentation engine ---------------- */
function openPresentation(slides, opts = {}) {
  if (!Array.isArray(slides) || !slides.length) { toast('Belum ada slide untuk ditampilkan.', 'error'); return; }
  presentState.slides = slides;
  presentState.index = 0;
  presentState.title = opts.title || 'Tata Ibadah';
  presentState.pptx = typeof opts.pptx === 'function' ? opts.pptx : null;
  presentState.open = true;
  presentState.auto = false;
  presentState.startedAt = Date.now();

  const root = document.getElementById('presentRoot');
  root.classList.remove('hidden');
  document.body.classList.add('presenting');
  document.getElementById('presentTitle').textContent = presentState.title;
  const pptxBtn = document.querySelector('[data-action="present-pptx"]');
  if (pptxBtn) pptxBtn.classList.toggle('hidden', !presentState.pptx);
  document.getElementById('presentOverview').classList.add('hidden');
  document.getElementById('presentAutoBtn').classList.remove('active');

  renderPresentSlide();
  buildOverview();
  startPresentTimer();

  if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
    const p = document.documentElement.requestFullscreen();
    if (p && p.catch) p.catch(() => {});
  }
}

function closePresentation() {
  if (!presentState.open) return;
  presentState.open = false;
  clearInterval(presentState.timerId);
  clearInterval(presentState.autoId);
  presentState.timerId = null;
  presentState.autoId = null;
  presentState.auto = false;
  document.getElementById('presentRoot').classList.add('hidden');
  document.getElementById('presentOverview').classList.add('hidden');
  document.body.classList.remove('presenting');
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
}

function presentGo(delta) {
  if (!presentState.open) return;
  const next = Math.max(0, Math.min(presentState.slides.length - 1, presentState.index + delta));
  if (next === presentState.index) return;
  presentState.index = next;
  renderPresentSlide();
  syncOverviewActive();
}

function presentGoTo(index) {
  if (!presentState.open) return;
  const i = Number(index);
  if (Number.isNaN(i) || i < 0 || i >= presentState.slides.length) return;
  presentState.index = i;
  document.getElementById('presentOverview').classList.add('hidden');
  renderPresentSlide();
  syncOverviewActive();
}

function renderPresentSlide() {
  const total = presentState.slides.length;
  const slide = presentState.slides[presentState.index];
  const frame = document.getElementById('presentFrame');
  frame.innerHTML = slideHTML(slide, presentState.index, total);
  document.getElementById('presentCounter').textContent = `${String(presentState.index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  const kinds = { cover: 'Sampul', verse: 'Tema', item: 'Susunan Ibadah', warta: 'Warta Jemaat', closing: 'Penutup' };
  document.getElementById('presentSlideKind').textContent = kinds[slide.type] || 'Slide';
  document.getElementById('presentBar').style.width = `${((presentState.index + 1) / total) * 100}%`;
  const prev = document.querySelector('.present-arrow.prev');
  const next = document.querySelector('.present-arrow.next');
  if (prev) prev.style.opacity = presentState.index === 0 ? '.35' : '1';
  if (next) next.style.opacity = presentState.index >= total - 1 ? '.35' : '1';
}

function buildOverview() {
  const grid = document.getElementById('overviewGrid');
  grid.innerHTML = presentState.slides.map((slide, i) => `
    <div class="thumb ${i === presentState.index ? 'active' : ''}" data-action="present-goto" data-index="${i}" role="button" tabindex="0">
      <div class="thumb-canvas"><div class="thumb-inner">${slideHTML(slide, i, presentState.slides.length)}</div></div>
      <div class="thumb-label"><span>${esc(slide.title || 'Slide')}</span><span>${i + 1}</span></div>
    </div>`).join('');
  requestAnimationFrame(refreshThumbScale);
  setTimeout(refreshThumbScale, 180);
}
function refreshThumbScale() {
  document.querySelectorAll('.thumb-canvas').forEach((canvas) => {
    const inner = canvas.querySelector('.thumb-inner');
    if (!inner) return;
    const scale = (canvas.clientWidth || 190) / 960;
    inner.style.setProperty('--thumb-scale', String(scale));
  });
}
function syncOverviewActive() {
  document.querySelectorAll('.thumb').forEach((thumb, i) => thumb.classList.toggle('active', i === presentState.index));
}
function toggleOverview(force) {
  const el = document.getElementById('presentOverview');
  const show = typeof force === 'boolean' ? force : el.classList.contains('hidden');
  el.classList.toggle('hidden', !show);
  if (show) {
    refreshThumbScale();
    syncOverviewActive();
  }
}
function startPresentTimer() {
  clearInterval(presentState.timerId);
  clearInterval(presentState.autoId);
  const tick = () => {
    const sec = Math.floor((Date.now() - presentState.startedAt) / 1000);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    document.getElementById('presentTimer').textContent = h
      ? `${h}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`;
  };
  tick();
  presentState.timerId = setInterval(tick, 1000);
}
function toggleAutoPresent() {
  presentState.auto = !presentState.auto;
  const btn = document.getElementById('presentAutoBtn');
  btn.classList.toggle('active', presentState.auto);
  clearInterval(presentState.autoId);
  if (presentState.auto) {
    presentState.autoId = setInterval(() => {
      if (!presentState.open) return;
      const next = presentState.index + 1 >= presentState.slides.length ? 0 : presentState.index + 1;
      presentGoTo(next);
    }, 12000);
    toast('Putar otomatis aktif — slide berganti tiap 12 detik.');
  }
}
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    const p = document.documentElement.requestFullscreen();
    if (p && p.catch) p.catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

document.addEventListener('keydown', (e) => {
  if (!presentState.open) return;
  const tag = (e.target.tagName || '').toLowerCase();
  if (['input', 'textarea', 'select'].includes(tag)) return;
  const k = e.key;
  if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'Enter') {
    e.preventDefault(); presentGo(1);
  } else if (k === 'ArrowLeft' || k === 'PageUp') {
    e.preventDefault(); presentGo(-1);
  } else if (k === 'Home') {
    e.preventDefault(); presentGoTo(0);
  } else if (k === 'End') {
    e.preventDefault(); presentGoTo(presentState.slides.length - 1);
  } else if (k === 'Escape') {
    if (!document.getElementById('presentOverview').classList.contains('hidden')) {
      toggleOverview(false);
    } else {
      closePresentation();
    }
  } else if (k.toLowerCase() === 'f') {
    toggleFullscreen();
  } else if (k.toLowerCase() === 'o') {
    toggleOverview();
  } else if (k.toLowerCase() === 'a') {
    toggleAutoPresent();
  }
});
window.addEventListener('resize', () => {
  if (presentState.open) refreshThumbScale();
});

/* =========================================================
   PowerPoint (.pptx) export
   ========================================================= */
const PPT = {
  navy: '0B1E36', navy2: '102B4C', navy3: '143253',
  gold: 'D8B743', gold2: 'F0D98A',
  white: 'F4F7FC', muted: 'B7C7DA', dim: '7E93AA', line: '2A4260',
};

function pptxAvailable() {
  return typeof window.PptxGenJS !== 'undefined';
}
function pptxNewDeck(title) {
  const pptx = new window.PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = DB.settings.nama;
  pptx.company = DB.settings.nama;
  pptx.subject = title;
  pptx.title = title;
  pptx.lang = 'id-ID';
  return pptx;
}
function pptxBaseSlide(pptx, pageNo, total) {
  const s = pptx.addSlide();
  s.background = { color: PPT.navy };
  s.addShape(pptx.ShapeType.rect, { x: 7.35, y: 3.2, w: 2.65, h: 2.65, fill: { color: '0F2847' }, line: { color: '0F2847' } });
  s.addText('✝', { x: 7.2, y: 2.85, w: 2.4, h: 2.4, fontSize: 150, color: PPT.navy3, align: 'center', fontFace: 'Georgia', valign: 'middle' });
  s.addShape(pptx.ShapeType.rect, { x: 0.55, y: 4.93, w: 8.9, h: 0.012, fill: { color: PPT.line }, line: { color: PPT.line } });
  s.addText(DB.settings.nama.toUpperCase(), {
    x: 0.55, y: 5.0, w: 6, h: 0.22, fontSize: 7, color: PPT.dim, fontFace: 'Calibri', charSpacing: 2,
  });
  s.addText(`${String(pageNo).padStart(2, '0')} / ${String(total).padStart(2, '0')}`, {
    x: 8.25, y: 5.0, w: 1.2, h: 0.22, fontSize: 8, color: PPT.dim, align: 'right', fontFace: 'Calibri',
  });
  return s;
}
function pptxRuns(text, opts) {
  const lines = String(text == null ? '' : text).split('\n');
  if (!lines.length) return [];
  return lines.map((line) => ({
    text: line,
    options: { ...opts, breakLine: true },
  }));
}
function addPptxSlide(pptx, slide, pageNo, total) {
  const s = pptxBaseSlide(pptx, pageNo, total);
  const type = slide.type || 'item';
  const bodyText = String(slide.body || '');
  const bodySize = bodyText.length > 700 ? 9.5 : bodyText.length > 420 ? 11 : bodyText.length > 200 ? 12.5 : 14;

  s.addText('GEREJA MARANATHA TOLITOLI', {
    x: 0.55, y: 0.28, w: 8, h: 0.22, fontSize: 7.5, color: PPT.dim, charSpacing: 2, fontFace: 'Calibri',
  });
  s.addShape(pptx.ShapeType.rect, { x: 0.55, y: 0.56, w: 1.05, h: 0.022, fill: { color: PPT.gold }, line: { color: PPT.gold } });
  if (slide.tag) {
    s.addText(String(slide.tag).toUpperCase(), {
      x: 7.55, y: 0.28, w: 1.9, h: 0.24, fontSize: 7.5, color: PPT.gold2, align: 'right', charSpacing: 1, fontFace: 'Calibri',
    });
  }

  if (type === 'cover') {
    s.addShape(pptx.ShapeType.rect, { x: 0.55, y: 1.3, w: 0.035, h: 2.75, fill: { color: PPT.gold }, line: { color: PPT.gold } });
    s.addText(String(slide.kicker || 'TATA IBADAH').toUpperCase(), {
      x: 0.8, y: 1.3, w: 8, h: 0.3, fontSize: 12, color: PPT.gold2, bold: true, charSpacing: 3, fontFace: 'Calibri',
    });
    s.addText(slide.title || '', {
      x: 0.8, y: 1.65, w: 8.3, h: 0.95, fontSize: String(slide.title || '').length > 34 ? 31 : 38,
      color: PPT.white, bold: true, fontFace: 'Georgia', valign: 'middle', fit: 'shrink',
    });
    s.addText(slide.subtitle || '', {
      x: 0.8, y: 2.66, w: 8.2, h: 0.3, fontSize: 13.5, color: PPT.gold2, fontFace: 'Calibri', bold: true,
    });
    if (bodyText) {
      s.addText(pptxRuns(bodyText, { fontSize: 11.5, color: PPT.muted, fontFace: 'Calibri' }), {
        x: 0.8, y: 3.08, w: 5.2, h: 0.8, valign: 'top', paraSpaceAfter: 2,
      });
    }
    if (Array.isArray(slide.meta) && slide.meta.length) {
      s.addText(pptxRuns(slide.meta.join('\n'), { fontSize: 9.5, color: PPT.dim, fontFace: 'Calibri' }), {
        x: 6.0, y: 3.08, w: 3.4, h: 1.2, valign: 'top', paraSpaceAfter: 2,
      });
    }
    return;
  }

  if (type === 'verse') {
    s.addText(String(slide.kicker || '').toUpperCase(), {
      x: 0.55, y: 1.25, w: 8.9, h: 0.3, fontSize: 11, color: PPT.gold2, bold: true, charSpacing: 3, align: 'center', fontFace: 'Calibri',
    });
    s.addText(slide.title || '', {
      x: 0.7, y: 1.68, w: 8.6, h: 1.2, fontSize: String(slide.title || '').length > 60 ? 23 : 30,
      color: PPT.white, italic: true, fontFace: 'Georgia', align: 'center', valign: 'middle', fit: 'shrink',
    });
    if (slide.subtitle) {
      s.addText(slide.subtitle, {
        x: 1.2, y: 2.95, w: 7.6, h: 0.3, fontSize: 11.5, color: PPT.gold2, align: 'center', charSpacing: 1, fontFace: 'Calibri',
      });
    }
    if (bodyText) {
      s.addText(pptxRuns(bodyText, { fontSize: 12, color: PPT.muted, fontFace: 'Calibri', align: 'center' }), {
        x: 1.5, y: 3.3, w: 7, h: 1.1, valign: 'top', paraSpaceAfter: 3,
      });
    }
    if (Array.isArray(slide.meta) && slide.meta.length) {
      s.addText(pptxRuns(slide.meta.join('\n'), { fontSize: 9.5, color: PPT.dim, fontFace: 'Calibri', align: 'center' }), {
        x: 1.5, y: 4.25, w: 7, h: 0.5, valign: 'top',
      });
    }
    return;
  }

  if (type === 'closing') {
    s.addText(String(slide.kicker || 'PENUTUP').toUpperCase(), {
      x: 0.55, y: 1.45, w: 8.9, h: 0.3, fontSize: 11, color: PPT.gold2, bold: true, charSpacing: 3, align: 'center', fontFace: 'Calibri',
    });
    s.addText(slide.title || '', {
      x: 0.7, y: 1.85, w: 8.6, h: 0.8, fontSize: 36, color: PPT.gold2, fontFace: 'Georgia', align: 'center', bold: true, fit: 'shrink',
    });
    if (slide.subtitle) {
      s.addText(slide.subtitle, {
        x: 1, y: 2.66, w: 8, h: 0.3, fontSize: 13, color: PPT.white, align: 'center', fontFace: 'Calibri',
      });
    }
    if (bodyText) {
      s.addText(pptxRuns(bodyText, { fontSize: 12, color: PPT.muted, fontFace: 'Calibri', align: 'center' }), {
        x: 1.5, y: 3.0, w: 7, h: 1.1, valign: 'top', paraSpaceAfter: 3,
      });
    }
    if (Array.isArray(slide.meta) && slide.meta.length) {
      s.addText(pptxRuns(slide.meta.join('\n'), { fontSize: 9, color: PPT.dim, fontFace: 'Calibri', align: 'center' }), {
        x: 1.2, y: 4.15, w: 7.6, h: 0.55, valign: 'top',
      });
    }
    return;
  }

  /* item / warta */
  s.addText(String(slide.kicker || '').toUpperCase(), {
    x: 0.55, y: 0.82, w: 8.9, h: 0.26, fontSize: 9.5, color: PPT.gold2, bold: true, charSpacing: 2, fontFace: 'Calibri',
  });
  s.addText(slide.title || '', {
    x: 0.55, y: 1.12, w: 8.9, h: type === 'warta' ? 1.05 : 0.9,
    fontSize: String(slide.title || '').length > 52 ? 24 : type === 'warta' ? 28 : 32,
    color: PPT.white, bold: true, fontFace: 'Georgia', valign: 'top', fit: 'shrink',
  });
  let cursor = 2.1;
  if (slide.subtitle) {
    s.addText(pptxRuns(slide.subtitle, { fontSize: 13, color: PPT.gold2, fontFace: 'Calibri', bold: true }), {
      x: 0.55, y: cursor, w: 8.6, h: 0.4, valign: 'top',
    });
    cursor += 0.42;
  }
  if (bodyText) {
    s.addText(pptxRuns(bodyText, { fontSize: bodySize, color: PPT.muted, fontFace: 'Calibri' }), {
      x: 0.55, y: cursor, w: 7.55, h: 4.85 - cursor, valign: 'top', paraSpaceAfter: 4, fit: 'shrink',
    });
  }
  if (Array.isArray(slide.meta) && slide.meta.length) {
    s.addText(pptxRuns(slide.meta.join('\n'), { fontSize: 9, color: PPT.gold2, fontFace: 'Calibri' }), {
      x: 0.55, y: 4.5, w: 7.5, h: 0.35, valign: 'bottom', italic: true,
    });
  }
}

async function writePptx(pptx, filename) {
  if (!pptxAvailable()) {
    toast('Pustaka PowerPoint tidak termuat. Periksa folder js/vendor.', 'error');
    return;
  }
  try {
    await pptx.writeFile({ fileName: filename });
    toast('File PowerPoint berhasil diunduh.');
  } catch (err) {
    console.error(err);
    toast('Gagal membuat file PowerPoint.', 'error');
  }
}

function exportLiturgyPPTX(liturgy) {
  if (!liturgy) return;
  if (!pptxAvailable()) { toast('Pustaka PowerPoint tidak termuat.', 'error'); return; }
  const slides = buildLiturgySlides(liturgy);
  const pptx = pptxNewDeck(`Tata Ibadah — ${liturgy.judul} ${dateMedium(liturgy.tanggal)}`);
  slides.forEach((slide, i) => addPptxSlide(pptx, slide, i + 1, slides.length));
  const filename = `Tata-Ibadah-${liturgy.tanggal || todayISO()}.pptx`;
  writePptx(pptx, filename);
}

function exportWartaPPTX(list = null) {
  if (!pptxAvailable()) { toast('Pustaka PowerPoint tidak termuat.', 'error'); return; }
  const slides = buildWartaSlides(list);
  const pptx = pptxNewDeck(`Warta Jemaat — ${dateMedium(todayISO())}`);
  slides.forEach((slide, i) => addPptxSlide(pptx, slide, i + 1, slides.length));
  writePptx(pptx, `Warta-Jemaat-${todayISO()}.pptx`);
}

function exportJadwalPPTX() {
  if (!pptxAvailable()) { toast('Pustaka PowerPoint tidak termuat.', 'error'); return; }
  const slides = buildJadwalSlides();
  const pptx = pptxNewDeck(`Jadwal Pelayanan — ${dateMedium(todayISO())}`);
  slides.forEach((slide, i) => addPptxSlide(pptx, slide, i + 1, slides.length));
  writePptx(pptx, `Jadwal-Pelayanan-${todayISO()}.pptx`);
}
