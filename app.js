 // ================= VARIABEL GLOBAL =================
window.tahun = "2026";
window.month = "";
window.week = "";
window.day = "";
window.isSummaryMode = false;
let currentStatusFilter = 'all'; 

const urutanHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const urutanBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// ================= OTAK KALENDER SUPER PINTAR =================
window.generateCalendar = function(tahun, bulan) {
    let gBulan = urutanBulan.indexOf(bulan);
    let gTahun = parseInt(tahun);
    if (gBulan === -1 || isNaN(gTahun)) return null;

    let jumlahHari = new Date(gTahun, gBulan + 1, 0).getDate();
    let rawWeeks = {};
    let currW = 1;

    for (let d = 1; d <= jumlahHari; d++) {
        let dayOfWeek = new Date(gTahun, gBulan, d).getDay(); 
        
        if (dayOfWeek === 1 && d !== 1) {
            currW++;
        }
        
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            if (!rawWeeks[currW]) rawWeeks[currW] = {};
            let namaH = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"][dayOfWeek-1];
            rawWeeks[currW][namaH] = d;
        }
    }

    let finalWeeks = {};
    let idx = 1;
    for (let wKey in rawWeeks) {
        finalWeeks[idx] = rawWeeks[wKey];
        idx++;
    }
    return finalWeeks; 
};


// ================= VARIABEL UNDO HAPUS =================
let rowYangDihapus = null;
let posisiRow = null;
let timerUndo = null;

window.hapusBaris = function(btn) {
    if (confirm("Apakah Anda yakin akan menghapus baris ini?")) {
        let row = btn.closest('tr');
        let tbody = row.parentNode;
        rowYangDihapus = row;
        posisiRow = row.nextSibling;
        tbody.removeChild(row);
        window.updateNomor(); 

        let toast = document.getElementById("undoToast");
        if(toast) {
            toast.innerHTML = `Baris berhasil dihapus. <button class="undo-btn" onclick="batalHapus()">Batalkan</button>`;
            toast.classList.add("show");
        }

        clearTimeout(timerUndo);
        timerUndo = setTimeout(() => { if(toast) toast.classList.remove("show"); rowYangDihapus = null; }, 7000);
    }
}

window.batalHapus = function() {
    if (rowYangDihapus) {
        let tbody = document.querySelector("#momTable tbody");
        tbody.insertBefore(rowYangDihapus, posisiRow);
        window.updateNomor(); 
        let toast = document.getElementById("undoToast");
        if (toast) toast.classList.remove("show");
        rowYangDihapus = null;
        clearTimeout(timerUndo);
    }
}

window.hapusSemuaDataTabel = function() {
    if (confirm("🚨 PERINGATAN! Apakah Anda yakin ingin mengosongkan SEMUA baris di tabel ini?")) {
        let tbody = document.querySelector("#momTable tbody");
        tbody.innerHTML = ""; 
        window.tambah(); 
        window.updateNomor();
        alert("Semua baris telah dikosongkan. Jangan lupa klik 'Simpan ke Cloud' untuk memperbarui database.");
    }
}

// ================= UI HELPER =================
window.bukaLightbox = function(src, komentar) {
    document.getElementById('lightbox').style.display = 'block';
    document.getElementById('lightboxImg').src = src;
    document.getElementById('lightboxCaption').innerHTML = komentar || '';
}
window.tutupLightbox = function() { document.getElementById('lightbox').style.display = 'none'; }

window.toggleUploadForm = function() {
    let form = document.getElementById("formUploadFoto");
    let btnToggle = document.getElementById("btnToggleUpload");
    if (form.style.display === "none" || form.style.display === "") {
        form.style.display = "flex"; btnToggle.style.display = "none"; 
    } else {
        form.style.display = "none"; btnToggle.style.display = "inline-block"; 
    }
}

window.toggleMonthList = function() {
    let container = document.getElementById("monthListContainer");
    container.style.display = (container.style.display === "block") ? "none" : "block";
}
window.gantiTahun = function() {
    window.tahun = document.getElementById("selectTahun").value;
    document.getElementById("btnYear").innerText = window.tahun; 
    window.home(); 
}
window.triggerFade = function(id) {
    let el = document.getElementById(id);
    if(!el) return; el.classList.remove("fade-in"); void el.offsetWidth; el.classList.add("fade-in");
}
window.autoHeight = function(el) { el.style.height = "auto"; el.style.height = (el.scrollHeight) + "px"; }

