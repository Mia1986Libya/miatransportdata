// --- Data ---
let trips = JSON.parse(localStorage.getItem("trips")) || [];
let drivers = JSON.parse(localStorage.getItem("drivers")) || [];
let destinations = JSON.parse(localStorage.getItem("destinations")) || [];
let editTripIndex = null;

// --- DOM ---
const driverSelect = document.getElementById("driver");
const destinationSelect = document.getElementById("destination");
const tripForm = document.getElementById("tripForm");
const tripTable = document.querySelector("#tripTable tbody");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const totalPriceEl = document.getElementById("totalPrice");
const exportPDFBtn = document.getElementById("exportPDFBtn");
const driverFilter = document.getElementById("driverFilter");
const exportDriverPDFBtn = document.getElementById("exportDriverPDFBtn");
const revenueChartCanvas = document.getElementById("revenueChart");

// Manage drivers/destinations
const newDriverInput = document.getElementById("newDriver");
const addDriverBtn = document.getElementById("addDriverBtn");
const editDriverBtn = document.getElementById("editDriverBtn");
const deleteDriverBtn = document.getElementById("deleteDriverBtn");
const driversSelect = document.getElementById("driversSelect");

const newDestinationInput = document.getElementById("newDestination");
const addDestinationBtn = document.getElementById("addDestinationBtn");
const editDestinationBtn = document.getElementById("editDestinationBtn");
const deleteDestinationBtn = document.getElementById("deleteDestinationBtn");
const destinationsSelect = document.getElementById("destinationsSelect");

// --- Save Functions ---
function saveTrips() {
  localStorage.setItem("trips", JSON.stringify(trips));
}
function saveDrivers() {
  localStorage.setItem("drivers", JSON.stringify(drivers));
}
function saveDestinations() {
  localStorage.setItem("destinations", JSON.stringify(destinations));
}

// --- Update UI ---
function updateDriverDestinationUI() {
  driverSelect.innerHTML = '<option value="">Select Driver</option>';
  driverFilter.innerHTML = '<option value="">Select Driver for PDF</option>';
  drivers.forEach((d) => {
    driverSelect.innerHTML += `<option value="${d}">${d}</option>`;
    driverFilter.innerHTML += `<option value="${d}">${d}</option>`;
  });

  destinationSelect.innerHTML = '<option value="">Select Destination</option>';
  destinations.forEach((d) => {
    destinationSelect.innerHTML += `<option value="${d}">${d}</option>`;
  });

  driversSelect.innerHTML = "";
  drivers.forEach((d) => {
    const opt = document.createElement("option");
    opt.text = d;
    driversSelect.add(opt);
  });
  destinationsSelect.innerHTML = "";
  destinations.forEach((d) => {
    const opt = document.createElement("option");
    opt.text = d;
    destinationsSelect.add(opt);
  });
}

// --- Driver Buttons ---
addDriverBtn.addEventListener("click", () => {
  const val = newDriverInput.value.trim();
  if (val && !drivers.includes(val)) {
    drivers.push(val);
    saveDrivers();
    updateDriverDestinationUI();
    newDriverInput.value = "";
  }
});
editDriverBtn.addEventListener("click", () => {
  const sel = driversSelect.selectedIndex;
  const val = newDriverInput.value.trim();
  if (sel >= 0 && val) {
    drivers[sel] = val;
    saveDrivers();
    updateDriverDestinationUI();
    newDriverInput.value = "";
  }
});
deleteDriverBtn.addEventListener("click", () => {
  const sel = driversSelect.selectedIndex;
  if (sel >= 0) {
    if (confirm(`Delete driver "${drivers[sel]}"?`)) {
      drivers.splice(sel, 1);
      saveDrivers();
      updateDriverDestinationUI();
    }
  }
});

// --- Destination Buttons ---
addDestinationBtn.addEventListener("click", () => {
  const val = newDestinationInput.value.trim();
  if (val && !destinations.includes(val)) {
    destinations.push(val);
    saveDestinations();
    updateDriverDestinationUI();
    newDestinationInput.value = "";
  }
});
editDestinationBtn.addEventListener("click", () => {
  const sel = destinationsSelect.selectedIndex;
  const val = newDestinationInput.value.trim();
  if (sel >= 0 && val) {
    destinations[sel] = val;
    saveDestinations();
    updateDriverDestinationUI();
    newDestinationInput.value = "";
  }
});
deleteDestinationBtn.addEventListener("click", () => {
  const sel = destinationsSelect.selectedIndex;
  if (sel >= 0) {
    if (confirm(`Delete destination "${destinations[sel]}"?`)) {
      destinations.splice(sel, 1);
      saveDestinations();
      updateDriverDestinationUI();
    }
  }
});

// --- Trips ---
tripForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const driver = driverSelect.value,
    date = document.getElementById("date").value;
  const destination = destinationSelect.value,
    shipment = document.getElementById("shipment").value;
  const price = parseFloat(document.getElementById("price").value);
  const trip = {
    driver,
    date,
    destination,
    shipment,
    price,
    status: "Pending"
  };
  if (editTripIndex === null) {
    trips.push(trip);
  } else {
    trips[editTripIndex] = trip;
    editTripIndex = null;
    submitBtn.textContent = "Add Trip";
    cancelEditBtn.style.display = "none";
  }
  saveTrips();
  renderTrips();
  tripForm.reset();
});

cancelEditBtn.addEventListener("click", () => {
  tripForm.reset();
  editTripIndex = null;
  submitBtn.textContent = "Add Trip";
  cancelEditBtn.style.display = "none";
});

