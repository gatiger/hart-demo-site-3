const DEMO = {
  alert: {
    id: "water-advisory",
    title: "County Alert: Boil Water Advisory (Demo)",
    body: "Impacts portions of Hartwell-area lines. Crews are flushing mains. Next update scheduled at 3:00 PM.",
    updated: "Updated today"
  },
  announcements: [
    { id: 1, type: "Press",  tag: "info",    title: "Hart County launches new service directory (Demo)", date: "Feb 18, 2026", body: "A redesigned hub makes it easier to find departments, forms, and frequently requested services." },
    { id: 2, type: "Project",tag: "project", title: "Courthouse parking improvements begin next week (Demo)", date: "Feb 17, 2026", body: "Work will be phased to maintain access. Temporary signage will be posted daily." },
    { id: 3, type: "Alert",  tag: "alert",   title: "Weather readiness update: county resources (Demo)", date: "Feb 16, 2026", body: "Check road updates, emergency contacts, and facility closures in one place." },
    { id: 4, type: "Press",  tag: "info",    title: "Tax digest public notice posted (Demo)", date: "Feb 14, 2026", body: "Notice is available under Documents → Budget & Finance." }
  ],
  meetings: [
    { id: "m1", when: "Feb 25, 2026 • 6:00 PM", where: "Administration Building • Main Hearing Room", title: "Board of Commissioners – Regular Session (Demo)", status: "Upcoming" },
    { id: "m2", when: "Mar 4, 2026 • 5:30 PM", where: "Administration Building • Conference A", title: "Planning Commission – Work Session (Demo)", status: "Upcoming" },
    { id: "m3", when: "Feb 11, 2026 • 6:00 PM", where: "Administration Building • Main Hearing Room", title: "Board of Commissioners – Regular Session (Demo)", status: "Past" }
  ]
};

function byId(id){ return document.getElementById(id); }

function setActiveNav(){
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  document.querySelectorAll(".sideNav a").forEach(a=>{
    const href = (a.getAttribute("href")||"").toLowerCase();
    a.classList.toggle("active", href === path);
  });
}

/* Accessible toast: dismissible + longer default */
function toast(title, body, ms = 8000){
  const t = byId("toast");
  if(!t) return;

  const tt = t.querySelector(".tTitle");
  const tb = t.querySelector(".tBody");
  if(tt) tt.textContent = title;
  if(tb) tb.textContent = body;

  t.classList.add("show");

  const closeBtn = byId("toastClose");
  if(closeBtn){
    closeBtn.onclick = () => t.classList.remove("show");
  }

  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=> t.classList.remove("show"), ms);
}

function renderAlert(){
  const holder = byId("alertHolder");
  if(!holder) return;

  const dismissed = sessionStorage.getItem("dismissed_alert") === DEMO.alert.id;
  if(dismissed){
    holder.innerHTML = `
      <div class="card" role="region" aria-label="Alert dismissed notice">
        <div class="cardHeader">
          <div>
            <h2>Alert hidden</h2>
            <p class="sub">You dismissed the demo alert for this session.</p>
          </div>
          <button class="btn" id="showAlert" type="button">Show alert</button>
        </div>
      </div>
    `;
    const b = byId("showAlert");
    b?.addEventListener("click", ()=>{
      sessionStorage.removeItem("dismissed_alert");
      holder.innerHTML = "";
      renderAlert();
      toast("Alert restored", "The demo alert is visible again.");
    });
    return;
  }

  holder.innerHTML = `
    <div class="alertBar" role="status" aria-live="polite" aria-atomic="true">
      <div>
        <strong>${DEMO.alert.title}</strong>
        <div class="muted">${DEMO.alert.body} <span>(${DEMO.alert.updated})</span></div>
      </div>
      <button class="x" id="dismissAlert" type="button" aria-label="Dismiss alert">Dismiss</button>
    </div>
  `;

  byId("dismissAlert")?.addEventListener("click", ()=>{
    sessionStorage.setItem("dismissed_alert", DEMO.alert.id);
    holder.innerHTML = "";
    renderAlert();
    toast("Alert dismissed (demo).", "This only hides it for this browser session.");
  });
}

function renderAnnouncements(list){
  const holder = byId("announcementsList");
  if(!holder) return;

  holder.innerHTML = list.map(a => `
    <article class="item" aria-label="Announcement">
      <div class="itemTop">
        <h3 class="itemTitle">${a.title}</h3>
        <span class="tag ${a.tag}">${a.type}</span>
      </div>
      <div class="meta">
        <span>${a.date}</span>
        <span>•</span>
        <span>${a.body}</span>
      </div>
    </article>
  `).join("");
}

