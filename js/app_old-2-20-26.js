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

function setActiveTopNav(){
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".topNav a, .menuNav a").forEach(a=>{
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
    byId("showAlert")?.addEventListener("click", ()=>{
      sessionStorage.removeItem("dismissed_alert");
      holder.innerHTML = "";
      renderAlert();
      initJumpToAlerts(); // rebind (alert DOM changed)
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
    initJumpToAlerts(); // rebind (alert DOM changed)
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

/**
 * Stabilize keyboard tabbing at 400% zoom:
 * - If focus moves offscreen or is barely visible, scroll it into view instantly.
 * - Do NOT interfere with the mobile menu focus trap.
 */
function initKeyboardScrollStabilizer(){
  let last = { el: null, t: 0 };

  document.addEventListener("focusin", (e) => {
    const el = e.target;
    if(!el || !el.getBoundingClientRect) return;

    const panel = byId("mobileMenu");
    if(panel && !panel.hidden && el.closest("#mobileMenu")) return;
    if(panel && panel.hidden && el.closest("#mobileMenu")) return;

    const now = performance.now();
    if(last.el === el && (now - last.t) < 200) return;

    const r = el.getBoundingClientRect();
    const offscreen = (r.bottom < 0) || (r.top > window.innerHeight);
    const barelyVisible = (r.top < 12) || (r.bottom > window.innerHeight - 12);

    if(offscreen || barelyVisible){
      last = { el, t: now };
      el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
    }
  }, true);

  document.addEventListener("keydown", (e) => {
    if(e.key === "Tab"){
      document.documentElement.style.scrollBehavior = "auto";
    }
  }, true);
}

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
      filter = p.getAttribute("data-filter") || "All";
      apply();
    });
  });

  if(search){
    search.addEventListener("input", ()=>{
      term = search.value || "";
      apply();
    });
  }

  apply();
}

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

function initSealFallback(){
  const img = byId("sealImg");
  img?.addEventListener("error", () => {
    const box = byId("sealBox");
    if(!box) return;
    box.textContent = "HC";
    box.style.fontWeight = "900";
  });
}

/**
 * Mobile menu: focus trap only while open + Escape closes + restore focus + body scroll lock.
 */
function initMobileMenu(){
  const btn = byId("menuBtn");
  const panel = byId("mobileMenu");
  const close = byId("menuClose");
  const backdrop = byId("menuBackdrop");
  if(!btn || !panel || !close || !backdrop) return;

  let lastFocus = null;

  panel.setAttribute("role", panel.getAttribute("role") || "dialog");
  panel.setAttribute("aria-modal", panel.getAttribute("aria-modal") || "true");

  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

  const getFocusable = () => {
    const all = [close, ...Array.from(panel.querySelectorAll(focusableSelectors))];
    return Array.from(new Set(all)).filter(el => el && el.offsetParent !== null);
  };

  const setOpenState = (isOpen) => {
    panel.hidden = !isOpen;
    backdrop.hidden = !isOpen;
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    document.body.classList.toggle("menuOpen", isOpen);
  };

  const openMenu = () => {
    lastFocus = document.activeElement;
    setOpenState(true);
    close.focus();
  };

  const closeMenu = () => {
    setOpenState(false);
    (lastFocus && lastFocus.focus) ? lastFocus.focus() : btn.focus();
  };

  btn.addEventListener("click", () => {
    const expanded = btn.getAttribute("aria-expanded") === "true";
    expanded ? closeMenu() : openMenu();
  });

  close.addEventListener("click", closeMenu);
  backdrop.addEventListener("click", closeMenu);

  panel.addEventListener("click", (e) => {
    const t = e.target;
    if(t && t.matches && t.matches("a")) closeMenu();
  });

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

    if(!e.shiftKey && document.activeElement === last){
      e.preventDefault();
      first.focus();
      return;
    }
    if(e.shiftKey && document.activeElement === first){
      e.preventDefault();
      last.focus();
      return;
    }
  });
}

function initJumpToAlerts(){
  const btn = byId("jumpToAlerts");
  const holder = byId("alertHolder");
  if(!btn || !holder) return;

  if(!holder.hasAttribute("tabindex")){
    holder.setAttribute("tabindex","-1");
  }

  // Avoid double-binding if renderAlert() re-runs
  if(btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";

  btn.addEventListener("click", () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    holder.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start"
    });

    window.setTimeout(() => {
      try{ holder.focus({ preventScroll: true }); }catch(_){ holder.focus(); }
    }, reduce ? 0 : 250);
  });
}

document.addEventListener("DOMContentLoaded", ()=>{
  setActiveTopNav();
  initMobileMenu();
  initSealFallback();

  initKeyboardScrollStabilizer();

  renderAlert();
  initJumpToAlerts();

  // homepage
  renderAnnouncements(DEMO.announcements.slice(0,3));
  renderMeetings(DEMO.meetings.filter(m=> m.status === "Upcoming").slice(0,2));

  initNewsPage();
  initMeetingsPage();
  initContact();

  document.querySelectorAll("[data-toast]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const raw = el.getAttribute("data-toast") || "";
      const [t,b] = raw.split("|");
      toast(t || "Demo", b || "Action triggered.");
    });
  });
});
