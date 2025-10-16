/**
 * image.js — Lightbox d’images réutilisable (Dessins, Expéditions, etc.)
 *
 * Ce que fait ce fichier :
 * - Ouvre une lightbox quand on clique une vignette (élément .js-lightbox, [data-closeups] ou [data-group]).
 * - Gère le carrousel (flèches, clic gauche/droite, ← → clavier) si plusieurs images.
 * - Mode “solo” automatique : s’il n’y a qu’UNE image, on affiche juste le zoom (pas de flèches, pas de “1/1”).
 * - Préchargement malin (viewport/hover/ouverture) avec une petite file d’attente (concurrence limitée).
 * - Respecte les préférences d’économie de données du navigateur (ne précharge pas si saveData/reduced-data).
 *
 * Pré-requis HTML (à avoir UNE fois par page juste avant le </body>) :
 * <div id="lightbox">
    <span id="close-lightbox">✖</span>
    <img id="lightbox-img" src="" alt="">
    <div id="lightbox-controls">
     <button id="prev-image">←</button>
      <div id="lightbox-indicator">Image 1 / 1</div>
      <button id="next-image">→</button>
    </div>
  </div>
 *
 * Comment taguer les images :
 *   1) Zoom simple (mode solo) :
 *      <img class="js-lightbox" src="/img/photo.jpg" alt="">
 *   2) Plusieurs close-ups pour une même vignette :
 *      <img class="js-lightbox"
 *           src="/img/vignette.jpg"
 *           data-closeups="/img/close1.jpg,/img/close2.jpg,/img/close3.jpg"
 *           alt="">
 *   3) Groupe de vignettes (carrousel d’un set) :
 *      <img class="js-lightbox" data-group="g1" src="/small1.jpg" data-src="/big1.jpg">
 *      <img class="js-lightbox" data-group="g1" src="/small2.jpg" data-src="/big2.jpg">
 *
 * Conseils perf :
 * - Servez des close-ups ~1600–2000px en WebP/JPEG (pas les originaux 5000px).
 * - Ajoutez loading="lazy" decoding="async" aux vignettes dans la page.
 * - Pensez au cache long (CDN) et au cache-busting (ex. image.js?v=2).
 */

