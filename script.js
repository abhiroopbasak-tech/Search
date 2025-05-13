let originalData = [];
let headers = ["Anno", "Vol.", "Carta", "Nome", "Categoria", "Titolo categoria", "Sottocategoria"];

async function loadTSV() {
  const response = await fetch("data/dataset.tsv");
  const text = await response.text();

  const rows = text.split(/\r?\n/).filter(line => line.trim());
  const rawHeaders = rows[0].split("\t");
  const dataRows = rows.slice(1).map(row => row.split("\t"));

  const idx = (name) => rawHeaders.indexOf(name);

  originalData = dataRows.map(row => {
    return {
      "Anno": row[idx("Anno")],
      "Vol.": row[idx("Vol.")],
      "Carta": [row[idx("Carta-nr")], row[idx("Carta-lett")]].filter(Boolean).join(""),
      "Nome": row[idx("Nome")],
      "Categoria": row[idx("Categoria")],
      "Titolo categoria": row[idx("Titolo categoria")],
      "Sottocategoria": [row[idx("Sottocategoria")], row[idx("Titolo sottocategoria")]].filter(Boolean).join(" - ")
    };
  });

  renderTable(originalData);
}

function renderTable(data) {
  const tableHeader = document.getElementById("tableHeader");
  const tableBody = document.getElementById("tableBody");
  tableHeader.innerHTML = "";
  tableBody.innerHTML = "";

  const headerRow = document.createElement("tr");
  headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    headerRow.appendChild(th);
  });
  tableHeader.appendChild(headerRow);

  data.forEach(row => {
    const tr = document.createElement("tr");
    headers.forEach(h => {
      const td = document.createElement("td");
      td.textContent = row[h] || "";
      tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  });
}

document.getElementById("multiSearchForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const filters = {};

  for (let [key, value] of formData.entries()) {
    if (value.trim()) filters[key] = value.trim().toLowerCase();
  }

  const filtered = originalData.filter(row =>
    Object.entries(filters).every(([field, val]) => {
      const cell = row[field]?.toLowerCase() || "";
      if (["Nome", "Titolo categoria"].includes(field)) {
        return cell.includes(val); // partial match for free-text fields
      } else {
        return cell === val; // exact match for structured fields
      }
    })
  );

  renderTable(filtered);
});

document.getElementById("resetBtn").addEventListener("click", () => {
  document.getElementById("multiSearchForm").reset();
  renderTable(originalData);
});

window.addEventListener("DOMContentLoaded", loadTSV);
