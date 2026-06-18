const chapters = [
  {
    title: "Chapitre I — Exister pour rien",
    file: "Chapitre 1 - Exister pour rien.md",
    appear: "none"
  },
  {
    title: "Chapitre II — Le mal et le bien",
    file: "Chapitre 2 - Le mal et le bien (à corriger et à finir).md",
    appear: "none"
  },
  {
    title: "Chapitre III — Le premier homme I",
    file: "Chapitre 3 - Le premier homme I.md",
    appear: "ready"
  },
  {
    title: "Chapitre IV — Une histoire des temps à venir",
    file: "Chapitre 4 - Une histoire des temps à venir.md",
    appear: "none"
  },
  {
    title: "Chapitre V — Les moeurs de l'homme",
    file: "Chapitre 5 - Les moeurs de l'homme.md",
    appear: "none"
  },
  {
    title: "Chapitre VI — Pour m'aimer",
    file: "Chapitre 6 - Pour m'aimer.md",
    appear: "none"
  },
  {
    title: "Chapitre VIII — Un monde sans ombre",
    file: "Chapitre 8 - Un monde sans ombre(221B).md",
    appear: "none"
  },
  {
    title: "Chapitre IX — Le code naturel I",
    file: "Chapitre 9 - Le code naturel I.md",
    appear: "none"
  },
  {
    title: "Chapitre X — Le code naturel II",
    file: "Chapitre 10 - Le code naturel II.md",
    appear: "none"
  },
  {
    title: "Chapitre XI — Le code naturel III",
    file: "Chapitre 11 - Le code naturel III.md",
    appear: "none"
  },
  {
    title: "Chapitre XII — Le code naturel IV",
    file: "Chapitre 12 - Le code naturel IV.md",
    appear: "none"
  },
  {
    title: "Chapitre XIII — Le code naturel (épilogue)",
    file: "Chapitre 13 - Le code naturel (épilogue).md",
    appear: "none"
  },
  {
    title: "Chapitre XIV — La nuit",
    file: "Chapitre 14 - La nuit.md",
    appear: "none"
  },
  {
    title: "Chapitre XVI — L'erreur I",
    file: "Chapitre 16 - L'erreur I.md",
    appear: "none"
  },
  {
    title: "Chapitre XVII — L'avant I",
    file: "Chapitre 17 - L'avant I.md",
    appear: "none"
  },
  {
    title: "Chapitre XVIII — Le deuxieme homme",
    file: "Chapitre 18 - Le deuxieme homme.md",
    appear: "none"
  },
  {
    title: "Chapitre XIX — Les remord du comandant",
    file: "Chapitre 19 - Les remord du comandant.md",
    appear: "none"
  },
  {
    title: "Chapitre XX — La main",
    file: "Chapitre 20 - La main.md",
    appear: "none"
  },
  {
    title: "Chapitre XXI — Le cueilleur d'ame",
    file: "Chapitre 21 - Le cueilleur d'ame.md",
    appear: "none"
  },
  {
    title: "Chapitre XXI bis — Le procés de dieux I",
    file: "Chapitre 21 - Le procés de dieux I.md",
    appear: "none"
  },
  {
    title: "Chapitre XXII — Y a-t-il quelque chose qui puisse vous sauver",
    file: "Chapitre 22 - Y a-t-il quelque chose qui puisse vous sauver.md",
    appear: "none"
  },
  {
    title: "Chapitre XXIII — Les efforts",
    file: "Chapitre 23 - Les efforts.md",
    appear: "none"
  }
];

const BASE_URL = "https://raw.githubusercontent.com/GabrielMarie/Walker/main/Journal%20De%20Bord/";

const menuView = document.getElementById("menu-view");
const readerView = document.getElementById("reader-view");
const chaptersList = document.getElementById("chapters-list");
const readerContent = document.getElementById("reader-content");
const loadingOverlay = document.getElementById("loading-overlay");
const loadingLabel = document.querySelector(".loading-label");
const loadingDots = document.querySelector(".loading-dots");
const immersionCursor = document.getElementById("immersion-cursor");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const menuBtn = document.getElementById("menu-btn");

const modeFacileBtn = document.getElementById("mode-facile-btn");
const modeImmersionBtn = document.getElementById("mode-immersion-btn");

const settingsToggle = document.getElementById("settings-toggle");
const settingsPanel = document.getElementById("settings-panel");
const closeSettingsBtn = document.getElementById("close-settings");
const panelOverlay = document.getElementById("panel-overlay");

