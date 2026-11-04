(() => {
  const cfg = window.RMSTORE_CONFIG;
  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY);
  const bucket = cfg.STORAGE_BUCKET;

  const grid = document.getElementById("productGrid");
  const status = document.getElementById("catalogStatus");
  const count = document.getElementById("catalogCount");
  const search = document.getElementById("searchInput");
  const filters = document.getElementById("filters");
  const modal = document.getElementById("productModal");
  const modalContent = document.getElementById("modalContent");
  const lightbox = document.getElementById("imageLightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxCounter = document.getElementById("lightboxCounter");

  let products = [];
  let category = "Todos";
  let activeImages = [];
  let activeImageIndex = 0;

  const wa = (text) => `https://wa.me/${cfg.WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  ["waTop","waHero","waBottom"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.href = wa("Hola RM STORE, quisiera información sobre sus equipos disponibles.");
  });

  const esc = (v="") => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const publicUrl = (path) => path ? client.storage.from(bucket).getPublicUrl(path).data.publicUrl : "";
  const money = (v) => (v === null || v === undefined || v === "") ? "Consultar" : `S/ ${Number(v).toLocaleString("es-PE",{minimumFractionDigits:0,maximumFractionDigits:2})}`;
  const formatCondition = (v) => {
    if (v === null || v === undefined || String(v).trim() === "") return "";
    const s = String(v).trim();
    if (/^\d+(?:[.,]\d+)?\s*\/\s*10$/i.test(s)) return s.replace(/\s+/g, "");
    if (/^\d+(?:[.,]\d+)?$/.test(s)) return `${s.replace(',', '.')}/10`;
    return s;
  };
  const formatBattery = (v) => {
    if (v === null || v === undefined || String(v).trim() === "") return "";
    const s = String(v).trim();
    if (/^\d+(?:[.,]\d+)?\s*%$/.test(s)) return s.replace(/\s+/g, "");
    if (/^\d+(?:[.,]\d+)?$/.test(s)) return `${s.replace(',', '.')}%`;
    return s;
  };

  async function loadProducts(){
    status.hidden = false; grid.hidden = true;
    const { data, error } = await client
      .from("productos")
      .select("*")
      .eq("publicado", true)
      .order("destacado", { ascending:false })
      .order("orden", { ascending:true })
      .order("created_at", { ascending:false });

    if(error){
      console.error(error);
      status.textContent = "No pudimos cargar el catálogo en este momento. Intenta nuevamente en unos segundos.";
      count.textContent = "Catálogo no disponible";
      return;
    }
    products = data || [];
    render();
  }

  function filtered(){
    const q = search.value.trim().toLowerCase();
    return products.filter(p => {
      const catOk = category === "Todos" || p.categoria === category;
      const haystack = [p.marca,p.modelo,p.procesador,p.ram,p.almacenamiento,p.pantalla,p.graficos,p.descripcion].join(" ").toLowerCase();
      return catOk && (!q || haystack.includes(q));
    });
  }

  function card(p){
    const img = p.imagenes?.[0] ? `<img src="${publicUrl(p.imagenes[0])}" alt="${esc(p.marca)} ${esc(p.modelo)}" loading="lazy">` :
      `<div class="product-placeholder">RM STORE</div>`;
    const stateClass = p.estado === "Disponible" ? "available" : p.estado === "Reservado" ? "reserved" : "sold";
    const specs = [p.procesador,p.ram,p.almacenamiento].filter(Boolean).slice(0,3).map(x=>`<span>${esc(x)}</span>`).join("");
    return `<article class="product-card">
      <div class="product-image">
        ${img}
        <div class="badges">
          <span class="badge ${stateClass}">${esc(p.estado)}</span>
          ${p.destacado ? '<span class="badge featured">Destacado</span>' : ''}
        </div>
      </div>
      <div class="product-body">
        <div class="product-brand">${esc(p.marca).toUpperCase()}</div>
        <h3 class="product-title">${esc(p.modelo)}</h3>
        <div class="specs">${specs || "<span>Consulta especificaciones</span>"}</div>
        <div class="product-footer">
          <span class="price">${money(p.precio)}</span>
          <button class="text-btn" data-open="${p.id}">Ver detalles →</button>
        </div>
        <a class="card-whatsapp" href="${wa(`Hola RM STORE, quisiera consultar por ${p.marca} ${p.modelo}.`)}" target="_blank" rel="noopener">Consultar por WhatsApp <span aria-hidden="true">↗</span></a>
      </div>
    </article>`;
  }

  function render(){
    const list = filtered();
    count.textContent = `${list.length} ${list.length === 1 ? "equipo" : "equipos"}`;
    if(!list.length){
      status.hidden = false; grid.hidden = true;
      status.textContent = products.length ? "No encontramos equipos con ese filtro." : "Muy pronto publicaremos nuevos equipos.";
      return;
    }
    status.hidden = true; grid.hidden = false;
    grid.innerHTML = list.map(card).join("");
  }

  function setMainImage(index){
    if(!activeImages.length) return;
    activeImageIndex = (index + activeImages.length) % activeImages.length;
    const mainImg = document.getElementById("modalMainImage");
    if(mainImg) mainImg.src = activeImages[activeImageIndex];
    modalContent.querySelectorAll("[data-thumb]").forEach((thumb,i)=>{
      thumb.classList.toggle("active", i === activeImageIndex);
      thumb.setAttribute("aria-current", i === activeImageIndex ? "true" : "false");
    });
  }

  function showLightbox(index = activeImageIndex){
    if(!activeImages.length) return;
    activeImageIndex = (index + activeImages.length) % activeImages.length;
    lightboxImage.src = activeImages[activeImageIndex];
    lightboxCounter.textContent = `${activeImageIndex + 1} / ${activeImages.length}`;
    document.getElementById("lightboxPrev").hidden = activeImages.length < 2;
    document.getElementById("lightboxNext").hidden = activeImages.length < 2;
    if(!lightbox.open) lightbox.showModal();
  }

  function moveLightbox(step){
    if(!activeImages.length) return;
    activeImageIndex = (activeImageIndex + step + activeImages.length) % activeImages.length;
    lightboxImage.src = activeImages[activeImageIndex];
    lightboxCounter.textContent = `${activeImageIndex + 1} / ${activeImages.length}`;
    setMainImage(activeImageIndex);
  }

  function openProduct(id){
    const p = products.find(x => String(x.id) === String(id));
    if(!p) return;
    const imgs = (p.imagenes || []).map(publicUrl);
    activeImages = imgs;
    activeImageIndex = 0;
    const main = imgs[0] || "";
    const details = [
      ["Procesador",p.procesador],["RAM",p.ram],["Almacenamiento",p.almacenamiento],["Pantalla",p.pantalla],
      ["Gráficos",p.graficos],["Condición",formatCondition(p.condicion)],["Batería",formatBattery(p.bateria)],["Incluye",p.incluye]
    ].filter(([,v])=>v);

    modalContent.innerHTML = `<div class="modal-layout">
      <div class="modal-gallery">
        ${main ? `<button class="main-image-button" type="button" data-enlarge="0" aria-label="Ampliar imagen"><img id="modalMainImage" class="modal-main-image" src="${main}" alt="${esc(p.modelo)}"><span class="zoom-hint">⌕ Ampliar</span></button>` : '<div class="modal-main-image product-placeholder">RM STORE</div>'}
        ${imgs.length>1 ? `<div class="modal-thumbs">${imgs.map((u,i)=>`<button type="button" class="thumb-button ${i===0?'active':''}" data-thumb="${i}" aria-label="Ver foto ${i+1}" aria-current="${i===0?'true':'false'}"><img src="${u}" alt="Foto ${i+1}"></button>`).join("")}</div>`:""}
        ${imgs.length>1 ? `<div class="gallery-controls"><button type="button" data-gallery-step="-1">← Anterior</button><span>${imgs.length} fotos</span><button type="button" data-gallery-step="1">Siguiente →</button></div>`:""}
      </div>
      <div class="modal-info">
        <p class="eyebrow">${esc(p.marca)} · ${esc(p.categoria)}</p>
        <h2>${esc(p.modelo)}</h2>
        <div class="badges modal-badges">
          <span class="badge ${p.estado==="Disponible"?"available":p.estado==="Reservado"?"reserved":"sold"}">${esc(p.estado)}</span>
        </div>
        <div class="detail-list">${details.map(([k,v])=>`<div class="detail"><small>${esc(k)}</small><strong>${esc(v)}</strong></div>`).join("")}</div>
        ${p.descripcion ? `<p class="muted product-description">${esc(p.descripcion)}</p>`:""}
        <div class="product-footer modal-footer">
          <span class="price">${money(p.precio)}</span>
          <a class="btn" target="_blank" rel="noopener" href="${wa(`Hola RM STORE, quisiera información sobre ${p.marca} ${p.modelo}.`)}">Consultar</a>
        </div>
      </div>
    </div>`;
    modal.showModal();
  }

  search.addEventListener("input", render);
  filters.addEventListener("click", e => {
    const btn = e.target.closest("[data-category]");
    if(!btn) return;
    category = btn.dataset.category;
    filters.querySelectorAll(".chip").forEach(x=>x.classList.toggle("active",x===btn));
    render();
  });
  grid.addEventListener("click", e => {
    const btn = e.target.closest("[data-open]");
    if(btn) openProduct(btn.dataset.open);
  });
  modalContent.addEventListener("click", e => {
    const thumb = e.target.closest("[data-thumb]");
    if(thumb){ setMainImage(Number(thumb.dataset.thumb)); return; }
    const enlarge = e.target.closest("[data-enlarge]");
    if(enlarge){ showLightbox(activeImageIndex); return; }
    const step = e.target.closest("[data-gallery-step]");
    if(step) setMainImage(activeImageIndex + Number(step.dataset.galleryStep));
  });

  document.getElementById("modalClose").addEventListener("click",()=>modal.close());
  modal.addEventListener("click", e => { if(e.target === modal) modal.close(); });
  document.getElementById("lightboxClose").addEventListener("click",()=>lightbox.close());
  document.getElementById("lightboxPrev").addEventListener("click",()=>moveLightbox(-1));
  document.getElementById("lightboxNext").addEventListener("click",()=>moveLightbox(1));
  lightbox.addEventListener("click", e => { if(e.target === lightbox) lightbox.close(); });

  document.addEventListener("keydown", e => {
    if(lightbox.open){
      if(e.key === "ArrowLeft") moveLightbox(-1);
      if(e.key === "ArrowRight") moveLightbox(1);
      return;
    }
    if(modal.open && activeImages.length > 1){
      if(e.key === "ArrowLeft") setMainImage(activeImageIndex - 1);
      if(e.key === "ArrowRight") setMainImage(activeImageIndex + 1);
    }
  });

  loadProducts();
})();
