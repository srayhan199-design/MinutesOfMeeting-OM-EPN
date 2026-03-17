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
const db = getDatabase(app);
const auth = getAuth(app); // Inisialisasi Auth

// ================= SISTEM LOGIN & LOGOUT =================
// Cek otomatis apakah user sedang login atau belum
onAuthStateChanged(auth, (user) => {
    const loginScreen = document.getElementById("loginScreen");
    const toolbar = document.querySelector(".toolbar");
    const mainApp = document.querySelector(".main");

    if (user) {
        // Jika sudah login: Sembunyikan kotak login, tampilkan aplikasi
        if(loginScreen) loginScreen.style.display = "none";
        if(toolbar) toolbar.style.display = "flex";
        if(mainApp) mainApp.style.display = "flex";
    } else {
        // Jika belum login: Tampilkan kotak login, sembunyikan aplikasi
        if(loginScreen) loginScreen.style.display = "flex";
        if(toolbar) toolbar.style.display = "none";
        if(mainApp) mainApp.style.display = "none";
    }
});

// Fungsi tombol Login dipencet
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
            // Berhasil login
            errorText.style.display = "none";
            btnLogin.innerText = "Login";
            document.getElementById("emailInput").value = "";
            document.getElementById("passwordInput").value = "";
        })
        .catch((error) => {
            // Gagal login
            errorText.innerText = "Login gagal! Cek kembali email & password.";
            errorText.style.display = "block";
            btnLogin.innerText = "Login";
        });
};