const immersionColorsSection = document.getElementById("immersion-colors-section");
const themeButtons = document.querySelectorAll(".theme-btn");
const showProgressToggle = document.getElementById("show-progress-toggle");
const resetProgressBtn = document.getElementById("reset-progress-btn");

const STORAGE_KEYS = {
  mode: "walker-reading-mode",
  theme: "walker-immersion-theme",
  chapter: "walker-current-chapter",
  progress: "walker-chapter-progress",
  progressEnabled: "walker-show-progress"
};

const TYPEWRITER_SPEEDS = {
  menu: {
    letterDelay: 10,
    startDelay: 120
  },
  loading: {
    letterDelay: 70,
    startDelay: 120
  },
  reader: {
    letterDelay: 6,
    startDelay: 120
  }
};

let currentIndex = null;
let showProgress = false;
let isLoadingChapter = false;
const MIN_LOADING_DELAY = 1000;
const MAX_LOADING_DELAY = 3500;
const IMMERSION_SCROLL_LINES = 1;
let activeTypingRun = 0;
let activeCursorElement = null;
let activeLoadingRun = 0;
let readerScrollTarget = null;

function getProgressMap() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.progress)) || {};
  } catch {
    return {};
  }
}

function saveProgressMap(map) {
  localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(map));
}

function getChapterProgress(index) {
  const progressMap = getProgressMap();
  return progressMap[index] || 0;
}

function setChapterProgress(index, value) {
  const progressMap = getProgressMap();
  progressMap[index] = Math.max(0, Math.min(100, value));
  saveProgressMap(progressMap);
}

function openSettings() {
  settingsPanel.classList.add("open");
  panelOverlay.classList.add("open");
  settingsPanel.setAttribute("aria-hidden", "false");
}

function closeSettings() {
  settingsPanel.classList.remove("open");
  panelOverlay.classList.remove("open");
  settingsPanel.setAttribute("aria-hidden", "true");
}

function showMenu() {
  menuView.classList.add("active");
  readerView.classList.remove("active");
  document.body.classList.add("menu-open");
  buildMenu();
  animateVisibleText();
  readerScrollTarget = null;
  window.scrollTo({ top: 0, behavior: "auto" });
}

function showReader() {
  menuView.classList.remove("active");
  readerView.classList.add("active");
  document.body.classList.remove("menu-open");
  readerScrollTarget = window.scrollY;
}

function formatProgress(value) {
  return `${Math.round(value)}%`;
}

function buildMenu() {
  chaptersList.innerHTML = "";

  chapters.forEach((chapter, index) => {
    const button = document.createElement("button");
    button.className = "chapter-button";

    const title = document.createElement("span");
    title.className = "chapter-title";
    title.textContent = chapter.title;
    button.appendChild(title);

    if (showProgress) {
      const progress = document.createElement("span");
      progress.className = "chapter-progress";
      progress.textContent = formatProgress(getChapterProgress(index));
      button.appendChild(progress);
    }

    const isUnavailable = chapter.appear === "none";

    if (isUnavailable) {
      button.classList.add("chapter-button--locked");
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
      button.setAttribute("title", "Chapitre pas encore disponible");
    } else {
      button.addEventListener("click", () => loadChapter(index));
    }

    chaptersList.appendChild(button);
  });
}

function isChapterAccessible(index) {
  return chapters[index] && chapters[index].appear !== "none";
}

function getPreviousAccessibleChapterIndex(index) {
  for (let i = index - 1; i >= 0; i -= 1) {
    if (isChapterAccessible(i)) {
      return i;
    }
  }
  return null;
}

function getNextAccessibleChapterIndex(index) {
  for (let i = index + 1; i < chapters.length; i += 1) {
    if (isChapterAccessible(i)) {
      return i;
    }
  }
  return null;
}

