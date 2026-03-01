document.addEventListener("DOMContentLoaded", () => {
  initPublicWorks();
});

async function initPublicWorks(){
  const sub = document.getElementById("pwSub");

  try{
    const res = await fetch("/content/publicworks.json", { cache: "no-store" });
    if(!res.ok) throw new Error("Failed to load /content/publicworks.json");
    const data = await res.json();

    if(sub) sub.textContent = safeText(data.subtitle) || "";

    renderHero(data.hero || {});
    renderAbout(data.about || {});
    renderServices(data.services || {});
    renderStaff(data.staff || {});
  }catch(err){
    if(sub) sub.textContent = "Unable to load Public Works content.";
    console.error(err);
  }
}

function renderHero(hero){
  const titleEl = document.getElementById("pwHeroTitle");
  const leftEl  = document.getElementById("pwHeroLeft");
  const rightEl = document.getElementById("pwHeroRight");
  const ctasEl  = document.getElementById("pwHeroCtas");

  if(titleEl) titleEl.textContent = safeText(hero.title) || "Hart County Public Works";

  // Address
  const streetEl = document.getElementById("pwStreet");
  const cityEl   = document.getElementById("pwCityStateZip");

  if(streetEl) streetEl.textContent = safeText(hero.address?.street) || "";
  if(cityEl){
    const city  = safeText(hero.address?.city);
    const state = safeText(hero.address?.state);
    const zip   = safeText(hero.address?.zip);
    const cityState = [city, state].filter(Boolean).join(", ");
    cityEl.textContent = cityState + (zip ? " " + zip : "");
  }

  // Images
  injectImg(leftEl, hero.leftImage?.src, hero.leftImage?.alt || "Public Works photo");
  injectImg(rightEl, hero.rightImage?.src, hero.rightImage?.alt || "Public Works photo");

  // Buttons
  if(ctasEl){
    ctasEl.innerHTML = "";
    const buttons = Array.isArray(hero.buttons) ? hero.buttons : [];
    buttons.filter(b => b && b.enabled !== false).slice(0, 6).forEach(b => {
      const a = document.createElement("a");
      a.className = (b.variant === "ghost") ? "btn ghost" : "btn";
      a.textContent = safeText(b.label) || "Learn more";
      a.href = safeText(b.href) || "#";
      if(b.newTab === true){
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
      const aria = safeText(b.ariaLabel);
      if(aria) a.setAttribute("aria-label", aria);
      ctasEl.appendChild(a);
    });
  }
}

function renderAbout(about){
  const titleEl = document.getElementById("pwAboutTitle");
  const textEl  = document.getElementById("pwAboutText");
  if(titleEl) titleEl.textContent = safeText(about.title) || "What Public Works Does";
  if(textEl){
  const lines = Array.isArray(about.text) ? about.text : [about.text];
  textEl.innerHTML = lines
    .filter(Boolean)
    .map(p => `<p>${escapeHtml(safeText(p))}</p>`)
    .join("");
}
}

function renderServices(services){
  const subEl = document.getElementById("pwServicesSub");
  const grid  = document.getElementById("pwServicesGrid");
  if(!grid) return;

  if(subEl) subEl.textContent = safeText(services.subtitle) || "";

  const items = Array.isArray(services.items) ? services.items : [];
  const visible = items.filter(x => x && x.enabled !== false);

  grid.innerHTML = visible.map(s => `
    <article class="pwService">
      <h3>${escapeHtml(safeText(s.title) || "Service")}</h3>
      <p>${escapeHtml(safeText(s.text) || "")}</p>
    </article>
  `).join("");
}

function renderStaff(staff){
  const subEl = document.getElementById("pwStaffSub");
  const grid  = document.getElementById("pwStaffGrid");
  if(!grid) return;

  if(subEl) subEl.textContent = safeText(staff.subtitle) || "";

  const people = Array.isArray(staff.people) ? staff.people : [];
  const visible = people.filter(p => p && p.enabled !== false).slice(0, 12);

  grid.innerHTML = visible.map(p => staffCard(p)).join("");
}

function staffCard(p){
  const name  = safeText(p.name) || "Name";
  const title = safeText(p.title) || "";
  const phone = safeText(p.phone) || "";
  const fax   = safeText(p.fax) || "";
  const info  = safeText(p.info) || "";
  const imgSrc = safeText(p.photo?.src) || "";
  const imgAlt = safeText(p.photo?.alt) || `${name} photo`;

  const phoneLine = phone ? `<div><a href="tel:${telHref(phone)}">${escapeHtml(phone)}</a></div>` : "";
  const faxLine   = fax ? `<div>Fax: ${escapeHtml(fax)}</div>` : "";
  const metaBlock = (phone || fax) ? `<div class="pwMeta">${phoneLine}${faxLine}</div>` : "";

  return `
    <article class="pwPerson">
      <div class="pwPhoto">
        ${imgSrc ? `<img src="${escapeAttr(imgSrc)}" alt="${escapeAttr(imgAlt)}" loading="lazy">`
                : `<div class="muted">Add photo.src</div>`}
      </div>
      <div class="pwBody">
        <h3 class="pwName">${escapeHtml(name)}</h3>
        ${title ? `<div class="pwTitle">${escapeHtml(title)}</div>` : `<div class="pwTitle muted"></div>`}
        ${metaBlock}
        ${info ? `<div class="pwInfo">${escapeHtml(info)}</div>` : ``}
      </div>
    </article>
  `;
}

function injectImg(holder, src, alt){
  if(!holder) return;
  holder.innerHTML = "";
  const s = safeText(src);
  if(!s){
    holder.innerHTML = `<div class="muted">Add image src</div>`;
    return;
  }
  const img = document.createElement("img");
  img.src = s;
  img.alt = safeText(alt) || "Image";
  img.loading = "lazy";
  holder.appendChild(img);
}

function safeText(v){
  return (v === undefined || v === null) ? "" : String(v).trim();
}
function telHref(phone){
  return String(phone).replace(/[^\d+]/g, "");
}
function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function escapeAttr(str){
  return escapeHtml(str);
}