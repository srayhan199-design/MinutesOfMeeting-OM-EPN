// Integrasi Firebase Database & Auth
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, get, child, push, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyABsU8Z9wzzzAPHk-5eB6HV2tcsRYGsC2w",
    authDomain: "data-minutes-of-meeting.firebaseapp.com",
    databaseURL: "https://data-minutes-of-meeting-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "data-minutes-of-meeting",
    storageBucket: "data-minutes-of-meeting.firebasestorage.app",
    messagingSenderId: "766106710249",
    appId: "1:766106710249:web:569025628323eeb3460078"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app); // Inisialisasi Auth

// ================= SISTEM LOGIN & LOGOUT =================
// Cek otomatis apakah user sedang login atau belum
onAuthStateChanged(auth, (user) => {
    const loginScreen = document.getElementById("loginScreen");
    const toolbar = document.querySelector(".toolbar");
    const mainApp = document.querySelector(".main");

    if (user) {
        if(loginScreen) loginScreen.style.display = "none";
        if(toolbar) toolbar.style.display = "flex";
        if(mainApp) mainApp.style.display = "flex";
    } else {
        if(loginScreen) loginScreen.style.display = "flex";
        if(toolbar) toolbar.style.display = "none";
        if(mainApp) mainApp.style.display = "none";
    }
});

window.prosesLogin = function() {
    const email = document.getElementById("emailInput").value;
    const pass = document.getElementById("passwordInput").value;
    const btnLogin = document.querySelector(".login-box button");
    const errorText = document.getElementById("loginError");

    if(!email || !pass) {
        errorText.innerText = "Email dan Password harus diisi!";
        errorText.style.display = "block";
        return;
    }

    btnLogin.innerText = "Mengecek...";

    signInWithEmailAndPassword(auth, email, pass)
        .then((userCredential) => {
            errorText.style.display = "none";
            btnLogin.innerText = "Login";
            document.getElementById("emailInput").value = "";
            document.getElementById("passwordInput").value = "";
        })
        .catch((error) => {
            errorText.innerText = "Login gagal! Cek kembali email & password.";
            errorText.style.display = "block";
            btnLogin.innerText = "Login";
        });
};

window.prosesLogout = function() {
    if(confirm("Apakah Anda yakin ingin keluar dari sistem?")) {
        signOut(auth).then(() => {
            alert("Berhasil Logout!");
            home(); 
        }).catch((error) => {
            console.error("Gagal logout:", error);
        });
    }
};

// ================= FUNGSI-FUNGSI DATABASE MOM =================
function parseGroups(rawData) {
    let groups = [];
    let currentGroup = null;
    if(!rawData || !Array.isArray(rawData)) return groups;

    rawData.forEach(d => {
        if (d[0] !== "-") { 
            let textMatter = d[2] ? d[2].toString().toLowerCase().replace(/[^a-z0-9]/g, '') : "";
            let key = textMatter; 
            if (key === "") { key = Math.random().toString(); }

            currentGroup = { key: key, items: [d], hasActive: (d[10] === "open" || d[10] === "process") };
            groups.push(currentGroup);
        } else { 
            if (currentGroup) {
                currentGroup.items.push(d);
                if (d[10] === "open" || d[10] === "process") { currentGroup.hasActive = true; }
            }
        }
    });
    return groups;
}

const urutanBulanLokal = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const urutanMingguLokal = ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"];
const urutanHariLokal = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

window.getHariSebelumnya = function(y, m, w, d) {
    let yIdx = parseInt(y);
    let mIdx = urutanBulanLokal.indexOf(m);
    let wIdx = urutanMingguLokal.indexOf(w);
    let dIdx = urutanHariLokal.indexOf(d);

    dIdx--; 
    if (dIdx < 0) {
        dIdx = 4; 
        wIdx--; 
        if (wIdx < 0) {
            wIdx = 3; 
            mIdx--; 
            if (mIdx < 0) { mIdx = 11; yIdx--; }
        }
    }
    return { y: yIdx.toString(), m: urutanBulanLokal[mIdx], w: urutanMingguLokal[wIdx], d: urutanHariLokal[dIdx] };
}

