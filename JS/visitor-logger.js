// Visitor logger: single, robust implementation
(function() {
  const CONSENT_KEY = 'visitor_tracking_consent';
  const VISITOR_ID_KEY = 'visitor_id';
  const WORKER_URL = 'https://visitor-tracker.gabriel-saint-gelais.workers.dev';

  // Get current page filename
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // Cookie helpers
  function setCookie(name, value, days = 3650) {
    try {
      const expires = new Date(Date.now() + days * 864e5).toUTCString();
      document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
    } catch (e) {
      // ignore
    }
  }

  function getCookie(name) {
    try {
      return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name ? decodeURIComponent(parts[1]) : r;
      }, null);
    } catch (e) {
      return null;
    }
  }

  // Generate or retrieve unique visitor ID (stored in cookie + localStorage)
  function getOrCreateVisitorId() {
    let id = getCookie(VISITOR_ID_KEY) || (() => { try { return localStorage.getItem(VISITOR_ID_KEY); } catch(e){ return null; } })();
    if (!id) {
      id = 'v_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
      try { setCookie(VISITOR_ID_KEY, id); } catch (e) {}
      try { localStorage.setItem(VISITOR_ID_KEY, id); } catch (e) {}
    }
    return id;
  }

  const visitorId = getOrCreateVisitorId();

  function sendToWorker(payload) {
    try {
      fetch(WORKER_URL + '/api/log-visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(res => {
        if (!res.ok) console.warn('Worker responded with status', res.status);
      }).catch(err => console.error('Failed to send to worker:', err));
    } catch (e) {
      console.error('Unexpected error while sending to worker', e);
    }
  }

  function logVisit() {
    // Try to get IP (with timeout); if it fails, send visit without IP
    const ipify = 'https://api.ipify.org?format=json';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    fetch(ipify, { signal: controller.signal }).then(r => r.json()).then(data => {
      clearTimeout(timeoutId);
      sendToWorker({
        ip: data && data.ip ? data.ip : undefined,
        page: currentPage,
        visitorId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
    }).catch(err => {
      clearTimeout(timeoutId);
      console.warn('Could not obtain public IP (continuing without it):', err && err.message ? err.message : err);
      sendToWorker({
        page: currentPage,
        visitorId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
    });
  }

  function showConsentDialog() {
    const savedConsent = getCookie(CONSENT_KEY) || (() => { try { return localStorage.getItem(CONSENT_KEY); } catch(e){ return null; } })();
    if (savedConsent !== null) {
      if (savedConsent === 'yes') {
        logVisit();
      }
      return;
    }

    const banner = document.createElement('div');
    banner.id = 'consent-banner';
    banner.style.cssText = `position: fixed; bottom: 0; left: 0; right: 0; background: #1a1a1a; border-top: 1px solid #444; padding: 16px 20px; font-size: 14px; color: #e8eef6; display: flex; justify-content: space-between; align-items: center; gap: 16px; z-index: 999998; font-family: system-ui, -apple-system, sans-serif; box-shadow: 0 -2px 8px rgba(0,0,0,0.3);`;

    banner.innerHTML = `
      <span style="flex: 1;">Ce site enregistre les visites pour des statistiques. Acceptez-vous?</span>
      <button id="consent-yes" style="background: #4da6ff; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;">Oui</button>
      <button id="consent-no" style="background: #444; color: #e8eef6; border: 1px solid #666; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;">Non</button>
    `;

    document.body.appendChild(banner);

    document.getElementById('consent-yes').addEventListener('click', () => {
      try { setCookie(CONSENT_KEY, 'yes'); } catch (e) {}
      try { localStorage.setItem(CONSENT_KEY, 'yes'); } catch (e) {}
      banner.remove();
      logVisit();
    });

    document.getElementById('consent-no').addEventListener('click', () => {
      try { setCookie(CONSENT_KEY, 'no'); } catch (e) {}
      try { localStorage.setItem(CONSENT_KEY, 'no'); } catch (e) {}
      banner.remove();
    });
  }

  if (document.body) {
    showConsentDialog();
  } else {
    document.addEventListener('DOMContentLoaded', showConsentDialog);
  }
})();
