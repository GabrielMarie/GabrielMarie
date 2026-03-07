// =========================================================
// Parallax hero + reveal on scroll
// =========================================================
console.log("parallax loaded");
(function () {
  // Reveal (IntersectionObserver)
  const revealEls = Array.from(document.querySelectorAll(".reveal"));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => io.observe(el));

  // Parallax on hero background
  const hero = document.querySelector("[data-parallax]");
  if (!hero) return;

  const bg = hero.querySelector(".hero-bg");
  if (!bg) return;

  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;

    window.requestAnimationFrame(() => {
      const rect = hero.getBoundingClientRect();
      const viewH = window.innerHeight || 800;

      // progress: 0 when hero top at top of viewport, to ~1 when hero fully passed
      const progress = Math.min(Math.max((viewH - rect.top) / (viewH + rect.height), 0), 1);

      // move background a bit (subtle)
      const translateY = (progress - 0.5) * 320; // px
      bg.style.transform = `translate3d(0, ${translateY}px, 0)`;

      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
})();







// =========================================================
// TIMELINE — fill continu + points qui s'allument "au bon moment"
// =========================================================
(function () {
  const timeline = document.querySelector("[data-timeline]");
  if (!timeline) return;

  const track = timeline.querySelector(".timeline-track");
  const line = timeline.querySelector(".timeline-line");
  const fill = timeline.querySelector(".timeline-fill");
  const days = Array.from(timeline.querySelectorAll("[data-day]"));

  if (!track || !line || !fill || days.length === 0) return;

  const LEAD_PX = 60; // ✅ plus grand = s'allume plus tôt | plus petit = plus tard (0 = pile sur le point)

  function clamp(v, a, b) {
    return Math.max(a, Math.min(v, b));
  }

  // Positions (en px) des points DANS la ligne
  let dotOffsets = [];

  function computeDotOffsets() {
    const lineRect = line.getBoundingClientRect();

    dotOffsets = days.map((day) => {
      const dot = day.querySelector(".timeline-dot");
      if (!dot) return 0;

      const r = dot.getBoundingClientRect();
      const centerY = r.top + r.height / 2;

      return centerY - lineRect.top; // distance du haut de la ligne -> centre du point
    });
  }

  function update() {
    const trackRect = track.getBoundingClientRect();
    const lineRect = line.getBoundingClientRect();
    const vh = window.innerHeight || 800;

    // ----- 1) Remplissage ROUGE continu -----
    // La progression commence quand le haut du track monte vers 35% de l'écran
    const startY = vh * 0.35+200;
    const progressPx = startY - trackRect.top; // combien de px la timeline "entre"
    const fillPx = clamp(progressPx, 0, lineRect.height);
    fill.style.height = `${fillPx}px`;

    // ----- 2) Point actif basé sur la position DES DOTS -----
    if (dotOffsets.length !== days.length) computeDotOffsets();

    let activeIndex = 0;
    for (let i = 0; i < dotOffsets.length; i++) {
      // Le point devient actif quand le fill est rendu "proche" du point
      if (fillPx >= dotOffsets[i] - LEAD_PX) activeIndex = i;
    }

    days.forEach((d, i) => {
      d.classList.toggle("is-active", i === activeIndex);
      d.classList.toggle("is-done", i < activeIndex);
    });
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    computeDotOffsets();
    update();
  });

  // init (après que la page ait “settle”)
  requestAnimationFrame(() => {
    computeDotOffsets();
    update();
  });
})();