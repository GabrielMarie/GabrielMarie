(function () {
  const CONSENT_KEY = "visitor_tracking_consent";
  const WORKER_URL = "https://visitor-traker.gabriel-saint-gelais.workers.dev";
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  function dntEnabled() {
    return navigator.doNotTrack === "1" || window.doNotTrack === "1";
  }

  async function logVisit() {
    // IMPORTANT: pas d'IP côté client; l'IP sera déduite côté Worker (CF-Connecting-IP)
    try {
      await fetch(WORKER_URL + "/api/log-visitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: currentPage,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {}
  }

  function showConsentDialog() {
    // Respect DNT => on ne track pas
    if (dntEnabled()) {
      localStorage.setItem(CONSENT_KEY, "no");
      return;
    }

    const saved = localStorage.getItem(CONSENT_KEY);
    if (saved !== null) {
      if (saved === "yes") logVisit();
      return;
    }

    const banner = document.createElement("div");
    banner.id = "consent-banner";
    banner.style.cssText = `
      position: fixed; bottom: 0; left: 0; right: 0;
      background: #1a1a1a; border-top: 1px solid #444;
      padding: 16px 20px; font-size: 14px; color: #e8eef6;
      display: flex; justify-content: space-between; align-items: center;
      gap: 16px; z-index: 999998; font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 -2px 8px rgba(0,0,0,0.3);
    `;

    banner.innerHTML = `
      <span style="flex: 1;">
        Ce site peut enregistrer des visites (page + horodatage, et l’IP côté serveur). Acceptez-vous?
        <a href="/privacy.html" style="color:#4da6ff; margin-left:8px;">Détails</a>
      </span>
      <button id="consent-yes" style="background:#4da6ff;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;">Oui</button>
      <button id="consent-no"  style="background:#444;color:#e8eef6;border:1px solid #666;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;">Non</button>
    `;

    document.body.appendChild(banner);

    document.getElementById("consent-yes").addEventListener("click", () => {
      localStorage.setItem(CONSENT_KEY, "yes");
      banner.remove();
      logVisit();
    });

    document.getElementById("consent-no").addEventListener("click", () => {
      localStorage.setItem(CONSENT_KEY, "no");
      banner.remove();
    });
  }

  if (document.body) showConsentDialog();
  else document.addEventListener("DOMContentLoaded", showConsentDialog);
})();
