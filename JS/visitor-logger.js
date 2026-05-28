
(async function () {
  try {
    await fetch(
      "https://visitor-traker.gabriel-saint-gelais.workers.dev/collect?page=" +
      encodeURIComponent(location.pathname),
      {
        method: "GET",
        mode: "cors"
      }
    );
  } catch (e) {}
})();
