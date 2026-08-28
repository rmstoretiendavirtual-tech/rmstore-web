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
    products = data || []; renderAdminList();
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
        <span class="status-dot">${esc(p.estado)}${p.publicado ? "" : " · Oculto"}</span>
      </article>`;
    }).join("");
  }

  adminSearch.addEventListener("input",renderAdminList);
  adminList.addEventListener("click",e=>{
    const item=e.target.closest("[data-id]"); if(item) editProduct(item.dataset.id);
  });

  function editProduct(id){
    const p=products.find(x=>String(x.id)===String(id)); if(!p)return;
    $("productId").value=p.id; $("marca").value=p.marca||""; $("modelo").value=p.modelo||"";
    $("categoria").value=p.categoria||"Laptop"; $("estado").value=p.estado||"Disponible";
    $("procesador").value=p.procesador||""; $("ram").value=p.ram||""; $("almacenamiento").value=p.almacenamiento||"";
    $("pantalla").value=p.pantalla||""; $("graficos").value=p.graficos||""; $("precio").value=p.precio??"";
    $("condicion").value=p.condicion||""; $("bateria").value=p.bateria||""; $("descripcion").value=p.descripcion||"";
    $("incluye").value=p.incluye||""; $("orden").value=p.orden??0; $("destacado").checked=!!p.destacado; $("publicado").checked=!!p.publicado;
    currentImagePaths=[...(p.imagenes||[])]; renderExistingImages();
    formTitle.textContent="Editar producto"; deleteBtn.hidden=false; setMsg(formMessage,"");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function resetForm(){
    productForm.reset(); $("productId").value=""; $("orden").value=0; $("publicado").checked=true;
    currentImagePaths=[]; renderExistingImages(); formTitle.textContent="Nuevo producto"; deleteBtn.hidden=true; setMsg(formMessage,"");
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
      pantalla:$("pantalla").value.trim()||null,
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

  client.auth.getSession().then(({data})=>showForSession(data.session));
})();
