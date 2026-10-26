/* =========================================================
   Gereja Maranatha Tolitoli — Data & Penyimpanan
   Data disimpan di localStorage (offline, per perangkat).
   ========================================================= */
'use strict';

const APP_STORAGE_KEY = 'gm_tolitoli_v1';

const pad2 = (n) => String(n).padStart(2, '0');
const isoOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseISO = (s) => new Date(`${s}T00:00:00`);
const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const todayISO = () => isoOf(startOfDay());
const currentMonth = () => todayISO().slice(0, 7);
const monthKeyOf = (iso) => String(iso || '').slice(0, 7);
const uid = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

function nextSundayISO(weeksAhead = 0) {
  const d = startOfDay();
  const diff = ((7 - d.getDay()) % 7) || 7;
  return isoOf(addDays(d, diff + weeksAhead * 7));
}
function lastSundayISO() {
  const d = startOfDay();
  const diff = d.getDay() === 0 ? 7 : d.getDay();
  return isoOf(addDays(d, -diff));
}
function dateFromToday(days) { return isoOf(addDays(startOfDay(), days)); }
function ageOf(iso) {
  if (!iso) return null;
  const b = parseISO(iso), now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age < 0 ? 0 : age;
}
function daysUntil(iso) {
  if (!iso) return null;
  return Math.round((parseISO(iso) - startOfDay()) / 86400000);
}

const WILAYAH = ['Wilayah I - Nalu', 'Wilayah II - Baolan', 'Wilayah III - Tambun', 'Wilayah IV - Ogodeide'];
const KATEGORI_JEMAAT = ['Sekolah Minggu', 'Remaja', 'Pemuda', 'Dewasa', 'Lansia'];
const KATEGORI_KEUANGAN = {
  masuk: ['Persembahan Minggu', 'Perpuluhan', 'Persembahan Syukur', 'Donasi / Sumbangan', 'Diakonia Masuk', 'Lainnya'],
  keluar: ['Operasional Ibadah', 'Diakonia', 'Honorarium', 'Pemeliharaan Gedung', 'Pembangunan', 'Pendidikan', 'Lainnya'],
};
const KATEGORI_WARTA = ['Ibadah', 'Kegiatan', 'Diakonia', 'Keuangan', 'Ulang Tahun', 'Umum'];
const METODE_BAYAR = ['Tunai', 'Transfer', 'QRIS'];