window.loadHariIni = async function() {
    let tbody = document.querySelector("#momTable tbody");
    tbody.innerHTML = "<tr><td colspan='13' style='color:blue; padding:20px;'>Sinkronisasi data dari cloud...</td></tr>";
    try {
        const currentSnap = await get(child(ref(db), `MOM/${window.tahun}/${window.month}/${window.week}/${window.day}`));
        tbody.innerHTML = "";

        if (currentSnap.exists()) {
            let data = currentSnap.val();
            data.forEach(d => {
                let isSub = (d[0] === "-");
                let row = tambah(isSub); 
                let elements = row.querySelectorAll("input,textarea,select,span");
                for(let i=0; i < d.length; i++) {
                    if(!elements[i]) continue;
                    if(elements[i].tagName === "SPAN") elements[i].innerText = d[i] || "";
                    else { elements[i].value = d[i] || ""; if(elements[i].tagName === "TEXTAREA") autoHeight(elements[i]); }
                }
                setStatus(row.querySelector("select")); 
            });
        } else {
            tambah();
        }
        updateNomor(); 
    } catch (error) { 
        console.error(error); 
        tbody.innerHTML = "<tr><td colspan='13' style='color:red;'>Gagal memuat data MOM.</td></tr>"; 
    }
};

window.tarikDataKemarin = async function() {
    let prev = window.getHariSebelumnya(window.tahun, window.month, window.week, window.day);
    if (parseInt(prev.y) < 2025) { alert("Tidak ada rekaman data sebelum tahun 2025."); return; }

    try {
        const snap = await get(child(ref(db), `MOM/${prev.y}/${prev.m}/${prev.w}/${prev.d}`));
        if (snap.exists()) {
            let groups = parseGroups(snap.val());
            let hasCarry = false;

            let existingKeys = [];
            document.querySelectorAll("#momTable tbody tr").forEach(tr => {
                if(tr.style.display === "none" || tr.cells.length <= 1) return;
                let textMatter = tr.cells[2].querySelector("textarea") ? tr.cells[2].querySelector("textarea").value.toLowerCase().replace(/[^a-z0-9]/g, '') : "";
                existingKeys.push(textMatter);
            });

            groups.forEach(g => {
                if (g.hasActive) {
                    let kMatter = g.items[0][2] ? g.items[0][2].toString().toLowerCase().replace(/[^a-z0-9]/g, '') : "";

                    if (!existingKeys.includes(kMatter) || kMatter === "") {
                        hasCarry = true;
                        g.items.forEach(d => {
                            let isSub = (d[0] === "-");
                            let row = tambah(isSub); 
                            let elements = row.querySelectorAll("input,textarea,select,span");
                            for(let i=0; i < d.length; i++) {
                                if(!elements[i]) continue;
                                if(elements[i].tagName === "SPAN") elements[i].innerText = d[i] || "";
                                else { elements[i].value = d[i] || ""; if(elements[i].tagName === "TEXTAREA") autoHeight(elements[i]); }
                            }
                            setStatus(row.querySelector("select")); 
                        });
                    }
                }
            });

            if (hasCarry) {
                alert(`Berhasil menarik pekerjaan yang belum selesai (Open/Process) dari hari ${prev.d}!`);
                updateNomor();
            } else {
                alert(`Tugas dari hari ${prev.d} sudah ada di tabel ini, atau sudah berstatus Close semua.`);
            }
        } else {
            alert(`Tidak ada rekaman tersimpan di hari ${prev.d}. Pastikan kamu sudah menekan tombol Simpan di hari tersebut.`);
        }
    } catch (err) {
        console.error(err);
        alert("Gagal terhubung ke Cloud saat menarik data.");
    }
};

