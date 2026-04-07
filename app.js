window.loadSummaryGlobal = async function() {
    isSummaryMode = true; 
    resetDisplay();

    document.getElementById("momContainer").style.display = "block";
    document.getElementById("statContainer").style.display = "flex";
    triggerFade("momContainer");

    document.getElementById("actionButtons").style.display = "none"; 
    document.getElementById("colDelete").style.display = "table-cell"; 
    document.getElementById("backToDayBtn").onclick = home; 
    document.getElementById("judul").innerText = "Global Summary (No Duplicate - Latest Only)";

    let tbody = document.querySelector("#momTable tbody");
    tbody.innerHTML = "<tr><td colspan='13'>Scanning database...</td></tr>";

    try {
        const snapshot = await get(ref(db, "MOM"));

        if (!snapshot.exists()) {
            tbody.innerHTML = "<tr><td colspan='13'>Data tidak ditemukan</td></tr>";
            return;
        }

        tbody.innerHTML = "";
        const allData = snapshot.val();

        let uniqueDataMap = {};

        // 🔥 LOOP SEMUA DATA
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
                                        let infoAsal = `${tKey}-${bln}-${mgg}-${hr}`;

                                        let groups = parseGroups(rawData);

                                        groups.forEach(g => {
                                            g.items.forEach(d => {

                                                let matters = (d[2] || "").toLowerCase().trim();
                                                let problem = (d[3] || "").toLowerCase().trim();

                                                if (!matters && !problem) return;

                                                // 🔑 KEY UNIK
                                                let key = matters + "|" + problem;

                                                // ✅ SIMPAN TERBARU (override)
                                                uniqueDataMap[key] = {
                                                    data: d,
                                                    infoAsal,
                                                    pathTahun: tKey,
                                                    pathBulan: bln,
                                                    pathMinggu: mgg,
                                                    pathHari: hr
                                                };
                                            });
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

        // 🔥 RENDER TANPA FILTER STATUS
        Object.values(uniqueDataMap).forEach(item => {

            let d = item.data;
            let sVal = d[10] || "";

            hasData = true;

            let agingVal = d[9] || "";
            let agingColor = "#495057";

            if (d[7] && parseInt(agingVal) < 0 && sVal !== "close") {
                agingColor = "red";
            }

            if (sVal === "open") cOpen++;
            else if (sVal === "process") cProcess++;
            else if (sVal === "close") cClose++;

            let row = tbody.insertRow();

            let matterEncoded = encodeURIComponent(d[2] || '');
            let problemEncoded = encodeURIComponent(d[3] || '');

            row.innerHTML = `
                <td>${d[0] || ''}</td>
                <td>${item.pathBulan} - ${item.pathMinggu} - ${item.pathHari}</td>
                <td>${(d[2]||'').replace(/\n/g, '<br>')}</td>
                <td>${(d[3]||'').replace(/\n/g, '<br>')}</td>
                <td>${item.infoAsal}</td>
                <td>${d[5] || ''}</td>
                <td>${d[6] || ''}</td>
                <td>${d[7] || ''}</td>
                <td>${d[8] || ''}</td>
                <td style="color:${agingColor}; font-weight:bold;">${agingVal}</td>
                <td style="font-weight:bold; text-transform:uppercase;">${sVal}</td>
                <td>${(d[11]||'').replace(/\n/g, '<br>')}</td>
                <td>
                    <button onclick="hapusBarisGlobal(this)"
                        data-t="${item.pathTahun}"
                        data-b="${item.pathBulan}"
                        data-m="${item.pathMinggu}"
                        data-h="${item.pathHari}"
                        data-matters="${matterEncoded}"
                        data-problem="${problemEncoded}">
                        ✖
                    </button>
                </td>
            `;
        });

        document.getElementById("countOpen").innerText = cOpen;
        document.getElementById("countProcess").innerText = cProcess;
        document.getElementById("countClose").innerText = cClose;

        updateNomor();

        if (!hasData) {
            tbody.innerHTML = "<tr><td colspan='13'>Tidak ada data</td></tr>";
        }

    } catch (e) {
        console.error(e);
        tbody.innerHTML = "<tr><td colspan='13' style='color:red;'>Gagal load data</td></tr>";
    }
};
