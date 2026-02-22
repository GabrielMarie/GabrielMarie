// =========================================================
// PARALLAX MENU — comportement différencié
// =========================================================

(function () {
  const header = document.querySelector(".main-header");
  if (!header) return;

  const isSecondary = document.body.classList.contains("secondary-impact");

  let lastScrollY = window.scrollY;

  // -------------------------------------------------------
  // SECONDARY PAGES: visible uniquement au sommet
  // -------------------------------------------------------
  if (isSecondary) {
    const TOP_THRESHOLD = 6; // px de tolérance

    function updateSecondaryMenu() {
      if (window.scrollY <= TOP_THRESHOLD) {
        header.style.transform = "translateY(0)";
      } else {
        header.style.transform = "translateY(-120%)";
      }
    }

    window.addEventListener("scroll", updateSecondaryMenu, { passive: true });
    window.addEventListener("resize", updateSecondaryMenu);
    updateSecondaryMenu();
    return; // ⬅️ STOP ici, on ne va PAS plus loin
  }

  // -------------------------------------------------------
  // INDEX (comportement original: hide/show au scroll)
  // -------------------------------------------------------
  function updateIndexMenu() {
    const currentY = window.scrollY;

    if (currentY <= 10) {
      header.style.transform = "translateY(0)";
    } else if (currentY > lastScrollY) {
      // scroll down → hide
      header.style.transform = "translateY(-120%)";
    } else {
      // scroll up → show
      header.style.transform = "translateY(0)";
    }

    lastScrollY = currentY;
  }

  window.addEventListener("scroll", updateIndexMenu, { passive: true });
})();


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