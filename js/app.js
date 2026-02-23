// Content loader (file-based CMS style)
async function loadJSON(path){
  try{
    const res = await fetch(path, { cache: "no-store" });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }catch(e){
    console.error("Content load failed:", path, e);
    return null;
  }
}

/* -------------------------
   Mobile menu (WCAG-friendly)
-------------------------- */
function initMobileMenu(){
  const btn = document.getElementById("menuBtn");
  const panel = document.getElementById("mobileMenu");
  const close = document.getElementById("menuClose");
  const backdrop = document.getElementById("menuBackdrop");

  // If any piece is missing, don't crash—just skip.
  if(!btn || !panel || !close || !backdrop) return;

  let lastFocus = null;

  // Ensure consistent starting state
  panel.hidden = true;
  backdrop.hidden = true;
  btn.setAttribute("aria-expanded", "false");

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
    // Filter out hidden elements
    return Array.from(new Set(all)).filter(el => el && el.offsetParent !== null);
  };

  const setOpen = (open) => {
    panel.hidden = !open;
    backdrop.hidden = !open;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("menuOpen", open); // optional CSS: body.menuOpen{ overflow:hidden; }
  };

  const openMenu = () => {
    lastFocus = document.activeElement;
    setOpen(true);
    close.focus();
  };

  const closeMenu = () => {
    setOpen(false);
    if(lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    else btn.focus();
  };

  btn.addEventListener("click", () => {
    const expanded = btn.getAttribute("aria-expanded") === "true";
    expanded ? closeMenu() : openMenu();
  });

  close.addEventListener("click", closeMenu);
  backdrop.addEventListener("click", closeMenu);

  // Close when clicking a link in the menu
  panel.addEventListener("click", (e) => {
    const t = e.target;
    if(t && t.matches && t.matches("a")) closeMenu();
  });

  // Escape + focus trap
  document.addEventListener("keydown", (e) => {
    if(panel.hidden) return;

    if(e.key === "Escape"){
      e.preventDefault();
      closeMenu();
      return;
    }

    if(e.key !== "Tab") return;

    const focusables = getFocusable();
    if(!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if(!e.shiftKey && document.activeElement === last){
      e.preventDefault();
      first.focus();
    } else if(e.shiftKey && document.activeElement === first){
      e.preventDefault();
      last.focus();
    }
  });
}

/* -------------------------
   Renderers
-------------------------- */
function renderDirectory(items) {
  const list = document.getElementById("directoryList");
  if (!list) return;

  const safe = (v) => (v === undefined || v === null) ? "" : String(v).trim();

  const visible = (items || []).filter(d => d.enabled !== false);

  list.innerHTML = visible.map(d => {
    const name  = safe(d.name);
    const dept  = safe(d.department || d.dept || d.tag || "");
    const title = safe(d.title || d.role || "");

    const phone = safe(d.phone);
    const fax   = safe(d.fax);
    const email = safe(d.email);

    // Keep these separate on purpose:
    const pageUrl    = safe(d.url);       // internal page (recommended)
    const websiteUrl = safe(d.website);   // external site

    const hours = safe(d.hours);
    const desc  = safe(d.description);

    const telHref  = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "";
    const faxHref  = fax ? `tel:${fax.replace(/[^\d+]/g, "")}` : "";
    const mailHref = email ? `mailto:${email}` : "";

    // Normalize external website if provided
    const webHref = websiteUrl
      ? (websiteUrl.startsWith("http://") || websiteUrl.startsWith("https://")
          ? websiteUrl
          : `https://${websiteUrl}`)
      : "";

    // Title link preference: internal url first, then external website
    const titleHref = pageUrl || webHref;

    const metaParts = [];
    if (Array.isArray(d.phone)) {
  d.phone.forEach(num => {
    const clean = safe(num);
    if (!clean) return;
    const tel = `tel:${clean.replace(/[^\d+]/g, "")}`;
    metaParts.push(`<a href="${tel}" class="phone-link">${clean}</a>`);
  });
} else if (phone) {
  metaParts.push(`<a href="${telHref}" class="phone-link">${phone}</a>`);
}
    if (fax)   metaParts.push(`<a href="${faxHref}" class="phone-link">Fax: ${fax}</a>`);
    if (email) metaParts.push(`<a href="${mailHref}" class="link">Email ${name || "office"}</a>`);

    const displayTitle = title || name || "Unnamed";

    return `
      <article class="item" aria-label="${displayTitle}">
        <div class="itemTop">
          <div>
            <h3 class="itemTitle">
              ${titleHref
  ? `<a href="${titleHref}"
        class="title-link"
        ${titleHref.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""}>
        ${displayTitle}
        ${titleHref.startsWith("http") ? '<span class="sr-only"> (opens in a new tab)</span>' : ""}
     </a>`
  : displayTitle
}
            </h3>
            ${title && name ? `<div class="sub" style="margin-top:4px">${name}</div>` : ""}
            ${dept ? `<div class="sub" style="margin-top:4px">${dept}</div>` : ""}
          </div>
        </div>

        ${metaParts.length ? `<div class="meta">${metaParts.join(`<span>•</span>`)}</div>` : ""}

        ${hours ? `<div class="meta"><span>Hours: ${hours}</span></div>` : ""}

        ${desc ? `<p class="sub" style="margin-top:6px">${desc}</p>` : ""}
      </article>
    `;
  }).join("");

  // Disable phone links on desktop (no focus, no click)
const isDesktop = window.matchMedia("(min-width: 769px)").matches;

document.querySelectorAll("#directoryList .phone-link").forEach(a => {
  if (isDesktop) {
    a.setAttribute("tabindex", "-1");
    a.setAttribute("aria-hidden", "true");
  } else {
    a.removeAttribute("tabindex");
    a.removeAttribute("aria-hidden");
  }
});
}

function renderNews(items){
  const list = document.getElementById("newsList");
  if(!list) return;

  const safe = (v) => (v === undefined || v === null) ? "" : String(v).trim();
  const visible = (items || []).filter(n => n.enabled !== false);

  list.innerHTML = visible.map(n => {
    const title = safe(n.title);
    const date  = safe(n.date);
    const type  = safe(n.type);
    const body  = safe(n.body);

    return `
      <article class="item" aria-label="${title || "News item"}">
        <div class="itemTop">
          <h3 class="itemTitle">${title}</h3>
          ${type ? `<span class="tag">${type}</span>` : ""}
        </div>
        ${(date || body) ? `
          <div class="meta">
            ${date ? `<span>${date}</span>` : ""}
            ${(date && body) ? `<span>•</span>` : ""}
            ${body ? `<span>${body}</span>` : ""}
          </div>
        ` : ""}
      </article>
    `;
  }).join("");
}

/* -------------------------
   Meetings mini calendar (homepage)
-------------------------- */

// Meeting type -> label + CSS class
const MEETING_TYPE_META = {
  commissioners: { label: "Commissioners", className: "mtg-commissioners" },
  assessors:     { label: "Board of Assessors", className: "mtg-assessors" },
  planning:      { label: "Planning", className: "mtg-planning" },
  zoning:        { label: "Zoning", className: "mtg-zoning" },
  default:       { label: "Other", className: "mtg-default" }
};

// Which types appear in the legend (order matters)
const MEETING_LEGEND_TYPES = ["commissioners", "assessors", "planning", "zoning"];

// Render mini calendar into #meetingsMiniCal
function renderMeetingsMiniCalendar(meetings, opts = {}) {
  const {
    mountId = "meetingsMiniCal",
    monthDate = new Date(),
    weekStartsOnMonday = true,
    showLegend = true,
    dayLink = "meetings.html"
  } = opts;

  const mount = document.getElementById(mountId);
  if (!mount) return;

  // Build map: YYYY-MM-DD -> meetings[]
  const byDay = new Map();
  (meetings || []).forEach(m => {
    const raw = m?.date;
    if (!raw) return;
    const key = String(raw).slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(m);
  });

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth(); // 0-11
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const daysInMonth = last.getDate();

  const monthLabel = first.toLocaleString(undefined, { month: "long", year: "numeric" });

  const dowSunFirst = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dowMonFirst = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dow = weekStartsOnMonday ? dowMonFirst : dowSunFirst;

  // Determine offset (blank cells before day 1). JS getDay(): 0=Sun..6=Sat
  let offset = first.getDay();
  if (weekStartsOnMonday) offset = (offset + 6) % 7; // convert to Mon-first index

  const legendHtml = showLegend ? buildMeetingsLegendHtml() : "";

  let html = `
    <div class="miniCalHead">
      <div class="miniCalTitle">${escapeHtml(monthLabel)}</div>
      ${legendHtml}
    </div>

    <div class="miniCalGrid" role="grid" aria-label="${escapeHtml(monthLabel)} calendar">
      ${dow.map(d => `<div class="miniCalDow" role="columnheader">${escapeHtml(d)}</div>`).join("")}
  `;

  // Leading blanks
  for (let i = 0; i < offset; i++) {
    html += `<div class="miniCalCell is-empty" role="gridcell" aria-disabled="true"></div>`;
  }

  // Days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const key = d.toISOString().slice(0, 10);
    const dayMeetings = byDay.get(key) || [];
    const hasMeetings = dayMeetings.length > 0;

    const prettyDate = d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

    if (hasMeetings) {
      const typesForDay = [...new Set(dayMeetings.map(m => (m?.type || "default")))];
      const dotsHtml = buildDotsHtml(typesForDay);

      const titles = dayMeetings.map(m => m?.title).filter(Boolean);
      const ariaLabel = titles.length
        ? `${prettyDate}. ${dayMeetings.length} meeting${dayMeetings.length > 1 ? "s" : ""}: ${titles.join("; ")}.`
        : `${prettyDate}. ${dayMeetings.length} meeting${dayMeetings.length > 1 ? "s" : ""}.`;

      html += `
        <a class="miniCalCell is-event"
           role="gridcell"
           href="${escapeHtml(dayLink)}"
           aria-label="${escapeHtml(ariaLabel)}">
          <span class="miniCalDayNum">${day}</span>
          ${dotsHtml}
        </a>
      `;
    } else {
      html += `
        <div class="miniCalCell" role="gridcell" aria-label="${escapeHtml(prettyDate)}">
          <span class="miniCalDayNum">${day}</span>
        </div>
      `;
    }
  }

  html += `</div>`;
  mount.innerHTML = html;
}

