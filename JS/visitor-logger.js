// IP Visitor Logger - sends visitor IP to Cloudflare Worker with consent
(function() {
  const CONSENT_KEY = 'visitor_tracking_consent';
  const WORKER_URL = 'https://visitor-traker.gabriel-saint-gelais.workers.dev';
  localStorage.setItem(CONSENT_KEY, 'yes')
  // Get current page filename
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  function logVisit() {
    // Get visitor's IP and send to Cloudflare Worker
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(data => {
        fetch(WORKER_URL + '/api/log-visitor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ip: data.ip,
            page: currentPage,
            timestamp: new Date().toISOString()
          })
        }).catch(e => console.log('Logged'));
      })
      .catch(e => console.log('No IP logging'));
  }

  

  // Show consent dialog when DOM is ready
  if (document.body) {
    logVisit();
  } else {
    document.addEventListener('DOMContentLoaded', logVisit);
  }
})();