window.resetDisplay = function() {
    document.getElementById("homeText").style.display = "none";
    document.getElementById("weekMenu").style.display = "none";
    document.getElementById("dayMenu").style.display = "none";
    document.getElementById("momContainer").style.display = "none";
    document.getElementById("statContainer").style.display = "none";
    document.getElementById("kegiatanContainer").style.display = "none";
    document.getElementById("searchInput").value = "";
    currentStatusFilter = "all";
    document.getElementById("colDelete").style.display = "table-cell";
}

window.home = function() { 
    window.isSummaryMode = false; window.resetDisplay();
    document.getElementById("homeText").style.display = "block";
    document.querySelectorAll(".toolbar button").forEach(btn => btn.classList.remove("active-month"));
    window.triggerFade("homeText");
}

// ================= FILTER & SEARCH =================
window.cariData = function() { window.applyFilters(); }
window.filterGlobal = function(status) { currentStatusFilter = status; window.applyFilters(); }

window.applyFilters = function() {
    let keyword = document.getElementById("searchInput").value.toLowerCase();
    let trs = document.querySelectorAll("#momTable tbody tr");

    trs.forEach(r => {
        let sVal = "";
        let selectEl = r.querySelector("select");
        if (selectEl) { sVal = selectEl.value; } 
        else {
            let statusTd = r.querySelector(".col-status");
            if(statusTd) {
                if(statusTd.classList.contains("status-open")) sVal = "open";
                else if(statusTd.classList.contains("status-process")) sVal = "process";
                else if(statusTd.classList.contains("status-close")) sVal = "close";
            }
        }
        let matchStatus = (currentStatusFilter === 'all' || sVal === currentStatusFilter);
        let textContent = "";
        r.querySelectorAll("input, textarea, select").forEach(el => textContent += el.value.toLowerCase() + " ");
        r.querySelectorAll("div, span").forEach(el => textContent += el.innerText.toLowerCase() + " ");
        let matchSearch = textContent.includes(keyword);

        if (matchStatus && matchSearch) { r.style.display = "table-row"; } else { r.style.display = "none"; }
    });
    window.updateNomor();
}

// ================= CORE TABLE LOGIC =================
window.updateNomor = function() {
    let idx = 1;
    let trs = Array.from(document.querySelectorAll("#momTable tbody tr"));
    trs.forEach(r => { let colNo = r.querySelector(".col-no"); if (colNo) { colNo.style.display = "table-cell"; colNo.rowSpan = 1; } });
    let visibleTrs = trs.filter(r => r.style.display !== "none");

    for (let i = 0; i < visibleTrs.length; i++) {
        let r = visibleTrs[i];
        let colNo = r.querySelector(".col-no");
        if (!colNo) continue;

        if (r.classList.contains("sub-row")) {
            let prevMainIndex = i - 1;
            while(prevMainIndex >= 0 && visibleTrs[prevMainIndex].classList.contains("sub-row")) { prevMainIndex--; }

            if (prevMainIndex >= 0) {
                colNo.style.display = "none";
                let parentColNo = visibleTrs[prevMainIndex].querySelector(".col-no");
                parentColNo.rowSpan = parentColNo.rowSpan + 1;
            }
        } else {
            colNo.style.display = "table-cell"; colNo.rowSpan = 1;
            let noInput = colNo.querySelector(".no");
            if(noInput) { noInput.value = idx++; } else { let div = colNo.querySelector("div"); if(div) div.innerText = idx++; }
        }
    }
}