// Fungsi tombol Logout dipencet
window.prosesLogout = function() {
    if(confirm("Apakah Anda yakin ingin keluar dari sistem?")) {
        signOut(auth).then(() => {
            alert("Berhasil Logout!");
            home(); // Reset tampilan ke home
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
        const currentSnap = await get(child(ref(db), `MOM/${tahun}/${month}/${week}/${day}`));
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
    let prev = window.getHariSebelumnya(tahun, month, week, day);
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

window.loadSummaryGlobal = async function() {
    isSummaryMode = true; resetDisplay();
    document.getElementById("momContainer").style.display = "block";
    document.getElementById("statContainer").style.display = "flex";
    triggerFade("momContainer");
    document.getElementById("actionButtons").style.display = "none"; 
    document.getElementById("colDelete").style.display = "table-cell"; 
    document.getElementById("backToDayBtn").onclick = home; 
    document.getElementById("judul").innerText = "Global Summary (Semua Tahun)";

    let tbody = document.querySelector("#momTable tbody");
    tbody.innerHTML = "<tr><td colspan='13' style='color:blue; padding:20px;'>Scanning Database 2025-2035...</td></tr>";

    try {
        const snapshot = await get(ref(db, "MOM"));
        if (snapshot.exists()) {
            tbody.innerHTML = "";
            const allData = snapshot.val();
            let uniqueGroups = new Map(); 
            
            for (let thn = 2025; thn <= 2035; thn++) {
                let tKey = thn.toString();
                if (allData[tKey]) {
                    urutanBulan.forEach(bln => {
                        if (allData[tKey][bln]) {
                            ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"].forEach(mgg => {
                                if (allData[tKey][bln][mgg]) {
                                    urutanHari.forEach(hr => {
                                        if (allData[tKey][bln][mgg][hr]) {
                                            let rawData = allData[tKey][bln][mgg][hr];
                                            let infoAsal = `${tKey}-${bln.substring(0,3)}-${mgg.split(' ')[1]}- ${hr}`;

                                            let groups = parseGroups(rawData);
                                            groups.forEach(g => {
                                                g.items.forEach(d => {
                                                    d.infoAsal = infoAsal;
                                                    d.pathTahun = tKey; d.pathBulan = bln; d.pathMinggu = mgg; d.pathHari = hr;
                                                });
                                                uniqueGroups.set(g.key, g);
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            }

            let cOpen = 0, cProcess = 0, cClose = 0;
            let hasData = false;

            for (let g of uniqueGroups.values()) {
                g.items.forEach(d => {
                    if (!d[2] || d[2].toString().trim().length < 2) return; 
                    hasData = true;

                    let sVal = d[10] || ""; let agingVal = d[9] || ""; let agingColor = "#495057";
                    if (d[7] && parseInt(agingVal) < 0 && sVal !== "close") { agingColor = "red"; }
                    if(sVal === "open") cOpen++; else if(sVal === "process") cProcess++; else if(sVal === "close") cClose++;

                    let isSub = (d[0] === "-");
                    let rowClass = isSub ? "sub-row" : "";
                    let row = tbody.insertRow();
                    row.className = rowClass;
                    
                    let matterEncoded = encodeURIComponent(d[2] || '');
                    let problemEncoded = encodeURIComponent(d[3] || '');

                    row.innerHTML = `
                        <td class="col-no"><div style="font-weight:bold; font-size:16px;">${d[0] || ''}</div></td>
                        <td class="col-hari"><div style="padding:8px; font-weight:bold;">${d.pathBulan} - ${d.pathMinggu} - ${d.pathHari}</div></td>
                        <td class="col-matters" style="text-align: left;"><div style="padding:8px;">${(d[2]||'').replace(/\n/g, '<br>')}</div></td>
                        <td class="col-problem" style="text-align: left;"><div style="padding:8px;">${(d[3]||'').replace(/\n/g, '<br>')}</div></td>
                        <td class="col-tanggal"><div style="padding:8px; font-weight:bold; color:#2c3e50;">${d.infoAsal}</div></td>
                        <td class="col-pic"><div style="padding:8px;">${d[5] || ''}</div></td>
                        <td class="col-epc"><div style="padding:8px;">${d[6] || ''}</div></td>
                        <td class="col-due"><div style="padding:8px;">${d[7] || ''}</div></td>
                        <td class="col-done"><div style="padding:8px;">${d[8] || ''}</div></td>
                        <td class="col-aging"><div style="padding:8px; font-weight:bold; color:${agingColor};">${agingVal}</div></td>
                        <td class="col-status status-${sVal}"><div style="padding:8px; font-weight:bold; color:${sVal==='process'?'black':'white'}; text-transform:uppercase;">${sVal}</div></td>
                        <td class="col-remarks" style="text-align: left;"><div style="padding:8px;">${(d[11]||'').replace(/\n/g, '<br>')}</div></td>
                        <td class="col-del" style="white-space:nowrap;">
                            <button onclick="hapusBarisGlobal(this)" data-t="${d.pathTahun}" data-b="${d.pathBulan}" data-m="${d.pathMinggu}" data-h="${d.pathHari}" data-matters="${matterEncoded}" data-problem="${problemEncoded}" style="color:red; background:none; border:none; cursor:pointer; font-weight:bold; font-size:18px;" title="Hapus Data Ini Secara Permanen dari Database">✖</button>
                        </td>
                    `;
                });
            }
            document.getElementById("countOpen").innerText = cOpen; document.getElementById("countProcess").innerText = cProcess; document.getElementById("countClose").innerText = cClose;
            updateNomor(); 
            if (!hasData) tbody.innerHTML = "<tr><td colspan='13' style='padding:20px;'>Data Tidak Ditemukan.</td></tr>";
        } else { tbody.innerHTML = "<tr><td colspan='13' style='padding:20px;'>Data Tidak Ditemukan.</td></tr>"; }
    } catch (e) { console.error(e); tbody.innerHTML = "<tr><td colspan='13' style='color:red;'>Gagal memuat Global Summary.</td></tr>"; }
};

window.hapusBarisGlobal = async function(btn) {
    let t = btn.getAttribute('data-t'); let b = btn.getAttribute('data-b'); let m = btn.getAttribute('data-m'); let h = btn.getAttribute('data-h');
    let mattersStr = decodeURIComponent(btn.getAttribute('data-matters'));
    let problemStr = decodeURIComponent(btn.getAttribute('data-problem'));

    if (!confirm(`Hati-hati! Apakah Anda yakin ingin menghapus data ini secara PERMANEN dari tanggal ${t}-${b}-${m}-${h}?`)) return;

    let row = btn.closest("tr");
    row.style.opacity = "0.5";
    
    try {
        let path = `MOM/${t}/${b}/${m}/${h}`;
        let snap = await get(ref(db, path));
        
        if (snap.exists()) {
            let dataArray = snap.val();
            let newData = dataArray.filter(d => { let isMatch = (d[2] || "") === mattersStr && (d[3] || "") === problemStr; return !isMatch; });
            if (newData.length === 0) newData = null; 

            await set(ref(db, path), newData);
            row.remove(); updateNomor();
            alert("Data berhasil dihapus permanen dari Cloud!");
        } else { alert("Data tidak ditemukan di database (Mungkin sudah terhapus sebelumnya)."); row.remove(); }
    } catch (err) { console.error(err); alert("Gagal menghapus data dari server."); row.style.opacity = "1"; }
};

window.save = async function() {
    if(isSummaryMode) return;
    let data = [];
    
    document.querySelectorAll("#momTable tbody tr").forEach(r => {
        let rowData = [];
        r.querySelectorAll("input,textarea,select,span").forEach(el => rowData.push(el.value || el.innerText || ""));
        
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
        await set(ref(db, `MOM/${tahun}/${month}/${week}/${day}`), data); 
        
        if (data === null) {
            alert(`Semua data di hari ${day} berhasil dikosongkan dari Cloud!`);
        } else {
            alert(`Data Berhasil disimpan di folder ${tahun}! (Baris kosong otomatis diabaikan)`);
        }
        
        loadHariIni();
        
    } catch (error) { alert("Gagal menyimpan data MOM."); console.error(error); }
};

window.loadKegiatan = function() {
    isSummaryMode = false; resetDisplay();
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
