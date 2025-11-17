// === Avion volant : script autonome (logique + styles) ===
// Fichier: avion.js
// Prérequis DOM: <img id="flyerGif" src="..."> présent dans la page.
// Optionnel: menu avec id="menu" pour déclencher un vol à la navigation.

(function () {
  // ---- Injecte le style requis si absent ----
  const STYLE_ID = "avion-style";
  const CSS = `
#flyerGif{
  position: fixed;
  top: 0;
  left: 0;
  transform: translate3d(-200px,0,0); /* démarre hors écran */
  z-index: 9999;
  image-rendering: pixelated;         /* pixel-art net */
  pointer-events: auto;               /* prend les clics */
  cursor: pointer;
}
@media (prefers-reduced-motion: reduce){
  #flyerGif{ display: none !important; }
}`.trim();

  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // --- Réglages ---
  const FLY_PROB       = 1 / 20; // 1 fois sur 20 au chargement de la page
  const SPEED_PX_S     = 120;    // vitesse horizontale (px/s)
  const MARGIN_V_PX    = 20;     // marge verticale (px)
  const MIN_DELAY_MS   = 4000;   // délai mini pour l'unique passage auto
  const MAX_DELAY_MS   = 9000;   // délai maxi
  const START_AFTER_MS = 1000;   // petit délai initial
  const PROB_ON_NAV    = 1 / 4;  // 1 fois sur 4 au clic menu (page suivante)

  const img = document.getElementById("flyerGif");
  if (!img) return;

  // caché tant qu'il ne vole pas
  img.hidden = true;

  // clic -> entrer dans le jeu
  img.addEventListener("click", () => {
    try { sessionStorage.removeItem("flyOnNextPage"); } catch {}
    window.location.href = "https://arcadedegab.gamer.gd/taplavion/taplavion_menu.html?v=1";
  }, { passive: true });

  let raf = null, startTs = null;
  let x = 0, y = 0, w = 0, h = 0, vw = 0, vh = 0;
  let flownThisPage = false;     // une seule traversée max
  let scheduled = null;          // timeout éventuel de passage auto

  const rnd   = (a, b) => a + Math.random() * (b - a);

  function recalcViewport() { vw = innerWidth; vh = innerHeight; }
  function pickY() {
    const minY = MARGIN_V_PX;
    const maxY = Math.max(minY, vh - h - MARGIN_V_PX);
    y = Math.round(rnd(minY, maxY));
    img.style.top = y + "px";
  }
  function resetXLeft() {
    x = -w - 10;
    img.style.transform = `translate3d(${x}px,0,0)`;
  }

  function step(ts) {
    if (!startTs) startTs = ts;
    const dt = (ts - startTs) / 1000;
    startTs = ts;

    x += SPEED_PX_S * dt;
    img.style.transform = `translate3d(${Math.round(x)}px,0,0)`;

    if (x > vw + 10) {
      cancelAnimationFrame(raf); raf = null;
      flownThisPage = true;      // terminé : plus d’autre passage
      img.hidden = true;         // on recache l’avion
      return;
    }
    raf = requestAnimationFrame(step);
  }

  // Lance un passage immédiat (si pas déjà fait)
  function flyNow() {
    if (flownThisPage) return;               // déjà passé → ignore
    if (raf) { cancelAnimationFrame(raf); }  // annule une anim en cours
    if (scheduled) { clearTimeout(scheduled); scheduled = null; } // annule auto prévu

    recalcViewport(); pickY(); resetXLeft();
    startTs = null;
    img.hidden = false;
    raf = requestAnimationFrame(step);
  }

  function start() {
    w = img.naturalWidth || img.width;
    h = img.naturalHeight || img.height;
    if (!w || !h) { img.addEventListener("load", start, { once: true }); return; }

    recalcViewport(); pickY(); resetXLeft();

    // Cas “vol à l’arrivée” (armé par la page précédente) → on vole, et c’est tout
    if (sessionStorage.getItem("flyOnNextPage") === "1") {
      sessionStorage.removeItem("flyOnNextPage");
      setTimeout(flyNow, 120); // petit délai pour laisser la page se poser
      return;
    }

    // Sinon, on ne planifie qu’avec la probabilité FLY_PROB (1/20), et au plus 1 fois
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches && Math.random() < FLY_PROB) {
      const delayMs = Math.round(rnd(MIN_DELAY_MS, MAX_DELAY_MS)) + START_AFTER_MS;
      scheduled = setTimeout(() => {
        scheduled = null;
        flyNow(); // compte comme l’unique passage de la page
      }, delayMs);
    }
  }

  addEventListener("resize", recalcViewport);

  // Hook menu : armer un vol sur la page suivante selon PROB_ON_NAV
  const menu = document.getElementById("menu");
  if (menu) {
    menu.addEventListener("click", (e) => {
      if (flownThisPage) return;           // si déjà passé ici, on n’arme pas
      const a = e.target.closest("a");
      if (!a) return;

      if (Math.random() < PROB_ON_NAV) {
        const href = a.getAttribute("href") || "";
        if (href.startsWith("#")) {
          // même page → on peut lancer un vol immédiat *si* pas déjà passé
          setTimeout(flyNow, 50);
        } else {
          // autre page → armer un vol à l’arrivée
          sessionStorage.setItem("flyOnNextPage", "1");
        }
      } else {
        // si on ne veut PAS voler à la prochaine page, on s'assure de nettoyer
        sessionStorage.removeItem("flyOnNextPage");
      }
    });
  }

  if (img.complete) start();
  else img.addEventListener("load", start, { once: true });

  // exposé pour debug si besoin
  window._flyer = { flyNow };
})();