window.aging = function(el) {
    let row = el.closest("tr");
    let tglVal = row.cells[4].querySelector("input").value;      
    let dueVal = row.cells[7].querySelector("input").value;      
    let selesaiVal = row.cells[8].querySelector("input").value;  
    let statusVal = row.cells[10].querySelector("select").value; 
    let agingSpan = row.cells[9].querySelector("span");

    if (!tglVal && !dueVal) { agingSpan.innerText = ""; return; }
    let pembandingDate = selesaiVal ? new Date(selesaiVal) : new Date();
    pembandingDate.setHours(0,0,0,0);

    if (dueVal) {
        let dueDate = new Date(dueVal); dueDate.setHours(0,0,0,0);
        let diffDays = Math.floor((dueDate - pembandingDate) / (1000 * 60 * 60 * 24));
        agingSpan.innerText = diffDays;
        agingSpan.style.color = (diffDays < 0 && statusVal !== "close") ? "red" : "#495057";
    } else if (tglVal) {
        let startDate = new Date(tglVal); startDate.setHours(0,0,0,0);
        let diffDays = Math.floor((pembandingDate - startDate) / (1000 * 60 * 60 * 24));
        agingSpan.innerText = diffDays;
        agingSpan.style.color = "#495057";
    }
}

window.setStatus = function(s) {
    if(!s) return; s.parentElement.className = "col-status status-" + s.value; window.aging(s);
}

window.tambah = function(isSubRow = false, referenceRow = null) {
    let tbody = document.querySelector("#momTable tbody");
    let row = document.createElement("tr");
    if (isSubRow) row.classList.add("sub-row");

    // --- LOGIKA TANGGAL OTOMATIS (HANYA UNTUK KOLOM HARI KIRI) ---
    let tanggalAsli = window.hitungTanggalOtomatis(window.tahun, window.month, window.week, window.day);
    let teksHari = window.day || ""; 

    if (tanggalAsli && !isSubRow && !window.isSummaryMode) {
        teksHari = `${window.day}\n(${tanggalAsli})`; 
    }

    row.innerHTML = `
        <td class="col-no"><input class="no" readonly style="background:transparent; border:none; text-align:center; font-weight:bold; font-size:16px; width:100%;"></td>
        <td class="col-hari"><textarea class="cell-hari" readonly style="background:transparent; border:none; text-align:center; width:100%; resize:none; overflow:hidden;" oninput="autoHeight(this)">${teksHari}</textarea></td>
        <td class="col-matters"><textarea oninput="autoHeight(this)"></textarea></td>
        <td class="col-problem"><textarea oninput="autoHeight(this)"></textarea></td>
        <td class="col-tanggal"><input type="date" onchange="aging(this)"></td> <td class="col-pic"><input></td>
        <td class="col-epc"><input></td>
        <td class="col-due"><input type="date" onchange="aging(this)"></td>
        <td class="col-done"><input type="date" onchange="aging(this)"></td>
        <td class="col-aging"><span style="font-weight:bold; color:#495057;"></span></td>
        <td class="col-status"><select onchange="setStatus(this)"><option></option><option value="open">Open</option><option value="process">Process</option><option value="close">Close</option></select></td>
        <td class="col-remarks"><textarea oninput="autoHeight(this)"></textarea></td>
        <td class="col-del" style="white-space:nowrap;">
            <button onclick="tambahSub(this)" style="color:#2ecc71; background:none; border:none; cursor:pointer; font-weight:bold; font-size:18px; margin-right:5px;">➕</button>
            <button onclick="hapusBaris(this)" style="color:red; background:none; border:none; cursor:pointer; font-weight:bold; font-size:18px;">✖</button>
        </td>
    `;
    if (referenceRow) { tbody.insertBefore(row, referenceRow.nextSibling); } 
    else { tbody.appendChild(row); }
    window.updateNomor(); 
    
    let ta = row.querySelector('.col-hari textarea');
    if(ta) window.autoHeight(ta);
    
    return row;
}

window.tambahSub = function(btn) { let parentTr = btn.closest('tr'); window.tambah(true, parentTr); }

// ================= NAVIGASI MENU (BACA KALENDER) =================
window.pilihBulan = function(b, e) { 
    window.isSummaryMode = false; 
    window.month = b; 
    window.resetDisplay(); 
    
    const weekMenu = document.getElementById("weekMenu");
    weekMenu.style.display = "block"; 
    
    weekMenu.innerHTML = `
        <h2 style="color:#2c3e50; margin-top:0;">Pilih Minggu</h2>
        <hr style="border:0; border-top:1px solid #eee; margin-bottom:20px;">
    `;

    let kalender = window.generateCalendar(window.tahun, window.month);
    let maxMinggu = kalender ? Object.keys(kalender).length : 4; 
    
    for (let w = 1; w <= maxMinggu; w++) {
        let btn = document.createElement("button");
        btn.className = "weekBtn";
        btn.innerText = "Minggu " + w;
        btn.onclick = function() { window.pilihMinggu('Minggu ' + w); };
        weekMenu.appendChild(btn);
    }

    window.triggerFade("weekMenu"); 
    document.querySelectorAll(".toolbar button").forEach(btn => btn.classList.remove("active-month")); 
    e.classList.add("active-month"); 
    if(typeof window.loadMonthlySummary === "function") window.loadMonthlySummary(b); 
}

