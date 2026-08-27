
// RM STORE V1
// Cambia aquí el número de WhatsApp en formato internacional, sin + ni espacios.
// Ejemplo Perú: 51999999999
const WHATSAPP_NUMBER = "51999999999";

const products = [
  {
    brand: "Lenovo",
    name: "ThinkPad T14",
    category: "laptop",
    cpu: "Core i7",
    ram: "16 GB",
    storage: "512 GB SSD",
    display: '14" FHD',
    status: "Disponible"
  },
  {
    brand: "Lenovo",
    name: "ThinkPad P15v",
    category: "workstation",
    cpu: "Core i9",
    ram: "16 GB",
    storage: "1 TB SSD",
    display: '15.6" FHD',
    status: "Disponible"
  },
  {
    brand: "Apple",
    name: 'iPad Pro 11"',
    category: "tablet",
    cpu: "Apple Silicon",
    ram: "—",
    storage: "256 GB",
    display: '11" Retina',
    status: "Disponible"
  },
  {
    brand: "Dell",
    name: "Latitude 7320",
    category: "laptop",
    cpu: "Core i7",
    ram: "16 GB",
    storage: "256 GB SSD",
    display: '13.3" FHD',
    status: "Disponible"
  },
  {
    brand: "Lenovo",
    name: "ThinkPad X1 Carbon",
    category: "laptop",
    cpu: "Core i7",
    ram: "16 GB",
    storage: "512 GB SSD",
    display: '14" FHD',
    status: "Disponible"
  },
  {
    brand: "Lenovo",
    name: "ThinkPad P1",
    category: "workstation",
    cpu: "Core i7",
    ram: "32 GB",
    storage: "1 TB SSD",
    display: '15.6" FHD',
    status: "Disponible"
  }
];

const productGrid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const filterButtons = [...document.querySelectorAll(".filter")];
const emptyState = document.getElementById("emptyState");
let activeFilter = "all";

function whatsappUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function deviceMarkup() {
  return `
    <div class="device-mini" aria-hidden="true">
      <div class="mini-screen">FOTO REAL DEL EQUIPO</div>
      <div class="mini-base"></div>
    </div>`;
}

function renderProducts() {
  const q = searchInput.value.trim().toLowerCase();
  const filtered = products.filter(p => {
    const matchesFilter = activeFilter === "all" || p.category === activeFilter;
    const haystack = `${p.brand} ${p.name} ${p.cpu} ${p.ram} ${p.storage} ${p.display}`.toLowerCase();
    return matchesFilter && haystack.includes(q);
  });

  productGrid.innerHTML = filtered.map(p => `
    <article class="product-card">
      <div class="product-image">
        <span class="product-badge">${p.category === "workstation" ? "Workstation" : p.category === "tablet" ? "Tablet" : "Laptop"}</span>
        ${deviceMarkup()}
      </div>
      <div class="product-body">
        <div class="product-brand">${p.brand}</div>
        <div class="product-title">${p.name}</div>
        <div class="specs">
          <div class="spec">${p.cpu}</div>
          <div class="spec">${p.ram}</div>
          <div class="spec">${p.storage}</div>
          <div class="spec">${p.display}</div>
        </div>
        <div class="product-footer">
          <span class="status">${p.status}</span>
          <a class="product-link" target="_blank" rel="noopener"
             href="${whatsappUrl(`Hola RM STORE, quisiera información sobre ${p.brand} ${p.name}.`)}">
             Consultar →
          </a>
        </div>
      </div>
    </article>
  `).join("");

  emptyState.hidden = filtered.length !== 0;
}

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    renderProducts();
  });
});

searchInput.addEventListener("input", renderProducts);

const genericMessage = "Hola RM STORE, quisiera información sobre los equipos disponibles.";
["nav-whatsapp","hero-whatsapp","cta-whatsapp","float-whatsapp"].forEach(id => {
  document.getElementById(id).href = whatsappUrl(genericMessage);
});

document.getElementById("year").textContent = new Date().getFullYear();

const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
menuToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
});
nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));

renderProducts();
