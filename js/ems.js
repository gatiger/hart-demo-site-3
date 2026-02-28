// EMS page JSON-driven rendering
document.addEventListener("DOMContentLoaded", () => {
  initEmsPage();
});

async function initEmsPage(){
  const sub = document.getElementById("emsSub");
  try{
    const res = await fetch("/content/ems.json", { cache: "no-store" });
    if(!res.ok) throw new Error("Failed to load content/ems.json");
    const data = await res.json();

    // Top subtext
    if(sub) sub.textContent = safeText(data.subtitle) || "";

    renderHero(data.hero || {});
    renderStaff(data.staff || {});
    renderAbout(data.about || {});
  }catch(err){
    if(sub) sub.textContent = "Unable to load EMS content.";
    console.error(err);
  }
}

function renderAbout(about){
  const titleEl = document.getElementById("emsAboutTitle");
  const textEl  = document.getElementById("emsAboutText");

  if(titleEl) titleEl.textContent = safeText(about.title) || "What EMS Does";
  if(textEl)  textEl.textContent  = safeText(about.text) || "";
}

function renderHero(hero){
  const titleEl = document.getElementById("emsHeroTitle");
  const leftEl  = document.getElementById("emsHeroLeft");
  const rightEl = document.getElementById("emsHeroRight");
  const ctasEl  = document.getElementById("emsHeroCtas");

  if(titleEl) titleEl.textContent = safeText(hero.title) || "Hart County EMS";

  console.log("HERO OBJECT:", hero);
console.log("ADDRESS:", hero.address);
console.log("ELS:", {
  streetEl: !!document.getElementById("emsStreet"),
  cityEl: !!document.getElementById("emsCityStateZip")
});

    // Address fields (center column)
  const streetEl = document.getElementById("emsStreet");
  const cityEl   = document.getElementById("emsCityStateZip");

  if(streetEl){
    streetEl.textContent = safeText(hero.address?.street) || "";
  }

  if(cityEl){
    const city  = safeText(hero.address?.city);
    const state = safeText(hero.address?.state);
    const zip   = safeText(hero.address?.zip);

    const cityState = [city, state].filter(Boolean).join(", ");
    cityEl.textContent = cityState + (zip ? " " + zip : "");
  }

  // Left image
  if(leftEl){
    leftEl.innerHTML = "";
    const src = safeText(hero.leftImage?.src);
    if(src){
      const img = document.createElement("img");
      img.src = src;
      img.alt = safeText(hero.leftImage?.alt) || "EMS photo";
      img.loading = "lazy";
      leftEl.appendChild(img);
    }else{
      leftEl.innerHTML = `<div class="muted">Add hero.leftImage.src in ems.json</div>`;
    }
  }

  // Right image
  if(rightEl){
    rightEl.innerHTML = "";
    const src = safeText(hero.rightImage?.src);
    if(src){
      const img = document.createElement("img");
      img.src = src;
      img.alt = safeText(hero.rightImage?.alt) || "EMS photo";
      img.loading = "lazy";
      rightEl.appendChild(img);
    }else{
      rightEl.innerHTML = `<div class="muted">Add hero.rightImage.src in ems.json</div>`;
    }
  }

  // CTA buttons
  if(ctasEl){
    ctasEl.innerHTML = "";
    const buttons = Array.isArray(hero.buttons) ? hero.buttons : [];
    buttons
      .filter(b => b && b.enabled !== false)
      .slice(0, 4)
      .forEach(b => {
        const a = document.createElement("a");
        a.className = (b.variant === "ghost") ? "btn ghost" : "btn";
        a.textContent = safeText(b.label) || "Learn more";

        const href = safeText(b.href);
        a.href = href || "#";

        // external/new tab support
        if(b.newTab === true){
          a.target = "_blank";
          a.rel = "noopener noreferrer";
        }

        // Accessible label if provided
        const aria = safeText(b.ariaLabel);
        if(aria) a.setAttribute("aria-label", aria);

        ctasEl.appendChild(a);
      });
  }
}

function renderStaff(staff){
  const subEl = document.getElementById("emsStaffSub");
  const grid = document.getElementById("emsStaffGrid");
  if(!grid) return;

  if(subEl) subEl.textContent = safeText(staff.subtitle) || "";

  const people = Array.isArray(staff.people) ? staff.people : [];
  const visible = people.filter(p => p && p.enabled !== false).slice(0, 6);

  grid.innerHTML = visible.map(p => personCard(p)).join("");

  // If fewer than 1 person, show helper text
  if(visible.length === 0){
    grid.innerHTML = `<div class="muted">Add staff.people items in content/ems.json</div>`;
  }
}

function personCard(p){
  const name = safeText(p.name) || "Name";
  const title = safeText(p.title) || "";
  const phone = safeText(p.phone) || "";
  const fax = safeText(p.fax) || "";
  const imgSrc = safeText(p.photo?.src) || "";
  const imgAlt = safeText(p.photo?.alt) || `${name} photo`;

  const phoneLink = phone
  ? `<div><a href="tel:${telHref(phone)}" aria-label="Call ${name}">${escapeHtml(phone)}</a></div>`
  : "";

const faxLine = fax
  ? `<div>Fax: ${escapeHtml(fax)}</div>`
  : "";

  return `
    <article class="emsPerson">
      <div class="emsPhoto">
        ${imgSrc
          ? `<img src="${escapeAttr(imgSrc)}" alt="${escapeAttr(imgAlt)}" loading="lazy">`
          : `<div class="muted">Add photo.src</div>`
        }
      </div>
      <div class="emsBody">
        <h3 class="emsName">${escapeHtml(name)}</h3>
        ${title ? `<div class="emsTitle">${escapeHtml(title)}</div>` : `<div class="emsTitle muted"> </div>`}
        <div class="emsMeta">
          ${phoneLink}
          ${faxLine}
        </div>
      </div>
    </article>
  `;
}

function safeText(v){
  return (v === undefined || v === null) ? "" : String(v).trim();
}

function telHref(phone){
  // keep digits and leading +
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
  // same as escapeHtml for our use
  return escapeHtml(str);

}