// --- Render Trips ---
let revenueChart;
function renderTrips() {
  updateDriverDestinationUI();
  let filtered = trips.filter(
    (t) =>
      t.driver.toLowerCase().includes(searchInput.value.toLowerCase()) ||
      t.destination.toLowerCase().includes(searchInput.value.toLowerCase()) ||
      t.shipment.toLowerCase().includes(searchInput.value.toLowerCase())
  );
  const sortVal = sortSelect.value;
  if (sortVal === "dateAsc")
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  if (sortVal === "dateDesc")
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  if (sortVal === "priceAsc") filtered.sort((a, b) => a.price - b.price);
  if (sortVal === "priceDesc") filtered.sort((a, b) => b.price - a.price);

  tripTable.innerHTML = "";
  let total = 0;
  filtered.forEach((t, i) => {
    total += t.price;
    tripTable.innerHTML += `
      <tr>
        <td>${t.driver}</td>
        <td>${t.date}</td>
        <td>${t.destination}</td>
        <td>${t.shipment}</td>
        <td>${t.price.toFixed(2)} LYD</td>
        <td>${t.status}</td>
        <td>
          <button class="action-btn edit-btn" onclick="editTrip(${i})">Edit</button>
          <button class="action-btn delete-btn" onclick="deleteTrip(${i})">Delete</button>
          <button class="action-btn invoice-btn" onclick="printInvoice(${i})">Invoice</button>
          <button class="action-btn" style="background:#16a085;" onclick="toggleStatus(${i})">Toggle Status</button>
        </td>
      </tr>`;
  });
  totalPriceEl.textContent = `${total.toFixed(2)} LYD`;
  updateChart();
}

// --- Edit/Delete/Invoice/Toggle ---
function editTrip(i) {
  const t = trips[i];
  driverSelect.value = t.driver;
  document.getElementById("date").value = t.date;
  destinationSelect.value = t.destination;
  document.getElementById("shipment").value = t.shipment;
  document.getElementById("price").value = t.price;
  editTripIndex = i;
  submitBtn.textContent = "Update Trip";
  cancelEditBtn.style.display = "inline-block";
}
function deleteTrip(i) {
  trips.splice(i, 1);
  saveTrips();
  renderTrips();
}
function printInvoice(i) {
  const t = trips[i];
  const w = window.open("", "Invoice", "width=600,height=400");
  w.document
    .write(`<html><head><title>Invoice</title></head><body style="font-family:Arial;padding:20px;">
  <h2 style="text-align:center;">Transport Invoice</h2>
  <p><b>Driver:</b> ${t.driver}</p>
  <p><b>Date:</b> ${t.date}</p>
  <p><b>Destination:</b> ${t.destination}</p>
  <p><b>Shipment:</b> ${t.shipment}</p>
  <p><b>Price:</b> ${t.price.toFixed(2)} LYD</p>
  <p><b>Status:</b> ${t.status}</p>
  <hr><p style="text-align:center;">Thank you</p>
  <script>window.print();</script></body></html>`);
  w.document.close();
}
function toggleStatus(i) {
  trips[i].status = trips[i].status === "Pending" ? "Paid" : "Pending";
  saveTrips();
  renderTrips();
}

// --- Export PDF ---
exportPDFBtn.addEventListener("click", () => {
  exportTripsPDF(trips, "All Trips Report");
});
exportDriverPDFBtn.addEventListener("click", () => {
  const driver = driverFilter.value;
  if (!driver) return alert("Select driver first!");
  const driverTrips = trips.filter((t) => t.driver === driver);
  exportTripsPDF(driverTrips, `Trips of ${driver}`);
});
function exportTripsPDF(tripsArray, title) {
  const total = tripsArray.reduce((sum, t) => sum + t.price, 0);
  const rows = tripsArray
    .map(
      (t) => `<tr>
    <td>${t.driver}</td>
    <td>${t.date}</td>
    <td>${t.destination}</td>
    <td>${t.shipment}</td>
    <td>${t.price.toFixed(2)} LYD</td>
    <td>${t.status}</td>
  </tr>`
    )
    .join("");
  const w = window.open("", "PDF", "width=800,height=600");
  w.document.write(`<html><head><title>${title}</title><style>
    body{font-family:Arial;padding:20px}
    table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #333;padding:10px;text-align:center}
    th{background:#3498db;color:white}
    tfoot td{font-weight:bold}
  </style></head><body>
  <h2 style="text-align:center;">${title}</h2>
  <table>
    <thead>
      <tr><th>Driver</th><th>Date</th><th>Destination</th><th>Shipment</th><th>Price</th><th>Status</th></tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="5">Total</td><td>${total.toFixed(
      2
    )} LYD</td></tr></tfoot>
  </table>
  <script>window.print();</script>
  </body></html>`);
  w.document.close();
}
// --- Search & Sort ---
searchInput.addEventListener("input", renderTrips);
sortSelect.addEventListener("change", renderTrips);

// --- Chart ---
function updateChart() {
  const data = {};
  trips.forEach((t) => {
    data[t.driver] = (data[t.driver] || 0) + t.price;
  });
  const labels = Object.keys(data),
    values = Object.values(data);
  if (revenueChart) revenueChart.destroy();
  revenueChart = new Chart(revenueChartCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Revenue (LYD)", data: values, backgroundColor: "#3498db" }
      ]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

// --- Initialize ---
updateDriverDestinationUI();
renderTrips();
