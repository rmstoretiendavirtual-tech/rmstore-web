(() => {
  const cfg = window.RMSTORE_CONFIG;
  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY);
  const bucket = cfg.STORAGE_BUCKET;

  const loginView = document.getElementById("loginView");
  const adminView = document.getElementById("adminView");
  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");
  const productForm = document.getElementById("productForm");
  const formMessage = document.getElementById("formMessage");
  const adminList = document.getElementById("adminList");
  const adminSearch = document.getElementById("adminSearch");
  const deleteBtn = document.getElementById("deleteBtn");
  const formTitle = document.getElementById("formTitle");
  const existingImages = document.getElementById("existingImages");

  let products = [];
  let currentImagePaths = [];
  let orderDirty = false;

  const $ = id => document.getElementById(id);
  const publicUrl = path => path ? client.storage.from(bucket).getPublicUrl(path).data.publicUrl : "";
  const esc = (v="") => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const setMsg = (el,msg,type="") => { el.textContent = msg || ""; el.className = `form-message ${type}`; };

  async function isAdmin(){
    const { data, error } = await client.rpc("is_admin");
    return !error && data === true;
  }

  async function showForSession(session){
    if(!session){
      loginView.hidden = false; adminView.hidden = true; return;
    }
    if(!(await isAdmin())){
      await client.auth.signOut();
      setMsg(loginMessage,"Este usuario no tiene permisos de administrador.","error");
      loginView.hidden = false; adminView.hidden = true; return;
    }
    loginView.hidden = true; adminView.hidden = false;
    await loadProducts();
  }


  // Sugerencias locales ampliables: los valores escritos se guardan en los mismos campos
  // existentes de Supabase y se ofrecen nuevamente al cargar el inventario.
  const brandDefaults=["Lenovo","Dell","HP","Apple","ASUS","Acer","MSI","Samsung","Microsoft","LG","Huawei","Razer","Gigabyte","Toshiba","Dynabook","Fujitsu","Panasonic","Framework","Motorola","Xiaomi","Google","OnePlus"];
  const modelsByBrand={
    Lenovo:["ThinkPad T14","ThinkPad T14s","ThinkPad T15","ThinkPad T15g","ThinkPad T16","ThinkPad L13","ThinkPad L13 Yoga","ThinkPad L14","ThinkPad L15","ThinkPad P1","ThinkPad P14s","ThinkPad P15","ThinkPad P15v","ThinkPad P16","ThinkPad P16s","ThinkPad P16v","ThinkPad X1 Carbon","ThinkPad X1 Extreme","ThinkPad X13","ThinkPad E14","ThinkPad E15","ThinkBook","IdeaPad","Legion"],
    Dell:["Latitude 5320","Latitude 5420","Latitude 5520","Latitude 7210 2-in-1","Latitude 7320","Latitude 7420","Precision","XPS","Inspiron","Alienware","Vostro"],
    HP:["EliteBook","ProBook","ZBook Firefly","ZBook Power","ZBook Studio","ZBook Fury","Spectre","Pavilion","Victus","Omen"],
    Apple:["MacBook Air","MacBook Pro","iPad","iPad Air","iPad Pro","iPhone","Mac mini"],
    ASUS:["Zenbook","Vivobook","ExpertBook","ROG Zephyrus","ROG Strix","TUF Gaming"],
    Acer:["TravelMate","Aspire","Swift","Nitro","Predator"],
    MSI:["Modern","Prestige","Stealth","Katana","Raider"],
    Samsung:["Galaxy Book","Galaxy Tab","Galaxy S"],
    Microsoft:["Surface Pro","Surface Laptop","Surface Book"]
  };
  const cpus=["Intel Core i3-10110U","Intel Core i3-1115G4","Intel Core i3-1215U","Intel Core i3-1315U","Intel Core i5-10210U","Intel Core i5-10310U","Intel Core i5-1135G7","Intel Core i5-1145G7","Intel Core i5-1235U","Intel Core i5-1240P","Intel Core i5-12500H","Intel Core i5-1335U","Intel Core i5-1340P","Intel Core i5-13500H","Intel Core i7-10510U","Intel Core i7-10610U","Intel Core i7-10750H","Intel Core i7-1165G7","Intel Core i7-11800H","Intel Core i7-1255U","Intel Core i7-1260P","Intel Core i7-12700H","Intel Core i7-1355U","Intel Core i7-1360P","Intel Core i7-13700H","Intel Core i9-10885H","Intel Core i9-11950H","Intel Core i9-12900H","Intel Core i9-13900H","Intel Core i9-14900HX","Intel Core Ultra 5 125U","Intel Core Ultra 5 125H","Intel Core Ultra 5 225U","Intel Core Ultra 5 225H","Intel Core Ultra 7 155U","Intel Core Ultra 7 155H","Intel Core Ultra 7 165H","Intel Core Ultra 7 258V","Intel Core Ultra 7 255U","Intel Core Ultra 7 265H","Intel Core Ultra 9 185H","Intel Core Ultra 9 285H","Intel Xeon W-10855M","Intel Xeon W-11955M","Intel Processor N100","Intel Celeron N4020","AMD Ryzen 3 4300U","AMD Ryzen 3 5300U","AMD Ryzen 5 4500U","AMD Ryzen 5 PRO 4650U","AMD Ryzen 5 5500U","AMD Ryzen 5 PRO 5650U","AMD Ryzen 5 7530U","AMD Ryzen 5 8640U","AMD Ryzen 7 4700U","AMD Ryzen 7 PRO 4750U","AMD Ryzen 7 5700U","AMD Ryzen 7 PRO 5850U","AMD Ryzen 7 PRO 6850U","AMD Ryzen 7 7730U","AMD Ryzen 7 7840U","AMD Ryzen 7 8840U","AMD Ryzen 9 5900HX","AMD Ryzen 9 7940HS","AMD Ryzen 9 8945HS","AMD Ryzen AI 9 HX 370","AMD Ryzen AI 7 350","AMD Ryzen Threadripper","Apple M1","Apple M1 Pro","Apple M1 Max","Apple M2","Apple M2 Pro","Apple M2 Max","Apple M3","Apple M3 Pro","Apple M3 Max","Apple M4","Apple M4 Pro","Apple M4 Max","Apple M5","Qualcomm Snapdragon X Elite","Qualcomm Snapdragon X Plus","Qualcomm Snapdragon 8cx"];
  const ramOptions=["4 GB DDR3","8 GB DDR3","4 GB DDR4","8 GB DDR4","12 GB DDR4","16 GB DDR4","24 GB DDR4","32 GB DDR4","64 GB DDR4","8 GB DDR5","16 GB DDR5","24 GB DDR5","32 GB DDR5","48 GB DDR5","64 GB DDR5","96 GB DDR5","128 GB DDR5","8 GB LPDDR4X","16 GB LPDDR4X","16 GB LPDDR5","32 GB LPDDR5","16 GB LPDDR5X","32 GB LPDDR5X"];
  const storageOptions=["128 GB SSD SATA","256 GB SSD SATA","512 GB SSD SATA","1 TB SSD SATA","128 GB SSD NVMe","256 GB SSD NVMe","512 GB SSD NVMe","1 TB SSD NVMe","2 TB SSD NVMe","4 TB SSD NVMe","500 GB HDD","1 TB HDD","2 TB HDD","64 GB eMMC","128 GB eMMC"];
  const screenSizes=["4.7","5.4","5.8","6.1","6.3","6.5","6.7","6.9","7.9","8.3","9.7","10.1","10.2","10.5","10.9","11","11.6","12","12.3","12.4","12.5","12.9","13","13.3","13.4","13.5","13.6","14","14.1","14.5","15","15.3","15.6","16","16.1","17","17.3","18","19.5","21.5","23.8","24","27","32"].map(x=>x+'"');
  const screenRes=["1366 × 768","1600 × 900","1920 × 1080","1920 × 1200","2240 × 1400","2560 × 1440","2560 × 1600","2880 × 1800","2880 × 1920","3200 × 2000","3840 × 2160","3840 × 2400","5120 × 2880"];
  const uniq = values=>[...new Set(values.filter(Boolean).map(v=>String(v).trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es",{numeric:true}));
  function fillOptions(id,values){const el=$(id+"Options"); el.replaceChildren(...uniq(values).map(v=>{const o=document.createElement("option");o.value=v;return o;}));}
  function refreshSuggestions(){
    fillOptions("marca",[...brandDefaults,...products.map(p=>p.marca)]);
    const b=$("marca").value.trim().toLowerCase();
    fillOptions("modelo",[...(Object.entries(modelsByBrand).find(([k])=>k.toLowerCase()===b)?.[1]||[]),...products.filter(p=>!b||String(p.marca||"").toLowerCase()===b).map(p=>p.modelo)]);
    fillOptions("procesador",[...cpus,...products.map(p=>p.procesador)]);
    fillOptions("ram",[...ramOptions,...products.map(p=>p.ram)]);
    fillOptions("almacenamiento",[...storageOptions,...products.map(p=>p.almacenamiento)]);
    fillOptions("pantallaTamano",screenSizes);fillOptions("pantallaResolucion",screenRes);
  }
  $("marca").addEventListener("input",refreshSuggestions);
  // Combos visibles con búsqueda y entrada libre, sin cambiar el esquema de Supabase.
  const comboIds=["marca","modelo","procesador","ram","almacenamiento","pantallaTamano","pantallaResolucion"];
  function initCombos(){
    comboIds.forEach(id=>{
      const input=$(id), label=input.parentElement, listId=id+"Options";
      input.removeAttribute("list"); // El datalist nativo no muestra flecha en algunos navegadores.
      const wrapper=document.createElement("div");wrapper.className="rm-combo";
      input.parentNode.insertBefore(wrapper,input);wrapper.appendChild(input);
      const toggle=document.createElement("button");toggle.type="button";toggle.className="rm-combo-toggle";
      toggle.setAttribute("aria-label","Mostrar opciones de "+id);toggle.textContent="▾";
      const menu=document.createElement("div");menu.className="rm-combo-menu";menu.hidden=true;
      wrapper.append(toggle,menu);
      const close=()=>{menu.hidden=true;toggle.setAttribute("aria-expanded","false")};
      const show=(filter="")=>{
        const options=[...$(listId).options].map(o=>o.value).filter(Boolean);
        const matches=filter?options.filter(v=>v.toLocaleLowerCase("es").includes(filter.toLocaleLowerCase("es"))):options;
        menu.replaceChildren();
        matches.slice(0,80).forEach(v=>{
          const btn=document.createElement("button");btn.type="button";btn.className="rm-combo-option";btn.textContent=v;
          btn.addEventListener("click",()=>{input.value=v;input.dispatchEvent(new Event("input",{bubbles:true}));input.dispatchEvent(new Event("change",{bubbles:true}));close();});
          menu.appendChild(btn);
        });
        if(!matches.length){const msg=document.createElement("div");msg.className="rm-combo-empty";msg.textContent="Sin coincidencias. Puedes escribir un valor nuevo.";menu.appendChild(msg)}
        menu.hidden=false;toggle.setAttribute("aria-expanded","true");
      };
      toggle.addEventListener("click",e=>{e.preventDefault();menu.hidden?show():close()});
      input.addEventListener("focus",()=>show(input.value.trim()));
      input.addEventListener("input",()=>show(input.value.trim()));
      input.addEventListener("keydown",e=>{
        if(e.key==="Escape")close();
        if(e.key==="ArrowDown"&&menu.hidden){e.preventDefault();show(input.value.trim())}
        if(e.key==="Enter"&&!menu.hidden){close()}
      });
      document.addEventListener("pointerdown",e=>{if(!wrapper.contains(e.target))close()});
    });
  }
  initCombos();

  // No new database columns: screen details are encoded in the existing pantalla field.
  function buildScreen(){return [$("pantallaTamano").value.trim(),$("pantallaResolucion").value.trim(),$("pantallaTipo").value,$("pantallaTactil").value,$("pantallaExtra").value.trim()].join(" | ").replace(/(?: \| )+$/g,"").trim();}
  function parseScreen(value){
    const parts=String(value||"").split(" | ");
    ["pantallaTamano","pantallaResolucion","pantallaTipo","pantallaTactil","pantallaExtra"].forEach(id=>$(id).value="");
    if(parts.length>1){
      $("pantallaTamano").value=parts[0]||"";$("pantallaResolucion").value=parts[1]||"";
      $("pantallaTipo").value=parts[2]||"";$("pantallaTactil").value=parts[3]||"";$("pantallaExtra").value=parts.slice(4).join(" | ");
    }else {$("pantallaExtra").value=value;} // Preserve legacy text verbatim.
  }
  function moveProduct(id,direction){
    if(adminSearch.value.trim()){setMsg($("orderMessage"),"Borra la búsqueda para ordenar todos los productos.","error");return;}
    const i=products.findIndex(p=>String(p.id)===String(id));const j=i+(direction==="up"?-1:1);
    if(i<0||j<0||j>=products.length)return;
    [products[i],products[j]]=[products[j],products[i]];orderDirty=true;
    setMsg($("orderMessage"),"Cambios pendientes. Pulsa Guardar orden.");renderAdminList();
  }
  $("saveOrderBtn").addEventListener("click",async()=>{
    if(!orderDirty){setMsg($("orderMessage"),"No hay cambios pendientes.");return;}
    const btn=$("saveOrderBtn");btn.disabled=true;setMsg($("orderMessage"),"Guardando orden…");
    try{
      // Sequential updates keep the existing Supabase schema and RLS intact.
      for(let i=0;i<products.length;i++){
        const {data:updated,error}=await client.from("productos").update({orden:i+1}).eq("id",products[i].id).select("id");
        if(error)throw error;
        if(!updated?.length)throw new Error("Supabase no confirmó la actualización. Revisa los permisos de edición.");
      }
      orderDirty=false;setMsg($("orderMessage"),"Orden guardado. Actualiza la tienda para verlo.","success");
    }catch(e){setMsg($("orderMessage"),"No se pudo guardar todo el orden: "+(e.message||e),"error");}
    finally{btn.disabled=false;}
  });

  loginForm.addEventListener("submit", async e => {
    e.preventDefault(); setMsg(loginMessage,"Ingresando…");
    const { data, error } = await client.auth.signInWithPassword({
      email: $("loginEmail").value.trim(),
      password: $("loginPassword").value
    });
    if(error){ setMsg(loginMessage,"No se pudo iniciar sesión. Revisa el correo y la contraseña.","error"); return; }
    setMsg(loginMessage,"");
    await showForSession(data.session);
  });

  $("logoutBtn").addEventListener("click", async()=>{ await client.auth.signOut(); location.reload(); });

  async function loadProducts(){
    adminList.innerHTML = '<div class="status-card">Cargando productos…</div>';
    const { data, error } = await client.from("productos").select("*").order("created_at",{ascending:false});
    if(error){ adminList.innerHTML = `<div class="status-card">Error: ${esc(error.message)}</div>`; return; }
    products = (data || []).sort((a,b)=>(Number(a.orden)||0)-(Number(b.orden)||0) || String(a.created_at||"").localeCompare(String(b.created_at||""))); orderDirty=false; renderAdminList(); refreshSuggestions();
  }

  function renderAdminList(){
    const q = adminSearch.value.trim().toLowerCase();
    const list = products.filter(p => [p.marca,p.modelo,p.procesador,p.estado].join(" ").toLowerCase().includes(q));
    $("adminCount").textContent = `${list.length} producto${list.length===1?"":"s"}`;
    if(!list.length){ adminList.innerHTML='<div class="status-card">No hay productos.</div>'; return; }
    adminList.innerHTML = list.map(p => {
      const img = p.imagenes?.[0] ? `<img src="${publicUrl(p.imagenes[0])}" alt="">` : `<div class="mini-placeholder">RM</div>`;
      return `<article class="admin-item" data-id="${p.id}">
        ${img}
        <div><h3>${esc(p.marca)} ${esc(p.modelo)}</h3><p>${esc(p.procesador || "")} · ${esc(p.ram || "")}</p></div>
        <div class="order-buttons"><button type="button" class="order-arrow" data-move="up" data-product="${esc(p.id)}" aria-label="Subir ${esc(p.modelo)}" title="Subir">↑</button><button type="button" class="order-arrow" data-move="down" data-product="${esc(p.id)}" aria-label="Bajar ${esc(p.modelo)}" title="Bajar">↓</button><small>${esc(p.estado)}${p.publicado ? "" : " · Oculto"}</small></div>
      </article>`;
    }).join("");
  }

  adminSearch.addEventListener("input",renderAdminList);
  adminList.addEventListener("click",e=>{
    const move=e.target.closest("[data-move]");
    if(move){e.stopPropagation(); moveProduct(move.dataset.product,move.dataset.move);return;}
    const item=e.target.closest("[data-id]"); if(item) editProduct(item.dataset.id);
  });

  function editProduct(id){
    const p=products.find(x=>String(x.id)===String(id)); if(!p)return;
    $("productId").value=p.id; $("marca").value=p.marca||""; $("modelo").value=p.modelo||"";
    $("categoria").value=p.categoria||"Laptop"; $("estado").value=p.estado||"Disponible";
    $("procesador").value=p.procesador||""; $("ram").value=p.ram||""; $("almacenamiento").value=p.almacenamiento||"";
    parseScreen(p.pantalla||""); $("graficos").value=p.graficos||""; $("precio").value=p.precio??"";
    $("condicion").value=p.condicion||""; $("bateria").value=p.bateria||""; $("descripcion").value=p.descripcion||"";
    $("incluye").value=p.incluye||""; $("orden").value=p.orden??0; $("destacado").checked=!!p.destacado; $("publicado").checked=!!p.publicado;
    currentImagePaths=[...(p.imagenes||[])]; renderExistingImages();
    formTitle.textContent="Editar producto"; deleteBtn.hidden=false; setMsg(formMessage,"");
    refreshSuggestions(); window.scrollTo({top:0,behavior:"smooth"});
  }

  function resetForm(){
    productForm.reset(); $("pantallaExtra").value=""; $("productId").value=""; $("orden").value=0; $("publicado").checked=true;
    currentImagePaths=[]; renderExistingImages(); refreshSuggestions(); formTitle.textContent="Nuevo producto"; deleteBtn.hidden=true; setMsg(formMessage,"");
  }
  $("resetFormBtn").addEventListener("click",resetForm);

  function renderExistingImages(){
    existingImages.innerHTML=currentImagePaths.map((p,i)=>`<div class="thumb"><img src="${publicUrl(p)}" alt="Foto"><button type="button" data-remove-image="${i}" title="Quitar">×</button></div>`).join("");
  }
  existingImages.addEventListener("click",e=>{
    const btn=e.target.closest("[data-remove-image]"); if(!btn)return;
    currentImagePaths.splice(Number(btn.dataset.removeImage),1); renderExistingImages();
  });

  async function compressImage(file){
    if(!file.type.startsWith("image/")) throw new Error("Archivo no válido.");
    const bitmap=await createImageBitmap(file);
    const max=1600;
    const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
    const w=Math.max(1,Math.round(bitmap.width*scale)), h=Math.max(1,Math.round(bitmap.height*scale));
    const canvas=document.createElement("canvas"); canvas.width=w; canvas.height=h;
    canvas.getContext("2d",{alpha:false}).drawImage(bitmap,0,0,w,h);
    bitmap.close?.();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",0.82));
    if(!blob) throw new Error("No se pudo optimizar una imagen.");
    return new File([blob],`${crypto.randomUUID()}.webp`,{type:"image/webp"});
  }

  async function uploadFiles(productId, files){
    const paths=[];
    for(const raw of files){
      setMsg(formMessage,`Optimizando y subiendo ${raw.name}…`);
      const file=await compressImage(raw);
      if(file.size > 5*1024*1024) throw new Error("Una imagen supera 5 MB incluso después de optimizarla.");
      const path=`${productId}/${Date.now()}-${file.name}`;
      const { error }=await client.storage.from(bucket).upload(path,file,{contentType:"image/webp",upsert:false});
      if(error) throw error;
      paths.push(path);
    }
    return paths;
  }

  function payload(){
    const price=$("precio").value.trim();
    return {
      marca:$("marca").value.trim(),
      modelo:$("modelo").value.trim(),
      categoria:$("categoria").value,
      estado:$("estado").value,
      procesador:$("procesador").value.trim()||null,
      ram:$("ram").value.trim()||null,
      almacenamiento:$("almacenamiento").value.trim()||null,
      pantalla:buildScreen()||null,
      graficos:$("graficos").value.trim()||null,
      precio:price===""?null:Number(price),
      condicion:$("condicion").value.trim()||null,
      bateria:$("bateria").value.trim()||null,
      descripcion:$("descripcion").value.trim()||null,
      incluye:$("incluye").value.trim()||null,
      destacado:$("destacado").checked,
      publicado:$("publicado").checked,
      orden:Number($("orden").value||0)
    };
  }

  productForm.addEventListener("submit",async e=>{
    e.preventDefault(); setMsg(formMessage,"Guardando…");
    const id=$("productId").value;
    const data=payload();
    let productId=id;

    try{
      if(!id){
        const { data:created,error }=await client.from("productos").insert(data).select("id").single();
        if(error)throw error;
        productId=created.id;
      }else{
        const { error }=await client.from("productos").update(data).eq("id",id);
        if(error)throw error;
      }

      const files=Array.from($("imagenes").files||[]);
      if(currentImagePaths.length+files.length>10) throw new Error("Máximo 10 imágenes por producto.");
      const uploaded=files.length?await uploadFiles(productId,files):[];
      const finalPaths=[...currentImagePaths,...uploaded];

      const { error:updateImages }=await client.from("productos").update({imagenes:finalPaths}).eq("id",productId);
      if(updateImages)throw updateImages;

      setMsg(formMessage,"Producto guardado correctamente.","success");
      await loadProducts(); editProduct(productId); $("imagenes").value="";
    }catch(err){
      console.error(err); setMsg(formMessage,err.message||"No se pudo guardar el producto.","error");
    }
  });

  deleteBtn.addEventListener("click",async()=>{
    const id=$("productId").value; if(!id)return;
    if(!confirm("¿Eliminar este producto? Esta acción también eliminará sus fotos."))return;
    setMsg(formMessage,"Eliminando…");
    try{
      if(currentImagePaths.length){
        const { error:storageError }=await client.storage.from(bucket).remove(currentImagePaths);
        if(storageError)throw storageError;
      }
      const { error }=await client.from("productos").delete().eq("id",id);
      if(error)throw error;
      resetForm(); await loadProducts(); setMsg(formMessage,"Producto eliminado.","success");
    }catch(err){setMsg(formMessage,err.message||"No se pudo eliminar.","error");}
  });

  refreshSuggestions();
  client.auth.getSession().then(({data})=>showForSession(data.session));
})();
