// === FIREBASE & DOM ===

// --- Variabel Data Pinjam/Kembali (RAM, bukan Firestore) ---
let pinjamList = [];
let kembaliList = [];

// --- Helper Firestore Buku (CRUD) ---
async function getAllBuku() {
  const snapshot = await firebase.firestore().collection("buku").get();
  let arr = [];
  snapshot.forEach(doc => arr.push({ id: doc.id, ...doc.data() }));
  return arr;
}

async function getBukuById(id) {
  const doc = await firebase.firestore().collection("buku").doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

// --- Render Buku (Tabel & Dropdown) ---
async function renderBuku(isAdmin = true) {
  const daftarBuku = document.getElementById('daftarBuku');
  const bukuDipinjam = document.getElementById('bukuDipinjam');
  daftarBuku.innerHTML = '';
  bukuDipinjam.innerHTML = '<option value="">Pilih Buku</option>';
  const bukuList = await getAllBuku();

  bukuList.forEach(buku => {
    let aksi = '';
    if (isAdmin) {
      aksi = `<button class="btn btn-danger btn-sm" data-id="${buku.id}">Hapus</button>`;
    }
    daftarBuku.innerHTML += `
      <tr>
        <td>${buku.judul}</td>
        <td>${buku.pengarang}</td>
        <td>${buku.tahun}</td>
        <td>${buku.kategori}</td>
        <td>${buku.isbn}</td>
        <td>${aksi}</td>
      </tr>
    `;
    bukuDipinjam.innerHTML += `<option value="${buku.id}">${buku.judul} (${buku.isbn})</option>`;
  });

  // Hapus buku
  if (isAdmin) {
    daftarBuku.querySelectorAll('button.btn-danger').forEach(btn => {
      btn.onclick = async function () {
        if (confirm('Yakin hapus buku ini?')) {
          await firebase.firestore().collection("buku").doc(this.dataset.id).delete();
          showAlert(document.getElementById('alertBuku'), 'success', 'Buku berhasil dihapus!');
          renderBuku();
        }
      };
    });
  }
}

// --- Buku: Tambah Buku ---
document.getElementById('formTambahBuku').addEventListener('submit', async function (e) {
  e.preventDefault();
  e.stopPropagation();
  if (!this.checkValidity()) {
    this.classList.add('was-validated');
    return;
  }
  const dataBuku = {
    judul: document.getElementById('judul').value,
    pengarang: document.getElementById('pengarang').value,
    tahun: parseInt(document.getElementById('tahun').value),
    kategori: document.getElementById('kategori').value,
    isbn: document.getElementById('isbn').value
  };
  await firebase.firestore().collection("buku").add(dataBuku);
  showAlert(document.getElementById('alertBuku'), 'success', 'Buku berhasil ditambahkan!');
  renderBuku();
  this.reset();
  this.classList.remove('was-validated');
});

// --- PINJAMAN ---
function renderPinjam() {
  const daftarPinjam = document.getElementById('daftarPinjam');
  daftarPinjam.innerHTML = '';
  pinjamList.forEach((p, idx) => {
    getBukuById(p.bukuId).then(buku => {
      daftarPinjam.innerHTML += `
        <tr>
          <td>${p.nama}</td>
          <td>${p.idPeminjam}</td>
          <td>${buku ? buku.judul : '-'}</td>
          <td>${formatTanggal(p.tglPinjam)}</td>
          <td>
            <button class="btn btn-info btn-sm" onclick="showStrukPinjam(${idx})">Struk</button>
          </td>
        </tr>
      `;
      renderPinjamKembali();
    });
  });
}

// --- Dropdown Transaksi Pinjam untuk Pengembalian ---
function renderPinjamKembali() {
  const pinjamKembali = document.getElementById('pinjamKembali');
  pinjamKembali.innerHTML = '<option value="">Pilih Transaksi Pinjam</option>';
  pinjamList.forEach((p, idx) => {
    getBukuById(p.bukuId).then(buku => {
      pinjamKembali.innerHTML += `<option value="${idx}">${p.nama} (${buku ? buku.judul : '-'})</option>`;
    });
  });
}

// --- PINJAM: Tambah Peminjaman ---
document.getElementById('formPinjam').addEventListener('submit', function (e) {
  e.preventDefault();
  e.stopPropagation();
  if (!this.checkValidity()) {
    this.classList.add('was-validated');
    return;
  }
  const nama = document.getElementById('namaPeminjam').value;
  const idPeminjam = document.getElementById('idPeminjam').value;
  const bukuId = document.getElementById('bukuDipinjam').value;
  const tglPinjam = document.getElementById('tglPinjam').value;
  if (!bukuId) return showAlert(document.getElementById('alertPinjam'), 'danger', 'Buku wajib dipilih');
  pinjamList.push({ nama, idPeminjam, bukuId, tglPinjam });
  renderPinjam();
  this.reset();
  this.classList.remove('was-validated');
  showStrukPinjam(pinjamList.length - 1);
});

// --- STRUK PINJAM ---
window.showStrukPinjam = function (idx) {
  const p = pinjamList[idx];
  getBukuById(p.bukuId).then(buku => {
    document.getElementById('isiStruk').innerHTML = `
      <b>Struk Peminjaman Buku</b><hr/>
      Nama: ${p.nama}<br>
      ID: ${p.idPeminjam}<br>
      Buku: ${buku ? buku.judul : '-'}<br>
      Tgl Pinjam: ${formatTanggal(p.tglPinjam)}<br>
      <small>Harap kembalikan buku maksimal 7 hari.</small>
    `;
    new bootstrap.Modal(document.getElementById('modalStruk')).show();
  });
};

// --- PENGEMBALIAN ---
function renderKembali() {
  const daftarKembali = document.getElementById('daftarKembali');
  daftarKembali.innerHTML = '';
  kembaliList.forEach((k, idx) => {
    getBukuById(k.bukuId).then(buku => {
      const denda = hitungDenda(k.tglPinjam, k.tglKembali);
      daftarKembali.innerHTML += `
        <tr>
          <td>${k.nama}</td>
          <td>${k.idPeminjam}</td>
          <td>${buku ? buku.judul : '-'}</td>
          <td>${formatTanggal(k.tglPinjam)}</td>
          <td>${formatTanggal(k.tglKembali)}</td>
          <td>Rp${denda.toLocaleString('id-ID')}</td>
          <td><button class="btn btn-info btn-sm" onclick="showStrukKembali(${idx})">Struk</button></td>
        </tr>
      `;
    });
  });
}

// --- KEMBALI: Proses Pengembalian ---
document.getElementById('formKembali').addEventListener('submit', function (e) {
  e.preventDefault();
  e.stopPropagation();
  if (!this.checkValidity()) {
    this.classList.add('was-validated');
    return;
  }
  const idxPinjam = parseInt(document.getElementById('pinjamKembali').value);
  const tglKembali = document.getElementById('tglKembali').value;
  if (isNaN(idxPinjam)) return showAlert(document.getElementById('alertKembali'), 'danger', 'Transaksi pinjam wajib dipilih');
  // Cek sudah dikembalikan?
  if (kembaliList.find(k => k.nama === pinjamList[idxPinjam].nama && k.bukuId === pinjamList[idxPinjam].bukuId)) {
    return showAlert(document.getElementById('alertKembali'), 'danger', 'Buku ini sudah dikembalikan oleh peminjam ini!');
  }
  const dataPinjam = pinjamList[idxPinjam];
  kembaliList.push({ ...dataPinjam, tglKembali });
  renderKembali();
  this.reset();
  this.classList.remove('was-validated');
  showStrukKembali(kembaliList.length - 1);
});

// --- STRUK KEMBALI ---
window.showStrukKembali = function (idx) {
  const k = kembaliList[idx];
  getBukuById(k.bukuId).then(buku => {
    const denda = hitungDenda(k.tglPinjam, k.tglKembali);
    document.getElementById('isiStruk').innerHTML = `
      <b>Struk Pengembalian Buku</b><hr/>
      Nama: ${k.nama}<br>
      ID: ${k.idPeminjam}<br>
      Buku: ${buku ? buku.judul : '-'}<br>
      Tgl Pinjam: ${formatTanggal(k.tglPinjam)}<br>
      Tgl Kembali: ${formatTanggal(k.tglKembali)}<br>
      Denda: <b>Rp${denda.toLocaleString('id-ID')}</b>
    `;
    new bootstrap.Modal(document.getElementById('modalStruk')).show();
  });
};

// --- UTILITAS ---
function showAlert(container, type, msg) {
  container.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  setTimeout(() => {
    container.innerHTML = '';
  }, 3500);
}

function formatTanggal(tgl) {
  if (!tgl) return '';
  const d = new Date(tgl);
  return d.toLocaleDateString('id-ID');
}

function hitungDenda(tglPinjam, tglKembali) {
  if (!tglPinjam || !tglKembali) return 0;
  const msPerDay = 24 * 60 * 60 * 1000;
  const pinjam = new Date(tglPinjam);
  const kembali = new Date(tglKembali);
  const diff = Math.floor((kembali - pinjam) / msPerDay);
  const telat = diff - 7 > 0 ? diff - 7 : 0; // telat jika >7 hari
  return telat * 5000;
}

// --- Inisialisasi pertama (fetch buku, render tab pinjam/kembali kosong) ---
document.addEventListener('DOMContentLoaded', () => {
  renderBuku();
  renderPinjam();
  renderKembali();
});