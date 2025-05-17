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

// Admin login
const ADMIN_EMAIL = "admin@domain.com";
const adminMenu = document.getElementById("adminMenu");
const adminSection = document.getElementById("adminSection");
const adminEmailShow = document.getElementById("adminEmailShow");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const modalLogin = document.getElementById("modalLogin");
const closeLoginModal = document.getElementById("closeLoginModal");
let adminUser = null;

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

// Admin buku
async function renderAdminBuku() {
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
      <td>${buku.status === "dipinjam" ? "<span style='color:red'>Dipinjam</span>" : "Tersedia"}</td>
      <td>
        <button class="btn-admin edit" onclick="editBukuAdmin('${buku.id}')">Edit</button>
        <button class="btn-admin" style="background:#f87171;color:#fff;" onclick="hapusBukuAdmin('${buku.id}')">Hapus</button>
      </td>
    </tr>`;
  });
  fetchBuku();
}
const formTambahBuku = document.getElementById("formTambahBuku");
formTambahBuku.onsubmit = async function(e){
  e.preventDefault();
  const idEdit = document.getElementById("bukuIdEdit").value;
  const data = {
    judul: document.getElementById("judulBuku").value,
    pengarang: document.getElementById("pengarangBuku").value,
    tahun: parseInt(document.getElementById("tahunBuku").value),
    kategori: document.getElementById("kategoriBuku").value,
    isbn: document.getElementById("isbnBuku").value,
    status: "tersedia"
  };
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
};
window.editBukuAdmin = async function(id){
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
};
document.getElementById("btnBatalEdit").onclick = function(){
  formTambahBuku.reset();
  document.getElementById("btnSubmitBuku").textContent = "Tambah Buku";
  document.getElementById("btnBatalEdit").style.display = "none";
  document.getElementById("bukuIdEdit").value = "";
};
window.hapusBukuAdmin = async function(id){
  if (!confirm("Yakin hapus buku ini?")) return;
  await db.collection("buku").doc(id).delete();
  // Hapus juga semua peminjaman buku ini di koleksi "peminjaman"
  let snapshot = await db.collection("peminjaman").where("bukuId","==",id).get();
  let batch = db.batch();
  snapshot.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  showAlert("alertAdmin","success","Buku & riwayat pinjamnya berhasil dihapus!");
  renderAdminBuku();
  fetchBuku();
};

// Data dummy
const DUMMY_BUKU = [
  {judul:"Laskar Pelangi",pengarang:"Andrea Hirata",tahun:2005,kategori:"Fiksi",isbn:"9789793062797"},
  {judul:"Bumi",pengarang:"Tere Liye",tahun:2014,kategori:"Fiksi",isbn:"9786020304196"},
  {judul:"Supernova",pengarang:"Dewi Lestari",tahun:2001,kategori:"Fiksi",isbn:"9789799234426"},
  {judul:"Perahu Kertas",pengarang:"Dewi Lestari",tahun:2009,kategori:"Fiksi",isbn:"9789791227228"},
  {judul:"Sapiens",pengarang:"Yuval Noah Harari",tahun:2011,kategori:"Non-Fiksi",isbn:"9786024246942"},
  {judul:"Atomic Habits",pengarang:"James Clear",tahun:2018,kategori:"Non-Fiksi",isbn:"9786020631049"},
  {judul:"Berani Tidak Disukai",pengarang:"Ichiro Kishimi",tahun:2013,kategori:"Non-Fiksi",isbn:"9786023854315"},
  {judul:"Filosofi Teras",pengarang:"Henry Manampiring",tahun:2018,kategori:"Non-Fiksi",isbn:"9786024810228"},
  {judul:"Clean Code",pengarang:"Robert C. Martin",tahun:2008,kategori:"Teknologi",isbn:"9780132350884"},
  {judul:"The Pragmatic Programmer",pengarang:"Andrew Hunt",tahun:1999,kategori:"Teknologi",isbn:"9780135957059"},
  {judul:"Introduction to Algorithms",pengarang:"Thomas H. Cormen",tahun:2009,kategori:"Teknologi",isbn:"9780262033848"},
  {judul:"Python Crash Course",pengarang:"Eric Matthes",tahun:2016,kategori:"Teknologi",isbn:"9781593276034"},
  {judul:"Sejarah Dunia yang Disembunyikan",pengarang:"Jonathan Black",tahun:2018,kategori:"Sejarah",isbn:"9786023855183"},
  {judul:"A History of Modern Indonesia",pengarang:"Adrian Vickers",tahun:2005,kategori:"Sejarah",isbn:"9780521833992"},
  {judul:"Indonesia Etc.",pengarang:"Elizabeth Pisani",tahun:2014,kategori:"Sejarah",isbn:"9780393079974"},
  {judul:"Guns, Germs, and Steel",pengarang:"Jared Diamond",tahun:1997,kategori:"Sejarah",isbn:"9780393317557"}
];

// Koleksi Buku
let semuaBuku = [];
let filterKategori = "Semua";
async function fetchBuku() {
  let snapshot = await db.collection("buku").get();
  semuaBuku = [];
  snapshot.forEach(doc => semuaBuku.push({ id: doc.id, ...doc.data() }));
  if (semuaBuku.length < 16) {
    DUMMY_BUKU.forEach(d => {
      if (!semuaBuku.some(b => b.judul === d.judul && b.kategori === d.kategori)) {
        semuaBuku.push({ ...d, id: 'dummy-'+d.judul.replace(/\s/g,'') });
      }
    });
  }
  renderBukuGrid();
  renderBukuSelect();
}
fetchBuku();

// RENDER KOLEKSI BUKU
function renderBukuGrid() {
  const daftarBuku = document.getElementById('daftarBuku');
  let filter = filterKategori === "Semua"
    ? semuaBuku
    : semuaBuku.filter(b => b.kategori === filterKategori);
  daftarBuku.innerHTML = "";
  if (filter.length === 0) {
    daftarBuku.innerHTML = "<div class='text-muted text-center py-4'>Belum ada buku pada kategori ini.</div>";
    return;
  }
  filter.forEach(buku => {
    let isDummy = buku.id.startsWith('dummy-');
    let isDipinjam = buku.status === "dipinjam";
    let btnDisabled = isDummy ? 'disabled title="Buku demo, hanya admin yang bisa menambah"' : (isDipinjam ? 'disabled title="Buku sedang dipinjam"' : '');
    let statusHtml = isDummy ? '' : `<div class="status-buku ${isDipinjam ? 'dipinjam' : 'tersedia'}">${isDipinjam ? 'Dipinjam' : 'Tersedia'}</div>`;
    daftarBuku.innerHTML += `
      <div class="card-buku">
        <div class="judul">${buku.judul}</div>
        <div class="pengarang">Pengarang: ${buku.pengarang}</div>
        <div class="kategori-badge">${buku.kategori}</div>
        <div class="tahun">Tahun: ${buku.tahun}</div>
        <div class="isbn">ISBN: ${buku.isbn}</div>
        ${statusHtml}
        <button class="btn-pinjam" data-id="${buku.id}" ${btnDisabled}>Pinjam</button>
      </div>
    `;
  });
  document.querySelectorAll('.btn-pinjam').forEach(btn => {
    btn.onclick = function() {
      const bukuId = this.dataset.id;
      if (bukuId.startsWith('dummy-')) {
        alert('Buku ini hanya untuk demo. Silakan login admin untuk menambah buku asli.');
        return;
      }
      let buku = semuaBuku.find(b=>b.id===bukuId);
      if (!buku || buku.status === "dipinjam") {
        showAlert('alertPinjam','danger','Buku sedang dipinjam!');
        return;
      }
      document.getElementById('bukuDipinjam').value = bukuId;
      document.getElementById('formPinjamSection').scrollIntoView({behavior:"smooth"});
    };
  });
}
document.querySelectorAll('.kategori-btn').forEach(btn => {
  btn.onclick = function() {
    document.querySelectorAll('.kategori-btn').forEach(b=>b.classList.remove('active'));
    this.classList.add('active');
    filterKategori = this.dataset.kategori;
    renderBukuGrid();
  };
});
function renderBukuSelect() {
  const bukuDipinjam = document.getElementById('bukuDipinjam');
  bukuDipinjam.innerHTML = '<option value="">-- Pilih Buku --</option>';
  let available = 0;
  semuaBuku.forEach(b => {
    if (!b.id.startsWith('dummy-') && (!b.status || b.status === "tersedia")) {
      bukuDipinjam.innerHTML += `<option value="${b.id}">${b.judul} (${b.isbn})</option>`;
      available++;
    }
  });
  bukuDipinjam.disabled = available === 0;
  let alertEl = document.getElementById('alertPinjam');
  if (available === 0 && alertEl) {
    alertEl.innerHTML = '<div class="alert alert-warning">Tidak ada buku yang tersedia untuk dipinjam.</div>';
  } else if (alertEl) {
    alertEl.innerHTML = '';
  }
}

// Peminjaman
let pinjamList = JSON.parse(localStorage.getItem("riwayatPinjam")||"[]");
document.getElementById('formPinjam').addEventListener('submit',async function(e){
  e.preventDefault();
  let nama = document.getElementById('namaPeminjam').value.trim();
  let idPeminjam = document.getElementById('idPeminjam').value.trim();
  let bukuId = document.getElementById('bukuDipinjam').value;
  let tglPinjam = document.getElementById('tglPinjam').value;
  if (!bukuId) return showAlert('alertPinjam','danger','Buku wajib dipilih!');
  let buku = semuaBuku.find(b=>b.id===bukuId);
  if (!buku) return showAlert('alertPinjam','danger','Buku tidak ditemukan!');
  if (buku.status === "dipinjam") return showAlert('alertPinjam','danger','Buku sedang dipinjam!');
  let data = {nama,idPeminjam,bukuId,tglPinjam,judul:buku.judul,pengarang:buku.pengarang,kategori:buku.kategori,isbn:buku.isbn};
  // Simpan ke Firestore koleksi "peminjaman"
  await db.collection("peminjaman").add({
    ...data,
    tglPinjam: new Date(tglPinjam),
    status: "dipinjam",
    tglKembali: null
  });
  // Update status buku
  await db.collection("buku").doc(bukuId).update({status: "dipinjam"});
  // Simpan ke localStorage untuk riwayat lokal (opsional)
  pinjamList.push(data);
  localStorage.setItem("riwayatPinjam",JSON.stringify(pinjamList));
  renderRiwayat();
  showStrukPinjam(data);
  this.reset();
  await fetchBuku();
  renderBukuSelect();
});
function showAlert(id,type,msg){
  let el = document.getElementById(id);
  el.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  setTimeout(()=>el.innerHTML="",2300);
}

// Riwayat
function renderRiwayat() {
  const el = document.getElementById('riwayatTabel');
  if(pinjamList.length===0) {
    el.innerHTML = "<div class='text-muted text-center p-2'>Belum ada data peminjaman.</div>";
    return;
  }
  let html = `<table class="riwayat-tabel"><thead>
    <tr>
      <th>Nama</th>
      <th>ID</th>
      <th>Judul Buku</th>
      <th>Kategori</th>
      <th>Tgl Pinjam</th>
      <th>Struk</th>
    </tr></thead><tbody>`;
  pinjamList.forEach((p,i)=>{
    html += `<tr>
      <td>${p.nama}</td>
      <td>${p.idPeminjam}</td>
      <td>${p.judul}</td>
      <td>${p.kategori}</td>
      <td>${formatTanggal(p.tglPinjam)}</td>
      <td><button class="btn-struk" onclick="showStrukPinjamByIndex(${i})">Lihat</button></td>
    </tr>`;
  });
  html += "</tbody></table>";
  el.innerHTML = html;
}
window.showStrukPinjamByIndex = function(i){
  showStrukPinjam(pinjamList[i]);
};
function showStrukPinjam(data){
  let isi = `<div style="font-size:1.09rem">
    <b>Struk Peminjaman Buku</b><hr>
    Nama: <b>${data.nama}</b><br>
    ID: ${data.idPeminjam}<br>
    Judul: ${data.judul}<br>
    Kategori: ${data.kategori}<br>
    Pengarang: ${data.pengarang}<br>
    ISBN: ${data.isbn}<br>
    Tanggal Pinjam: ${formatTanggal(data.tglPinjam)}<br>
    <small>Harap kembalikan buku maksimal 7 hari!</small>
  </div>`;
  document.getElementById('isiStruk').innerHTML = isi;
  document.getElementById('modalStruk').classList.add('show');
}
document.getElementById('closeModal').onclick = () => {
  document.getElementById('modalStruk').classList.remove('show');
};
window.onclick = function(event){
  if(event.target === document.getElementById('modalStruk'))
    document.getElementById('modalStruk').classList.remove('show');
};
function formatTanggal(tgl) {
  if (!tgl) return '';
  if (typeof tgl === "object" && tgl.toDate) tgl = tgl.toDate();
  const d = new Date(tgl);
  return d.toLocaleDateString('id-ID');
}
renderRiwayat();

// Panel admin: daftar peminjaman
async function renderAdminPeminjaman() {
  let el = document.getElementById("adminDaftarPeminjaman");
  if (!el) return;
  let snapshot = await db.collection("peminjaman").orderBy("tglPinjam","desc").get();
  if (snapshot.empty) {
    el.innerHTML = "<div class='text-muted'>Belum ada data peminjaman.</div>";
    return;
  }
  let html = `<table class="riwayat-tabel"><thead>
    <tr>
      <th>Nama</th>
      <th>ID</th>
      <th>Buku</th>
      <th>Tanggal Pinjam</th>
      <th>Status</th>
    </tr></thead><tbody>`;
  snapshot.forEach(doc=>{
    let d = doc.data();
    html += `<tr>
      <td>${d.nama}</td>
      <td>${d.idPeminjam}</td>
      <td>${d.judul}</td>
      <td>${formatTanggal(d.tglPinjam && d.tglPinjam.toDate ? d.tglPinjam.toDate() : d.tglPinjam)}</td>
      <td>${d.status}</td>
    </tr>`;
  });
  html += "</tbody></table>";
  el.innerHTML = html;
}

window.semuaBuku = semuaBuku;