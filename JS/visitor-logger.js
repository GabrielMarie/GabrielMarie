(function () {
  const endpoint = 'https://visitor-traker.gabriel-saint-gelais.workers.dev/collect?page=' + encodeURIComponent(location.pathname);
  fetch(endpoint, {
    method: 'GET',
    mode: 'cors',
    credentials: 'include'
  }).catch(() => {});
})();