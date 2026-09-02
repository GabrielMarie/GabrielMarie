// =========================================================
// 1155, rue de la Rive
// Header caché au scroll + menu mobile + reveal + parallax
// =========================================================
(function () {
  const header = document.querySelector(".main-header");
  const isHome = document.body.classList.contains("is-home");
  const banner = document.querySelector(".template-note");

  // ---- 0) Décaler le header sous le bandeau de démo (si présent) ----
  if (banner && header) {
    const syncBannerOffset = () => {
      const h = banner.offsetHeight;
      document.documentElement.style.setProperty("--banner-offset", h + "px");
    };
    syncBannerOffset();
    window.addEventListener("resize", syncBannerOffset);
  } else {
    document.documentElement.style.setProperty("--banner-offset", "0px");
  }

  // ---- 1) Header : solide après un petit scroll, caché en descendant ----
  if (header) {
    const TOP_THRESHOLD = 8;
    const heroSectionEl = document.querySelector(".hero-section");
    const solidThreshold = isHome && heroSectionEl
      ? Math.max(heroSectionEl.offsetHeight - 140, 200)
      : TOP_THRESHOLD;
    const mobileMq = window.matchMedia("(max-width: 900px)");
    let lastScrollY = window.scrollY || 0;

    const updateHeader = () => {
      const y = window.scrollY || 0;
      const menuOpen = document.body.classList.contains("mobile-menu-open");

      header.classList.toggle("is-solid", y > solidThreshold);

      if (mobileMq.matches) {
        if (menuOpen || y <= TOP_THRESHOLD) {
          header.style.transform = "translateY(0)";
        } else if (y > lastScrollY + 3) {
          header.style.transform = "translateY(-120%)";
        } else if (y < lastScrollY - 3) {
          header.style.transform = "translateY(0)";
        }
        lastScrollY = y;
        return;
      }
      header.style.transform = (y > lastScrollY + 4 && y > 120) ? "translateY(-120%)" : "translateY(0)";
      lastScrollY = y;
    };
    window.addEventListener("scroll", updateHeader, { passive: true });
    window.addEventListener("resize", updateHeader);
    updateHeader();

    // ---- 2) Menu mobile ----
    const nav = header.querySelector(".main-nav");
    const toggleBtn = header.querySelector(".mobile-menu-toggle");
    if (nav && toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        const isOpen = document.body.classList.toggle("mobile-menu-open");
        toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
      nav.addEventListener("click", (e) => {
        if (e.target.closest("a")) {
          document.body.classList.remove("mobile-menu-open");
        }
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") document.body.classList.remove("mobile-menu-open");
      });
    }
  }

  // ---- 3) Reveal on scroll ----
  const revealEls = Array.from(document.querySelectorAll(".reveal"));
  if (revealEls.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // ---- 4) Parallax ----
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const heroSection = document.querySelector(".hero-section");
  const pageHeroBg = document.querySelector(".page-hero-bg");
  let ticking = false;

  const updateParallax = () => {
    ticking = false;
    const y = window.scrollY || 0;
    if (heroSection) {
      heroSection.style.backgroundPosition = `center calc(50% + ${Math.round(y * 0.22)}px)`;
    }
    if (pageHeroBg) {
      pageHeroBg.style.transform = `translate3d(0, ${y * 0.22}px, 0)`;
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
