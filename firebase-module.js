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
export const auth = getAuth(app); 

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
            if (modal && txt) {
                txt.innerText = lastDate;
                modal.style.display = "flex";
            }
        }).catch(err => console.error(err));
        
        // Memuat data otomatis saat login berhasil
        if(typeof loadHariIni === "function") loadHariIni();
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

window.getHariSebelumnya = function(y, m, w, d) {
    let yIdx = parseInt(y); let mIdx = urutanBulanLokal.indexOf(m); let wIdx = urutanMingguLokal.indexOf(w); let dIdx = urutanHariLokal.indexOf(d);
    dIdx--; 
    if (dIdx < 0) {
        dIdx = 6; wIdx--; // 6 karena sekarang sampai Minggu
        if (wIdx < 0) { wIdx = 4; mIdx--; if (mIdx < 0) { mIdx = 11; yIdx--; } } 
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
            currentSnap.val().forEach(d => {
                let row = typeof window.tambah === "function" ? window.tambah(d[0] === "-") : tambah(d[0] === "-"); 
                
                // PENGISIAN DATA AMAN TANPA LOOPING INDEKS
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
                row.querySelector(".col-remarks textarea").value = d[11] || ""; // REMARKS AMAN DI NOMOR 11
                
                if(typeof window.setStatus === "function") window.setStatus(row.querySelector("select"));
                row.querySelectorAll("textarea").forEach(ta => autoHeight(ta));
            });
        } else {
            if(typeof window.tambah === "function") window.tambah(); else tambah();
        }
        window.updateNomor();
    } catch (error) { tbody.innerHTML = "<tr><td colspan='13' style='color:red;'>Gagal memuat data MOM.</td></tr>"; }
};

window.tarikDataKemarin = async function() {
    let prev = window.getHariSebelumnya(window.tahun, window.month, window.week, window.day);
    if (parseInt(prev.y) < 2025) { alert("Tidak ada data sebelum tahun 2025."); return; }
    try {
        const snap = await get(child(ref(db), `MOM/${prev.y}/${prev.m}/${prev.w}/${prev.d}`));
        if (snap.exists()) {
            let groups = parseGroups(snap.val()); let hasCarry = false;
            let existingKeys = [];
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
                            row.querySelector(".col-remarks textarea").value = d[11] || "";
                            
                            if(typeof window.setStatus === "function") window.setStatus(row.querySelector("select")); 
                            row.querySelectorAll("textarea").forEach(ta => autoHeight(ta));
                        });
                    }
                }
            });
            if (hasCarry) { alert(`Tugas ditarik dari hari ${prev.d}!`); window.updateNomor(); } else { alert(`Sudah ditarik semua.`); }
        } else { alert(`Tidak ada rekaman di hari ${prev.d}.`); }
    } catch (err) { alert("Gagal terhubung ke Cloud."); }
};

window.loadMonthlySummary = async function(targetMonth) {
    window.isSummaryMode = true; 
    if (typeof window.resetDisplay === "function") window.resetDisplay(); 
    document.getElementById("momContainer").style.display = "block";
    document.getElementById("actionButtons").style.display = "none"; 
    document.getElementById("judul").innerText = `SUMMARY BULAN ${targetMonth.toUpperCase()} ${window.tahun || "2026"}`;
    document.getElementById("colDelete").style.display = "none";

    let statCont = document.getElementById("statContainer");
    if(statCont) statCont.style.display = "flex";

    let tbody = document.querySelector("#momTable tbody");
    tbody.innerHTML = "<tr><td colspan='13' style='color:blue; padding:20px; text-align:center;'>Sedang merangkum data...</td></tr>";

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
                tbody.innerHTML = "<tr><td colspan='13' style='text-align:center; padding:20px;'>Tidak ada pekerjaan di bulan ini.</td></tr>";
                ["countOpen", "countProcess", "countClose", "countTotal"].forEach(id => { if(document.getElementById(id)) document.getElementById(id).innerText = 0; });
                return;
            }

            dataTerbaru.forEach(d => {
                let statusVal = d[10] ? d[10].toLowerCase() : "";
                if (statusVal === "open") cOpen++; else if (statusVal === "process") cProcess++; else if (statusVal === "close") cClose++;
                let row = typeof window.tambah === "function" ? window.tambah(d[0] === "-") : tambah(d[0] === "-"); 
                
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
                row.querySelector(".col-remarks textarea").value = d[11] || "";
                
                if (typeof window.setStatus === "function") window.setStatus(row.querySelector("select"));
                row.querySelectorAll("input, textarea, select").forEach(el => { el.disabled = true; el.style.backgroundColor = "transparent"; el.style.color = "black"; });
                row.querySelector(".col-del").style.display = "none";
            });

            window.updateNomor();
            if(document.getElementById("countOpen")) document.getElementById("countOpen").innerText = cOpen;
            if(document.getElementById("countProcess")) document.getElementById("countProcess").innerText = cProcess;
            if(document.getElementById("countClose")) document.getElementById("countClose").innerText = cClose;
            if(document.getElementById("countTotal")) document.getElementById("countTotal").innerText = cTotal;
        } else {
            tbody.innerHTML = "<tr><td colspan='13' style='text-align:center; padding:20px;'>Belum ada data tersimpan.</td></tr>";
            ["countOpen", "countProcess", "countClose", "countTotal"].forEach(id => { if(document.getElementById(id)) document.getElementById(id).innerText = 0; });
        }
    } catch (error) { tbody.innerHTML = `<tr><td colspan='13' style='color:red;'>Error Asli: <b>${error.message}</b></td></tr>`; }
};

window.save = async function() {
    if(window.isSummaryMode) return;
    let data = [];
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
