// Firebase config dan inisialisasi
const firebaseConfig = {
  apiKey: "AIzaSyAvgK3-CN1qOQ_6hfhJOTEoNtyUkws-FWs",
  authDomain: "buku-perpustakaan-d5800.firebaseapp.com",
  projectId: "buku-perpustakaan-d5800",
  storageBucket: "buku-perpustakaan-d5800.appspot.com",
  messagingSenderId: "272079716908",
  appId: "1:272079716908:web:f621036e0be69ef4ab4789",
  measurementId: "G-QR79PE11PS"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

const ADMIN_EMAIL = "admin@domain.com";
const adminMenu = document.getElementById("adminMenu");
const adminSection = document.getElementById("adminSection");
const adminEmailShow = document.getElementById("adminEmailShow");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const modalLogin = document.getElementById("modalLogin");
const closeLoginModal = document.getElementById("closeLoginModal");
let adminUser = null;

// --- Utility Functions ---
function formatTanggal(tgl) {
  if (!tgl) return '';
  if (typeof tgl === "object" && tgl.toDate) tgl = tgl.toDate();
  const d = new Date(tgl);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}
function showAlert(id, type, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  setTimeout(() => el.innerHTML = "", 2600);
}
function showLoading(btn, state = true) {
  if (!btn) return;
  btn.disabled = state;
  if (state) {
    btn.dataset.original = btn.innerHTML;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Loading...`;
  } else {
    btn.innerHTML = btn.dataset.original || btn.innerHTML;
  }
}
function isValidBuku(data) {
  if (!data.judul || !data.pengarang || !data.kategori) return false;
  if (!data.tahun || isNaN(Number(data.tahun)) || data.tahun < 1900 || data.tahun > (new Date().getFullYear() + 1)) return false;
  if (!data.isbn || data.isbn.length < 7) return false;
  return true;
}
function isValidPinjam(nama, idPeminjam, bukuToPinjam, tglPinjam, tglKembali) {
  if (!nama || !idPeminjam || !tglPinjam || !tglKembali) return false;
  if (!Array.isArray(bukuToPinjam) || bukuToPinjam.length === 0) return false;
  return true;
}
function calculateDenda(tglKembali, tglKembaliAsli) {
  if (!tglKembali || !tglKembaliAsli) return { denda: 0, hariTelat: 0 };
  const tglTarget = new Date(tglKembali);
  const tglAsli = new Date(tglKembaliAsli);
  const hariTelat = Math.floor((tglAsli - tglTarget) / (1000 * 60 * 60 * 24));
  const denda = hariTelat > 0 ? hariTelat * 5000 : 0;
  return { denda, hariTelat };
}

// --- Admin Login ---
loginBtn.onclick = function() {
  modalLogin.classList.add("show");
};
closeLoginModal.onclick = function() {
  modalLogin.classList.remove("show");
};
document.getElementById("formLoginAdmin").onsubmit = function(e){
  e.preventDefault();
  const email = document.getElementById("loginAdminEmail").value.trim();
  const password = document.getElementById("loginAdminPassword").value;
  auth.signInWithEmailAndPassword(email, password)
    .then(user => {
      adminUser = user.user;
      modalLogin.classList.remove("show");
      showAdminPanel();
      showAlert("alertLoginAdmin","success","Login berhasil!");
    })
    .catch(err => showAlert("alertLoginAdmin","danger",err.message));
};
logoutBtn.onclick = function(){
  auth.signOut().then(()=>window.location.reload());
};
function showAdminPanel() {
  adminMenu.style.display = "inline";
  logoutBtn.style.display = "inline";
  loginBtn.style.display = "none";
  adminEmailShow.textContent = `(${auth.currentUser.email})`;
  adminSection.style.display = "";
  document.querySelector("main").scrollIntoView({behavior:"smooth"});
  renderAdminBuku();
  renderAdminPeminjaman();
}
adminMenu.onclick = function(e){
  e.preventDefault();
  adminSection.style.display = "";
  document.querySelector("main").scrollIntoView({behavior:"smooth"});
  renderAdminBuku();
  renderAdminPeminjaman();
};
auth.onAuthStateChanged(function(user){
  if(user && user.email === ADMIN_EMAIL){
    adminUser = user;
    showAdminPanel();
  }
});

// --- Dummy Data ---
const DUMMY_BUKU = [
  // ... (isi seperti sebelumnya, singkat di sini)
  {judul:"Laskar Pelangi",pengarang:"Andrea Hirata",tahun:2005,kategori:"Fiksi",isbn:"9789793062797"},
  {judul:"Bumi",pengarang:"Tere Liye",tahun:2014,kategori:"Fiksi",isbn:"9786020304196"},
  // ... dst ...
];
async function seedDummyBooksIfNeeded() {
  let snapshot = await db.collection("buku").limit(1).get();
  if (snapshot.empty) {
    for (const d of DUMMY_BUKU) {
      try {
        await db.collection("buku").add({ ...d, status: "tersedia" });
      } catch (err) {
        console.error("Error seeding dummy:", err);
      }
    }
  }
}
window.tambahDummyBuku = async function() {
  if (!confirm("Tambah semua buku dummy ke koleksi buku?")) return;
  for (const d of DUMMY_BUKU) {
    try {
      await db.collection("buku").add({ ...d, status: "tersedia" });
    } catch (err) {
      showAlert("alertAdmin", "danger", "Gagal tambah buku dummy: " + err.message);
      return;
    }
  }
  showAlert("alertAdmin", "success", "Buku dummy berhasil ditambahkan ke Firestore!");
  renderAdminBuku();
  fetchBuku();
};

// --- Admin Buku CRUD ---
async function renderAdminBuku() {
  try {
    let snapshot = await db.collection("buku").get();
    let bukuList = [];
    snapshot.forEach(doc => bukuList.push({ id: doc.id, ...doc.data() }));
    const tbody = document.getElementById("adminDaftarBuku");
    tbody.innerHTML = "";
    bukuList.forEach(buku => {
      tbody.innerHTML += `<tr>
        <td>${buku.judul}</td>
        <td>${buku.pengarang}</td>
        <td>${buku.tahun}</td>
        <td>${buku.kategori}</td>
        <td>${buku.isbn}</td>
        <td>
          ${buku.status === "dipinjam" ? "<span style='color:red'>Dipinjam</span>" : 
            buku.status === "tersedia" ? "<span style='color:green'>Tersedia</span>" : 
            "<span style='color:#888'>Tidak Tersedia</span>"
          }
        </td>
        <td>
          <button class="btn-admin edit" onclick="editBukuAdmin('${buku.id}')">Edit</button>
          <button class="btn-admin" style="background:#f87171;color:#fff;" onclick="hapusBukuAdmin('${buku.id}')">Hapus</button>
        </td>
      </tr>`;
    });
    fetchBuku();
  } catch (err) {
    showAlert("alertAdmin", "danger", "Gagal memuat daftar buku admin: " + err.message);
  }
}
const formTambahBuku = document.getElementById("formTambahBuku");
formTambahBuku.onsubmit = async function(e){
  e.preventDefault();
  const idEdit = document.getElementById("bukuIdEdit").value;
  const data = {
    judul: document.getElementById("judulBuku").value.trim(),
    pengarang: document.getElementById("pengarangBuku").value.trim(),
    tahun: parseInt(document.getElementById("tahunBuku").value),
    kategori: document.getElementById("kategoriBuku").value.trim(),
    isbn: document.getElementById("isbnBuku").value.trim(),
    status: "tersedia"
  };
  if (!isValidBuku(data)) {
    showAlert("alertAdmin", "danger", "Data buku tidak valid!");
    return;
  }
  try {
    if (idEdit) {
      let bukuDoc = await db.collection("buku").doc(idEdit).get();
      if (bukuDoc.exists && bukuDoc.data().status) {
        data.status = bukuDoc.data().status;
      }
      await db.collection("buku").doc(idEdit).set(data);
      showAlert("alertAdmin","success","Buku berhasil diupdate!");
    } else {
      await db.collection("buku").add(data);
      showAlert("alertAdmin","success","Buku berhasil ditambahkan!");
    }
    formTambahBuku.reset();
    document.getElementById("btnSubmitBuku").textContent = "Tambah Buku";
    document.getElementById("btnBatalEdit").style.display = "none";
    document.getElementById("bukuIdEdit").value = "";
    renderAdminBuku();
    fetchBuku();
  } catch (err) {
    showAlert("alertAdmin", "danger", "Gagal menyimpan buku: " + err.message);
  }
};
window.editBukuAdmin = async function(id){
  try {
    let doc = await db.collection("buku").doc(id).get();
    if (!doc.exists) return;
    let b = doc.data();
    document.getElementById("judulBuku").value = b.judul;
    document.getElementById("pengarangBuku").value = b.pengarang;
    document.getElementById("tahunBuku").value = b.tahun;
    document.getElementById("kategoriBuku").value = b.kategori;
    document.getElementById("isbnBuku").value = b.isbn;
    document.getElementById("bukuIdEdit").value = id;
    document.getElementById("btnSubmitBuku").textContent = "Update Buku";
    document.getElementById("btnBatalEdit").style.display = "";
  } catch (err) {
    showAlert("alertAdmin", "danger", "Gagal muat data buku: " + err.message);
  }
};
document.getElementById("btnBatalEdit").onclick = function(){
  formTambahBuku.reset();
  document.getElementById("btnSubmitBuku").textContent = "Tambah Buku";
  document.getElementById("btnBatalEdit").style.display = "none";
  document.getElementById("bukuIdEdit").value = "";
};
window.hapusBukuAdmin = async function(id){
  if (!confirm("Yakin hapus buku ini?")) return;
  try {
    await db.collection("buku").doc(id).delete();
    let snapshot = await db.collection("peminjaman").where("bukuId","==",id).get();
    let batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    showAlert("alertAdmin","success","Buku & riwayat pinjamnya berhasil dihapus!");
    renderAdminBuku();
    fetchBuku();
  } catch (err) {
    showAlert("alertAdmin", "danger", "Gagal hapus buku: " + err.message);
  }
};

// --- Koleksi Buku dan Rendering Grid/Select/Multi ---
let semuaBuku = [];
let filterKategori = "Semua";
let dummySeeded = false;
async function fetchBuku() {
  try {
    if (!dummySeeded) {
      await seedDummyBooksIfNeeded();
      dummySeeded = true;
    }
    let snapshot = await db.collection("buku").get();
    semuaBuku = [];
    snapshot.forEach(doc => semuaBuku.push({ id: doc.id, ...doc.data() }));
    semuaBuku.forEach(b => {
      if (!b.status) b.status = "tersedia";
    });
    window.semuaBuku = semuaBuku;
    renderBukuGrid();
    renderBukuSelect();
    renderMultiBukuPinjam();
  } catch (error) {
    console.error("Error fetching books:", error);
    showAlert('alertPinjam', 'danger', 'Gagal memuat daftar buku');
  }
}
function renderBukuGrid() {
  const daftarBuku = document.getElementById('daftarBuku');
  if (!daftarBuku) return;
  const filteredBooks = filterKategori === "Semua"
    ? semuaBuku
    : semuaBuku.filter(b => b.kategori === filterKategori);
  if (filteredBooks.length === 0) {
    daftarBuku.innerHTML = "<div class='text-muted text-center py-4'>Belum ada buku pada kategori ini.</div>";
    return;
  }
  daftarBuku.innerHTML = filteredBooks.map(buku => {
    const isDummy = buku.id.startsWith('dummy-');
    const isDipinjam = buku.status === "dipinjam";
    const isTersedia = buku.status === "tersedia";
    const btnDisabled = isDummy || !isTersedia;
    const statusHtml = isDummy ? '' : `
      <div class="status-buku ${isDipinjam ? 'dipinjam' : isTersedia ? 'tersedia' : 'tidak-tersedia'}">
        ${isDipinjam ? 'Dipinjam' : isTersedia ? 'Tersedia' : 'Tidak Tersedia'}
      </div>
    `;
    return `
      <div class="card-buku">
        <div class="judul">${buku.judul}</div>
        <div class="pengarang">Pengarang: ${buku.pengarang}</div>
        <div class="kategori-badge">${buku.kategori}</div>
        <div class="tahun">Tahun: ${buku.tahun}</div>
        <div class="isbn">ISBN: ${buku.isbn || '-'}</div>
        ${statusHtml}
        <button class="btn-pinjam" data-id="${buku.id}" 
          ${btnDisabled ? 'disabled' : ''}
          ${isDummy ? 'title="Buku demo, hanya admin yang bisa menambah"' : ''}
          ${isDipinjam ? 'title="Buku sedang dipinjam"' : isTersedia ? '' : 'title="Buku tidak tersedia"'}>
          Pinjam
        </button>
      </div>
    `;
  }).join('');
  document.querySelectorAll('.btn-pinjam').forEach(btn => {
    btn.addEventListener('click', function() {
      const bukuId = this.dataset.id;
      handlePinjamBuku(bukuId);
    });
  });
}
document.querySelectorAll('.kategori-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.kategori-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    filterKategori = this.dataset.kategori;
    renderBukuGrid();
  });
});
function renderBukuSelect() {
  const bukuDipinjam = document.getElementById('bukuDipinjam');
  if (!bukuDipinjam) return;
  const prevValue = bukuDipinjam.value;
  bukuDipinjam.innerHTML = '<option value="">-- Pilih Buku --</option>';
  let availableBooks = 0;
  semuaBuku.forEach(b => {
    if (!b.id.startsWith('dummy-') && b.status === "tersedia") {
      bukuDipinjam.innerHTML += `<option value="${b.id}">${b.judul}${b.isbn ? ` (${b.isbn})` : ''}</option>`;
      availableBooks++;
    }
  });
  bukuDipinjam.disabled = availableBooks === 0;
  if (prevValue && bukuDipinjam.querySelector(`option[value="${prevValue}"]`)) {
    bukuDipinjam.value = prevValue;
  }
  const alertEl = document.getElementById('alertPinjam');
  if (alertEl) {
    alertEl.innerHTML = availableBooks === 0 
      ? '<div class="alert alert-warning">Tidak ada buku yang tersedia untuk dipinjam.</div>' 
      : '';
  }
  bukuDipinjam.dispatchEvent(new Event('change'));
}
function renderMultiBukuPinjam() {
  const multiBukuDiv = document.getElementById('multiBukuDipinjam');
  if (!multiBukuDiv) return;
  const availableBooks = semuaBuku.filter(b => !b.id.startsWith('dummy-') && b.status === "tersedia");
  if (availableBooks.length === 0) {
    multiBukuDiv.innerHTML = "<div class='alert alert-warning'>Tidak ada buku yang tersedia untuk dipinjam.</div>";
    return;
  }
  multiBukuDiv.innerHTML = `
    <label for="multiBukuSelect"><b>Pilih Buku yang akan Dipinjam (bisa lebih dari satu):</b></label>
    <select id="multiBukuSelect" multiple size="6" style="width:100%;margin-bottom:7px;">
      ${availableBooks.map(b => `<option value="${b.id}">${b.judul}${b.isbn ? ` (${b.isbn})` : ''}</option>`).join('')}
    </select>
    <div id="multiJudulBukuTerpilih" class="text-muted" style="margin-bottom: 7px;"></div>
  `;
  const multiSelect = document.getElementById('multiBukuSelect');
  const multiJudulDiv = document.getElementById('multiJudulBukuTerpilih');
  multiSelect.addEventListener('change', function() {
    const ids = Array.from(this.selectedOptions).map(opt => opt.value);
    if (ids.length === 0) {
      multiJudulDiv.textContent = "";
    } else {
      multiJudulDiv.innerHTML = "Dipilih: <br>" + ids.map(id => {
        const buku = semuaBuku.find(b => b.id === id);
        return buku ? `• ${buku.judul}${buku.isbn ? ` (ISBN: ${buku.isbn})` : ''}` : '';
      }).join('<br>');
    }
  });
}
function updateJudulBukuTerpilih() {
  const select = document.getElementById('bukuDipinjam');
  const judulDiv = document.getElementById('judulBukuTerpilih');
  if (!select || !judulDiv) return;
  const selectedValue = select.value;
  if (!selectedValue) {
    judulDiv.textContent = "";
    return;
  }
  const buku = window.semuaBuku.find(b => b.id === selectedValue);
  if (buku) {
    judulDiv.textContent = `Judul: ${buku.judul}${buku.isbn ? ` (ISBN: ${buku.isbn})` : ''}`;
  } else {
    judulDiv.textContent = "";
  }
}

// --- Peminjaman ---
let pinjamList = JSON.parse(localStorage.getItem("riwayatPinjam") || "[]");
document.getElementById('formPinjam').addEventListener('submit', async function(e) {
  e.preventDefault();
  const nama = document.getElementById('namaPeminjam').value.trim();
  const idPeminjam = document.getElementById('idPeminjam').value.trim();
  const bukuIdSingle = document.getElementById('bukuDipinjam').value;
  const tglPinjamStr = document.getElementById('tglPinjam').value;
  const tglKembaliStr = document.getElementById('tglKembali').value;
  // Pastikan tanggal valid
  const tglPinjam = tglPinjamStr ? new Date(tglPinjamStr) : new Date();
  const tglKembali = tglKembaliStr ? new Date(tglKembaliStr) : new Date(Date.now() + 7*24*60*60*1000);
  const btn = this.querySelector('button[type="submit"]');
  const multiSelect = document.getElementById('multiBukuSelect');
  let bukuIds = [];
  if (multiSelect) {
    bukuIds = Array.from(multiSelect.selectedOptions).map(opt => opt.value);
  }
  let bukuToPinjam = bukuIds.length > 0 ? bukuIds : (bukuIdSingle ? [bukuIdSingle] : []);
  if (!isValidPinjam(nama, idPeminjam, bukuToPinjam, tglPinjam, tglKembali)) {
    showAlert('alertPinjam', 'danger', 'Semua field wajib diisi & buku harus dipilih!');
    return;
  }
  showLoading(btn, true);
  let notFound = false, dummyFound = false, notAvailable = false, bukuDatas = [];
  for (let bid of bukuToPinjam) {
    const localBuku = semuaBuku.find(b => b.id === bid);
    if (!localBuku) { notFound = true; continue; }
    if (localBuku.id.startsWith('dummy-')) { dummyFound = true; continue; }
    let doc;
    try {
      doc = await db.collection("buku").doc(bid).get();
    } catch (err) {
      showAlert('alertPinjam', 'danger', 'Gagal cek buku: ' + err.message);
      showLoading(btn, false);
      return;
    }
    if (!doc.exists) { notFound = true; continue; }
    let b = doc.data();
    if (b.status !== "tersedia") { notAvailable = true; continue; }
    bukuDatas.push({ ...localBuku, ...b });
  }
  if (notFound) {
    showAlert('alertPinjam', 'danger', 'Salah satu buku tidak ditemukan!');
    showLoading(btn, false);
    return;
  }
  if (dummyFound) {
    showAlert('alertPinjam', 'danger', 'Buku demo tidak bisa dipinjam!');
    showLoading(btn, false);
    return;
  }
  if (notAvailable) {
    showAlert('alertPinjam', 'danger', 'Ada buku yang tidak tersedia atau sedang dipinjam!');
    await fetchBuku();
    showLoading(btn, false);
    return;
  }
  try {
    const batch = db.batch();
    let invoiceDetails = [];
    for (let buku of bukuDatas) {
      const data = {
        nama, idPeminjam,
        bukuId: buku.id,
        tglPinjam,
        tglKembali,
        judul: buku.judul,
        pengarang: buku.pengarang,
        kategori: buku.kategori,
        isbn: buku.isbn
      };
      const newRef = db.collection("peminjaman").doc();
      batch.set(newRef, {
        ...data,
        status: "dipinjam",
        tglKembaliAsli: null
      });
      batch.update(db.collection("buku").doc(buku.id), { status: "dipinjam" });
      pinjamList.push(data);
      invoiceDetails.push(data);
    }
    await batch.commit();
    localStorage.setItem("riwayatPinjam", JSON.stringify(pinjamList));
    renderRiwayat();
    if (invoiceDetails.length === 1) showStrukPinjam(invoiceDetails[0]);
    else showStrukPinjamMulti(invoiceDetails, tglPinjam, tglKembali);
    this.reset();
    await fetchBuku();
    renderBukuSelect();
    renderMultiBukuPinjam();
    showAlert('alertPinjam', 'success', 'Buku berhasil dipinjam!');
  } catch (error) {
    if (error.code === "permission-denied" || (error.message && error.message.includes('Missing or insufficient permissions'))) {
      showAlert('alertPinjam', 'danger', 'Gagal meminjam buku: Izin Firestore kurang. Cek rules Firestore.');
    } else {
      showAlert('alertPinjam', 'danger', 'Gagal meminjam buku: ' + error.message);
    }
    console.error("Error borrowing books:", error);
  } finally {
    showLoading(btn, false);
  }
});

// --- Riwayat, Struk, dan Modal ---
function renderRiwayat() {
  const el = document.getElementById('riwayatTabel');
  if (!el) return;
  if (pinjamList.length === 0) {
    el.innerHTML = "<div class='text-muted text-center p-2'>Belum ada data peminjaman.</div>";
    return;
  }
  const html = `
    <table class="riwayat-tabel">
      <thead>
        <tr>
          <th>Nama</th>
          <th>ID</th>
          <th>Judul Buku</th>
          <th>Kategori</th>
          <th>Tgl Pinjam</th>
          <th>Tgl Kembali</th>
          <th>Struk/Invoice</th>
        </tr>
      </thead>
      <tbody>
        ${pinjamList.map((p, i) => `
          <tr>
            <td>${p.nama}</td>
            <td>${p.idPeminjam}</td>
            <td>${p.judul}</td>
            <td>${p.kategori}</td>
            <td>${formatTanggal(p.tglPinjam)}</td>
            <td>${formatTanggal(p.tglKembali)}</td>
            <td><button class="btn-struk" onclick="showStrukPinjamByIndex(${i})">Lihat</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  el.innerHTML = html;
}
window.showStrukPinjamByIndex = function(index) {
  if (index >= 0 && index < pinjamList.length) {
    showStrukPinjam(pinjamList[index]);
  }
};
function showStrukPinjam(data) {
  const tglKembaliAsli = data.tglKembaliAsli || null;
  const { denda, hariTelat } = calculateDenda(data.tglKembali, tglKembaliAsli);
  const strukContent = `
    <div class="invoice-struk">
      <div style="font-size:1.09rem">
        <b>Invoice Peminjaman Buku</b><hr>
        Nama: <b>${data.nama}</b><br>
        ID: ${data.idPeminjam}<br>
        Judul: ${data.judul}<br>
        Kategori: ${data.kategori}<br>
        Pengarang: ${data.pengarang}<br>
        ISBN: ${data.isbn || '-'}<br>
        Tanggal Pinjam: ${formatTanggal(data.tglPinjam)}<br>
        Tanggal Kembali (target): ${formatTanggal(data.tglKembali)}<br>
        ${tglKembaliAsli ? `Tanggal Kembali Sebenarnya: ${formatTanggal(tglKembaliAsli)}<br>` : ''}
        <hr>
        <b>Denda Terlambat: Rp ${denda.toLocaleString("id-ID")}</b> 
        ${hariTelat > 0 ? `(Terlambat ${hariTelat} hari)` : '(Tidak ada denda)'}<br>
        <small>Harap kembalikan buku tepat waktu. Denda Rp 5.000/hari jika lewat dari tanggal kembali.</small>
      </div>
    </div>
  `;
  document.getElementById('isiStruk').innerHTML = strukContent;
  document.getElementById('modalStruk').classList.add('show');
}
function showStrukPinjamMulti(datas, tglPinjam, tglKembali) {
  let strukContent = `
    <div class="invoice-struk">
      <div style="font-size:1.09rem">
        <b>Invoice Peminjaman Buku</b><hr>
        Nama: <b>${datas[0].nama}</b><br>
        ID: ${datas[0].idPeminjam}<br>
        <b>Daftar Buku:</b><br>
        <ol>${datas.map(d => `
          <li>
            <b>${d.judul}</b> (${d.kategori})<br>
            Pengarang: ${d.pengarang}<br>
            ISBN: ${d.isbn || '-'}
          </li>
        `).join('')}</ol>
        Tanggal Pinjam: ${formatTanggal(tglPinjam)}<br>
        Tanggal Kembali (target): ${formatTanggal(tglKembali)}<br>
        <hr>
        <small>Harap kembalikan buku tepat waktu. Denda Rp 5.000/hari jika lewat dari tanggal kembali.</small>
      </div>
    </div>
  `;
  document.getElementById('isiStruk').innerHTML = strukContent;
  document.getElementById('modalStruk').classList.add('show');
}
document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('modalStruk').classList.remove('show');
});
window.addEventListener('click', function(event) {
  if (event.target === document.getElementById('modalStruk')) {
    document.getElementById('modalStruk').classList.remove('show');
  }
});

// --- Panel admin: daftar peminjaman ---
async function renderAdminPeminjaman() {
  const el = document.getElementById("adminDaftarPeminjaman");
  if (!el) return;
  try {
    const snapshot = await db.collection("peminjaman").orderBy("tglPinjam", "desc").get();
    if (snapshot.empty) {
      el.innerHTML = "<div class='text-muted'>Belum ada data peminjaman.</div>";
      return;
    }
    const html = `
      <table class="riwayat-tabel">
        <thead>
          <tr>
            <th>Nama</th>
            <th>ID</th>
            <th>Buku</th>
            <th>Tgl Pinjam</th>
            <th>Tgl Kembali (target)</th>
            <th>Tgl Kembali Real</th>
            <th>Status</th>
            <th>Denda</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${snapshot.docs.map(doc => {
            const d = doc.data();
            const { denda, hariTelat } = calculateDenda(d.tglKembali, d.tglKembaliAsli);
            return `
              <tr>
                <td>${d.nama}</td>
                <td>${d.idPeminjam}</td>
                <td>${d.judul}</td>
                <td>${formatTanggal(d.tglPinjam?.toDate?.() || d.tglPinjam)}</td>
                <td>${formatTanggal(d.tglKembali?.toDate?.() || d.tglKembali)}</td>
                <td>${d.tglKembaliAsli ? formatTanggal(d.tglKembaliAsli?.toDate?.() || d.tglKembaliAsli) : '-'}</td>
                <td>${d.status || '-'}</td>
                <td>Rp ${denda.toLocaleString("id-ID")}${hariTelat > 0 ? `<br><span class="denda-late">Terlambat ${hariTelat} hari</span>` : ''}</td>
                <td>
                  ${d.status === "dipinjam" ? `
                    <button class="btn-admin btn-kembali" onclick="pengembalianBuku('${doc.id}','${d.bukuId}','${d.tglKembali}')">
                      Konfirmasi<br>Kembali
                    </button>
                  ` : ''}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    el.innerHTML = html;
  } catch (error) {
    console.error("Error loading borrow history:", error);
    el.innerHTML = "<div class='text-danger'>Gagal memuat data peminjaman</div>";
  }
}
window.pengembalianBuku = async function(peminjamanId, bukuId, tglKembali) {
  if (!confirm("Konfirmasi pengembalian buku?")) return;
  try {
    const tglSekarang = new Date();
    await db.collection("peminjaman").doc(peminjamanId).update({
      status: "dikembalikan",
      tglKembaliAsli: tglSekarang
    });
    await db.collection("buku").doc(bukuId).update({ status: "tersedia" });
    showAlert("alertAdmin", "success", "Buku berhasil dikembalikan!");
    renderAdminPeminjaman();
    fetchBuku();
  } catch (error) {
    showAlert("alertAdmin", "danger", "Gagal mengkonfirmasi pengembalian: " + error.message);
  }
};

// --- Inisialisasi saat DOM ready ---
document.addEventListener("DOMContentLoaded", function() {
  const select = document.getElementById('bukuDipinjam');
  if (select) {
    select.addEventListener('change', updateJudulBukuTerpilih);
  }
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  if(document.getElementById('tglPinjam')) document.getElementById('tglPinjam').valueAsDate = today;
  if(document.getElementById('tglKembali')) document.getElementById('tglKembali').valueAsDate = nextWeek;
  fetchBuku();
  renderRiwayat();
  auth.onAuthStateChanged(function(user) {
    if (user && user.email === ADMIN_EMAIL) {
      adminUser = user;
      showAdminPanel();
    }
  });
});

// --- Fungsi pinjam buku dari tombol di grid (pilih & highlight di select) ---
function handlePinjamBuku(bukuId) {
  if (bukuId.startsWith('dummy-')) {
    alert('Buku ini hanya untuk demo. Silakan login admin untuk menambah buku asli.');
    return;
  }
  const buku = semuaBuku.find(b => b.id === bukuId);
  if (!buku) {
    showAlert('alertPinjam', 'danger', 'Buku tidak ditemukan!');
    return;
  }
  if (buku.status !== "tersedia") {
    showAlert('alertPinjam', 'danger', 'Buku sedang dipinjam atau tidak tersedia!');
    return;
  }
  const multiSelect = document.getElementById('multiBukuSelect');
  if (multiSelect) {
    for (let i = 0; i < multiSelect.options.length; i++) {
      if (multiSelect.options[i].value === bukuId) {
        multiSelect.options[i].selected = true;
        multiSelect.dispatchEvent(new Event('change'));
        break;
      }
    }
    document.getElementById('formPinjamSection').scrollIntoView({behavior: "smooth"});
    return;
  }
  const select = document.getElementById('bukuDipinjam');
  select.value = bukuId;
  select.classList.add('highlighted');
  setTimeout(() => select.classList.remove('highlighted'), 700);
  updateJudulBukuTerpilih();
  document.getElementById('formPinjamSection').scrollIntoView({behavior: "smooth"});
}