function buildMeetingsLegendHtml() {
  const items = MEETING_LEGEND_TYPES
    .map(k => ({ key: k, meta: MEETING_TYPE_META[k] }))
    .filter(x => x.meta);

  return `
    <div class="miniCalLegend" aria-label="Meeting type legend">
      ${items.map(x => `
        <span class="miniCalKey">
          <span class="miniCalDot ${escapeHtml(x.meta.className)}" aria-hidden="true"></span>
          <span class="miniCalKeyLabel">${escapeHtml(x.meta.label)}</span>
        </span>
      `).join("")}
    </div>
  `;
}

function buildDotsHtml(typesForDay) {
  const shown = (typesForDay || []).slice(0, 5);
  const hiddenCount = Math.max(0, (typesForDay || []).length - shown.length);

  return `
    <div class="miniCalDots" aria-hidden="true">
      ${shown.map(t => {
        const meta = MEETING_TYPE_META[t] || MEETING_TYPE_META.default;
        return `<span class="miniCalDot ${escapeHtml(meta.className)}" title="${escapeHtml(meta.label)}"></span>`;
      }).join("")}
      ${hiddenCount ? `<span class="miniCalMore">+${hiddenCount}</span>` : ""}
    </div>
  `;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/* -------------------------
   Boot
-------------------------- */



/* -------------------------
   Homepage meetings mini
-------------------------- */
function renderMeetingsMini(items){
  const mount = document.getElementById("meetingsMini");
  if(!mount) return;

  const safe = (v) => (v === undefined || v === null) ? "" : String(v).trim();
  const parseDate = (v) => {
    const d = new Date(safe(v));
    return Number.isNaN(d.getTime()) ? null : d;
  };

  // Try to show next 2 upcoming meetings (if data provided)
  const upcoming = (items || [])
    .filter(m => m && (m.enabled !== false))
    .filter(m => String(m.status || "Upcoming").toLowerCase() === "upcoming")
    .slice()
    .sort((a,b) => (parseDate(a.date)?.getTime()||0) - (parseDate(b.date)?.getTime()||0))
    .slice(0,2);

  if(!upcoming.length){
    mount.innerHTML = `<p class="sub">See the full schedule on the Meetings page.</p>`;
    return;
  }

  mount.innerHTML = `
    <div class="list">
      ${upcoming.map(m => {
        const title = safe(m.title || "Meeting");
        const date  = safe(m.date || "");
        const time  = safe(m.time || "");
        const agenda = safe(m.agenda || m.agenda_url || "");
        const packet = safe(m.packet || m.packet_url || "");
        const watch  = safe(m.watch || m.stream || m.video_url || "");
        return `
          <article class="item">
            <div class="itemTop">
              <h3 class="itemTitle">${title}</h3>
            </div>
            <div class="meta">
              ${date ? `<span>${date}</span>` : ``}
              ${(date && time) ? `<span>•</span>` : ``}
              ${time ? `<span>${time}</span>` : ``}
            </div>
            <div class="meta" style="margin-top:8px">
              ${agenda ? `<a class="link" href="${agenda}">Agenda</a>` : ``}
              ${(agenda && packet) ? `<span>•</span>` : ``}
              ${packet ? `<a class="link" href="${packet}">Packet</a>` : ``}
              ${((agenda||packet) && watch) ? `<span>•</span>` : ``}
              ${watch ? `<a class="link" href="${watch}">Watch</a>` : ``}
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  initMobileMenu();

  // Use relative paths (plays nicer on a county server subfolder)
  const site = await loadJSON("./content/site.json");
  const alerts = await loadJSON("./content/alerts.json");
  const meetings = await loadJSON("./content/meetings.json");


  // Alerts: prefer alerts.json, fall back to site.json if needed
  if (alerts) window.renderAlert(alerts);
  else if (site) window.renderAlert(site);


  // Homepage meetings card (optional)
  // Homepage meetings card (calendar version)
if (document.getElementById("meetingsMiniCal")) {
  const allMeetings = meetings?.items || meetings || [];

  const upcoming = allMeetings.filter(m =>
    m && m.enabled !== false &&
    String(m.status || "Upcoming").toLowerCase() === "upcoming"
  );

  renderMeetingsMiniCalendar(upcoming, {
    monthDate: new Date(),
    showLegend: true,
    dayLink: "meetings.html"
  });
}

  // Page-scoped content: only load JSON when the page declares it
  const dirEl = document.getElementById("directoryList");
  const dirPath = dirEl?.getAttribute("data-json");
  if (dirPath) {
    const directory = await loadJSON(dirPath);
    if (directory?.items) renderDirectory(directory.items);
    else if (Array.isArray(directory)) renderDirectory(directory);
  }

  const newsEl = document.getElementById("newsList");
  const newsPath = newsEl?.getAttribute("data-json");
  if (newsPath) {
    const news = await loadJSON(newsPath);
    if (news?.items) renderNews(news.items);
    else if (Array.isArray(news)) renderNews(news);
  }

  async function initAnnouncementsFromNewsRotator({
  newsUrl = "./content/news.json",
  mountId = "annRotator",
  maxItems = 5,
  intervalMs = 7000
} = {}) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  const prevBtn = document.getElementById("annPrev");
  const nextBtn = document.getElementById("annNext");
  const pauseBtn = document.getElementById("annPause");

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Helpers
  const safe = (v) => (v === undefined || v === null) ? "" : String(v).trim();
  const parseDate = (v) => {
    const s = safe(v);
    // Expect ISO like "2026-02-22" or ISO datetime
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date(0) : d;
  };
  const fmtDate = (d) =>
    d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  // Load news
  let items = [];
  try {
    const res = await fetch(newsUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${newsUrl}`);
    const data = await res.json();

    // Support either array JSON or {items:[...]}
    const list = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
    items = list
      .filter(x => x && (x.enabled !== false))
      .slice()
      .sort((a, b) => parseDate(b.date) - parseDate(a.date))
      .slice(0, maxItems);
  } catch (e) {
    // Fallback message
    mount.innerHTML = `<p class="sub">Announcements are unavailable right now.</p>`;
    console.warn(e);
    return;
  }

  if (!items.length) {
    mount.innerHTML = `<p class="sub">No announcements yet.</p>`;
    return;
  }

  let index = 0;
  let timer = null;
  let paused = prefersReducedMotion; // start paused if reduced motion

  function render(i) {
    const it = items[i] || {};
    const title = safe(it.title || it.headline || "Update");
    const date = parseDate(it.date);
    const summary = safe(it.summary || it.excerpt || it.description || "");
    const url = safe(it.url || it.link || "");

    mount.innerHTML = `
      <article class="annItem">
        <h3 class="annTitle">${title}</h3>
        <div class="annMeta">${date.getTime() ? fmtDate(date) : ""}</div>
        ${summary ? `<p class="annBody">${summary}</p>` : ""}
        ${url ? `<div style="margin-top:10px"><a class="link" href="${url}">Read more</a></div>` : ""}
      </article>
    `;
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function start() {
    if (paused || prefersReducedMotion) return;
    stop();
    timer = setInterval(() => {
      index = (index + 1) % items.length;
      render(index);
    }, intervalMs);
  }

  function setPaused(nextPaused) {
    paused = !!nextPaused;
    if (pauseBtn) {
      pauseBtn.setAttribute("aria-pressed", paused ? "true" : "false");
      pauseBtn.textContent = paused ? "Play" : "Pause";
    }
    if (paused) stop();
    else start();
  }

  // Initial render
  render(index);
  setPaused(paused);

  // Controls
  prevBtn?.addEventListener("click", () => {
    index = (index - 1 + items.length) % items.length;
    render(index);
  });

  nextBtn?.addEventListener("click", () => {
    index = (index + 1) % items.length;
    render(index);
  });

  pauseBtn?.addEventListener("click", () => setPaused(!paused));

  // Pause auto-rotate when user interacts
  mount.addEventListener("mouseenter", () => setPaused(true));
  mount.addEventListener("mouseleave", () => setPaused(prefersReducedMotion ? true : false));
  mount.addEventListener("focusin", () => setPaused(true));
  mount.addEventListener("focusout", () => setPaused(prefersReducedMotion ? true : false));

  // If user changes OS motion preference live
  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener?.("change", (e) => {
    if (e.matches) setPaused(true);
  });
}
});
