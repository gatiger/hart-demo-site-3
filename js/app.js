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

  // Persist view month on the element
  const initialMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  if (!mount._miniCalState) mount._miniCalState = { viewMonth: initialMonth };

  // Map: YYYY-MM-DD -> meetings[]
  const byDay = new Map();
  (meetings || []).forEach(m => {
    const raw = m?.date;
    if (!raw) return;
    const key = String(raw).slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(m);
  });

  const dowSunFirst = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dowMonFirst = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dow = weekStartsOnMonday ? dowMonFirst : dowSunFirst;

  const render = () => {
    const view = mount._miniCalState.viewMonth;
    const year = view.getFullYear();
    const month = view.getMonth();

    const first = new Date(year, month, 1);
    const last  = new Date(year, month + 1, 0);
    const daysInMonth = last.getDate();

    const monthLabel = first.toLocaleString(undefined, { month: "long", year: "numeric" });

    // Offset for blanks
    let offset = first.getDay(); // 0=Sun..6=Sat
    if (weekStartsOnMonday) offset = (offset + 6) % 7;

    const legendHtml = showLegend ? buildMeetingsLegendHtml() : "";

    let html = `
      <div class="miniCalHead">
        <div class="miniCalHeadLeft">
          <div class="miniCalTitle">${escapeHtml(monthLabel)}</div>
          <div class="miniCalNav" aria-label="Calendar navigation">
            <button type="button" class="miniCalNavBtn" data-cal-prev aria-label="Previous month">‹</button>
            <button type="button" class="miniCalNavBtn" data-cal-next aria-label="Next month">›</button>
          </div>
        </div>
        ${legendHtml}
      </div>

      <div class="miniCalGrid" role="grid" aria-label="${escapeHtml(monthLabel)} calendar">
        ${dow.map(d => `<div class="miniCalDow" role="columnheader">${escapeHtml(d)}</div>`).join("")}
    `;

    for (let i = 0; i < offset; i++) {
      html += `<div class="miniCalCell is-empty" role="gridcell" aria-disabled="true"></div>`;
    }

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

    // Hook up nav
    mount.querySelector("[data-cal-prev]")?.addEventListener("click", () => {
      mount._miniCalState.viewMonth = new Date(year, month - 1, 1);
      render();
    });

    mount.querySelector("[data-cal-next]")?.addEventListener("click", () => {
      mount._miniCalState.viewMonth = new Date(year, month + 1, 1);
      render();
    });
  };

  render();
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

  function renderMeetingsPage(items){
  const upcomingEl = document.getElementById("upcomingMeetings");
  const pastEl = document.getElementById("pastMeetings");
  if(!upcomingEl && !pastEl) return;

  const safe = (v) => (v === undefined || v === null) ? "" : String(v).trim();
  const parseDate = (v) => {
    const s = safe(v);
    // Expect ISO like 2026-03-10
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const all = (items || [])
    .filter(m => m && m.enabled !== false)
    .slice()
    .sort((a,b) => (parseDate(a.date)?.getTime()||0) - (parseDate(b.date)?.getTime()||0));

  const isUpcoming = (m) => String(m.status || "Upcoming").toLowerCase() === "upcoming";
  const upcoming = all.filter(isUpcoming);
  const past = all.filter(m => !isUpcoming(m)).reverse(); // newest past first

  const linkAttrs = (href) => {
    const h = safe(href);
    if(!h) return "";
    const isExternal = /^https?:\/\//i.test(h);
    return isExternal ? `target="_blank" rel="noopener noreferrer"` : "";
  };

  const renderList = (list) => `
    <div class="list">
      ${list.map(m => {
        const title = safe(m.title || "Meeting");
        const date  = safe(m.date || "");
        const time  = safe(m.time || "");
        const loc   = safe(m.location || "");

        const agenda = safe(m.agenda_url || m.agenda || "");
        const packet = safe(m.packet_url || m.packet || "");
        const minutes = safe(m.minutes_url || m.minutes || "");
        const stream = safe(m.stream_url || m.watch || m.video_url || "");

        return `
          <article class="item" aria-label="${escapeHtml(title)}">
            <div class="itemTop">
              <h3 class="itemTitle">${escapeHtml(title)}</h3>
              ${m.type ? `<span class="tag">${escapeHtml(m.type)}</span>` : ``}
            </div>

            ${(date || time || loc) ? `
              <div class="meta">
                ${date ? `<span>${escapeHtml(date)}</span>` : ``}
                ${(date && time) ? `<span>•</span>` : ``}
                ${time ? `<span>${escapeHtml(time)}</span>` : ``}
                ${((date || time) && loc) ? `<span>•</span>` : ``}
                ${loc ? `<span>${escapeHtml(loc)}</span>` : ``}
              </div>
            ` : ``}

            ${(agenda || packet || minutes || stream) ? `
              <div class="meta" style="margin-top:10px">
                ${agenda ? `<a class="link" href="${agenda}" ${linkAttrs(agenda)}>Agenda</a>` : ``}
                ${(agenda && packet) ? `<span>•</span>` : ``}
                ${packet ? `<a class="link" href="${packet}" ${linkAttrs(packet)}>Packet</a>` : ``}
                ${((agenda || packet) && minutes) ? `<span>•</span>` : ``}
                ${minutes ? `<a class="link" href="${minutes}" ${linkAttrs(minutes)}>Minutes</a>` : ``}
                ${((agenda || packet || minutes) && stream) ? `<span>•</span>` : ``}
                ${stream ? `<a class="link" href="${stream}" ${linkAttrs(stream)}>Watch</a>` : ``}
              </div>
            ` : ``}
          </article>
        `;
      }).join("")}
    </div>
  `;

  if(upcomingEl){
    upcomingEl.innerHTML = upcoming.length
      ? renderList(upcoming)
      : `<p class="sub">No upcoming meetings are posted yet.</p>`;
  }

  if(pastEl){
    pastEl.innerHTML = past.length
      ? renderList(past)
      : `<p class="sub">No past meetings are posted yet.</p>`;
  }
}


document.addEventListener("DOMContentLoaded", async () => {
  initMobileMenu();

const currentPath = window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".topNav a, .menuNav a").forEach(link => {
    const href = link.getAttribute("href");
    if (!href) return;

    if (href === currentPath) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });

  // Use relative paths (plays nicer on a county server subfolder)
  const site = await loadJSON("./content/site.json");
  const alerts = await loadJSON("./content/alerts.json");
  const meetings = await loadJSON("./content/meetings.json");


  // Alerts: prefer alerts.json, fall back to site.json if needed
  if (typeof window.renderAlert === "function") {
  window.renderAlert(alerts || site);
}


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

renderMeetingsPage(meetings?.items || meetings || []);

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

  // Expand/collapse handler (one-time, event delegation)
if (!mount.dataset.expandWired) {
  mount.addEventListener("click", (e) => {
    const btn = e.target.closest(".annExpandBtn");
    if (!btn) return;

    const bodyId = btn.getAttribute("data-expand");
    const p = document.getElementById(bodyId);
    if (!p) return;

    const expanded = btn.getAttribute("aria-expanded") === "true";

    if (expanded) {
      p.classList.add("clamp2");
      btn.setAttribute("aria-expanded", "false");
      btn.textContent = "Expand";
    } else {
      p.classList.remove("clamp2");
      btn.setAttribute("aria-expanded", "true");
      btn.textContent = "Collapse";
    }
  });

  mount.dataset.expandWired = "1";
}

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
    const summary = safe(it.body || it.summary || it.excerpt || it.description || "");
    const url = safe(it.url || it.link || "");

    const bodyId = `annBody-${i}`;

mount.innerHTML = `
  <article class="annTile">
    <div class="annMetaRow">
      ${date.getTime() ? `<time class="annDate">${fmtDate(date)}</time>` : ""}
    </div>

    <h3 class="annTitle">${title}</h3>

    ${summary ? `
      <p class="annBody clamp2" id="${bodyId}">
        ${summary}
      </p>
      <button class="btn ghost annExpandBtn"
              type="button"
              data-expand="${bodyId}"
              aria-expanded="false"
              aria-controls="${bodyId}"
              hidden>
        Expand
      </button>
    ` : ""}

    ${url ? `
      <div class="annFooter">
        <a class="annCta" href="${url}">Read more →</a>
      </div>
    ` : ""}
  </article>
`;

// Show Expand button only if content overflows 2 lines
if (summary) {
  requestAnimationFrame(() => {
    const p = document.getElementById(bodyId);
    const btn = mount.querySelector(`.annExpandBtn[data-expand="${bodyId}"]`);
    if (!p || !btn) return;

    btn.hidden = !(p.scrollHeight > p.clientHeight + 1);
  });
}
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

if (document.getElementById("annRotator")) {
    initAnnouncementsFromNewsRotator({
      newsUrl: "./content/news.json",
      mountId: "annRotator",
      maxItems: 5,
      intervalMs: 7000
    });
  }

  function renderCommissioners(items){
  const mount = document.getElementById("commissionersList");
  if(!mount) return;

  if (!mount.dataset.expandWired) {
    mount.addEventListener("click", (e) => {
      const btn = e.target.closest(".annExpandBtn");
      if (!btn) return;

      const bodyId = btn.getAttribute("data-expand");
      const p = document.getElementById(bodyId);
      if (!p) return;

      const expanded = btn.getAttribute("aria-expanded") === "true";

      if (expanded) {
        p.classList.add("clamp2");
        btn.setAttribute("aria-expanded", "false");
        btn.textContent = "Expand";
      } else {
        p.classList.remove("clamp2");
        btn.setAttribute("aria-expanded", "true");
        btn.textContent = "Collapse";
      }
    });

    mount.dataset.expandWired = "1";
  }

  const safe = (v)=> (v===undefined||v===null) ? "" : String(v).trim();

  mount.innerHTML = (items || []).map(c => {
    const name = safe(c.name);
    const role = safe(c.role);
    const district = safe(c.district);
    const phone = safe(c.phone);
    const phoneRaw = safe(c.phone_raw);
    const email = safe(c.email);
    const photo = safe(c.photo || "./assets/commissioners/placeholder.png");
    const bio = safe(c.bio);

    return `
      <article class="commCard" aria-label="Commissioner profile">
        <figure class="commPhoto">
          <img src="${photo}" alt="Photo of ${name}">
        </figure>

        <div class="commInfo">
          <h3 class="commName">${name}</h3>
          <div class="commRole">
            ${role ? role + " • " : ""}${district}
          </div>

          <div class="commMeta" aria-label="Contact information">
            ${phone ? `<span>Phone: <a class="phone-link" href="tel:${phoneRaw}">${phone}</a></span>` : ``}
            ${(phone && email) ? `<span>•</span>` : ``}
            ${email ? `<span>Email: <a class="email-link" href="mailto:${email}">${email}</a></span>` : ``}
          </div>

          ${bio ? `<p class="sub" style="margin-top:10px">${bio}</p>` : ``}
        </div>
      </article>
    `;
  }).join("");
}

const commissioners = await loadJSON("./content/commissioners.json");

if (document.getElementById("commissionersList")) {
  renderCommissioners(commissioners?.items || commissioners || []);
}
});