/* ---------------- DATA CONTOH ---------------- */
function seedData() {
  const now = new Date();
  const Y = now.getFullYear();
  const M = now.getMonth();
  const today = todayISO();
  const nextSun = nextSundayISO(0);
  const nextSun2 = nextSundayISO(1);
  const nextSun3 = nextSundayISO(2);
  const prevSun = lastSundayISO();

  const J = (id, nama, panggilan, gender, tglLahir, wilayah, keluarga, peranKK, kategori, telepon, pekerjaan, alamat, baptis, sidi, status, catatan = '') => ({
    id, nama, panggilan, gender, tglLahir, wilayah, keluarga, peranKK, kategori, telepon,
    pekerjaan, alamat, baptis, sidi, status, catatan,
  });

  const jemaat = [
    J('j01', 'Pdt. Yohanes M. Pattiasina, S.Th.', 'Yohanes', 'L', '1974-04-12', 'Wilayah II - Baolan', 'KK Pattiasina', 'Kepala Keluarga', 'Dewasa', '0812-4000-1001', 'Pendeta', 'Jl. Trans Sulawesi No. 45, Baolan', '1989-06-18', '1996-08-11', 'Aktif', 'Pendeta Jemaat'),
    J('j02', 'Helena S. Pattiasina', 'Helena', 'P', '1977-10-08', 'Wilayah II - Baolan', 'KK Pattiasina', 'Istri', 'Dewasa', '0812-4000-1002', 'Guru', 'Jl. Trans Sulawesi No. 45, Baolan', '1992-04-05', '1999-07-18', 'Aktif', ''),
    J('j03', 'Yohana Pattiasina', 'Yohana', 'P', '2008-01-15', 'Wilayah II - Baolan', 'KK Pattiasina', 'Anak', 'Remaja', '0812-4000-1003', 'Pelajar', 'Jl. Trans Sulawesi No. 45, Baolan', '2012-12-25', '', 'Aktif', 'Aktif di Komisi Remaja'),
    J('j04', 'Pnt. Samuel L. Tangkilisan', 'Samuel', 'L', '1971-03-14', 'Wilayah I - Nalu', 'KK Tangkilisan', 'Kepala Keluarga', 'Dewasa', '0812-4000-1004', 'PNS', 'Jl. Nalu Raya No. 12, Nalu', '1985-06-09', '1990-04-15', 'Aktif', 'Ketua Majelis Jemaat'),
    J('j05', 'Naomi R. Tangkilisan', 'Naomi', 'P', '1975-08-02', 'Wilayah I - Nalu', 'KK Tangkilisan', 'Istri', 'Dewasa', '0812-4000-1005', 'Guru', 'Jl. Nalu Raya No. 12, Nalu', '1990-05-20', '1997-11-02', 'Aktif', 'Ketua Komisi Wanita'),
    J('j06', 'Gideon A. Tangkilisan', 'Gideon', 'L', '2001-11-21', 'Wilayah I - Nalu', 'KK Tangkilisan', 'Anak', 'Pemuda', '0812-4000-1006', 'Mahasiswa', 'Jl. Nalu Raya No. 12, Nalu', '2006-12-25', '', 'Aktif', 'Pemusik - gitar'),
    J('j07', 'Pnt. Debora A. Rante', 'Debora', 'P', '1980-01-09', 'Wilayah II - Baolan', 'KK Rante', 'Kepala Keluarga', 'Dewasa', '0812-4000-1007', 'Guru', 'Jl. Basuki Rahmat No. 8, Baolan', '1994-07-17', '2001-04-08', 'Aktif', 'Sekretaris Majelis'),
    J('j08', 'Dkn. Maria F. Palembangan', 'Maria', 'P', '1978-05-17', 'Wilayah III - Tambun', 'KK Palembangan', 'Kepala Keluarga', 'Dewasa', '0812-4000-1008', 'Bidan', 'Jl. Tambun No. 21, Tambun', '1992-10-11', '2000-06-25', 'Aktif', 'Bendahara Majelis'),
    J('j09', 'Pnt. Yosua L. Lamadau', 'Yosua', 'L', '1968-09-30', 'Wilayah I - Nalu', 'KK Lamadau', 'Kepala Keluarga', 'Dewasa', '0812-4000-1009', 'Petani', 'Jl. Nalu No. 33, Nalu', '1983-03-27', '1988-09-04', 'Aktif', 'Penatua Bidang Pelayanan'),
    J('j10', 'Sarah M. Lamadau', 'Sarah', 'P', '1973-12-11', 'Wilayah I - Nalu', 'KK Lamadau', 'Istri', 'Dewasa', '0812-4000-1010', 'Ibu Rumah Tangga', 'Jl. Nalu No. 33, Nalu', '1988-12-18', '1995-05-14', 'Aktif', ''),
    J('j11', 'Dkn. Ruth S. Batalipu', 'Ruth', 'P', '1984-02-20', 'Wilayah II - Baolan', 'KK Batalipu', 'Kepala Keluarga', 'Dewasa', '0812-4000-1011', 'Perawat', 'Jl. Ahmad Yani No. 5, Baolan', '1998-08-09', '2006-03-19', 'Aktif', 'Diaken Bidang Diakonia'),
    J('j12', 'Andreas T. Batalipu', 'Andreas', 'L', '2010-04-03', 'Wilayah II - Baolan', 'KK Batalipu', 'Anak', 'Remaja', '0812-4000-1012', 'Pelajar', 'Jl. Ahmad Yani No. 5, Baolan', '2015-12-25', '', 'Aktif', ''),
    J('j13', 'Ibu Esther D. Rante', 'Esther', 'P', '1988-07-19', 'Wilayah III - Tambun', 'KK Rante', 'Kepala Keluarga', 'Dewasa', '0812-4000-1013', 'Guru', 'Jl. Tambun Baru No. 3, Tambun', '2002-04-14', '2009-10-11', 'Aktif', 'Koordinator Sekolah Minggu'),
    J('j14', 'Kevin A. Rante', 'Kevin', 'L', '2015-10-24', 'Wilayah III - Tambun', 'KK Rante', 'Anak', 'Sekolah Minggu', '0812-4000-1014', 'Pelajar', 'Jl. Tambun Baru No. 3, Tambun', '2020-12-25', '', 'Aktif', ''),
    J('j15', 'Lukas Dg. Massora', 'Lukas', 'L', '1956-02-28', 'Wilayah IV - Ogodeide', 'KK Massora', 'Kepala Keluarga', 'Lansia', '0812-4000-1015', 'Pensiunan', 'Jl. Ogodeide No. 9, Ogodeide', '1972-06-11', '1980-02-17', 'Aktif', ''),
    J('j16', 'Sartini Dg. Massora', 'Sartini', 'P', '1959-06-14', 'Wilayah IV - Ogodeide', 'KK Massora', 'Istri', 'Lansia', '0812-4000-1016', 'Ibu Rumah Tangga', 'Jl. Ogodeide No. 9, Ogodeide', '1975-08-24', '1984-09-09', 'Aktif', ''),
    J('j17', 'Hendra Gunawan', 'Hendra', 'L', '1986-11-02', 'Wilayah II - Baolan', 'KK Gunawan', 'Kepala Keluarga', 'Dewasa', '0812-4000-1017', 'Wiraswasta', 'Jl. Pramuka No. 18, Baolan', '2001-05-06', '2010-07-25', 'Aktif', 'Baru pindah dari Gereja Maranatha Palu'),
    J('j18', 'Lisa Nurhayati', 'Lisa', 'P', '1989-03-25', 'Wilayah II - Baolan', 'KK Gunawan', 'Istri', 'Dewasa', '0812-4000-1018', 'Karyawan', 'Jl. Pramuka No. 18, Baolan', '2004-10-31', '2012-04-08', 'Aktif', ''),
    J('j19', 'Cello Gunawan', 'Cello', 'L', '2016-10-24', 'Wilayah II - Baolan', 'KK Gunawan', 'Anak', 'Sekolah Minggu', '0812-4000-1019', 'Pelajar', 'Jl. Pramuka No. 18, Baolan', '2021-12-25', '', 'Aktif', ''),
    J('j20', 'Pnt. Petrus L. Toding', 'Petrus', 'L', '1965-05-07', 'Wilayah III - Tambun', 'KK Toding', 'Kepala Keluarga', 'Dewasa', '0812-4000-1020', 'Petani', 'Jl. Tambun No. 40, Tambun', '1980-09-14', '1987-03-22', 'Aktif', 'Penatua'),
    J('j21', 'Marta Toding', 'Marta', 'P', '1969-08-16', 'Wilayah III - Tambun', 'KK Toding', 'Istri', 'Dewasa', '0812-4000-1021', 'Ibu Rumah Tangga', 'Jl. Tambun No. 40, Tambun', '1984-12-23', '1992-08-16', 'Aktif', ''),
    J('j22', 'Bima Toding', 'Bima', 'L', '2003-12-01', 'Wilayah III - Tambun', 'KK Toding', 'Anak', 'Pemuda', '0812-4000-1022', 'Mahasiswa', 'Jl. Tambun No. 40, Tambun', '2008-12-25', '', 'Aktif', 'Pemusik - drum'),
    J('j23', 'Lala Toding', 'Lala', 'P', '2006-09-12', 'Wilayah III - Tambun', 'KK Toding', 'Anak', 'Remaja', '0812-4000-1023', 'Pelajar', 'Jl. Tambun No. 40, Tambun', '2010-12-25', '', 'Aktif', 'Singer'),
    J('j24', 'Rina S. Palembangan', 'Rina', 'P', '1995-10-05', 'Wilayah III - Tambun', 'KK Palembangan', 'Kepala Keluarga', 'Pemuda', '0812-4000-1024', 'Guru', 'Jl. Tambun No. 21, Tambun', '2009-06-07', '2016-11-13', 'Aktif', 'Guru Sekolah Minggu'),
    J('j25', 'Jefri Palembangan', 'Jefri', 'L', '1997-07-27', 'Wilayah III - Tambun', 'KK Palembangan', 'Kepala Keluarga', 'Pemuda', '0812-4000-1025', 'Wiraswasta', 'Jl. Tambun No. 23, Tambun', '2011-09-11', '2018-04-01', 'Aktif', ''),
    J('j26', 'Daniel Y. Sese', 'Daniel', 'L', '1999-06-05', 'Wilayah I - Nalu', 'KK Sese', 'Kepala Keluarga', 'Pemuda', '0812-4000-1026', 'Mahasiswa', 'Jl. Nalu No. 7, Nalu', '2013-12-25', '2021-06-20', 'Aktif', 'Ketua Komisi Pemuda'),
    J('j27', 'Marten L. Toding', 'Marten', 'L', '1982-10-30', 'Wilayah III - Tambun', 'KK Toding', 'Kepala Keluarga', 'Dewasa', '0812-4000-1027', 'Nelayan', 'Jl. Pantai Tambun No. 2, Tambun', '1996-07-21', '2004-02-15', 'Aktif', ''),
    J('j28', 'Yuliana P. Sari', 'Yuliana', 'P', '1992-05-13', 'Wilayah II - Baolan', 'KK Sari', 'Kepala Keluarga', 'Dewasa', '0812-4000-1028', 'Karyawan', 'Jl. Basuki Rahmat No. 19, Baolan', '2006-10-08', '2014-03-16', 'Pindah', 'Pindah domisili ke Palu, Agustus 2026'),
  ];

  /* --- Transaksi keuangan 3 bulan terakhir --- */
  const transaksi = [];
  let txSeq = 1;
  const pushTx = (offsetMonth, day, jenis, kategori, keterangan, jumlah, metode) => {
    const lastDay = new Date(Y, M + offsetMonth + 1, 0).getDate();
    const date = isoOf(new Date(Y, M + offsetMonth, Math.min(day, lastDay)));
    if (date > today) return;
    transaksi.push({
      id: `tx_${String(txSeq++).padStart(3, '0')}`,
      tanggal: date, jenis, kategori, keterangan, jumlah, metode,
    });
  };

  for (let om = -2; om <= 0; om++) {
    pushTx(om, 5, 'masuk', 'Persembahan Minggu', 'Persembahan ibadah Minggu I', 4850000 + (om + 2) * 125000, 'Tunai');
    pushTx(om, 12, 'masuk', 'Persembahan Minggu', 'Persembahan ibadah Minggu II', 3975000 + (om + 2) * 90000, 'Tunai');
    pushTx(om, 19, 'masuk', 'Persembahan Minggu', 'Persembahan ibadah Minggu III', 4250000 + (om + 2) * 75000, 'Tunai');
    pushTx(om, 20, 'masuk', 'Perpuluhan', 'Perpuluhan jemaat bulan ini', 3100000 + (om + 2) * 150000, 'Transfer');
    pushTx(om, 21, 'masuk', 'Persembahan Syukur', 'Persembahan syukur keluarga jemaat', 1500000, 'Tunai');
    pushTx(om, 18, 'masuk', 'Donasi / Sumbangan', 'Sumbangan pembangunan gedung serba guna', 2000000, 'Transfer');
    pushTx(om, 6, 'keluar', 'Operasional Ibadah', 'Konsumsi, listrik, ATK, dan multimedia', 2450000, 'Tunai');
    pushTx(om, 13, 'keluar', 'Diakonia', 'Kunjungan dan santunan jemaat sakit', 1200000, 'Transfer');
    pushTx(om, 22, 'keluar', 'Honorarium', 'Honorarium pemusik, singer, dan operator', 1500000, 'Tunai');
    pushTx(om, 24, 'keluar', 'Pemeliharaan Gedung', 'Perbaikan sound system dan kebersihan gedung', 875000, 'Transfer');
    pushTx(om, 26, 'keluar', 'Pendidikan', 'Beasiswa anak sekolah minggu', 650000, 'Tunai');
    pushTx(om, 23, 'keluar', 'Pembangunan', 'Pembelian material pembangunan', 2500000, 'Transfer');
  }

  /* --- Tata ibadah --- */
  const item = (bagian, petugas, keterangan, durasi) => ({ id: uid('li'), bagian, petugas, keterangan, durasi });
  const standardItems = (pengkhotbah = 'Pdt. Yohanes M. Pattiasina, S.Th.', liturgos = 'Pnt. Debora A. Rante') => [
    item('Pembukaan', liturgos, 'Jemaat berdiri.\nSalam pembuka, doa pembukaan, dan pengarahan ibadah.', 5),
    item('Nyanyian Pembukaan', 'Tim Musik & Paduan Suara', 'KJ 12 — "Hai Mari Sembah Tuhan"\n(2 bait)', 5),
    item('Pembacaan Alkitab', 'Pnt. Yosua L. Lamadau', 'Lukas 16:1-13', 5),
    item('Nyanyian Tanggapan', 'Tim Musik', 'KJ 415 — "Tuhan, Pimpinlah"\n(3 bait)', 4),
    item('Khotbah', pengkhotbah, 'Tema: "Setia dalam Perkara Kecil"\nLukas 16:10-12', 30),
    item('Doa Syafaat', 'Pnt. Debora A. Rante', 'Doa untuk jemaat, bangsa, dan pelayanan gereja.', 8),
    item('Persembahan', 'Dkn. Maria F. Palembangan', 'Persembahan kantong I & II.\nDiiringi pujian: "Bawa Persembahanmu".', 8),
    item('Pengutusan & Berkat', pengkhotbah, 'Jemaat berdiri. Amin.', 5),
  ];

  const ibadah = [
    {
      id: 'ib_01', tanggal: prevSun, jam: '09.00', judul: 'Ibadah Minggu',
      tema: 'Berakar dan Bertumbuh dalam Kristus', ayat: 'Kolose 2:6-7',
      pengkhotbah: 'Pdt. Yohanes M. Pattiasina, S.Th.', liturgos: 'Pnt. Petrus L. Toding',
      tempat: 'Gedung Gereja Maranatha Tolitoli', status: 'Final', catatan: '',
      items: [
        item('Pembukaan', 'Pnt. Petrus L. Toding', 'Jemaat berdiri. Salam pembuka dan doa pembukaan.', 5),
        item('Nyanyian Pembukaan', 'Tim Musik & Paduan Suara', 'KJ 8 — "Hai Segenap Umat Tuhan"\n(2 bait)', 5),
        item('Pembacaan Alkitab', 'Pnt. Samuel L. Tangkilisan', 'Kolose 2:6-7', 4),
        item('Nyanyian Tanggapan', 'Tim Musik', 'KJ 401 — "Bila Kuperhatikan"\n(2 bait)', 4),
        item('Khotbah', 'Pdt. Yohanes M. Pattiasina, S.Th.', 'Tema: "Berakar dan Bertumbuh dalam Kristus"\nKolose 2:6-7', 30),
        item('Doa Syafaat', 'Pnt. Debora A. Rante', 'Doa untuk jemaat, pelayanan, dan bangsa.', 7),
        item('Persembahan', 'Dkn. Ruth S. Batalipu', 'Persembahan kantong I & II.', 8),
        item('Pengutusan & Berkat', 'Pdt. Yohanes M. Pattiasina, S.Th.', 'Jemaat berdiri. Amin.', 5),
      ],
    },
    {
      id: 'ib_02', tanggal: nextSun, jam: '09.00', judul: 'Ibadah Minggu',
      tema: 'Kasih yang Melayani', ayat: 'Yohanes 13:1-17',
      pengkhotbah: 'Pdt. Yohanes M. Pattiasina, S.Th.', liturgos: 'Pnt. Debora A. Rante',
      tempat: 'Gedung Gereja Maranatha Tolitoli', status: 'Final',
      catatan: 'Perjamuan Kudus dilayani pada ibadah ini.',
      items: [
        item('Pembukaan', 'Pnt. Debora A. Rante', 'Jemaat berdiri.\nSalam pembuka, doa pembukaan, dan pengarahan ibadah.', 5),
        item('Nyanyian Pembukaan', 'Tim Musik & Paduan Suara', 'KJ 12 — "Hai Mari Sembah Tuhan"\n(2 bait)', 5),
        item('Pembacaan Alkitab', 'Pnt. Yosua L. Lamadau', 'Yohanes 13:1-17', 5),
        item('Nyanyian Tanggapan', 'Tim Musik', 'KJ 415 — "Tuhan, Pimpinlah"\n(3 bait)', 4),
        item('Khotbah', 'Pdt. Yohanes M. Pattiasina, S.Th.', 'Tema: "Kasih yang Melayani"\nYohanes 13:1-17', 30),
        item('Perjamuan Kudus', 'Pdt. Yohanes M. Pattiasina, S.Th.\nPnt. Samuel L. Tangkilisan', 'Jemaat yang telah dibaptis dan sidi dimohon mempersiapkan diri.\nDiiringi pujian: "Ku Datang pada-Mu, Tuhan".', 15),
        item('Doa Syafaat', 'Dkn. Maria F. Palembangan', 'Doa untuk jemaat, bangsa, dan pelayanan gereja.', 8),
        item('Persembahan', 'Dkn. Ruth S. Batalipu', 'Persembahan kantong I & II.\nDiiringi pujian: "Bawa Persembahanmu".', 8),
        item('Pengutusan & Berkat', 'Pdt. Yohanes M. Pattiasina, S.Th.', 'Jemaat berdiri. Amin.', 5),
      ],
    },
    {
      id: 'ib_03', tanggal: nextSun2, jam: '09.00', judul: 'Ibadah Minggu',
      tema: 'Setia dalam Perkara Kecil', ayat: 'Lukas 16:10-12',
      pengkhotbah: 'Pdt. Yohanes M. Pattiasina, S.Th.', liturgos: 'Pnt. Samuel L. Tangkilisan',
      tempat: 'Gedung Gereja Maranatha Tolitoli', status: 'Draft',
      catatan: 'Susunan masih dalam penyempurnaan oleh liturgos.',
      items: standardItems('Pdt. Yohanes M. Pattiasina, S.Th.', 'Pnt. Samuel L. Tangkilisan'),
    },
  ];

  /* --- Jadwal pelayanan --- */
  const jadwal = [
    {
      id: 'jd_01', tanggal: nextSun, jam: '09.00', ibadah: 'Ibadah Minggu',
      pengkhotbah: 'Pdt. Yohanes M. Pattiasina, S.Th.', liturgos: 'Pnt. Debora A. Rante',
      singer: 'Lala Toding & Yohana Pattiasina', pemusik: 'Tim A — Gideon, Bima, Rina',
      kolektan: 'Wilayah I - Nalu', multimedia: 'Andreas Batalipu', sekolahMinggu: 'Ibu Esther D. Rante',
      catatan: 'Perjamuan Kudus. Latihan paduan suara Sabtu, 16.00 WITA.',
    },
    {
      id: 'jd_02', tanggal: nextSun2, jam: '09.00', ibadah: 'Ibadah Minggu',
      pengkhotbah: 'Pdt. Yohanes M. Pattiasina, S.Th.', liturgos: 'Pnt. Yosua L. Lamadau',
      singer: 'PS Gloria', pemusik: 'Tim B — Jefri, Daniel, Kevin',
      kolektan: 'Wilayah II - Baolan', multimedia: 'Jefri Palembangan', sekolahMinggu: 'Ibu Rina S. Palembangan',
      catatan: '',
    },
    {
      id: 'jd_03', tanggal: nextSun3, jam: '09.00', ibadah: 'Ibadah Minggu',
      pengkhotbah: 'Pdt. Yohanes M. Pattiasina, S.Th.', liturgos: 'Pnt. Petrus L. Toding',
      singer: 'Sdr. Daniel Y. Sese', pemusik: 'Tim A — Gideon, Bima, Rina',
      kolektan: 'Wilayah III - Tambun', multimedia: 'Andreas Batalipu', sekolahMinggu: 'Ibu Esther D. Rante',
      catatan: 'Ibadah syukur ulang tahun jemaat bulan ini.',
    },
  ];

  const pelayan = [
    { id: 'pl_01', nama: 'Pdt. Yohanes M. Pattiasina, S.Th.', jabatan: 'Pendeta Jemaat', bidang: 'Penggembalaan', telepon: '0812-4000-1001', aktif: true },
    { id: 'pl_02', nama: 'Pnt. Samuel L. Tangkilisan', jabatan: 'Penatua / Ketua Majelis', bidang: 'Kepemimpinan', telepon: '0812-4000-1004', aktif: true },
    { id: 'pl_03', nama: 'Pnt. Debora A. Rante', jabatan: 'Penatua / Sekretaris', bidang: 'Administrasi', telepon: '0812-4000-1007', aktif: true },
    { id: 'pl_04', nama: 'Dkn. Maria F. Palembangan', jabatan: 'Diaken / Bendahara', bidang: 'Keuangan', telepon: '0812-4000-1008', aktif: true },
    { id: 'pl_05', nama: 'Pnt. Yosua L. Lamadau', jabatan: 'Penatua', bidang: 'Pelayanan & Ibadah', telepon: '0812-4000-1009', aktif: true },
    { id: 'pl_06', nama: 'Dkn. Ruth S. Batalipu', jabatan: 'Diaken', bidang: 'Diakonia', telepon: '0812-4000-1011', aktif: true },
    { id: 'pl_07', nama: 'Pnt. Petrus L. Toding', jabatan: 'Penatua', bidang: 'Pembangunan', telepon: '0812-4000-1020', aktif: true },
    { id: 'pl_08', nama: 'Ibu Esther D. Rante', jabatan: 'Guru Sekolah Minggu', bidang: 'Komisi Anak', telepon: '0812-4000-1013', aktif: true },
    { id: 'pl_09', nama: 'Sdr. Daniel Y. Sese', jabatan: 'Pengurus Pemuda', bidang: 'Komisi Pemuda', telepon: '0812-4000-1026', aktif: true },
  ];

  /* --- Warta jemaat --- */
  const warta = [
    { id: 'w_01', tanggal: dateFromToday(-1), kategori: 'Ibadah', penting: true, judul: 'Perjamuan Kudus Minggu Ini',
      isi: 'Ibadah Minggu akan dilayani Perjamuan Kudus. Jemaat yang telah dibaptis dan sidi dimohon mempersiapkan diri dengan doa dan pemeriksaan diri. Pelayanan doa tersedia setelah ibadah bagi jemaat yang membutuhkan pendampingan.' },
    { id: 'w_02', tanggal: dateFromToday(-2), kategori: 'Kegiatan', penting: true, judul: 'Latihan Gabungan Paduan Suara',
      isi: 'Latihan gabungan paduan suara dan tim musik dilaksanakan Sabtu pukul 16.00 WITA di ruang ibadah. Mohon kehadiran seluruh anggota PS Gloria, tim musik, dan singer. Membawa salinan lagu masing-masing.' },
    { id: 'w_03', tanggal: dateFromToday(-3), kategori: 'Diakonia', penting: true, judul: 'Kunjungan Jemaat Sakit',
      isi: 'Tim diakonia akan mengunjungi jemaat yang sedang sakit dan pemulihan pada pekan ini. Mohon doa jemaat. Bagi yang ingin ikut serta atau mengetahui jemaat yang perlu dikunjungi, silakan menghubungi Dkn. Ruth S. Batalipu.' },
    { id: 'w_04', tanggal: dateFromToday(-4), kategori: 'Ulang Tahun', penting: false, judul: 'Ulang Tahun Jemaat Bulan Ini',
      isi: 'Tuhan memberkati jemaat yang berulang tahun bulan ini. Majelis jemaat mengucapkan selamat ulang tahun dan mendoakan agar senantiasa bertumbuh dalam kasih Kristus. Daftar nama dapat dilihat pada papan informasi gereja.' },
    { id: 'w_05', tanggal: dateFromToday(-5), kategori: 'Kegiatan', penting: true, judul: 'Rapat Majelis Jemaat',
      isi: 'Rapat majelis jemaat dilaksanakan Sabtu pukul 13.00 WITA di ruang konsistori. Agenda: evaluasi pelayanan bulan lalu, persiapan perayaan Natal, dan laporan panitia pembangunan. Dimohon kehadiran seluruh majelis.' },
    { id: 'w_06', tanggal: dateFromToday(-6), kategori: 'Keuangan', penting: false, judul: 'Persembahan Pembangunan Gedung Serba Guna',
      isi: 'Panitia pembangunan menerima persembahan khusus untuk pembangunan gedung serba guna. Persembahan dapat disalurkan melalui kantong persembahan atau transfer ke rekening gereja. Laporan penerimaan dan penggunaan dana disampaikan setiap bulan melalui warta jemaat.' },
    { id: 'w_07', tanggal: dateFromToday(-7), kategori: 'Ibadah', penting: false, judul: 'Pendaftaran Baptis dan Sidi',
      isi: 'Pendaftaran baptis dan sidi dibuka sampai akhir bulan ini. Jemaat yang rindu untuk membaptiskan anak atau mengikuti kelas sidi dapat mendaftar melalui sekretariat gereja. Kelas katekisasi akan dimulai sesuai jadwal yang akan diumumkan.' },
    { id: 'w_08', tanggal: dateFromToday(-8), kategori: 'Kegiatan', penting: false, judul: 'Kerja Bakti Membersihkan Gedung Gereja',
      isi: 'Seluruh jemaat diundang untuk mengikuti kerja bakti membersihkan dan merapikan gedung gereja pada Sabtu pagi pukul 07.00 WITA. Membawa peralatan kebersihan seadanya. Mari bersama menjaga rumah Tuhan.' },
    { id: 'w_09', tanggal: dateFromToday(-9), kategori: 'Umum', penting: false, judul: 'Doa Pagi Setiap Rabu',
      isi: 'Doa pagi diadakan setiap Rabu pukul 05.30 WITA di ruang doa gereja. Mari memulai hari dengan bersekutu dan berdoa bersama. Semua jemaat diundang untuk hadir.' },
    { id: 'w_10', tanggal: dateFromToday(-10), kategori: 'Umum', penting: false, judul: 'Ucapan Terima Kasih',
      isi: 'Majelis jemaat mengucapkan terima kasih kepada seluruh jemaat atas dukungan doa, tenaga, dan persembahan untuk pelayanan gereja. Kiranya Tuhan memberkati setiap keluarga.' },
  ];

  /* --- Kegiatan --- */
  const kegiatan = [
    { id: 'k_01', nama: 'Ibadah Rumah Tangga Wilayah I', tanggal: dateFromToday(2), waktu: '19.00', tempat: 'Rumah Kel. Tangkilisan, Nalu', kategori: 'Ibadah Wilayah', penanggungjawab: 'Pnt. Samuel L. Tangkilisan', deskripsi: 'Ibadah rumah tangga gabungan Wilayah I. Jemaat diundang hadir bersama keluarga.' },
    { id: 'k_02', nama: 'Persekutuan Wanita', tanggal: dateFromToday(4), waktu: '09.00', tempat: 'Aula Gereja', kategori: 'Komisi Wanita', penanggungjawab: 'Ibu Naomi R. Tangkilisan', deskripsi: 'Persekutuan wanita dengan tema "Perempuan yang Takut akan Tuhan". Membawa makanan ringan untuk dibagikan.' },
    { id: 'k_03', nama: 'Ibadah Pemuda dan Remaja', tanggal: dateFromToday(6), waktu: '19.00', tempat: 'Aula Lantai 2', kategori: 'Komisi Pemuda', penanggungjawab: 'Sdr. Daniel Y. Sese', deskripsi: 'Ibadah pemuda dan remaja dengan tema "Berani karena Iman". Terbuka untuk semua pemuda jemaat.' },
    { id: 'k_04', nama: 'Latihan Paduan Suara', tanggal: dateFromToday(7), waktu: '16.00', tempat: 'Ruang Ibadah', kategori: 'Musik & Pujian', penanggungjawab: 'Tim Musik', deskripsi: 'Latihan gabungan PS Gloria, singer, dan tim musik untuk ibadah minggu mendatang.' },
    { id: 'k_05', nama: 'Bakti Sosial Diakonia', tanggal: dateFromToday(10), waktu: '08.00', tempat: 'Wilayah II - Baolan', kategori: 'Diakonia', penanggungjawab: 'Dkn. Ruth S. Batalipu', deskripsi: 'Pembagian bantuan sembako bagi jemaat lansia dan keluarga yang membutuhkan. Relawan dipersilakan bergabung.' },
    { id: 'k_06', nama: 'Rapat Majelis Jemaat', tanggal: dateFromToday(12), waktu: '13.00', tempat: 'Ruang Konsistori', kategori: 'Rapat', penanggungjawab: 'Pnt. Samuel L. Tangkilisan', deskripsi: 'Rapat rutin majelis jemaat: evaluasi pelayanan, persiapan Natal, dan laporan pembangunan.' },
    { id: 'k_07', nama: 'Ibadah Syukur Keluarga Toding', tanggal: dateFromToday(-5), waktu: '18.00', tempat: 'Rumah Kel. Toding, Tambun', kategori: 'Ibadah Wilayah', penanggungjawab: 'Pnt. Petrus L. Toding', deskripsi: 'Ibadah syukur atas pemulihan kesehatan anggota keluarga. Terima kasih atas doa jemaat.' },
    { id: 'k_08', nama: 'Outbound Sekolah Minggu', tanggal: dateFromToday(-10), waktu: '07.30', tempat: 'Pantai Tolitoli', kategori: 'Komisi Anak', penanggungjawab: 'Ibu Esther D. Rante', deskripsi: 'Kegiatan outbound anak-anak sekolah minggu. Berjalan lancar dengan 42 peserta.' },
  ];

  /* --- Struktur organisasi --- */
  const struktur = [
    { id: 's1', nama: 'Pdt. Yohanes M. Pattiasina, S.Th.', jabatan: 'Pendeta Jemaat', parentId: null, urutan: 1, periode: '2024–2028', telepon: '0812-4000-1001' },
    { id: 's2', nama: 'Pnt. Samuel L. Tangkilisan', jabatan: 'Ketua Majelis', parentId: 's1', urutan: 1, periode: '2024–2028', telepon: '0812-4000-1004' },
    { id: 's3', nama: 'Pnt. Debora A. Rante', jabatan: 'Sekretaris', parentId: 's1', urutan: 2, periode: '2024–2028', telepon: '0812-4000-1007' },
    { id: 's4', nama: 'Dkn. Maria F. Palembangan', jabatan: 'Bendahara', parentId: 's1', urutan: 3, periode: '2024–2028', telepon: '0812-4000-1008' },
    { id: 's5', nama: 'Pnt. Yosua L. Lamadau', jabatan: 'Penatua Bid. Pelayanan', parentId: 's1', urutan: 4, periode: '2024–2028', telepon: '0812-4000-1009' },
    { id: 's6', nama: 'Dkn. Ruth S. Batalipu', jabatan: 'Diaken Bid. Diakonia', parentId: 's1', urutan: 5, periode: '2024–2028', telepon: '0812-4000-1011' },
    { id: 's7', nama: 'Ibu Esther D. Rante', jabatan: 'Koordinator Komisi Anak', parentId: 's2', urutan: 1, periode: '2024–2028', telepon: '0812-4000-1013' },
    { id: 's8', nama: 'Sdr. Daniel Y. Sese', jabatan: 'Ketua Komisi Pemuda', parentId: 's2', urutan: 2, periode: '2024–2028', telepon: '0812-4000-1026' },
    { id: 's9', nama: 'Ibu Naomi R. Tangkilisan', jabatan: 'Ketua Komisi Wanita', parentId: 's2', urutan: 3, periode: '2024–2028', telepon: '0812-4000-1005' },
    { id: 's10', nama: 'Sdr. Gideon A. Tangkilisan', jabatan: 'Koordinator Musik & Pujian', parentId: 's5', urutan: 1, periode: '2024–2028', telepon: '0812-4000-1006' },
    { id: 's11', nama: 'Sdr. Andreas T. Batalipu', jabatan: 'Koordinator Multimedia', parentId: 's3', urutan: 1, periode: '2024–2028', telepon: '' },
    { id: 's12', nama: 'Ibu Rina S. Palembangan', jabatan: 'Tim Administrasi Keuangan', parentId: 's4', urutan: 1, periode: '2024–2028', telepon: '0812-4000-1024' },
    { id: 's13', nama: 'Ibu Sarah M. Lamadau', jabatan: 'Tim Diakonia', parentId: 's6', urutan: 1, periode: '2024–2028', telepon: '0812-4000-1010' },
  ];

  return {
    meta: { version: 1, seededAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    settings: {
      nama: 'Gereja Maranatha Tolitoli',
      tagline: 'Bersama Membangun Tubuh Kristus',
      alamat: 'Jl. Trans Sulawesi No. 45, Kel. Nalu, Kec. Baolan, Tolitoli, Sulawesi Tengah',
      telepon: '0812-4000-1234',
      email: 'sekretariat@maranathatolitoli.org',
      pendeta: 'Pdt. Yohanes M. Pattiasina, S.Th.',
      ibadah: 'Minggu, 09.00 WITA',
      saldoAwal: 48750000,
    },
    jemaat, transaksi, ibadah, jadwal, pelayan, warta, kegiatan, struktur,
  };
}

/* ---------------- LOAD / SAVE ---------------- */
function loadDB() {
  try {
    const raw = localStorage.getItem(APP_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.jemaat) || !data.settings) return null;
    ['transaksi', 'ibadah', 'jadwal', 'pelayan', 'warta', 'kegiatan', 'struktur'].forEach((k) => {
      if (!Array.isArray(data[k])) data[k] = [];
    });
    return data;
  } catch (err) {
    console.warn('Gagal membaca data lokal:', err);
    return null;
  }
}