// image.js — Lightbox + Préchargement malin + Mode solo (sans flèches ni "1/1")
document.addEventListener("DOMContentLoaded", () => {
  const lb        = document.getElementById("lightbox");
  const lbImg     = document.getElementById("lightbox-img");
  const closeBtn  = document.getElementById("close-lightbox");
  const prevBtn   = document.getElementById("prev-image");
  const nextBtn   = document.getElementById("next-image");
  const indicator = document.getElementById("lightbox-indicator");
  const controls  = document.getElementById("lightbox-controls");
  if (!lb || !lbImg) return;

  let currentIndex = 0;
  let currentImages = [];
  let singleMode = false; // ← nouveau

  /* ---------- Utils ---------- */
  const nz = (s) => (s || "").trim();
  const setIndicator = () => {
    if (!indicator) return;
    if (singleMode) {
      indicator.textContent = ""; // pas de "1/1"
    } else {
      indicator.textContent = `${currentIndex + 1} / ${currentImages.length}`;
    }
  };
  const setControlsVisibility = () => {
    if (!controls) return;
    controls.style.display = singleMode ? "none" : "flex";
  };

  // Respecte économie de données si activée
  const conn = navigator.connection || {};
  const CAN_PREFETCH = !conn.saveData && !matchMedia("(prefers-reduced-data: reduce)").matches;

  /* ---------- Préchargement avec file d’attente ---------- */
  const preloadCache = new Map(); // url -> Promise
  const queue = [];
  let inflight = 0;
  const MAX_CONCURRENCY = 3;

  function preload(url) {
    if (!url) return Promise.resolve();
    if (preloadCache.has(url)) return preloadCache.get(url);
    const p = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(url);
      img.onerror = reject;
      img.src = url;
    });
    preloadCache.set(url, p);
    return p;
  }

  function enqueue(url) {
    if (!CAN_PREFETCH) return;
    if (!url || preloadCache.has(url)) return;
    queue.push(url);
    pump();
  }

  function pump() {
    while (inflight < MAX_CONCURRENCY && queue.length) {
      const url = queue.shift();
      inflight++;
      preload(url).finally(() => { inflight--; pump(); });
    }
  }

  /* ---------- Lightbox ---------- */
  function showImage() {
    if (!currentImages.length) return;
    const full = nz(currentImages[currentIndex]);

    const img = new Image();
img.decoding = "async";
lbImg.classList.add("loading");
img.onload = () => {
  lbImg.src = full;
  lbImg.classList.remove("loading");
  setIndicator();
  if (!singleMode) {
    const next = currentImages[(currentIndex + 1) % currentImages.length];
    const prev = currentImages[(currentIndex - 1 + currentImages.length) % currentImages.length];
    enqueue(next); enqueue(prev);
  }
};
img.src = full;

  }

  function open() {
    // Mode solo si 0 ou 1 image
    singleMode = currentImages.length <= 1;
    setControlsVisibility();

    // Précharge le set en arrière-plan seulement en mode multi
    if (!singleMode && CAN_PREFETCH && currentImages.length > 1) {
      currentImages.forEach((u, i) => { if (i !== currentIndex) enqueue(nz(u)); });
    }

    showImage();
    lb.classList.remove("fade-out");
    lb.style.display = "flex";
    void lb.offsetWidth;
    lb.classList.add("fade-in");
  }

  function close() {
    lb.classList.remove("fade-in");
    lb.classList.add("fade-out");
    setTimeout(() => { lb.style.display = "none"; }, 200);
  }

  function getListFrom(el) {
    const attr = el.getAttribute("data-closeups");
    if (attr) return attr.split(",").map(nz).filter(Boolean);

    const grp = el.getAttribute("data-group");
    if (grp) {
      const nodes = document.querySelectorAll(`[data-group="${grp}"][data-src], [data-group="${grp}"][src]`);
      return Array.from(nodes).map(n => nz(n.getAttribute("data-src") || n.getAttribute("src"))).filter(Boolean);
    }

    const one = el.getAttribute("data-src") || el.getAttribute("src");
    return one ? [one] : [];
  }

  /* ---------- Délégation clic ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest(".js-lightbox, [data-closeups], [data-group]");
    if (!t) return;
    if (t.tagName === "A") e.preventDefault();

    currentImages = getListFrom(t);
    if (!currentImages.length) return;

    const clicked = t.getAttribute("data-src") || t.getAttribute("src");
    const idx = clicked ? currentImages.findIndex(u => u === clicked) : -1;
    currentIndex = idx >= 0 ? idx : 0;

    open();
  });

  /* ---------- Hover / Touch = précharge la série ---------- */
  const hoverHandler = (e) => {
    if (!CAN_PREFETCH) return;
    const t = e.target.closest(".js-lightbox, [data-closeups], [data-group]");
    if (!t) return;
    const list = getListFrom(t);
    // Ne précharge pas si on est clairement en mode solo (1 image)
    if (list.length > 1) list.forEach(u => enqueue(u));
  };
  document.addEventListener("mouseenter", hoverHandler, { capture: true, passive: true });
  document.addEventListener("touchstart", hoverHandler, { capture: true, passive: true });

  /* ---------- Précharge quand la vignette approche du viewport ---------- */
  if (CAN_PREFETCH && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;
        const list = getListFrom(target);
        if (list.length > 1) list.forEach(u => enqueue(u)); // idem: multi seulement
        obs.unobserve(target);
      });
    }, { rootMargin: "300px" });
    document.querySelectorAll(".js-lightbox, [data-closeups], [data-group]").forEach(el => io.observe(el));
  }

  /* ---------- Contrôles ---------- */
  prevBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (singleMode) return; // rien en mode solo
    if (currentImages.length > 1) { currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length; showImage(); }
  });
  nextBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (singleMode) return;
    if (currentImages.length > 1) { currentIndex = (currentIndex + 1) % currentImages.length; showImage(); }
  });

  lbImg.addEventListener("click", (e) => {
    if (!currentImages.length || singleMode) return; // clic ne change rien en solo
    const r = lbImg.getBoundingClientRect();
    const left = e.clientX < r.left + r.width / 2;
    currentIndex = left ? (currentIndex - 1 + currentImages.length) % currentImages.length
                        : (currentIndex + 1) % currentImages.length;
    showImage();
  });

  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  closeBtn?.addEventListener("click", (e) => { e.stopPropagation(); close(); });

  document.addEventListener("keydown", (e) => {
    if (lb.style.display !== "flex") return;
    if (e.key === "Escape") return close();
    if (singleMode) return; // pas de nav clavier en solo
    if (e.key === "ArrowLeft") prevBtn?.click();
    if (e.key === "ArrowRight") nextBtn?.click();
  });
});