window.pilihMinggu = function(w) { 
    window.week = w; 
    document.getElementById("weekMenu").style.display="none"; 
    
    const dayMenu = document.getElementById("dayMenu");
    dayMenu.innerHTML = `
        <button class="weekBtn" style="background:#f8d7da; color:#721c24; border-color:#f5c6cb;" onclick="window.kembaliMinggu()">⬅ Kembali ke Minggu</button>
        <h2 style="color:#2c3e50;">Pilih Hari</h2>
        <hr style="border:0; border-top:1px solid #eee; margin-bottom:20px;">
    `;

    let kalender = window.generateCalendar(window.tahun, window.month);
    let angkaMingguTarget = parseInt(w.replace("Minggu ", ""));
    let mingguPilihan = kalender ? kalender[angkaMingguTarget] : null;

    if (mingguPilihan) {
        ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"].forEach(hari => {
            if (mingguPilihan[hari]) { 
                let btn = document.createElement("button");
                btn.className = "dayBtn";
                btn.innerText = `${hari} (${mingguPilihan[hari]})`; 
                btn.onclick = function() { window.pilihHari(hari); };
                dayMenu.appendChild(btn);
            }
        });
    }

    dayMenu.style.display="block"; 
    window.triggerFade("dayMenu"); 
}

window.pilihHari = function(h) { 
    window.day = h; window.isSummaryMode = false; 
    document.getElementById("dayMenu").style.display="none"; 
    document.getElementById("momContainer").style.display="block"; 
    window.triggerFade("momContainer"); 
    document.getElementById("actionButtons").style.display="flex"; 
    document.getElementById("colDelete").style.display="table-cell"; 
    document.getElementById("backToDayBtn").onclick = window.kembaliHari; 
    document.getElementById("judul").innerText = `MOM ${window.tahun} - ${window.month} - ${window.week} - ${window.day}`; 
    if (typeof window.loadHariIni === 'function') window.loadHariIni(); 
}

window.kembaliHari = function() { document.getElementById("momContainer").style.display="none"; document.getElementById("dayMenu").style.display="block"; window.triggerFade("dayMenu"); }
window.kembaliMinggu = function() { document.getElementById("dayMenu").style.display="none"; document.getElementById("weekMenu").style.display="block"; window.triggerFade("weekMenu"); }

// ================= FUNGSI HITUNG TANGGAL OTOMATIS =================
window.hitungTanggalOtomatis = function(tahun, bulan, minggu, hari) {
    let kalender = window.generateCalendar(tahun, bulan);
    if (!kalender || !minggu || !hari) return "";

    let angkaMingguTarget = parseInt(minggu.replace("Minggu ", ""));
    let mingguPilihan = kalender[angkaMingguTarget];

    if (!mingguPilihan || !mingguPilihan[hari]) return ""; 

    let gBulan = urutanBulan.indexOf(bulan);
    let gTahun = parseInt(tahun);
    let d = mingguPilihan[hari];

    let dd = String(d).padStart(2, '0');
    let mm = String(gBulan + 1).padStart(2, '0');
    return `${dd}/${mm}/${gTahun}`;
};