function renderMeetings(list){
  const holder = byId("meetingsList");
  if(!holder) return;

  holder.innerHTML = list.map(m => `
    <article class="item" aria-label="Meeting">
      <div class="itemTop">
        <h3 class="itemTitle">${m.title}</h3>
        <span class="tag ${m.status === "Upcoming" ? "info" : ""}">${m.status}</span>
      </div>
      <div class="meta">
        <span>${m.when}</span>
        <span>•</span>
        <span>${m.where}</span>
      </div>
      <div class="btnRow" style="margin-top:10px">
        <button class="btn" type="button" data-dl="agenda:${m.id}">Agenda</button>
        <button class="btn" type="button" data-dl="packet:${m.id}">${m.status === "Upcoming" ? "Packet" : "Minutes"}</button>
        <a class="btn ghost" href="meetings.html">View all</a>
      </div>
    </article>
  `).join("");

  holder.querySelectorAll("[data-dl]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      toast("Demo download", "In the real site, this would download the agenda/packet PDF.");
    });
  });
}

/* NEWS page behavior */
function initNewsPage(){
  const holder = byId("newsList");
  if(!holder) return;

  const pills = document.querySelectorAll(".pill");
  const search = byId("newsSearch");

  let filter = "All";
  let term = "";

  const apply = ()=>{
    let items = DEMO.announcements.slice();

    if(filter !== "All"){
      items = items.filter(x => x.type === filter);
    }
    if(term.trim()){
      const t = term.trim().toLowerCase();
      items = items.filter(x =>
        (x.title + " " + x.body).toLowerCase().includes(t)
      );
    }

    holder.innerHTML = items.map(a => `
      <article class="item" aria-label="News post">
        <div class="itemTop">
          <h3 class="itemTitle">${a.title}</h3>
          <span class="tag ${a.tag}">${a.type}</span>
        </div>
        <div class="meta">
          <span>${a.date}</span>
          <span>•</span>
          <span>${a.body}</span>
        </div>
        <div class="btnRow" style="margin-top:10px">
          <button class="btn primary" type="button" data-open="${a.id}">Open</button>
          <button class="btn" type="button" data-share="${a.id}">Copy Link</button>
        </div>
      </article>
    `).join("");

    holder.querySelectorAll("[data-open]").forEach(b=>{
      b.addEventListener("click", ()=> toast("Demo article view", "In production, this opens the full post page."));
    });

    holder.querySelectorAll("[data-share]").forEach(b=>{
      b.addEventListener("click", async ()=>{
        const url = location.href.split("#")[0] + "#item-" + b.getAttribute("data-share");
        try{
          await navigator.clipboard.writeText(url);
          toast("Link copied", "Demo link copied to clipboard.");
        }catch(e){
          toast("Copy failed", "Your browser blocked clipboard access.");
        }
      });
    });
  };

  pills.forEach(p=>{
    p.addEventListener("click", ()=>{
      pills.forEach(x=> x.classList.remove("active"));
      p.classList.add("active");
      filter = p.getAttribute("data-filter");
      apply();
    });
  });

  if(search){
    search.addEventListener("input", ()=>{
      term = search.value;
      apply();
    });
  }

  apply();
}

/* MEETINGS page behavior */
function initMeetingsPage(){
  const up = byId("upcomingMeetings");
  const past = byId("pastMeetings");
  if(!up || !past) return;

  const upcoming = DEMO.meetings.filter(m=> m.status === "Upcoming");
  const pastList = DEMO.meetings.filter(m=> m.status === "Past");

  const row = (m, isPast=false) => `
    <article class="item" aria-label="Meeting">
      <div class="itemTop">
        <h3 class="itemTitle">${m.title}</h3>
        <span class="tag ${isPast ? "" : "info"}">${m.status}</span>
      </div>
      <div class="meta">
        <span>${m.when}</span>
        <span>•</span>
        <span>${m.where}</span>
      </div>
      <div class="btnRow" style="margin-top:10px">
        <button class="btn" type="button" data-dl="agenda:${m.id}">Agenda</button>
        <button class="btn" type="button" data-dl="packet:${m.id}">${isPast ? "Minutes" : "Packet"}</button>
        <button class="btn primary" type="button" data-add="${m.id}">Add to Calendar</button>
      </div>
    </article>
  `;

  up.innerHTML = upcoming.map(m=> row(m,false)).join("");
  past.innerHTML = pastList.map(m=> row(m,true)).join("");

  document.querySelectorAll("[data-add]").forEach(btn=>{
    btn.addEventListener("click", ()=> toast("Demo calendar", "In production, this would download an .ics calendar file."));
  });
  document.querySelectorAll("[data-dl]").forEach(btn=>{
    btn.addEventListener("click", ()=> toast("Demo download", "In production, this would download the agenda/packet/minutes PDF."));
  });
}

