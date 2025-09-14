// image.js — Lightbox réutilisable (dessin, expédition, etc.)
// image.js — Lightbox + Préchargement malin (viewport + hover + ouverture)
document.addEventListener("DOMContentLoaded", () => {
  const lb        = document.getElementById("lightbox");
  const lbImg     = document.getElementById("lightbox-img");
  const closeBtn  = document.getElementById("close-lightbox");
  const prevBtn   = document.getElementById("prev-image");
  const nextBtn   = document.getElementById("next-image");
  const indicator = document.getElementById("lightbox-indicator");
  if (!lb || !lbImg) return;

  let currentIndex = 0;
  let currentImages = [];

  /* ---------- Utils ---------- */
  const nz = (s) => (s || "").trim();
  const setIndicator = () => { if (indicator) indicator.textContent = `${currentIndex + 1} / ${currentImages.length}`; };

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

    // charge en mémoire puis swap (évite “trou noir”)
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      lbImg.src = full;
      setIndicator();
      // Précharge voisins immédiats
      const next = currentImages[(currentIndex + 1) % currentImages.length];
      const prev = currentImages[(currentIndex - 1 + currentImages.length) % currentImages.length];
      enqueue(next); enqueue(prev);
    };
    img.src = full;
  }

  function open() {
    // Quand on ouvre, on envoie en arrière-plan tout le set restant
    if (CAN_PREFETCH && currentImages.length > 1) {
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
    // 1) data-closeups explicite sur l’élément cliqué
    const attr = el.getAttribute("data-closeups");
    if (attr) return attr.split(",").map(nz).filter(Boolean);
    // 2) data-group (toutes les vignettes du groupe)
    const grp = el.getAttribute("data-group");
    if (grp) {
      const nodes = document.querySelectorAll(`[data-group="${grp}"][data-src], [data-group="${grp}"][src]`);
      return Array.from(nodes).map(n => nz(n.getAttribute("data-src") || n.getAttribute("src"))).filter(Boolean);
    }
    // 3) fallback: src/data-src de l’élément cliqué
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
    list.forEach(u => enqueue(u));
  };
  document.addEventListener("mouseenter", hoverHandler, { capture: true, passive: true });
  document.addEventListener("touchstart", hoverHandler, { capture: true, passive: true });

  /* ---------- Précharge quand la vignette approche du viewport ---------- */
  if (CAN_PREFETCH && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;
        const list = getListFrom(target);
        list.forEach(u => enqueue(u));
        obs.unobserve(target);
      });
    }, { rootMargin: "300px" });
    document.querySelectorAll(".js-lightbox, [data-closeups], [data-group]").forEach(el => io.observe(el));
  }

  /* ---------- Contrôles ---------- */
  prevBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (currentImages.length > 1) { currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length; showImage(); }
  });
  nextBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (currentImages.length > 1) { currentIndex = (currentIndex + 1) % currentImages.length; showImage(); }
  });
  lbImg.addEventListener("click", (e) => {
    if (!currentImages.length) return;
    const r = lbImg.getBoundingClientRect();
    const left = e.clientX < r.left + r.width / 2;
    if (currentImages.length > 1) {
      currentIndex = left ? (currentIndex - 1 + currentImages.length) % currentImages.length
                          : (currentIndex + 1) % currentImages.length;
      showImage();
    }
  });
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  closeBtn?.addEventListener("click", (e) => { e.stopPropagation(); close(); });
  document.addEventListener("keydown", (e) => {
    if (lb.style.display === "flex") {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prevBtn?.click();
      if (e.key === "ArrowRight") nextBtn?.click();
    }
  });
});



//a mettre dans le fichier affecter par image.js: // <script src="image.js" defer></script> 
  //<div id="lightbox">
   // <span id="close-lightbox">✖</span>
   // <img id="lightbox-img" src="" alt="">
   // <div id="lightbox-controls">
   //  <button id="prev-image">←</button>
   //   <div id="lightbox-indicator">Image 1 / 1</div>
   //   <button id="next-image">→</button>
   // </div>
  //</div>