function updateBottomNav() {
  if (currentIndex === null) {
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  prevBtn.disabled = getPreviousAccessibleChapterIndex(currentIndex) === null;
  nextBtn.disabled = getNextAccessibleChapterIndex(currentIndex) === null;
}

function updateReadingProgress() {
  if (isLoadingChapter) return;
  if (currentIndex === null || !readerView.classList.contains("active")) return;

  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight <= 0 ? 0 : (scrollTop / docHeight) * 100;

  setChapterProgress(currentIndex, progress);
}

function isImmersionMode() {
  return document.body.classList.contains("mode-immersion");
}

function updateImmersionCursorVisibility(isVisible) {
  if (!immersionCursor) {
    return;
  }

  immersionCursor.classList.toggle("visible", isVisible && isImmersionMode());
}

function isImmersionReaderActive() {
  return isImmersionMode()
    && readerView.classList.contains("active")
    && !isLoadingChapter;
}

function getReaderScrollStep() {
  const computedStyle = window.getComputedStyle(readerContent);
  const parsedLineHeight = Number.parseFloat(computedStyle.lineHeight);

  if (Number.isFinite(parsedLineHeight)) {
    return Math.max(16, parsedLineHeight * IMMERSION_SCROLL_LINES);
  }

  const parsedFontSize = Number.parseFloat(computedStyle.fontSize);
  return Math.max(16, parsedFontSize * 1.6 * IMMERSION_SCROLL_LINES);
}

function getReaderContentTop() {
  const readerRect = readerContent.getBoundingClientRect();
  return window.scrollY + readerRect.top;
}

function snapReaderScrollPosition() {
  const step = getReaderScrollStep();
  const contentTop = getReaderContentTop();
  const maxScrollTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const relativeOffset = Math.max(0, window.scrollY - contentTop);
  const snappedLine = Math.round(relativeOffset / step);

  readerScrollTarget = Math.max(0, Math.min(maxScrollTop, contentTop + (snappedLine * step)));
  window.scrollTo({ top: readerScrollTarget, behavior: "auto" });
}

function scrollReaderByStep(direction) {
  const maxScrollTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const step = getReaderScrollStep();
  const contentTop = getReaderContentTop();
  const currentTarget = window.scrollY;
  const relativeOffset = Math.max(0, currentTarget - contentTop);
  const snappedLine = Math.round(relativeOffset / step);
  const currentLine = Math.max(0, snappedLine);
  const nextLine = Math.max(0, currentLine + direction);
  const snappedTarget = contentTop + (nextLine * step);

  readerScrollTarget = Math.max(0, Math.min(maxScrollTop, snappedTarget));
  window.scrollTo({ top: readerScrollTarget, behavior: "auto" });
}

function setLoadingState(isVisible) {
  loadingOverlay.classList.toggle("visible", isVisible);
  loadingOverlay.setAttribute("aria-hidden", String(!isVisible));

  if (!loadingLabel || !loadingDots) {
    return;
  }

  if (!isVisible) {
    activeLoadingRun += 1;
    loadingLabel.textContent = "Chargement";
    loadingLabel.classList.remove("typewriter-active");
    loadingDots.classList.remove("loading-dots-active");
    loadingDots.textContent = "";
    return;
  }

  if (!isImmersionMode()) {
    activeLoadingRun += 1;
    loadingLabel.textContent = "Chargement";
    loadingLabel.classList.remove("typewriter-active");
    loadingDots.classList.remove("loading-dots-active");
    loadingDots.textContent = "";
    return;
  }

  activeLoadingRun += 1;
  const loadingRunId = activeLoadingRun;
  const fullText = "Chargement";
  let letterIndex = 0;

  loadingLabel.textContent = "";
  loadingLabel.classList.add("typewriter-active");
  loadingDots.classList.remove("loading-dots-active");
  loadingDots.textContent = "";

  function animateLoadingDots() {
    if (loadingRunId !== activeLoadingRun) {
      return;
    }

    const dotFrames = ["", ".", "..", "..."];
    let frameIndex = 0;

    function showNextFrame() {
      if (loadingRunId !== activeLoadingRun) {
        return;
      }

      loadingDots.textContent = dotFrames[frameIndex];
      frameIndex = (frameIndex + 1) % dotFrames.length;

      window.setTimeout(showNextFrame, TYPEWRITER_SPEEDS.loading.letterDelay * 3);
    }

    showNextFrame();
  }

  function typeLoadingLabel() {
    if (loadingRunId !== activeLoadingRun) {
      return;
    }

    letterIndex += 1;
    loadingLabel.textContent = fullText.slice(0, letterIndex);

    if (letterIndex < fullText.length) {
      window.setTimeout(typeLoadingLabel, TYPEWRITER_SPEEDS.loading.letterDelay);
    } else {
      loadingLabel.classList.remove("typewriter-active");
      loadingDots.classList.add("loading-dots-active");
      animateLoadingDots();
    }
  }

  window.setTimeout(typeLoadingLabel, TYPEWRITER_SPEEDS.loading.startDelay);
}

function getRandomLoadingDelay() {
  return Math.floor(Math.random() * (MAX_LOADING_DELAY - MIN_LOADING_DELAY + 1)) + MIN_LOADING_DELAY;
}

function setActiveCursor(element) {
  if (activeCursorElement) {
    activeCursorElement.classList.remove("typewriter-active");
  }

  activeCursorElement = element ?? null;

  if (activeCursorElement) {
    activeCursorElement.classList.add("typewriter-active");
  }
}

function collectTextNodes(root) {
  if (!root) return [];

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent.trim()) {
        return NodeFilter.FILTER_REJECT;
      }

      const parentElement = node.parentElement;
      if (!parentElement) {
        return NodeFilter.FILTER_REJECT;
      }

      if (parentElement.closest(".loading-overlay, .settings-panel")) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const textNodes = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  return textNodes;
}