/* CONTACT page behavior */
function initContact(){
  const form = byId("contactForm");
  if(!form) return;

  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    toast("Message sent (demo)", "For the demo, this does not send email—just shows the interaction.", 9000);
    form.reset();
  });

  document.querySelectorAll("[data-action='hours']").forEach(btn=>{
    btn.addEventListener("click", ()=> toast("Demo", "In production, this would show office hours and locations."));
  });
}

/* Seal fallback (no crashing) */
function initSealFallback(){
  const img = byId("sealImg");
  img?.addEventListener("error", () => {
    const box = byId("sealBox");
    if(!box) return;
    box.textContent = "HC";
    box.style.fontWeight = "900";
  });
}

/* Keep focused sidebar nav items visible (keyboard + Shift+Tab) */
function initSidebarFocusScroll(){
  document.addEventListener("focusin", (e) => {
    const el = e.target;
    if(!el || !el.closest) return;

    const sidebar = el.closest(".sidebar");
    if(!sidebar) return;

    const r = el.getBoundingClientRect();
    const sr = sidebar.getBoundingClientRect();

    const outOfView = (r.top < sr.top + 8) || (r.bottom > sr.bottom - 8);
    if(outOfView && el.scrollIntoView){
      el.scrollIntoView({ block: "nearest" });
    }
  });
}

function setActiveTopNav(){
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".topNav a, .menuNav a, .sideNav a").forEach(a=>{
    const href = (a.getAttribute("href")||"").toLowerCase();
    a.classList.toggle("active", href === path);
  });
}

function initMobileMenu(){
  const btn = document.getElementById("menuBtn");
  const panel = document.getElementById("mobileMenu");
  const close = document.getElementById("menuClose");
  const backdrop = document.getElementById("menuBackdrop");
  if(!btn || !panel || !close || !backdrop) return;

  let lastFocus = null;

  const getFocusable = () => {
    const selectors = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ];
    return Array.from(panel.querySelectorAll(selectors.join(",")))
      .filter(el => el.offsetParent !== null); // visible
  };

  const openMenu = () => {
    lastFocus = document.activeElement;

    panel.hidden = false;
    backdrop.hidden = false;
    btn.setAttribute("aria-expanded", "true");

    // Focus close first (feels natural + matches your request)
    close.focus();
  };

  const closeMenu = () => {
    panel.hidden = true;
    backdrop.hidden = true;
    btn.setAttribute("aria-expanded", "false");

    // Restore focus to the opener
    (lastFocus && lastFocus.focus) ? lastFocus.focus() : btn.focus();
  };

  btn.addEventListener("click", () => {
    const expanded = btn.getAttribute("aria-expanded") === "true";
    expanded ? closeMenu() : openMenu();
  });

  close.addEventListener("click", closeMenu);
  backdrop.addEventListener("click", closeMenu);

  // Close when clicking a link
  panel.addEventListener("click", (e) => {
    if(e.target && e.target.matches("a")) closeMenu();
  });

  // ✅ Focus trap + Escape
  document.addEventListener("keydown", (e) => {
    if(panel.hidden) return;

    if(e.key === "Escape"){
      e.preventDefault();
      closeMenu();
      return;
    }

    if(e.key !== "Tab") return;

    const focusables = getFocusable();
    if(focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    // If tabbing forward on last item → go to Close
    if(!e.shiftKey && document.activeElement === last){
      e.preventDefault();
      close.focus();
      return;
    }

    // If shift+tab on Close (or first item) → go to last item
    if(e.shiftKey && (document.activeElement === close || document.activeElement === first)){
      e.preventDefault();
      last.focus();
      return;
    }
  });
}


document.addEventListener("DOMContentLoaded", ()=>{
  setActiveTopNav();     // was setActiveNav()
  initMobileMenu();      // <-- add this

  initSealFallback();
  initSidebarFocusScroll();

  renderAlert();

  // homepage
  renderAnnouncements(DEMO.announcements.slice(0,3));
  renderMeetings(DEMO.meetings.filter(m=> m.status === "Upcoming").slice(0,2));

  initNewsPage();
  initMeetingsPage();
  initContact();

  // Generic toast buttons
  document.querySelectorAll("[data-toast]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const raw = el.getAttribute("data-toast") || "";
      const [t,b] = raw.split("|");
      toast(t || "Demo", b || "Action triggered.");
    });
  });
});

