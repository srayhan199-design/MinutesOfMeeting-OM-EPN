// ================= VARIABEL GLOBAL =================
let tahun = "2026";
let month = "";
let week = "";
let day = "";
let isSummaryMode = false;
let currentStatusFilter = 'all'; 

const urutanHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const urutanBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// ================= FITUR EXPORT KE EXCEL ==================
window.exportKeExcel = function() {
    if (typeof XLSX === 'undefined') {
        alert("Library Excel belum berhasil dimuat.");
        return;
    }

    let wb = XLSX.utils.book_new();
    let ws_data = [];

    let headers = [];
    document.querySelectorAll("#momTable thead th").forEach(th => {
        if (th.id !== "colDelete" && th.style.display !== "none") {
            headers.push(th.innerText);
        }
    });
    ws_data.push(headers);

    document.querySelectorAll("#momTable tbody tr").forEach(tr => {
        if (tr.style.display === "none") return;
        if (tr.cells.length <= 1) return;

        let rowData = [];
        tr.querySelectorAll("td").forEach(td => {
            if (td.classList.contains("col-del") || td.style.display === "none") return;

            let input = td.querySelector("input, textarea, select");
            rowData.push(input ? input.value : td.innerText);
        });

        if (rowData.length) ws_data.push(rowData);
    });

    let ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "Data");

    XLSX.writeFile(wb, isSummaryMode ? "Global.xlsx" : "Harian.xlsx");
}

// ================= TABLE =================
function updateNomor() {
    let idx = 1;
    document.querySelectorAll("#momTable tbody tr").forEach(r => {
        if (r.style.display === "none") return;
        let no = r.querySelector(".no");
        if (no) no.value = idx++;
    });
}

function tambah() {
    let tbody = document.querySelector("#momTable tbody");
    let row = document.createElement("tr");

    row.innerHTML = `
    <td><input class="no" readonly></td>
    <td><input class="cell-hari"></td>
    <td><textarea></textarea></td>
    <td><textarea></textarea></td>
    <td><input type="date"></td>
    <td><input></td>
    <td><input></td>
    <td><input type="date"></td>
    <td><input type="date"></td>
    <td><span></span></td>
    <td>
        <select>
            <option></option>
            <option value="open">Open</option>
            <option value="process">Process</option>
            <option value="close">Close</option>
        </select>
    </td>
    <td><textarea></textarea></td>
    <td class="col-del">
        <button onclick="hapusBaris(this)">✖</button>
    </td>
    `;

    tbody.appendChild(row);
    updateNomor();
    return row;
}

function hapusBaris(btn){
    btn.closest("tr").remove();
    updateNomor();
}

// ================= GLOBAL SUMMARY FIX =================
window.loadGlobalSummary = async function() {
    isSummaryMode = true;

    document.getElementById("momContainer").style.display = "block";
    document.getElementById("actionButtons").style.display = "none";
    document.getElementById("judul").innerText = "GLOBAL SUMMARY (NO DOUBLE)";

    document.getElementById("colDelete").style.display = "none";

    let tbody = document.querySelector("#momTable tbody");
    tbody.innerHTML = "";

    try {
        const querySnapshot = await getDocs(collection(db, "mom"));

        let mapData = new Map();

        querySnapshot.forEach(doc => {
            let d = doc.data();
            if (!d.matters) return;

            let key = d.matters.toLowerCase().trim();
            let time = d.timestamp ? new Date(d.timestamp).getTime() : 0;

            if (!mapData.has(key)) {
                mapData.set(key, d);
            } else {
                let old = mapData.get(key);
                let oldTime = old.timestamp ? new Date(old.timestamp).getTime() : 0;

                if (time > oldTime) {
                    mapData.set(key, d);
                }
            }
        });

        let finalData = Array.from(mapData.values());

        finalData.sort((a,b)=>{
            let ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            let tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return tb - ta;
        });

        finalData.forEach(d => {
            let row = tambah();

            row.cells[1].querySelector("input").value = d.hari || "";
            row.cells[2].querySelector("textarea").value = d.matters || "";
            row.cells[3].querySelector("textarea").value = d.problem || "";
            row.cells[4].querySelector("input").value = d.tanggal || "";
            row.cells[5].querySelector("input").value = d.pic || "";
            row.cells[6].querySelector("input").value = d.epc || "";
            row.cells[7].querySelector("input").value = d.due || "";
            row.cells[8].querySelector("input").value = d.done || "";
            row.cells[10].querySelector("select").value = d.status || "";
            row.cells[11].querySelector("textarea").value = d.remarks || "";

            // readonly (AMAN)
            row.querySelectorAll("input, textarea").forEach(el=>{
                el.setAttribute("readonly", true);
            });

            row.querySelectorAll("select").forEach(el=>{
                el.setAttribute("disabled", true);
            });

            row.querySelector(".col-del").style.display = "none";
        });

        updateNomor();

    } catch(e){
        console.error(e);
        alert("Gagal ambil data");
    }
};
