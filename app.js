// ================= SIMPAN KE CLOUD (SUPPORT MULTI ROW PER MATTERS) =================
window.simpanKeCloud = async function() {
    if (isSummaryMode) {
        alert("Tidak bisa menyimpan dalam mode Global Summary. Kembali ke mode harian terlebih dahulu.");
        return;
    }

    let rows = document.querySelectorAll("#momTable tbody tr");
    let dataToSave = [];

    rows.forEach(row => {
        if (row.style.display === "none") return;
        
        let matters = row.querySelector(".col-matters textarea")?.value.trim();
        if (!matters) return;

        let data = {
            matters: matters,
            hari: row.querySelector(".col-hari input")?.value || "",
            problem: row.querySelector(".col-problem textarea")?.value || "",
            tanggal: row.querySelector(".col-tanggal input")?.value || "",
            pic: row.querySelector(".col-pic input")?.value || "",
            epc: row.querySelector(".col-epc input")?.value || "",
            due: row.querySelector(".col-due input")?.value || "",
            done: row.querySelector(".col-done input")?.value || "",
            status: row.querySelector(".col-status select")?.value || "",
            remarks: row.querySelector(".col-remarks textarea")?.value || "",
            timestamp: new Date().toISOString(),
            tahun: tahun,
            bulan: month,
            minggu: week,
            hariNama: day
        };

        dataToSave.push(data);
    });

    if (dataToSave.length === 0) {
        alert("Tidak ada data yang valid untuk disimpan (Matters harus diisi).");
        return;
    }

    try {
        const querySnapshot = await getDocs(collection(db, "mom"));
        let existingMap = new Map();

        querySnapshot.forEach(docSnap => {
            let mattersExist = docSnap.data().matters?.toLowerCase().trim();
            if (mattersExist) {
                existingMap.set(mattersExist, docSnap.id);
            }
        });

        for (let data of dataToSave) {
            let key = data.matters.toLowerCase().trim();

            if (existingMap.has(key)) {
                let docId = existingMap.get(key);
                const docRef = doc(db, "mom", docId);
                const docSnap = await getDoc(docRef);
                let oldData = docSnap.data();

                let history = oldData.history || [];
                history.push(data);

                await updateDoc(docRef, { history: history });

                console.log(`Merged: ${data.matters}`);
            } else {
                await addDoc(collection(db, "mom"), {
                    matters: data.matters,
                    history: [data]
                });

                console.log(`Added new matters: ${data.matters}`);
            }
        }

        alert(`Berhasil menyimpan ${dataToSave.length} data (multi row dalam 1 matters).`);

        if (typeof window.loadHariIni === 'function') window.loadHariIni();

    } catch (error) {
        console.error("Error menyimpan data: ", error);
        alert("Gagal menyimpan ke Cloud. Periksa koneksi dan izin database.");
    }
};


// ================= LOAD DATA KE TABEL =================
window.loadHariIni = async function() {
    let tbody = document.querySelector("#momTable tbody");
    tbody.innerHTML = "";

    try {
        const querySnapshot = await getDocs(collection(db, "mom"));

        querySnapshot.forEach(docSnap => {
            let docData = docSnap.data();
            let matters = docData.matters;

            let history = docData.history || [];

            history.forEach(item => {
                let row = document.createElement("tr");

                row.innerHTML = `
                    <td class="col-matters"><textarea>${matters}</textarea></td>
                    <td class="col-hari"><input value="${item.hari || ""}"></td>
                    <td class="col-problem"><textarea>${item.problem || ""}</textarea></td>
                    <td class="col-tanggal"><input value="${item.tanggal || ""}"></td>
                    <td class="col-pic"><input value="${item.pic || ""}"></td>
                    <td class="col-epc"><input value="${item.epc || ""}"></td>
                    <td class="col-due"><input value="${item.due || ""}"></td>
                    <td class="col-done"><input value="${item.done || ""}"></td>
                    <td class="col-status">
                        <select>
                            <option ${item.status === "Open" ? "selected" : ""}>Open</option>
                            <option ${item.status === "Progress" ? "selected" : ""}>Progress</option>
                            <option ${item.status === "Done" ? "selected" : ""}>Done</option>
                        </select>
                    </td>
                    <td class="col-remarks"><textarea>${item.remarks || ""}</textarea></td>
                `;

                tbody.appendChild(row);
            });
        });

    } catch (error) {
        console.error("Error load data:", error);
    }
};