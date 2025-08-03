// Script commun à toutes les pages

// Bannière animée
function initBanner() {
  const banner = document.getElementById("siteBanner");
  if (banner) {
    banner.src = "le site de gab.gif";
    setTimeout(() => banner.src = "le site de gab fin.gif", 6000);
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
