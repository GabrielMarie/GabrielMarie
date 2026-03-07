// =========================================================
// PARALLAX + MENU
// - Menu: visible uniquement tout en haut (index + pages secondaires)
// - Dropdown: clic pour "pinner" ouvert, hover avec délai avant fermeture
// - Parallax: hero + sections (index) et hero-bg (secondary)
// =========================================================

(function () {
  const header = document.querySelector(".main-header");
  const isSecondary = document.body.classList.contains("secondary-impact");

  // -------------------------------------------------------
  // 1) MENU: visible uniquement au sommet
  // -------------------------------------------------------
  if (header) {
    const TOP_THRESHOLD = 8; // px de tolérance
    const updateMenu = () => {
      header.style.transform = (window.scrollY <= TOP_THRESHOLD)
        ? "translateY(0)"
        : "translateY(-120%)";
    };
    window.addEventListener("scroll", updateMenu, { passive: true });
    window.addEventListener("resize", updateMenu);
    updateMenu();
  }

// ===== Dropdown "À venir" avec délai de fermeture =====
(() => {
  const dropdowns = Array.from(document.querySelectorAll(".dropdown"));
  if (!dropdowns.length) return;

  const canHover = window.matchMedia("(hover: hover)").matches;
  const CLOSE_DELAY = 250; // ⏱️ 1.5 seconde

  function closeAll(except = null) {
    dropdowns.forEach(dd => {
      if (dd !== except) {
        dd.classList.remove("is-open");
        dd.classList.remove("is-open-hover");
      }
    });
  }

  dropdowns.forEach(dd => {
    const trigger = dd.querySelector("a");
    const panel = dd.querySelector(".dropdown-content");
    if (!trigger || !panel) return;

    let closeTimer = null;

    function cancelClose() {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    }

    function scheduleClose() {
      cancelClose();
      closeTimer = setTimeout(() => {
        dd.classList.remove("is-open-hover");
        if (!dd.classList.contains("is-open")) {
          dd.classList.remove("is-open");
        }
      }, CLOSE_DELAY);
    }

    // CLICK = toggle immédiat
    trigger.addEventListener("click", (e) => {
      const href = trigger.getAttribute("href") || "";
      if (href.startsWith("#")) e.preventDefault();

      cancelClose();
      const willOpen = !dd.classList.contains("is-open");
      closeAll(dd);
      dd.classList.toggle("is-open", willOpen);
    });

    // HOVER (PC)
    if (canHover) {
      dd.addEventListener("mouseenter", () => {
        cancelClose();
        dd.classList.add("is-open-hover");
      });

      dd.addEventListener("mouseleave", () => {
        scheduleClose(); // ⏱️ délai ici
      });

      panel.addEventListener("mouseenter", cancelClose);
      panel.addEventListener("mouseleave", scheduleClose);
    }
  });

  // clic ailleurs = ferme tout (sans délai)
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown")) {
      closeAll();
    }
  });

  // ESC = ferme tout
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });
})();

  // -------------------------------------------------------
  // 3) PARALLAX: index + secondary
  // -------------------------------------------------------
  const heroBg = document.querySelector(".hero-bg");                 // secondary pages
  const indexHero = document.querySelector(".hero-section.parallax"); // index
  const parallaxImages = Array.from(document.querySelectorAll(".parallax-image"));

  // garde-fou: si l'utilisateur préfère réduire les animations
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  let ticking = false;
  const updateParallax = () => {
    ticking = false;
    const scrollY = window.scrollY || 0;

    // Secondary hero (div.hero-bg absolute): translate
    if (heroBg) {
      heroBg.style.transform = `translate3d(0, ${scrollY * 0.22}px, 0)`;
    }

    // Index hero (background-image sur section): shift background-position
    if (indexHero) {
      const y = Math.round(scrollY * 0.25);
      indexHero.style.backgroundPosition = `center calc(50% + ${y}px)`;
    }

    // Index sections (div.parallax-image absolute): translate selon la position du parent
    for (const el of parallaxImages) {
      const parent = el.parentElement;
      const rect = parent ? parent.getBoundingClientRect() : el.getBoundingClientRect();
      const offset = -rect.top * 0.18;
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
    }
  };

  const requestTick = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateParallax);
  };

  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);
  requestTick();
})();