function animateVisibleText() {
  if (!isImmersionMode()) {
    activeTypingRun += 1;
    document.body.classList.remove("is-typing");
    setActiveCursor(null);
    return;
  }

  activeTypingRun += 1;
  const typingRunId = activeTypingRun;
  document.body.classList.add("is-typing");
  setActiveCursor(null);
  const speedProfile = menuView.classList.contains("active")
    ? TYPEWRITER_SPEEDS.menu
    : TYPEWRITER_SPEEDS.reader;

  const roots = [];

  roots.push(menuBtn, prevBtn, nextBtn);

  if (readerView.classList.contains("active")) {
    roots.push(readerContent);
  } else if (menuView.classList.contains("active")) {
    roots.push(chaptersList);
  }

  const uniqueNodes = [];
  const seenNodes = new Set();

  roots.forEach(root => {
    collectTextNodes(root).forEach(node => {
      if (!seenNodes.has(node)) {
        seenNodes.add(node);
        uniqueNodes.push({
          node,
          text: node.textContent
        });
      }
    });
  });

  uniqueNodes.forEach(({ node }) => {
    node.textContent = "";
  });

  let currentNodeIndex = 0;
  let currentLetterIndex = 0;

  function typeNextCharacter() {
    if (typingRunId !== activeTypingRun) {
      return;
    }

    const currentEntry = uniqueNodes[currentNodeIndex];

    if (!currentEntry) {
      document.body.classList.remove("is-typing");
      return;
    }

    setActiveCursor(currentEntry.node.parentElement);

    currentLetterIndex += 1;
    currentEntry.node.textContent = currentEntry.text.slice(0, currentLetterIndex);

    if (currentLetterIndex >= currentEntry.text.length) {
      currentNodeIndex += 1;
      currentLetterIndex = 0;
    }

    if (currentNodeIndex < uniqueNodes.length) {
      window.setTimeout(typeNextCharacter, speedProfile.letterDelay);
    } else {
      document.body.classList.remove("is-typing");
    }
  }

  window.setTimeout(typeNextCharacter, speedProfile.startDelay);
}

function loadChapter(index) {
  isLoadingChapter = true;

  const chapter = chapters[index];
  const url = BASE_URL + encodeURIComponent(chapter.file);
  const loadingStartedAt = Date.now();
  const targetLoadingDelay = getRandomLoadingDelay();
  const useImmersionEffects = isImmersionMode();

  if (useImmersionEffects) {
    setLoadingState(true);
  } else {
    setLoadingState(false);
  }
  readerContent.innerHTML = "";
  showReader();
  window.scrollTo({ top: 0, behavior: "auto" });

  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error("Impossible de charger ce chapitre.");
      }
      return response.text();
    })
    .then(markdown => {
      currentIndex = index;
      localStorage.setItem(STORAGE_KEYS.chapter, String(index));

      const finishLoading = () => {
        readerContent.innerHTML = marked.parse(markdown);
        updateBottomNav();

        const savedProgress = getChapterProgress(index);

        requestAnimationFrame(() => {
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const target = docHeight > 0 ? (savedProgress / 100) * docHeight : 0;
          window.scrollTo({ top: Math.max(0, target), behavior: "auto" });
          if (isImmersionMode()) {
            snapReaderScrollPosition();
          }
          setLoadingState(false);
          isLoadingChapter = false;
          animateVisibleText();
        });
      };

      if (useImmersionEffects) {
        const remainingDelay = Math.max(0, targetLoadingDelay - (Date.now() - loadingStartedAt));
        window.setTimeout(finishLoading, remainingDelay);
      } else {
        finishLoading();
      }
    })
    .catch(error => {
      readerContent.textContent = error.message;
      setLoadingState(false);
      isLoadingChapter = false;
    });
}

