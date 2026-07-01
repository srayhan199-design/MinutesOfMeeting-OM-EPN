import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, get, child, push, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Pastikan API Key di bawah ini sudah sesuai dengan punyamu
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
export const auth = getAuth(app); 

// ================= SISTEM LOGIN =================
onAuthStateChanged(auth, (user) => {
    const loginScreen = document.getElementById("loginScreen");
    const toolbar = document.querySelector(".toolbar");
    const mainApp = document.querySelector(".main");

    if (user) {
        if(loginScreen) loginScreen.style.display = "none";
        if(toolbar) toolbar.style.display = "flex";
        if(mainApp) mainApp.style.display = "flex";

        get(ref(db, 'MOM_LastUpdate')).then((snap) => {
            let lastDate = snap.exists() ? snap.val() : "Belum ada data tersimpan";
            let modal = document.getElementById("reminderModal");
            let txt = document.getElementById("lastUpdateText");
            if (modal && txt) { txt.innerText = lastDate; modal.style.display = "flex"; }
        }).catch(err => console.error(err));

        if(typeof window.loadHariIni === "function") window.loadHariIni();
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

    if(!email || !pass) { errorText.innerText = "Isi Email dan Password!"; errorText.style.display = "block"; return; }
    btnLogin.innerText = "Mengecek...";
    signInWithEmailAndPassword(auth, email, pass).then(() => {
        errorText.style.display = "none"; btnLogin.innerText = "Login";
        document.getElementById("emailInput").value = ""; document.getElementById("passwordInput").value = "";
    }).catch(() => {
        errorText.innerText = "Gagal! Cek email & password."; errorText.style.display = "block"; btnLogin.innerText = "Login";
    });
};

window.prosesLogout = function() {
    if(confirm("Yakin ingin keluar?")) {
        signOut(auth).then(() => { alert("Logout Berhasil!"); if(typeof window.home === "function") window.home(); }).catch((error) => console.error(error));
    }
};

// ================= FUNGSI DATABASE MOM =================
function parseGroups(rawData) {
    let groups = []; let currentGroup = null;
    if(!rawData || !Array.isArray(rawData)) return groups;
    rawData.forEach(d => {
        if (d[0] !== "-") { 
            let key = d[2] ? d[2].toString().toLowerCase().replace(/[^a-z0-9]/g, '') : Math.random().toString();
            currentGroup = { key: key, items: [d], hasActive: (d[10] === "open" || d[10] === "process") };
            groups.push(currentGroup);
        } else { 
            if (currentGroup) { currentGroup.items.push(d); if (d[10] === "open" || d[10] === "process") currentGroup.hasActive = true; }
        }
    });
    return groups;
}

const urutanBulanLokal = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const urutanMingguLokal = ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4", "Minggu 5"]; 
const urutanHariLokal = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

// ---------------------------------------------------------------------------------------------------------
// PERBAIKAN BUG KALENDER: Nyebrang Bulan / Tahun dengan Akurat
window.getHariSebelumnya = function(y, m, w, d) {
    let tglSekarangStr = window.hitungTanggalOtomatis(y, m, w, d);
    if (!tglSekarangStr) return null; // Pengaman jika tanggal kosong

    let parts = tglSekarangStr.split('/');
    let tglObj = new Date(parts[2], parseInt(parts[1]) - 1, parts[0]);
    tglObj.setDate(tglObj.getDate() - 1); // Mundur 1 hari di kalender

    let yBaru = tglObj.getFullYear().toString();
    let mBaru = urutanBulanLokal[tglObj.getMonth()];
    let arrayNamaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    let dBaru = arrayNamaHari[tglObj.getDay()];
    let tanggalAngkaBaru = tglObj.getDate();

    let kalenderBaru = window.generateCalendar(yBaru, mBaru);
    let wBaru = "Minggu 1"; 
    if (kalenderBaru) {
        for (let mg in kalenderBaru) {
            if (kalenderBaru[mg][dBaru] === tanggalAngkaBaru) {
                wBaru = "Minggu " + mg;
                break;
            }
        }
    }
    return { y: yBaru, m: mBaru, w: wBaru, d: dBaru };
}
// ---------------------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------------------------
// PENGISIAN DATA KE TABEL (Untuk Kolom Kategori Mandiri - 14 Kolom)
function isiDataKeBaris(row, d) {
    row.querySelector(".col-hari textarea").value = d[1] || "";
    row.querySelector(".col-matters textarea").value = d[2] || "";
    row.querySelector(".col-problem textarea").value = d[3] || "";
    row.querySelector(".col-tanggal input").value = d[4] || "";
    row.querySelector(".col-pic input").value = d[5] || "";
    row.querySelector(".col-epc input").value = d[6] || "";
    row.querySelector(".col-due input").value = d[7] || "";
    row.querySelector(".col-done input").value = d[8] || "";
    row.querySelector(".col-aging span").innerText = d[9] || "";
    row.querySelector(".col-status select").value = d[10] || "open";

    let selKat = row.querySelector(".col-kategori select");
    let txtRemarks = row.querySelector(".col-remarks textarea");

    // Jika data dari cloud cuma punya 12 kolom (data lama), d[11] itu Remarks. Kategori kita kosongkan.
    if (d.length <= 12) { 
        if (selKat) { selKat.value = ""; if(typeof window.setKategori==="function") window.setKategori(selKat); }
        if (txtRemarks) txtRemarks.value = d[11] || "";
    } else {
        // Jika data baru (13 kolom/lebih), d[11] itu Kategori, d[12] itu Remarks.
        if (selKat) { selKat.value = d[11] || ""; if(typeof window.setKategori==="function") window.setKategori(selKat); }
        if (txtRemarks) txtRemarks.value = d[12] || ""; 
    }

    if(typeof window.setStatus === "function") window.setStatus(row.querySelector(".col-status select"));
    row.querySelectorAll("textarea").forEach(ta => autoHeight(ta));
}
// ---------------------------------------------------------------------------------------------------------

window.loadHariIni = async function() {
    let tbody = document.querySelector("#momTable tbody");
    tbody.innerHTML = "<tr><td colspan='14' style='color:blue; padding:20px;'>Sinkronisasi data dari cloud...</td></tr>";
    try {
        const currentSnap = await get(child(ref(db), `MOM/${window.tahun}/${window.month}/${window.week}/${window.day}`));
        tbody.innerHTML = "";
        if (currentSnap.exists()) {
            currentSnap.val().forEach(d => {
                let row = typeof window.tambah === "function" ? window.tambah(d[0] === "-") : tambah(d[0] === "-"); 
                isiDataKeBaris(row, d);
            });
        } else { if(typeof window.tambah === "function") window.tambah(); else tambah(); }
        window.updateNomor();
    } catch (error) { tbody.innerHTML = "<tr><td colspan='14' style='color:red;'>Gagal memuat data MOM.</td></tr>"; }
};

window.tarikDataKemarin = async function() {
    let prev = window.getHariSebelumnya(window.tahun, window.month, window.week, window.day);
    if (!prev) { alert("Sistem kalender gagal memuat hari kemarin. Pastikan Anda sudah memilih hari dengan benar."); return; } // Pengaman tambahan
    if (parseInt(prev.y) < 2025) { alert("Tidak ada data sebelum tahun 2025."); return; }
    try {
        const snap = await get(child(ref(db), `MOM/${prev.y}/${prev.m}/${prev.w}/${prev.d}`));
        if (snap.exists()) {
            let groups = parseGroups(snap.val()); let hasCarry = false; let existingKeys = [];
            document.querySelectorAll("#momTable tbody tr").forEach(tr => {
                if(tr.style.display === "none" || tr.cells.length <= 1) return;
                let textMatter = tr.querySelector(".col-matters textarea") ? tr.querySelector(".col-matters textarea").value.toLowerCase().replace(/[^a-z0-9]/g, '') : "";
                existingKeys.push(textMatter);
            });
            groups.forEach(g => {
                if (g.hasActive) {
                    let kMatter = g.items[0][2] ? g.items[0][2].toString().toLowerCase().replace(/[^a-z0-9]/g, '') : "";
                    if (!existingKeys.includes(kMatter) || kMatter === "") {
                        hasCarry = true;
                        g.items.forEach(d => {
                            let row = typeof window.tambah === "function" ? window.tambah(d[0] === "-") : tambah(d[0] === "-"); 
                            isiDataKeBaris(row, d);
                        });
                    }
                }
            });
            if (hasCarry) { alert(`Tugas ditarik dari tanggal ${prev.d}, ${prev.w} ${prev.m} ${prev.y}!`); window.updateNomor(); } else { alert(`Sudah ditarik semua.`); }
        } else { alert(`Tidak ada rekaman di hari ${prev.d}, ${prev.m}.`); }
    } catch (err) { alert("Gagal terhubung ke Cloud."); }
};

window.loadMonthlySummary = async function(targetMonth) {
    window.isSummaryMode = true; 
    if (typeof window.resetDisplay === "function") window.resetDisplay(); 
    document.getElementById("momContainer").style.display = "block";
    document.getElementById("actionButtons").style.display = "none"; 
    document.getElementById("judul").innerText = `SUMMARY BULAN ${targetMonth.toUpperCase()} ${window.tahun || "2026"}`;
    document.getElementById("colDelete").style.display = "none";

    let statCont = document.getElementById("statContainer"); if(statCont) statCont.style.display = "flex";
    let tbody = document.querySelector("#momTable tbody"); tbody.innerHTML = "<tr><td colspan='14' style='color:blue; padding:20px; text-align:center;'>Sedang merangkum data...</td></tr>";

    try {
        const snapshot = await get(ref(db, `MOM/${window.tahun || "2026"}/${targetMonth}`));
        let saringanData = {}; let cOpen = 0, cProcess = 0, cClose = 0;

        if (snapshot.exists()) {
            const dataBulanIni = snapshot.val(); 
            urutanMingguLokal.forEach(minggu => {
                if(dataBulanIni[minggu]) {
                    urutanHariLokal.forEach(hari => {
                        if(dataBulanIni[minggu][hari]) {
                            dataBulanIni[minggu][hari].forEach(d => {
                                let matters = d[2] || ""; let problem = d[3] || "";
                                if (!matters) return;
                                let kunciUnik = matters.toString().toLowerCase().trim().replace(/[^a-z0-9]/g, '') + "_" + problem.toString().toLowerCase().trim().replace(/[^a-z0-9]/g, '');

                                let copyD = [...d];
                                if (d[0] !== "-") { 
                                    let valHari = d[1] || "";
                                    if (!valHari.includes("(")) {
                                        let tglOtomatis = window.hitungTanggalOtomatis(window.tahun || "2026", targetMonth, minggu, hari);
                                        if (tglOtomatis) {
                                            copyD[1] = `${hari}\n(${tglOtomatis})`;
                                            let splitTgl = tglOtomatis.split('/');
                                            copyD[4] = `${splitTgl[2]}-${splitTgl[1]}-${splitTgl[0]}`; 
                                        }
                                    }
                                }
                                saringanData[kunciUnik] = copyD; 
                            });
                        }
                    });
                }
            });

            tbody.innerHTML = ""; let dataTerbaru = Object.values(saringanData); let cTotal = dataTerbaru.length;

            if (cTotal === 0) {
                tbody.innerHTML = "<tr><td colspan='14' style='text-align:center; padding:20px;'>Tidak ada pekerjaan di bulan ini.</td></tr>";
                ["countOpen", "countProcess", "countClose", "countTotal"].forEach(id => { if(document.getElementById(id)) document.getElementById(id).innerText = 0; }); return;
            }

            dataTerbaru.forEach(d => {
                let statusVal = d[10] ? d[10].toLowerCase() : "";
                if (statusVal === "open") cOpen++; else if (statusVal === "process") cProcess++; else if (statusVal === "close") cClose++;
                let row = typeof window.tambah === "function" ? window.tambah(d[0] === "-") : tambah(d[0] === "-"); 
                
                isiDataKeBaris(row, d);
                
                row.querySelectorAll("input, textarea, select").forEach(el => { el.disabled = true; el.style.backgroundColor = "transparent"; el.style.color = "black"; });
                row.querySelector(".col-del").style.display = "none";
            });

            window.updateNomor();
            if(document.getElementById("countOpen")) document.getElementById("countOpen").innerText = cOpen;
            if(document.getElementById("countProcess")) document.getElementById("countProcess").innerText = cProcess;
            if(document.getElementById("countClose")) document.getElementById("countClose").innerText = cClose;
            if(document.getElementById("countTotal")) document.getElementById("countTotal").innerText = cTotal;
        } else {
            tbody.innerHTML = "<tr><td colspan='14' style='text-align:center; padding:20px;'>Belum ada data tersimpan.</td></tr>";
            ["countOpen", "countProcess", "countClose", "countTotal"].forEach(id => { if(document.getElementById(id)) document.getElementById(id).innerText = 0; });
        }
    } catch (error) { tbody.innerHTML = `<tr><td colspan='14' style='color:red;'>Error Asli: <b>${error.message}</b></td></tr>`; }
};

window.save = async function() {
    if(window.isSummaryMode) return; let data = [];
    document.querySelectorAll("#momTable tbody tr").forEach(r => {
        let rowData = []; r.querySelectorAll("input,textarea,select,span").forEach(el => rowData.push(el.value || el.innerText || ""));
        if (r.classList.contains("sub-row")) rowData[0] = "-";
        if ((rowData[2] ? rowData[2].trim() : "") !== "" || (rowData[3] ? rowData[3].trim() : "") !== "") data.push(rowData);
    });
    if (data.length === 0) data = null;
    try { 
        await set(ref(db, `MOM/${window.tahun}/${window.month}/${window.week}/${window.day}`), data); 
        if (data !== null) await set(ref(db, 'MOM_LastUpdate'), `${window.day}, ${window.month} ${window.tahun}`);
        alert(data === null ? `Data di hari ${window.day} dikosongkan!` : `Data Berhasil disimpan!`);
        window.loadHariIni();
    } catch (error) { alert("Gagal menyimpan data."); }
};

// ================= FITUR FOTO KEGIATAN =================
window.loadKegiatan = function() {
    try {
        window.isSummaryMode = false; if(typeof window.resetDisplay === "function") window.resetDisplay();
        document.getElementById("kegiatanContainer").style.display = "block";
        document.getElementById("formUploadFoto").style.display = "none";
        document.getElementById("btnToggleUpload").style.display = "inline-block";
        window.triggerFade("kegiatanContainer"); window.fetchFoto('Semua');
    } catch (error) { console.error(error.message); }
}

window.fetchFoto = async function(filterKategori = 'Semua') {
    try {
        document.querySelectorAll('#filterKegiatanContainer .stat-box').forEach(btn => {
            btn.style.opacity = "0.5"; btn.style.transform = "scale(0.95)"; btn.style.boxShadow = "none";
            if (btn.innerText.includes(filterKategori) || (filterKategori === 'Semua' && btn.innerText.includes('Semua'))) {
                btn.style.opacity = "1"; btn.style.transform = "scale(1.05)"; btn.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
            }
        });
        const gallery = document.getElementById("galleryContainer"); gallery.innerHTML = "<p>Memuat foto kegiatan...</p>";
        const snap = await get(ref(db, `Kegiatan`)); gallery.innerHTML = ""; let hasPhoto = false;

        if (snap.exists()) {
            const data = snap.val();
            ["Lapangan", "Meeting", "Bebas"].forEach(kat => {
                if (filterKategori !== 'Semua' && filterKategori !== kat) return;
                if (data[kat]) {
                    Object.keys(data[kat]).reverse().forEach(key => {
                        if(kat === 'Gallery') return; hasPhoto = true;
                        let imgData = data[kat][key]; let imgSrc = typeof imgData === 'string' ? imgData : imgData.image; 
                        let imgComment = typeof imgData === 'string' ? "" : (imgData.comment || "");
                        let safeComment = imgComment.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '<br>');

                        const card = document.createElement("div"); card.className = "photo-card";
                        card.innerHTML = `<div class="photo-img-wrapper"><img src="${imgSrc}" loading="lazy" onclick="window.bukaLightbox(this.src, '${safeComment}');"><span class="photo-category-badge">${kat}</span><button class="del-photo-btn" onclick="hapusFoto('${kat}', '${key}')">✖</button></div>${imgComment ? `<div class="photo-comment">${imgComment.replace(/\n/g, '<br>')}</div>` : ''}`;
                        gallery.appendChild(card);
                    });
                }
            });
        } 
        if (!hasPhoto) gallery.innerHTML = `<p style='padding: 20px;'>Belum ada foto.</p>`;
    } catch (err) { console.error(err); }
}

window.uploadFoto = function() {
    const files = document.getElementById("fotoInput").files;
    const kategori = document.getElementById("kategoriFoto").value; const komentar = document.getElementById("fotoKomentar").value; 
    if (files.length === 0) { alert("Pilih foto terlebih dahulu!"); return; }

    const btnUpload = document.querySelector("#formUploadFoto button.add-btn");
    const btnOriginalText = btnUpload.innerText; btnUpload.innerText = "⏳ Uploading..."; btnUpload.disabled = true;

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image(); img.src = e.target.result;
            img.onload = async function() {
                const canvas = document.createElement("canvas");
                const scaleSize = 1000 / img.width; canvas.width = 1000; canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext("2d"); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                try {
                    await push(ref(db, `Kegiatan/${kategori}`), { image: canvas.toDataURL("image/jpeg", 0.75), comment: komentar });
                    window.toggleUploadForm(); window.fetchFoto('Semua'); 
                } catch (err) { alert("Gagal upload foto."); } finally { btnUpload.innerText = btnOriginalText; btnUpload.disabled = false; }
            }
        }
        reader.readAsDataURL(file);
    });
}

window.hapusFoto = async function(kategori, key) {
    if(event) event.stopPropagation();
    if (confirm(`Yakin hapus foto ${kategori}?`)) {
        try { await remove(ref(db, `Kegiatan/${kategori}/${key}`)); window.fetchFoto('Semua'); } catch(err) { alert("Gagal hapus."); }
    }
}
