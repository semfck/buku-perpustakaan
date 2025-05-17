// ... kode main.js sebelumnya (peminjaman, koleksi, dsb) ...

// ========== ADMIN LOGIN & MANAGE ==========
const ADMIN_EMAIL = "admin@domain.com";
const adminMenu = document.getElementById("adminMenu");
const adminSection = document.getElementById("adminSection");
const adminEmailShow = document.getElementById("adminEmailShow");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const modalLogin = document.getElementById("modalLogin");
const closeLoginModal = document.getElementById("closeLoginModal");

// ===== ADMIN LOGIN =====
let adminUser = null;
loginBtn.onclick = function() {
  modalLogin.classList.add("show");
}
closeLoginModal.onclick = function() {
  modalLogin.classList.remove("show");
}
document.getElementById("formLoginAdmin").onsubmit = function(e){
  e.preventDefault();
  const email = document.getElementById("loginAdminEmail").value.trim();
  const password = document.getElementById("loginAdminPassword").value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(user => {
      adminUser = user.user;
      modalLogin.classList.remove("show");
      showAdminPanel();
      showAlert("alertLoginAdmin","success","Login berhasil!");
    })
    .catch(err => showAlert("alertLoginAdmin","danger",err.message));
};

// ===== ADMIN LOGOUT =====
logoutBtn.onclick = function(){
  firebase.auth().signOut().then(()=>window.location.reload());
};

// ====== SHOW/HIDE ADMIN PANEL ======
function showAdminPanel() {
  adminMenu.style.display = "inline";
  logoutBtn.style.display = "inline";
  loginBtn.style.display = "none";
  adminEmailShow.textContent = `(${firebase.auth().currentUser.email})`;
  adminSection.style.display = "";
  document.querySelector("main").scrollIntoView({behavior:"smooth"});
  renderAdminBuku();
}
adminMenu.onclick = function(e){
  e.preventDefault();
  adminSection.style.display = "";
  document.querySelector("main").scrollIntoView({behavior:"smooth"});
  renderAdminBuku();
};

// ====== RENDER ADMIN TABEL BUKU ======
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
      <td>
        <button class="btn-admin edit" onclick="editBukuAdmin('${buku.id}')">Edit</button>
        <button class="btn-admin" style="background:#f87171;color:#fff;" onclick="hapusBukuAdmin('${buku.id}')">Hapus</button>
      </td>
    </tr>`;
  });
}

// ====== TAMBAH/EDIT BUKU ======
const formTambahBuku = document.getElementById("formTambahBuku");
formTambahBuku.onsubmit = async function(e){
  e.preventDefault();
  const idEdit = document.getElementById("bukuIdEdit").value;
  const data = {
    judul: document.getElementById("judulBuku").value,
    pengarang: document.getElementById("pengarangBuku").value,
    tahun: parseInt(document.getElementById("tahunBuku").value),
    kategori: document.getElementById("kategoriBuku").value,
    isbn: document.getElementById("isbnBuku").value
  };
  if (idEdit) {
    // EDIT
    await db.collection("buku").doc(idEdit).set(data);
    showAlert("alertAdmin","success","Buku berhasil diupdate!");
  } else {
    // TAMBAH
    await db.collection("buku").add(data);
    showAlert("alertAdmin","success","Buku berhasil ditambahkan!");
  }
  formTambahBuku.reset();
  document.getElementById("btnSubmitBuku").textContent = "Tambah Buku";
  document.getElementById("btnBatalEdit").style.display = "none";
  document.getElementById("bukuIdEdit").value = "";
  renderAdminBuku();
  fetchBuku(); // update koleksi
};
// Edit buku
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
// Batal edit
document.getElementById("btnBatalEdit").onclick = function(){
  formTambahBuku.reset();
  document.getElementById("btnSubmitBuku").textContent = "Tambah Buku";
  document.getElementById("btnBatalEdit").style.display = "none";
  document.getElementById("bukuIdEdit").value = "";
};
// Hapus buku
window.hapusBukuAdmin = async function(id){
  if (!confirm("Yakin hapus buku ini?")) return;
  await db.collection("buku").doc(id).delete();
  showAlert("alertAdmin","success","Buku berhasil dihapus!");
  renderAdminBuku();
  fetchBuku();
};

// ====== AUTODETEKSI LOGIN ADMIN ======
firebase.auth().onAuthStateChanged(function(user){
  if(user && user.email === ADMIN_EMAIL){
    adminUser = user;
    showAdminPanel();
  }
});

// ... kode main.js selanjutnya (koleksi, pinjam, riwayat, dsb) ...