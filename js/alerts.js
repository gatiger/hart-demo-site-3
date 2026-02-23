/* alerts.js
   - Shows MULTIPLE alerts (stack)
   - Each alert shows title + 1-line preview (CSS ellipsis)
   - "View" button expands full message (and link)
   - Optional dismiss (localStorage) if dismissible:true
*/

const ALERT_PRIORITY = { critical: 4, important: 3, info: 2, success: 1 };

function safeDate(value){
  if(!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isWithinWindow(now, startStr, endStr){
  const start = safeDate(startStr);
  const end = safeDate(endStr);
  if(start && now < start) return false;
  if(end && now > end) return false;
  return true;
}

function getDismissedAlertIds(){
  try{
    const raw = localStorage.getItem("hc_dismissed_alerts");
    if(!raw) return new Set();
    const arr = JSON.parse(raw);
    if(!Array.isArray(arr)) return new Set();
    return new Set(arr.filter(x => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function dismissAlertId(id){
  if(!id) return;
  const set = getDismissedAlertIds();
  set.add(String(id));
  try{
    localStorage.setItem("hc_dismissed_alerts", JSON.stringify([...set]));
  } catch {}
}

function escapeText(str){
  return String(str ?? "").replace(/[&<>"']/g, (ch) => {
    switch(ch){
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "\"": return "&quot;";
      case "'": return "&#39;";
      default: return ch;
    }
  });
}

function ensureAlertMount(){
  // Prefer an existing in-layout holder (most pages include this)
  let mount = document.getElementById("alertHolder");
  if(mount) return mount;

  // Back-compat: if we already created a siteAlert earlier, reuse it
  mount = document.getElementById("siteAlert");
  if(mount) return mount;

  // Create a holder just under the header so it shows below the sticky topbar
  mount = document.createElement("div");
  mount.id = "alertHolder";

  const header = document.querySelector("header");
  if(header && header.parentNode){
    // Insert immediately after header
    if(header.nextSibling) header.parentNode.insertBefore(mount, header.nextSibling);
    else header.parentNode.appendChild(mount);
  } else {
    document.body.insertBefore(mount, document.body.firstChild);
  }
  return mount;
}

function pickAlerts(alerts, limit = 5){
  const now = new Date();
  const dismissed = getDismissedAlertIds();

  const active = (Array.isArray(alerts) ? alerts : [])
    .filter(a => a && a.active === true)
    .filter(a => isWithinWindow(now, a.start, a.end))
    .filter(a => !(a.dismissible === true && dismissed.has(String(a.id))));

  active.sort((a,b) => {
    const la = String(a.level || "info").toLowerCase().trim();
    const lb = String(b.level || "info").toLowerCase().trim();
    const pa = ALERT_PRIORITY[la] || 0;
    const pb = ALERT_PRIORITY[lb] || 0;
    if(pb !== pa) return pb - pa;

    const ea = safeDate(a.end);
    const eb = safeDate(b.end);
    if(ea && eb) return ea.getTime() - eb.getTime();
    if(ea && !eb) return -1;
    if(!ea && eb) return 1;
    return 0;
  });

  return active.slice(0, Math.max(1, limit));
}

function renderAlertsInto(mount, alerts){
  if(!mount) return;

  if(!alerts || !alerts.length){
    mount.innerHTML = "";
    mount.style.display = "none";
    return;
  }

  mount.style.display = "";

  mount.innerHTML = `
    <div class="hc-alertstack">
      ${alerts.map((a, idx) => {
        const level = String(a.level || "info").toLowerCase().trim();
        const template = String(a.template || "compact").toLowerCase().trim();
        const isCritical = level === "critical";

        const id = String(a.id || `alert-${idx}`);
        const title = escapeText(a.title || "");
        const message = escapeText(a.message || "");

        const link = (a.link && typeof a.link === "object") ? a.link : null;
        const linkLabel = link?.label ? escapeText(link.label) : "Learn more";
        const linkHref = link?.href ? String(link.href) : "";

        const dismissible = a.dismissible === true;

        // aria-live assertive only for critical
        const liveAttrs = isCritical
          ? `role="alert" aria-live="assertive"`
          : `aria-live="polite"`;

        // Stable DOM ids for aria-controls
        const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "_");
        const detailsId = `hc_alert_details_${safeId}`;

        return `
          <div class="hc-alert hc-alert--${escapeText(level)} hc-alert--${escapeText(template)}" ${liveAttrs} data-alert-id="${escapeText(id)}">
            <div class="hc-alert__main">
              <div class="hc-alert__title">${title}</div>

              <!-- 1-line preview, ellipsis handled by CSS -->
              <div class="hc-alert__preview"></div>

              <!-- Full message (collapsed by default) -->
              <div class="hc-alert__details" id="${detailsId}" hidden>
                <div class="hc-alert__full">${message}</div>
                ${linkHref ? `<a class="hc-alert__link hc-alert__link--inline" href="${escapeText(linkHref)}">${linkLabel}</a>` : ""}
              </div>
            </div>

            <div class="hc-alert__actions">
              <button class="hc-alert__toggle" type="button"
                aria-expanded="false"
                aria-controls="${detailsId}">
                View
              </button>

              ${dismissible ? `
                <button class="hc-alert__dismiss" type="button" aria-label="Dismiss notice" data-dismiss="1">✕</button>
              ` : ""}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  // Bind toggle + dismiss
  mount.querySelectorAll(".hc-alert").forEach(alertEl => {
    const toggle = alertEl.querySelector(".hc-alert__toggle");
    const dismissBtn = alertEl.querySelector("[data-dismiss='1']");

    if(toggle){
      const detailsId = toggle.getAttribute("aria-controls");
      const details = detailsId ? document.getElementById(detailsId) : null;

      if(details){
        toggle.addEventListener("click", () => {
          const expanded = toggle.getAttribute("aria-expanded") === "true";
          const next = !expanded;

          toggle.setAttribute("aria-expanded", String(next));
          toggle.textContent = next ? "Hide" : "View";
          details.hidden = !next;
        });
      }
    }

    if(dismissBtn){
      dismissBtn.addEventListener("click", () => {
        const id = alertEl.getAttribute("data-alert-id");
        dismissAlertId(id);
        alertEl.remove();

        if(!mount.querySelector(".hc-alert")){
          mount.innerHTML = "";
          mount.style.display = "none";
        }
      });
    }
  });
}

/**
 * Call this with your loaded JSON:
 *   const alerts = await loadJSON("./content/alerts.json");
 *   renderAlert(alerts);
 */
function renderAlert(data){
  const mount = ensureAlertMount();
  const list = pickAlerts(data?.alerts, 5); // show up to 5
  renderAlertsInto(mount, list);
}

// If your site already calls renderAlert(...) globally:
window.renderAlert = renderAlert;