function applyMode(mode) {
  document.body.classList.remove("mode-facile", "mode-immersion");

  if (mode === "immersion") {
    document.body.classList.add("mode-immersion");
    modeImmersionBtn.classList.add("active");
    modeFacileBtn.classList.remove("active");
    immersionColorsSection.classList.remove("hidden");
  } else {
    document.body.classList.add("mode-facile");
    modeFacileBtn.classList.add("active");
    modeImmersionBtn.classList.remove("active");
    immersionColorsSection.classList.add("hidden");
  }

  localStorage.setItem(STORAGE_KEYS.mode, mode);
  updateImmersionCursorVisibility(false);
}

function applyTheme(theme) {
  document.body.classList.remove("theme-default", "theme-green", "theme-blue", "theme-white");

  if (theme === "blue") {
    document.body.classList.add("theme-blue");
  } else if (theme === "white") {
    document.body.classList.add("theme-white");
  } else {
    document.body.classList.add("theme-green");
  }

  themeButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });

  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

function loadPreferences() {
  const savedMode = localStorage.getItem(STORAGE_KEYS.mode) || "facile";
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || "green";
  const savedProgress = localStorage.getItem(STORAGE_KEYS.progressEnabled);

  showProgress = savedProgress === "true";
  showProgressToggle.checked = showProgress;

  applyMode(savedMode);
  applyTheme(savedTheme);
}

prevBtn.addEventListener("click", () => {
  const previousIndex = getPreviousAccessibleChapterIndex(currentIndex);
  if (previousIndex !== null) {
    loadChapter(previousIndex);
  }
});

nextBtn.addEventListener("click", () => {
  const nextIndex = getNextAccessibleChapterIndex(currentIndex);
  if (nextIndex !== null) {
    loadChapter(nextIndex);
  }
});

menuBtn.addEventListener("click", showMenu);

modeFacileBtn.addEventListener("click", () => {
  applyMode("facile");
});

modeImmersionBtn.addEventListener("click", () => {
  applyMode("immersion");
});

themeButtons.forEach(button => {
  button.addEventListener("click", () => {
    applyTheme(button.dataset.theme);
  });
});

showProgressToggle.addEventListener("change", () => {
  showProgress = showProgressToggle.checked;
  localStorage.setItem(STORAGE_KEYS.progressEnabled, String(showProgress));
  buildMenu();
});

settingsToggle.addEventListener("click", openSettings);
closeSettingsBtn.addEventListener("click", closeSettings);
panelOverlay.addEventListener("click", closeSettings);

resetProgressBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEYS.progress);
  buildMenu();
  if (currentIndex !== null && readerView.classList.contains("active")) {
    window.scrollTo({ top: 0, behavior: "auto" });
  }
});

window.addEventListener("scroll", () => {
  if (readerScrollTarget !== null && Math.abs(window.scrollY - readerScrollTarget) < 2) {
    readerScrollTarget = window.scrollY;
  }

  updateReadingProgress();
});

window.addEventListener("wheel", (event) => {
  if (!isImmersionReaderActive()) {
    return;
  }

  if (Math.abs(event.deltaY) < 1) {
    return;
  }

  event.preventDefault();
  scrollReaderByStep(event.deltaY > 0 ? 1 : -1);
}, { passive: false });

window.addEventListener("beforeunload", () => {
  updateReadingProgress();
});

window.addEventListener("mousemove", (event) => {
  if (!immersionCursor) {
    return;
  }

  immersionCursor.style.left = `${event.clientX}px`;
  immersionCursor.style.top = `${event.clientY}px`;
  updateImmersionCursorVisibility(true);
});

window.addEventListener("mouseleave", () => {
  updateImmersionCursorVisibility(false);
});

window.addEventListener("blur", () => {
  updateImmersionCursorVisibility(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeSettings();
    return;
  }

  if (!isImmersionReaderActive()) {
    return;
  }

  if (["ArrowDown", "PageDown", " "].includes(event.key)) {
    event.preventDefault();
    scrollReaderByStep(1);
    return;
  }

  if (["ArrowUp", "PageUp"].includes(event.key)) {
    event.preventDefault();
    scrollReaderByStep(-1);
  }
});

loadPreferences();
buildMenu();
showMenu();

const savedChapter = localStorage.getItem(STORAGE_KEYS.chapter);
if (savedChapter !== null && !Number.isNaN(Number(savedChapter))) {
  currentIndex = Number(savedChapter);
  updateBottomNav();
}