// ================= FITUR EXPORT KE PDF ==================
window.exportKePDF = function() {
    const jspdfLib = window.jspdf;
    if (!jspdfLib) {
        alert("Library PDF gagal dimuat! Pastikan koneksi internet lancar.");
        return;
    }

    const { jsPDF } = jspdfLib;
    const doc = new jsPDF('l', 'mm', 'a4');

    let judulText = document.getElementById("judul").innerText;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold"); 
    doc.text(judulText, 14, 15);

    let headers = [];
    document.querySelectorAll("#momTable thead th").forEach(th => {
        if (th.id !== "colDelete" && th.style.display !== "none") {
            headers.push(th.innerText);
        }
    });

    let rows = [];
    document.querySelectorAll("#momTable tbody tr").forEach(tr => {
        if (tr.style.display === "none") return;

        let rowData = [];
        tr.querySelectorAll("td").forEach(td => {
            if(td.classList.contains("col-del") || td.style.display === "none") return;

            let val = "";
            let input = td.querySelector("input, textarea, select");
            if (input) { val = input.value; } else { val = td.innerText; }
            rowData.push(val);
        });

        if (rowData.length > 0) rows.push(rowData);
    });

    doc.autoTable({
        head: [headers],
        body: rows,
        startY: 25,
        theme: 'grid', 
        styles: { 
            fontSize: 7, 
            cellPadding: 2,
            valign: 'middle',
            fontStyle: 'bold',      
            lineWidth: 0.3,         
            lineColor: [0, 0, 0]    
        },
        headStyles: { 
            fillColor: [44, 62, 80], 
            textColor: 255, 
            halign: 'center',
            fontStyle: 'bold',      
            lineWidth: 0.3,         
            lineColor: [0, 0, 0]    
        },
        columnStyles: { 
            0: { cellWidth: 10 }, 
            1: { cellWidth: 26 }    
        }
    });

    let hariIni = new Date();
    let dd = String(hariIni.getDate()).padStart(2, '0');
    let mm = String(hariIni.getMonth() + 1).padStart(2, '0'); 
    let yyyy = hariIni.getFullYear();
    let formatTanggal = dd + '-' + mm + '-' + yyyy; 

    let namaFile = window.isSummaryMode ? 
        `MOM_Summary_${window.month || 'Bulan'}_(${formatTanggal}).pdf` : 
        `MOM_Harian_${window.day || ''}_(${formatTanggal}).pdf`;

    doc.save(namaFile);
};

