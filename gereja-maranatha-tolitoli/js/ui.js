/* =========================================================
   UI helpers — format, modal, toast, print, export
   ========================================================= */
'use strict';

const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function nl2br(value) { return esc(value).replace(/\n/g, '<br>'); }
function num(value) { return new Intl.NumberFormat('id-ID').format(Number(value) || 0); }
function money(value) {
  const v = Number(value) || 0;
  return `${v < 0 ? '-Rp ' : 'Rp '}${new Intl.NumberFormat('id-ID').format(Math.abs(Math.round(v)))}`;
}
function compactMoney(value) {
  const v = Number(value) || 0;
  const abs = Math.abs(v);
  if (abs >= 1000000000) return `${(v / 1000000000).toFixed(1).replace('.', ',')} M`;
  if (abs >= 1000000) return `${(v / 1000000).toFixed(1).replace('.', ',')} jt`;
  if (abs >= 1000) return `${Math.round(v / 1000)} rb`;
  return String(v);
}
function dateLong(iso) {
  if (!iso) return '—';
  const d = parseISO(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${DAYS_ID[d.getDay()]}, ${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}
function dateMedium(iso) {
  if (!iso) return '—';
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}
function dateShort(iso) {
  if (!iso) return '—';
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}
function dayName(iso) { return iso ? DAYS_ID[parseISO(iso).getDay()] : '—'; }
function monthShort(key) {
  if (!key) return '—';
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS_SHORT[m - 1]} ${String(y).slice(2)}`;
}
function monthLabel(key, short = false) {
  if (!key) return '—';
  const [y, m] = key.split('-').map(Number);
  return `${short ? MONTHS_SHORT[m - 1] : MONTHS_ID[m - 1]} ${y}`;
}
function greeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
}
function initials(name) {
  const clean = String(name || '').replace(/\b(Pdt|Pnt|Dkn|Sdr|Sdri|Ibu|Bpk|Bp|Hj)\.?\s*/gi, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
function avatarTone(name) {
  let h = 0;
  const s = String(name || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return `background:hsl(${h} 40% 93%);color:hsl(${h} 40% 32%)`;
}
function avatarHTML(name, cls = '', extraStyle = '') {
  return `<span class="avatar ${cls}" style="${avatarTone(name)};${extraStyle}">${esc(initials(name))}</span>`;
}
function icon(name, cls = '') {
  return `<svg class="ico ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}
function statusBadge(status) {
  const map = {
    Aktif: 'green', Pindah: 'amber', Meninggal: 'gray', Final: 'green', Draft: 'gold',
  };
  return `<span class="badge ${map[status] || 'gray'}">${esc(status || '—')}</span>`;
}
function dateBlock(iso, cls = '') {
  const d = iso ? parseISO(iso) : new Date();
  return `<div class="${cls}"><b>${d.getDate()}</b><span>${MONTHS_SHORT[d.getMonth()]}</span></div>`;
}
function debounce(fn, ms = 200) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
function emptyState(title, desc, iconName = 'file') {
  return `<div class="empty"><div class="empty-ico">${icon(iconName)}</div><b>${esc(title)}</b><p>${esc(desc)}</p></div>`;
}

/* ---------------- modal ---------------- */
let _pendingConfirm = null;

function openModal({ title = '', subtitle = '', body = '', footer = '', wide = false }) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = `
    <div class="modal-backdrop" data-action="modal-backdrop">
      <div class="modal ${wide ? 'modal-wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="modal-head">
          <div><h3>${title}</h3>${subtitle ? `<p>${subtitle}</p>` : ''}</div>
          <button class="icon-btn" data-action="modal-close" aria-label="Tutup">${icon('x')}</button>
        </div>
        <div class="modal-body">${body}</div>
        ${footer ? `<div class="modal-foot">${footer}</div>` : ''}
      </div>
    </div>`;
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => {
    const el = root.querySelector('input:not([type=hidden]),select,textarea,button.btn-primary');
    if (el) el.focus();
  });
}
function closeModal() {
  document.getElementById('modalRoot').innerHTML = '';
  document.body.classList.remove('modal-open');
  _pendingConfirm = null;
}
function confirmDialog({ title = 'Konfirmasi', message, confirmText = 'Ya, lanjutkan', onConfirm, danger = true }) {
  _pendingConfirm = onConfirm;
  openModal({
    title,
    body: `<p class="confirm-text">${message}</p>`,
    footer: `<button class="btn btn-outline" data-action="modal-close">Batal</button>
             <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="confirm-yes">${esc(confirmText)}</button>`,
  });
}
function runConfirm() {
  const fn = _pendingConfirm;
  _pendingConfirm = null;
  closeModal();
  if (typeof fn === 'function') fn();
}

/* ---------------- toast ---------------- */
function toast(message, type = 'success') {
  const root = document.getElementById('toastRoot');
  if (!root) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${icon(type === 'error' ? 'alert' : 'check')}<span>${esc(message)}</span>`;
  root.appendChild(el);
  setTimeout(() => {
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 230);
  }, 3400);
}

/* ---------------- export / print ---------------- */
function downloadFile(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}
function downloadJSON(filename, obj) {
  downloadFile(filename, JSON.stringify(obj, null, 2), 'application/json');
}
function toCSV(rows) {
  return rows.map((row) => row.map((cell) => {
    const s = String(cell == null ? '' : cell);
    return /[";\n\r,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(';')).join('\r\n');
}
function downloadCSV(filename, rows) {
  downloadFile(filename, `\uFEFF${toCSV(rows)}`, 'text/csv;charset=utf-8');
}
function printHTML(html) {
  const root = document.getElementById('printRoot');
  root.innerHTML = html;
  setTimeout(() => window.print(), 120);
}

/* ---------------- misc ---------------- */
function fileSafe(text) {
  return String(text || 'file').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-').slice(0, 80);
}
function nextBirthdayText(iso) {
  if (!iso) return '—';
  const today = startOfDay();
  const b = parseISO(iso);
  let next = new Date(today.getFullYear(), b.getMonth(), b.getDate());
  if (next < today) next = new Date(today.getFullYear() + 1, b.getMonth(), b.getDate());
  return dateMedium(isoOf(next));
}