// ================= MONTHLY SUMMARY (PENGGANTI GLOBAL SUMMARY) =================
window.loadMonthlySummary = async function(targetMonth) {
    window.isSummaryMode = true; 

    if (typeof resetDisplay === "function") resetDisplay();

    document.getElementById("momContainer").style.display = "block";
    document.getElementById("actionButtons").style.display = "none"; 
    document.getElementById("judul").innerText = `SUMMARY BULAN ${targetMonth.toUpperCase()} ${window.tahun || "2026"}`;
    document.getElementById("colDelete").style.display = "none";

    let tbody = document.querySelector("#momTable tbody");
    tbody.innerHTML = "<tr><td colspan='13' style='color:blue; padding:20px; text-align:center;'>Sedang merangkum data dari database...</td></tr>";

    try {
        let tahunAktif = window.tahun || "2026";
        const snapshot = await get(ref(db, `MOM/${tahunAktif}/${targetMonth}`));

        let saringanData = {};

        if (snapshot.exists()) {
            const dataBulanIni = snapshot.val(); 

            for (let minggu in dataBulanIni) {
                for (let hari in dataBulanIni[minggu]) {
                    let dataHarian = dataBulanIni[minggu][hari];

                    dataHarian.forEach(d => {
                        let matters = d[2] || "";
                        let problem = d[3] || "";
                        if (!matters) return;

                        let cleanMatters = matters.toString().toLowerCase().trim().replace(/[^a-z0-9]/g, '');
                        let cleanProblem = problem.toString().toLowerCase().trim().replace(/[^a-z0-9]/g, '');
                        let kunciUnik = cleanMatters + "_" + cleanProblem;

                        saringanData[kunciUnik] = d; 
                    });
                }
            }

            tbody.innerHTML = "";
            let dataTerbaru = Object.values(saringanData);

            if (dataTerbaru.length === 0) {
                tbody.innerHTML = "<tr><td colspan='13' style='text-align:center; padding:20px;'>Tidak ada pekerjaan di bulan ini.</td></tr>";
                return;
            }

            dataTerbaru.forEach(d => {
                let isSub = (d[0] === "-");
                let row = tambah(isSub); 
                let elements = row.querySelectorAll("input,textarea,select,span");

                for(let i=0; i < d.length; i++) {
                    if(!elements[i]) continue;
                    if(elements[i].tagName === "SPAN") elements[i].innerText = d[i] || "";
                    else { 
                        elements[i].value = d[i] || ""; 
                        if(elements[i].tagName === "TEXTAREA") autoHeight(elements[i]); 
                    }
                }

                if (typeof setStatus === "function") setStatus(row.querySelector("select")); 

                row.querySelectorAll("input, textarea, select").forEach(el => {
                    el.disabled = true;
                    el.style.backgroundColor = "transparent";
                    el.style.color = "black";
                });
                row.querySelector(".col-del").style.display = "none";
            });

            if (typeof updateNomor === "function") updateNomor();

        } else {
            tbody.innerHTML = "<tr><td colspan='13' style='text-align:center; padding:20px;'>Belum ada data tersimpan untuk bulan ini.</td></tr>";
        }
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan='13' style='color:red; text-align:center; padding:20px;'>Error Asli: <b>${error.message}</b></td></tr>`;
    }
};

window.save = async function() {
    if(window.isSummaryMode) return;
    let data = [];

    document.querySelectorAll("#momTable tbody tr").forEach(r => {
        let rowData = [];
        r.querySelectorAll("input,textarea,select,span").forEach(el => rowData.push(el.value || el.innerText || ""));

        // --- TAMBAHAN KODE PENGIKAT SUB-ROW ---
        if (r.classList.contains("sub-row")) {
            rowData[0] = "-";
        }
        // --------------------------------------

        let matters = rowData[2] ? rowData[2].trim() : "";
        let problem = rowData[3] ? rowData[3].trim() : "";

        if (matters !== "" || problem !== "") {
            data.push(rowData);
        }
    });

    if (data.length === 0) {
        data = null;
    }

    try { 
        await set(ref(db, `MOM/${window.tahun}/${window.month}/${window.week}/${window.day}`), data); 

        if (data === null) {
            alert(`Semua data di hari ${window.day} berhasil dikosongkan dari Cloud!`);
        } else {
            alert(`Data Berhasil disimpan di folder ${window.tahun}! (Baris kosong otomatis diabaikan)`);
        }

        loadHariIni();

    } catch (error) { alert("Gagal menyimpan data MOM."); console.error(error); }
};

window.loadKegiatan = function() {
    window.isSummaryMode = false; resetDisplay();
    document.getElementById("kegiatanContainer").style.display = "block";
    document.getElementById("formUploadFoto").style.display = "none";
    document.getElementById("btnToggleUpload").style.display = "inline-block";
    triggerFade("kegiatanContainer"); fetchFoto('Semua');
}

window.uploadFoto = function() {
    const files = document.getElementById("fotoInput").files;
    const kategori = document.getElementById("kategoriFoto").value; 
    const komentar = document.getElementById("fotoKomentar").value; 
    if (files.length === 0) { alert("Pilih foto terlebih dahulu!"); return; }

    const btnUpload = document.querySelector("#formUploadFoto button.add-btn");
    const btnOriginalText = btnUpload.innerText;
    btnUpload.innerText = "⏳ Sedang Mengupload..."; btnUpload.disabled = true;

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image(); img.src = e.target.result;
            img.onload = async function() {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 1000; const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH; canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext("2d"); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const base64String = canvas.toDataURL("image/jpeg", 0.75);

                try {
                    const fotoRef = ref(db, `Kegiatan/${kategori}`);
                    await push(fotoRef, { image: base64String, comment: komentar });
                    toggleUploadForm(); fetchFoto('Semua'); 
                } catch (err) { alert("Gagal upload foto ke server. Coba lagi."); console.error(err);
                } finally { btnUpload.innerText = btnOriginalText; btnUpload.disabled = false; }
            }
        }
        reader.readAsDataURL(file);
    });
}

window.fetchFoto = async function(filterKategori = 'Semua') {
    const tombolFilters = document.querySelectorAll('#filterKegiatanContainer .stat-box');
    tombolFilters.forEach(btn => {
        btn.style.opacity = "0.5"; btn.style.transform = "scale(0.95)"; btn.style.boxShadow = "none";
        if (btn.innerText.includes(filterKategori) || (filterKategori === 'Semua' && btn.innerText.includes('Semua'))) {
            btn.style.opacity = "1"; btn.style.transform = "scale(1.05)"; btn.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
        }
    });

    const gallery = document.getElementById("galleryContainer");
    gallery.innerHTML = "<p>Memuat foto kegiatan...</p>";

    try {
        const snap = await get(ref(db, `Kegiatan`));
        gallery.innerHTML = ""; let hasPhoto = false;

        if (snap.exists()) {
            const data = snap.val();
            const listKategori = ["Lapangan", "Meeting", "Bebas"]; 

            listKategori.forEach(kat => {
                if (filterKategori !== 'Semua' && filterKategori !== kat) return;

                if (data[kat]) {
                    let keys = Object.keys(data[kat]).reverse(); 

                    keys.forEach(key => {
                        if(kat === 'Gallery') return; 
                        hasPhoto = true;
                        let imgData = data[kat][key];
                        let imgSrc = ""; let imgComment = "";

                        if (typeof imgData === 'string') { imgSrc = imgData; } 
                        else { imgSrc = imgData.image; imgComment = imgData.comment || ""; }

                        let safeComment = imgComment.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '<br>');

                        const card = document.createElement("div"); card.className = "photo-card";

                        card.innerHTML = `
                            <div class="photo-img-wrapper">
                                <img src="${imgSrc}" alt="Kegiatan ${kat}" loading="lazy" onclick="bukaLightbox(this.src, '${safeComment}')" title="Klik untuk perbesar">
                                <span class="photo-category-badge">${kat}</span>
                                <button class="del-photo-btn" onclick="hapusFoto('${kat}', '${key}')" title="Hapus Foto">✖</button>
                            </div>
                            ${imgComment ? `<div class="photo-comment">${imgComment.replace(/\n/g, '<br>')}</div>` : ''}
                        `;
                        gallery.appendChild(card);
                    });
                }
            });
        } 
        if (!hasPhoto) { gallery.innerHTML = `<p style='color:#64748b; font-style:italic; padding: 20px;'>Belum ada foto dokumentasi untuk kategori: <b>${filterKategori}</b>.</p>`; }
    } catch (err) { gallery.innerHTML = "<p style='color:red;'>Gagal memuat foto dari server.</p>"; console.error(err); }
}

window.hapusFoto = async function(kategori, key) {
    event.stopPropagation();
    if (confirm(`Apakah kamu yakin ingin menghapus foto ${kategori} ini secara permanen?`)) {
        try { await remove(ref(db, `Kegiatan/${kategori}/${key}`)); fetchFoto('Semua'); 
        } catch(err) { alert("Gagal menghapus foto dari server."); console.error(err); }
    }
}
