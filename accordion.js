/**
 * accordion.js — Accordéon réutilisable “+ / −” pour masquer/afficher du contenu.
 *
 * Ce que fait ce script :
 * - Convertit chaque <section class="sujet"><h2>…</h2> …</section> en accordéon.
 * - Un seul panneau ouvert à la fois dans un même “scope” (conteneur avec [data-accordion-scope]).
 * - Ajoute l’accessibilité : rôle bouton, aria-expanded, navigation clavier (Entrée/Espace).
 * - Anime l’ouverture/fermeture via max-height.
 * - Ouvre automatiquement la section ciblée par l’ancre (#mon-id) au chargement et sur hashchange.
 *
 * Pré-requis CSS minimal (à mettre dans votre feuille) :
 *   .sujet-content { max-height: 0; overflow: hidden; transition: max-height .35s ease; }
 *   .sujet h2 { cursor: pointer; position: relative; padding-right: 1.5em; }
 *   .sujet h2::after { content: "+"; position: absolute; right: 0; top: 0; font-weight: 700; }
 *   section.sujet.open > h2::after { content: "−"; }
 *
 * Utilisation (auto-init par défaut) :
 * 1) HTML :
 *    <div data-accordion-scope>
 *      <section class="sujet" id="intro">
 *        <h2>Introduction</h2>
 *        <p>Mon contenu…</p>
 *      </section>
 *      <section class="sujet" id="details">
 *        <h2>Détails</h2>
 *        <p>Autre contenu…</p>
 *      </section>
 *    </div>
 *
 * 2) Scripts :
 *    <script src="site.js" defer></script>
 *    <script src="accordion.js?v=1" defer></script>
 *    // Si la page contient au moins un <section class="sujet">, l’accordéon s’initialise tout seul.
 *
 * 3) Initialisation manuelle (optionnelle) :
 *    // Cible un sélecteur spécifique et/ou limite au “scope” voulu
 *    Accordion.init("section.sujet", { scope: document.querySelector("[data-accordion-scope]") });
 *
 * Options :
 * - selector : sélecteur CSS des sections (défaut : "section.sujet").
 * - scope    : élément racine pour l’exclusivité d’ouverture (défaut : document).
 *
 * Notes :
 * - Le script regroupe automatiquement tout le contenu après <h2> dans un div.sujet-content.
 * - Pour ouvrir via un lien : <a href="#intro">Aller à l’intro</a>.
 */


// accordion.js — Accordéon réutilisable (un seul ouvert à la fois)
(function () {
  function wrapSection(section) {
    const h2 = section.querySelector("h2");
    if (!h2) return;

    // Crée le conteneur de contenu et déplace tout ce qui suit le h2
    const box = document.createElement("div");
    box.className = "sujet-content";
    const toMove = [];
    for (let n = h2.nextSibling; n; n = n.nextSibling) toMove.push(n);
    toMove.forEach(node => box.appendChild(node));
    section.appendChild(box);

    // Accessibilité + “bouton” au H2
    h2.setAttribute("role", "button");
    h2.setAttribute("tabindex", "0");
    h2.setAttribute("aria-expanded", "false");

    // Init fermé
    box.style.maxHeight = "0px";

    function close(sec) {
      const head = sec.querySelector("h2");
      const content = sec.querySelector(".sujet-content");
      sec.classList.remove("open");
      if (content) content.style.maxHeight = "0px";
      if (head) head.setAttribute("aria-expanded", "false");
    }

    function open(sec) {
      // Ferme les autres sections dans le même “scope”
      const scope = section.closest('[data-accordion-scope]') || document;
      scope.querySelectorAll("section.sujet.open").forEach(s => { if (s !== sec) close(s); });

      // Ouvre celle-ci
      sec.classList.add("open");
      const content = sec.querySelector(".sujet-content");
      if (content) content.style.maxHeight = content.scrollHeight + "px";
      h2.setAttribute("aria-expanded", "true");
    }

    function toggle() {
      section.classList.contains("open") ? close(section) : open(section);
    }

    h2.addEventListener("click", toggle);
    h2.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });

    // Ajuste la hauteur quand la fenêtre change de taille
    window.addEventListener("resize", () => {
      if (section.classList.contains("open")) {
        box.style.maxHeight = box.scrollHeight + "px";
      }
    });
  }

  // API publique : init(selector, {scope})
  function init(selector = "section.sujet", { scope } = {}) {
    const root = scope || document;
    root.querySelectorAll(selector).forEach(wrapSection);

    // Ouvrir automatiquement si l’ancre #sujetX est cliquée / chargée
    const applyAnchor = () => {
      const id = (location.hash || "").slice(1);
      if (!id) return;
      const sec = document.getElementById(id);
      const h2 = sec?.querySelector("h2");
      if (h2 && !sec.classList.contains("open")) h2.click();
    };
    window.addEventListener("hashchange", applyAnchor);
    applyAnchor();
  }

  // Auto-init si la page contient des sections .sujet
  document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector("section.sujet")) init();
  });

  // Expose pour init manuel: Accordion.init("section.sujet", {scope: el})
  window.Accordion = { init };
})();
