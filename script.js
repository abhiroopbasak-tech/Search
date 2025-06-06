let originalData = [];
let headers = ["Anno", "Vol.", "Carta", "Nome", "Categoria", "Titolo categoria", "Sottocategoria"];

function fillDropdown(id, field) {
  const select = document.getElementById(id);
  const uniqueValues = [...new Set(originalData.map(row => row[field]).filter(Boolean))].sort();
  uniqueValues.forEach(val => {
    const option = document.createElement("option");
    option.value = val;
    option.textContent = val;
    select.appendChild(option);
  });
}

async function loadTSV() {
  const response = await fetch("data/dataset.tsv");
  const text = await response.text();

  const rows = text.split(/\r?\n/).filter(line => line.trim());
  const rawHeaders = rows[0].split("\t");
  const dataRows = rows.slice(1).map(row => row.split("\t"));

  const idx = (name) => rawHeaders.indexOf(name);

  originalData = dataRows.map(row => {
    return {
      "Anno": (row[idx("Anno")] || "").toLowerCase(),
      "Vol.": (row[idx("Vol.")] || "").toLowerCase(),
      "Carta": [row[idx("Carta-nr")], row[idx("Carta-lett")]].filter(Boolean).join("").toLowerCase(),
      "Nome": (row[idx("Nome")] || "").toLowerCase(),
      "Categoria": (row[idx("Categoria")] || "").toLowerCase(),
      "Titolo categoria": (row[idx("Titolo categoria")] || "").toLowerCase(),
      "Sottocategoria": [row[idx("Sottocategoria")], row[idx("Titolo sottocategoria")]].filter(Boolean).join(" - ").toLowerCase()
    };
  });

  fillDropdown("filterVol", "Vol.");
  fillDropdown("filterCarta", "Carta");
  fillDropdown("filterCategoria", "Categoria");

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

// Build regex from search term (wildcards and phrases)
function buildRegex(searchTerm) {
  if (!searchTerm) return null;

  // Exact phrase search
  if (searchTerm.startsWith('"') && searchTerm.endsWith('"')) {
    const phrase = searchTerm.slice(1, -1).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return new RegExp(phrase, 'i');
  }

  // Wildcards: * -> .* , ? -> .?
  let regexPattern = searchTerm
    .replace(/[-\/\\^$+?.()|[\]{}]/g, '\\$&') // Escape regex special chars except * and ?
    .replace(/\\\*/g, '.*')                  // Already escaped *
    .replace(/\\\?/g, '.?');                 // Already escaped ?

  regexPattern = regexPattern.replace(/\*/g, '.*').replace(/\?/g, '.?');

  return new RegExp(regexPattern, 'i');
}

document.getElementById("multiSearchForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const filters = {};

  for (let [key, value] of formData.entries()) {
    if (value.trim()) filters[key] = value.trim().toLowerCase();
  }

  const fullTextTerm = document.getElementById("fullTextSearch").value.trim().toLowerCase();
  const fullTextRegex = buildRegex(fullTextTerm);

  const dropdownExactMatchFields = ["Vol.", "Carta", "Categoria"];

  let filtered = originalData.map(row => {
    let matchCount = 0;
    let matchesFields = true;

    for (const [field, val] of Object.entries(filters)) {
      const cell = (row[field] || "").toLowerCase();
      if (dropdownExactMatchFields.includes(field)) {
        if (cell !== val) {
          matchesFields = false;
          break;
        } else {
          matchCount++;
        }
      } else {
        const regex = buildRegex(val);
        if (!regex || !regex.test(cell)) {
          matchesFields = false;
          break;
        } else {
          matchCount++;
        }
      }
    }

    let matchesText = true;
    if (fullTextRegex) {
      matchesText = Object.values(row).some(v => fullTextRegex.test(v));
      if (matchesText) matchCount++;
    }

    return matchesFields && matchesText ? { ...row, __matchCount: matchCount } : null;
  }).filter(Boolean);

  // Sort by descending match count
  filtered.sort((a, b) => b.__matchCount - a.__matchCount);

  renderTable(filtered);
});

document.getElementById("resetBtn").addEventListener("click", () => {
  document.getElementById("multiSearchForm").reset();
  document.getElementById("fullTextSearch").value = "";
  renderTable(originalData);
});

window.addEventListener("DOMContentLoaded", loadTSV);
