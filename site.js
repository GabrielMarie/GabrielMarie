// Script commun à toutes les pages

// Bannière animée
// Bannière animée (intro 1x par onglet, puis loop)
function initBanner() {
  const INTRO_SRC = "le site de gab.gif";
  const LOOP_SRC  = "le site de gab fin.gif";
  const INTRO_DURATION_MS = 6000; // ta valeur actuelle

  const banner = document.getElementById("siteBanner");
  if (!banner) return;

  // Précharge le loop pour éviter un flash au switch
  const preload = new Image();
  preload.src = LOOP_SRC;

  const alreadyPhase2 = sessionStorage.getItem("bannerPhase") === "2";

  function toPhase2() {
    if (!banner.src.includes(LOOP_SRC)) {
      banner.src = LOOP_SRC;
    }
    sessionStorage.setItem("bannerPhase", "2");
  }

  if (alreadyPhase2) {
    // L’utilisateur a déjà vu l’intro dans cet onglet → on reste en phase 2
    banner.src = LOOP_SRC;
  } else {
    // Première visite dans l’onglet → jouer l’intro puis basculer
    banner.src = INTRO_SRC;
    setTimeout(toPhase2, INTRO_DURATION_MS);

    // Si l’utilisateur quitte la page avant la fin, on mémorise quand même
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        sessionStorage.setItem("bannerPhase", "2");
      }
    }, { once: true });
  }
}


// Menu burger
function initMenuToggle() {
  const toggle = document.querySelector(".menu-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const menu = document.getElementById("menu");
      if (menu) menu.classList.toggle("active");
    });
  }
}

// Easter egg (oeuf de Pâques)
function initEasterEgg() {
  const egg = document.getElementById("easter-egg");
  if (egg) {
    egg.addEventListener("click", () => {
      egg.src = "oeuf.gif";
      setTimeout(() => {
        egg.style.display = "none";
        egg.style.pointerEvents = "none";
      }, 10290);
    });
  }
}

// Initialisation commune

document.addEventListener("DOMContentLoaded", () => {
  initBanner();
  initMenuToggle();
  initEasterEgg();
});


// === Avion volant : max 1 passage par page ===
(function () {
  // --- Réglages ---
  const FLY_PROB       = 1 / 20; // ✅ 1 fois sur 20 au chargement de la page
  const SPEED_PX_S     = 120;    // vitesse horizontale (px/s)
  const MARGIN_V_PX    = 20;     // marge verticale (px)
  const MIN_DELAY_MS   = 4000;   // délai mini pour l'unique passage auto
  const MAX_DELAY_MS   = 9000;   // délai maxi
  const START_AFTER_MS = 1000;   // petit délai initial
  const PROB_ON_NAV    = 1 / 20; // ✅ 1 fois sur 20 au clic menu (page suivante)

  const img = document.getElementById("flyerGif");
  if (!img) return;

  // rendre l’avion cliquable -> entrer dans le jeu
  img.style.pointerEvents = "auto";
  img.style.cursor = "pointer";
  img.hidden = true; // caché tant qu'il ne vole pas

  img.addEventListener("click", () => {
    try { sessionStorage.removeItem("flyOnNextPage"); } catch {}
    window.location.href = "taplavion.html";
  }, { passive: true });

  let raf = null, startTs = null;
  let x = 0, y = 0, w = 0, h = 0, vw = 0, vh = 0;
  let flownThisPage = false;     // une seule traversée max
  let scheduled = null;          // timeout éventuel de passage auto

  const rnd   = (a, b) => a + Math.random() * (b - a);
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

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

  async function start() {
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
      scheduled = setTimeout(() => {
        scheduled = null;
        flyNow(); // compte comme l’unique passage de la page
      }, rnd(MIN_DELAY_MS, MAX_DELAY_MS) + START_AFTER_MS);
    }
  }

  addEventListener("resize", recalcViewport);

  // Hook menu : 1/20 d’armer un vol sur la page suivante
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