function persistDB() {
  try {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(DB));
  } catch (err) {
    console.error('Gagal menyimpan data:', err);
    if (typeof toast === 'function') toast('Penyimpanan browser penuh. Ekspor data lalu bersihkan sebagian.', 'error');
  }
}

let DB = loadDB();
if (!DB) {
  DB = seedData();
  persistDB();
}

function saveDB() {
  DB.meta.updatedAt = new Date().toISOString();
  persistDB();
}
function resetDB() {
  DB = seedData();
  saveDB();
}
function replaceDB(next) {
  DB = next;
  saveDB();
}

/* ---------------- QUERY HELPERS ---------------- */
function activeJemaat() { return DB.jemaat.filter((j) => j.status === 'Aktif'); }

function saldoKas() {
  return DB.transaksi.reduce(
    (s, t) => s + (t.jenis === 'masuk' ? Number(t.jumlah) : -Number(t.jumlah)),
    Number(DB.settings.saldoAwal) || 0
  );
}
function monthTotals(key) {
  let masuk = 0, keluar = 0;
  DB.transaksi.forEach((t) => {
    if (monthKeyOf(t.tanggal) !== key) return;
    if (t.jenis === 'masuk') masuk += Number(t.jumlah);
    else keluar += Number(t.jumlah);
  });
  return { masuk, keluar, net: masuk - keluar };
}
function monthsBack(count = 6) {
  const out = [];
  const base = startOfDay();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`, date: d });
  }
  return out;
}
function sortedJadwal(upcomingOnly = false) {
  return DB.jadwal
    .filter((j) => !upcomingOnly || j.tanggal >= todayISO())
    .slice()
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || String(a.jam).localeCompare(String(b.jam)));
}
function sortedIbadah() {
  return DB.ibadah.slice().sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}
function sortedWarta() {
  return DB.warta.slice().sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}
function sortedKegiatan() {
  return DB.kegiatan.slice().sort((a, b) => a.tanggal.localeCompare(b.tanggal));
}
function nextLiturgy() {
  const list = DB.ibadah.filter((i) => i.tanggal >= todayISO()).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  return list[0] || sortedIbadah()[0] || null;
}
function nextSchedule() {
  return sortedJadwal(true)[0] || null;
}
function birthdaysThisMonth() {
  const m = new Date().getMonth() + 1;
  return activeJemaat()
    .filter((j) => j.tglLahir && Number(j.tglLahir.slice(5, 7)) === m)
    .sort((a, b) => Number(a.tglLahir.slice(8, 10)) - Number(b.tglLahir.slice(8, 10)));
}
function pelayanOptions() {
  return DB.pelayan.filter((p) => p.aktif !== false).map((p) => p.nama);
}
