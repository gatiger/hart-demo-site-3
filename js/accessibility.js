document.addEventListener("DOMContentLoaded", initAccessibility);

async function initAccessibility(){
  const mount = document.getElementById("accessibilityContent");
  if(!mount) return;

  try{
    const res = await fetch("./content/accessibility.json");
    const data = await res.json();

    renderAccessibility(data);

  }catch(err){
    console.error(err);
    mount.innerHTML = `<p class="muted">Unable to load accessibility information.</p>`;
  }
}

function renderAccessibility(data){

  const mount = document.getElementById("accessibilityContent");

  let html = `
    <div class="pageHead">
      <h1 class="pageTitle">${data.title}</h1>
      <p class="pageSub">${data.subtitle}</p>
    </div>
  `;

  data.sections.forEach(section => {

    html += `
      <section class="card">
        <div class="cardHead">
          <h2 class="cardTitle">${section.title}</h2>
        </div>

        <div class="prose">
    `;

    if(section.paragraphs){
      section.paragraphs.forEach(p=>{
        html += `<p>${p}</p>`;
      });
    }

    if(section.list){
      html += `<ul>`;
      section.list.forEach(item=>{
        html += `<li>${item}</li>`;
      });
      html += `</ul>`;
    }

    html += `
        </div>
      </section>
    `;
  });

  html += `
    <section class="card">
      <div class="cardHead">
        <h2 class="cardTitle">${data.contact.title}</h2>
      </div>

      <div class="prose">
        <p>
          ${data.contact.name}<br>
          ${data.contact.street}<br>
          ${data.contact.city}, ${data.contact.state} ${data.contact.zip}
        </p>

        <p>
          Phone: <a href="tel:${data.contact.phone.replace(/[^0-9]/g,'')}">${data.contact.phone}</a>
        </p>

        <p class="muted">
          Last updated: ${data.lastUpdated}
        </p>
      </div>
    </section>
  `;

  mount.innerHTML = html;
}