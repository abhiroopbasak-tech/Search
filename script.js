let allData = [];
let currentResults = [];  // This will store the data after the initial search
let headers = [];

async function loadTSV() {
  const response = await fetch("data/dataset.tsv");
  const text = await response.text();

  const rows = text.split(/\r?\n/).filter(line => line.trim() !== "");
  headers = rows[0].split("\t");
  allData = rows.slice(1).map(row => row.split("\t"));

  populateDropdown(headers);
  currentResults = allData;  // Initialize with full dataset
  renderTable(currentResults);  // Render full dataset initially
}

function populateDropdown(headers) {
  const select = document.getElementById("fieldSelect");
  const refineSelect = document.getElementById("refineFieldSelect");

  // Populate both main and refine dropdowns with field names
  headers.forEach(header => {
    const option = document.createElement("option");
    option.value = header;
    option.textContent = header;  // Keep field names in Italian
    select.appendChild(option);
    const refineOption = document.createElement("option");
    refineOption.value = header;
    refineOption.textContent = header;
    refineSelect.appendChild(refineOption);
  });
}

document.getElementById("searchForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const [field, query] = getSearchInput();
  if (!field || !query) return;

  // Search the full dataset
  const fieldIndex = headers.indexOf(field);
  currentResults = allData.filter(row => row[fieldIndex]?.toLowerCase().includes(query));
  renderTable(currentResults);  // Render filtered results
});

document.getElementById("refineBtn").addEventListener("click", function () {
  // Show refine search box when Refine is clicked
  document.getElementById("refineSearchBox").style.display = "block";
});

document.getElementById("refineSearchBtn").addEventListener("click", function () {
  const [field, query] = getRefineSearchInput();
  if (!field || !query) return;

  // Apply the refine search on currentResults (already filtered by the first search)
  const fieldIndex = headers.indexOf(field);
  currentResults = currentResults.filter(row => row[fieldIndex]?.toLowerCase().includes(query));

  // Render the refined results
  renderTable(currentResults);
});

document.getElementById("resetBtn").addEventListener("click", () => {
  currentResults = allData;  // Reset to full dataset
  renderTable(currentResults);  // Render the full dataset again
  document.getElementById("searchForm").reset();  // Clear the search inputs
  document.getElementById("refineSearchBox").style.display = "none";  // Hide refine search box
});

function getSearchInput() {
  const field = document.getElementById("fieldSelect").value;
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  return [field, query];
}

function getRefineSearchInput() {
  const field = document.getElementById("refineFieldSelect").value;
  const query = document.getElementById("refineSearchInput").value.trim().toLowerCase();
  return [field, query];
}

function renderTable(data) {
  const tableHeader = document.getElementById("tableHeader");
  const tableBody = document.getElementById("tableBody");
  tableHeader.innerHTML = "";
  tableBody.innerHTML = "";

  // Render header row
  const headerRow = document.createElement("tr");
  headers.forEach(header => {
    const th = document.createElement("th");
    th.textContent = header;
    headerRow.appendChild(th);
  });
  tableHeader.appendChild(headerRow);

  // Render data rows
  data.forEach(row => {
    const tr = document.createElement("tr");
    row.forEach(cell => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  });
}

window.addEventListener("DOMContentLoaded", loadTSV);
