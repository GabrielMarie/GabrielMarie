// Script commun à toutes les pages

// Bannière animée
// Bannière animée (intro 1x par onglet, puis loop)
function initBanner() {
  const INTRO_SRC = "gif/le site de gab.gif";
  const LOOP_SRC  = "gif/le site de gab fin.gif";
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
      egg.src = "gif/oeuf.gif";
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