// ================= FITUR EXPORT KE EXCEL ==================
window.exportKeExcel = function() {
    let table = document.getElementById("momTable");
    let clone = table.cloneNode(true); 
    let oriRows = table.querySelectorAll("tr");
    let cloneRows = clone.querySelectorAll("tr");

    for (let i = 0; i < oriRows.length; i++) {
        let oriTr = oriRows[i];
        let cloneTr = cloneRows[i];

        if (oriTr.style.display === "none") {
            cloneTr.parentNode.removeChild(cloneTr);
            continue;
        }

        let oriCells = oriTr.querySelectorAll("th, td");
        let cloneCells = cloneTr.querySelectorAll("th, td");

        for (let j = 0; j < oriCells.length; j++) {
            let oriCell = oriCells[j];
            let cloneCell = cloneCells[j];

            if (oriCell.id === "colDelete" || oriCell.classList.contains("col-del") || oriCell.style.display === "none") {
                cloneCell.parentNode.removeChild(cloneCell);
                continue;
            }

            let input = oriCell.querySelector("input, textarea, select");
            if (input) {
                if (input.tagName === "SELECT") {
                    let teksStatus = input.options[input.selectedIndex] ? input.options[input.selectedIndex].text : "";
                    cloneCell.innerText = teksStatus;

                    if(teksStatus.toLowerCase() === "open") cloneCell.style.backgroundColor = "#e74c3c"; 
                    if(teksStatus.toLowerCase() === "process") cloneCell.style.backgroundColor = "#f1c40f"; 
                    if(teksStatus.toLowerCase() === "close") cloneCell.style.backgroundColor = "#2ecc71"; 

                    cloneCell.style.color = (teksStatus.toLowerCase() === "process") ? "#000" : "#fff"; 
                } else {
                    cloneCell.innerText = input.value;
                }
            } else if (oriCell.querySelector("span")) {
                cloneCell.innerText = oriCell.querySelector("span").innerText;
            }

            cloneCell.style.border = "1px solid #000000";
            cloneCell.style.padding = "5px";
            cloneCell.style.verticalAlign = "top";
            cloneCell.style.whiteSpace = "pre-wrap"; 
        }
    }

    let htmlTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
        <meta charset="utf-8">
        <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th { background-color: #2c3e50; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #000000; padding: 8px;}
            td { border: 1px solid #000000; vertical-align: top; white-space: pre-wrap; }
        </style>
    </head>
    <body>
        <h2 style="text-align: center; color: #2c3e50;">${document.getElementById("judul").innerText}</h2>
        ${clone.outerHTML}
    </body>
    </html>`;

    let hariIni = new Date();
    let dd = String(hariIni.getDate()).padStart(2, '0');
    let mm = String(hariIni.getMonth() + 1).padStart(2, '0');
    let yyyy = hariIni.getFullYear();
    let formatTanggal = dd + '-' + mm + '-' + yyyy;

    let blob = new Blob([htmlTemplate], { type: 'application/vnd.ms-excel' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;

    a.download = window.isSummaryMode ? 
        `MOM_Summary_${window.month || 'Bulan'}_(${formatTanggal}).xls` : 
        `MOM_Harian_${window.day || ''}_(${formatTanggal}).xls`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

// ================= FITUR FOTO KEGIATAN =================
window.loadKegiatan = function() {
    try {
        window.isSummaryMode = false; 
        if(typeof window.resetDisplay === "function") window.resetDisplay();
        
        let kegCont = document.getElementById("kegiatanContainer");
        if(kegCont) kegCont.style.display = "block";
        
        let formUpload = document.getElementById("formUploadFoto");
        if(formUpload) formUpload.style.display = "none";
        
        let btnToggle = document.getElementById("btnToggleUpload");
        if(btnToggle) btnToggle.style.display = "inline-block";
        
        if(typeof window.triggerFade === "function") window.triggerFade("kegiatanContainer");
        if(typeof window.fetchFoto === "function") window.fetchFoto('Semua');
    } catch (error) { console.error(error.message); }
}

window.fetchFoto = async function(filterKategori = 'Semua') {
    try {
        const tombolFilters = document.querySelectorAll('#filterKegiatanContainer .stat-box');
        tombolFilters.forEach(btn => {
            btn.style.opacity = "0.5"; btn.style.transform = "scale(0.95)"; btn.style.boxShadow = "none";
            if (btn.innerText.includes(filterKategori) || (filterKategori === 'Semua' && btn.innerText.includes('Semua'))) {
                btn.style.opacity = "1"; btn.style.transform = "scale(1.05)"; btn.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
            }
        });

        const gallery = document.getElementById("galleryContainer");
        if(gallery) gallery.innerHTML = "<p>Memuat foto kegiatan...</p>";

        const snap = await get(ref(db, `Kegiatan`));
        if(gallery) gallery.innerHTML = ""; let hasPhoto = false;

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
                        let imgSrc = typeof imgData === 'string' ? imgData : imgData.image; 
                        let imgComment = typeof imgData === 'string' ? "" : (imgData.comment || "");
                        let safeComment = imgComment.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '<br>');

                        const card = document.createElement("div"); card.className = "photo-card";
                        card.innerHTML = `
                            <div class="photo-img-wrapper">
                                <img src="${imgSrc}" loading="lazy" onclick="if(typeof window.bukaLightbox === 'function') window.bukaLightbox(this.src, '${safeComment}');">
                                <span class="photo-category-badge">${kat}</span>
                                <button class="del-photo-btn" onclick="hapusFoto('${kat}', '${key}')">✖</button>
                            </div>
                            ${imgComment ? `<div class="photo-comment">${imgComment.replace(/\n/g, '<br>')}</div>` : ''}
                        `;
                        if(gallery) gallery.appendChild(card);
                    });
                }
            });
        } 
        if (!hasPhoto && gallery) { gallery.innerHTML = `<p style='padding: 20px;'>Belum ada foto kategori: <b>${filterKategori}</b>.</p>`; }
    } catch (err) { console.error(err); }
}

window.uploadFoto = function() {
    const files = document.getElementById("fotoInput").files;
    const kategori = document.getElementById("kategoriFoto").value; 
    const komentar = document.getElementById("fotoKomentar").value; 
    if (files.length === 0) { alert("Pilih foto terlebih dahulu!"); return; }

    const btnUpload = document.querySelector("#formUploadFoto button.add-btn");
    const btnOriginalText = btnUpload.innerText;
    btnUpload.innerText = "⏳ Uploading..."; btnUpload.disabled = true;

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
                    if(typeof window.toggleUploadForm === "function") window.toggleUploadForm(); 
                    window.fetchFoto('Semua'); 
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
