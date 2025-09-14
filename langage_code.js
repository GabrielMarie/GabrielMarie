/**
 * langage_code.js — Prism auto + outils (copier / accordéon) pour blocs <pre><code class="language-...">
 *
 * Fonctions :
 * - Auto-détection des langages présents, chargement Prism (thème + core) + composants requis.
 * - Barre d’outils par bloc : bouton Copier (📋) et Replier/Déplier (▾/▸).
 * - Accordéon animé (max-height) ; état accessible au clavier.
 * - Alias: Prism.languages.arduino = Prism.languages.cpp si C++ est chargé.
 *
 * Personnalisation rapide :
 * - Désactiver le repli sur un bloc : ajouter data-no-collapse sur <pre> ou <code>.
 * - Désactiver le bouton copier :   ajouter data-no-copy     sur <pre> ou <code>.
 * - Titre optionnel : si un élément .code-title précède immédiatement le <pre>, son texte est affiché à gauche de la barre.
 * 
 * - Détecte tous les <code class="language-..."> présents dans la page.
 * - Charge Prism (thème + core) et SEULEMENT les composants nécessaires pour ces langages.
 * - Lance Prism.highlightAllUnder(document) une fois prêt.
 * - Ajoute l’alias Prism.languages.arduino = Prism.languages.cpp si C++ est chargé.
 *
 * Utilisation :
 * 1) Marque tes blocs comme d’habitude :
 *    <pre class="code-block"><code class="language-python">...</code></pre>
 *    <pre class="code-block"><code class="language-cpp">...</code></pre>
 *    <pre class="code-block"><code class="language-html">...</code></pre>
 * 2) Inclure ce script (idéalement en bas de page ou avec defer) :
 *    <script src="langage_code.js?v=1" defer></script>
 *
 * Notes :
 * - “language-c++” n’est pas standard : utilise “language-cpp”.
 * - Pour HTML/XML/SVG/MathML utilise “language-html”/“language-xml” (alias de 'markup').
 * - Si tu utilises déjà Prism ailleurs, ce fichier NE rechargera ni le core ni les composants déjà présents.
 */


(function () {
  const CDN_BASE = "https://unpkg.com/prismjs";
  const THEME = `${CDN_BASE}/themes/prism.css`;
  const CORE  = `${CDN_BASE}/prism.js`;
  const COMP_BASE = `${CDN_BASE}/components`;

  const MAP = {
    markup:["markup"], html:["markup"], xml:["markup"], svg:["markup"], mathml:["markup"],
    css:["css"],
    clike:["clike"],
    javascript:["clike","javascript"], js:["clike","javascript"],
    typescript:["clike","javascript","typescript"],
    c:["clike","c"],
    cpp:["clike","c","cpp"],
    arduino:["clike","c","cpp"],
    python:["python"], py:["python"],
    bash:["bash"], shell:["bash"],
    json:["json"],
    yaml:["yaml"], yml:["yaml"],
    sql:["sql"],
    php:["clike","php"],
    java:["clike","java"],
    kotlin:["clike","kotlin"],
    swift:["clike","swift"],
    go:["go"], rust:["rust"], ruby:["ruby"],
    latex:["latex"], matlab:["matlab"],
    plaintext:[], none:[]
  };

  function normalizeLang(raw){
    if(!raw) return null;
    let s = raw.toLowerCase().replace(/^language-/,"").trim();
    if(s==="c++") s="cpp";
    if(s==="js") s="javascript";
    if(s==="py") s="python";
    if(s==="yml") s="yaml";
    if(["html","xml","svg","mathml"].includes(s)) return s;
    return s;
  }
  function hasAnyCode(){ return !!document.querySelector('code[class*="language-"]'); }
  function detectLanguages(){
    const langs=new Set();
    document.querySelectorAll('code[class*="language-"]').forEach(code=>{
      code.classList.forEach(cls=>{
        if(cls.startsWith("language-")){
          const k = normalizeLang(cls); if(k) langs.add(k);
        }
      });
    });
    return [...langs];
  }
  function resolveComponents(langs){
    const out=[], seen=new Set(); const add=x=>{ if(!x||seen.has(x))return; seen.add(x); out.push(x); };
    langs.forEach(l=> (MAP[l]||[]).forEach(add));
    return out;
  }

  /* loaders idempotents */
  function cssLoaded(){ return [...document.styleSheets].some(s=>(s.href||"").includes("/prism.css")); }
  function scriptLoadedEndsWith(file){ return [...document.scripts].some(s=>s.src && s.src.endsWith(file)); }
  function loadCSS(href){ return new Promise((res,rej)=>{ if(cssLoaded()) return res(); const link=document.createElement("link"); link.rel="stylesheet"; link.href=href; link.onload=res; link.onerror=rej; document.head.appendChild(link); }); }
  function loadScript(src){ return new Promise((res,rej)=>{ const tail=src.split("/").pop(); if(scriptLoadedEndsWith(tail)) return res(); const el=document.createElement("script"); el.src=src; el.defer=true; el.onload=res; el.onerror=rej; document.head.appendChild(el); }); }
  async function ensurePrismAndComponents(components){
    if(!window.Prism){ await loadCSS(THEME); await loadScript(CORE); }
    for(const comp of components){ await loadScript(`${COMP_BASE}/prism-${comp}.min.js`); }
  }

  /* styles pour la carte (déplace dans style.css si tu veux) */
  let stylesInjected=false;
  function injectStyles(){
    if(stylesInjected) return; stylesInjected=true;
    const css = `
      .lc-card{ background:#fff; border:1px solid #e5e7eb; border-radius:12px; box-shadow:0 1px 2px rgba(0,0,0,.04); overflow:hidden; margin:1rem 0; }
      .lc-head{ display:flex; align-items:center; justify-content:space-between; gap:.5rem; padding:.5rem .75rem; background:#fff; }
      .lc-head:hover{ background:#fafafa; }
      .lc-title{ font-weight:600; color:#222; font-size:.95rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .lc-tools{ display:flex; gap:.25rem; }
      .lc-btn{ appearance:none; border:0; background:#eee; cursor:pointer; padding:.3rem .5rem; border-radius:.45rem; font-size:.9rem; line-height:1; color:#222; }
      .lc-btn:hover{ background:#e5e5e5; }
      .lc-btn:focus{ outline:2px solid #4c9ffe; outline-offset:2px; }
      .lc-copy.ok{ color:#0a7a2f; background:#e6f7ec; }
      .lc-content{ transition:max-height .3s ease; overflow:hidden; background:#fff; }
      .lc-body{ padding:.75rem .75rem 1rem; }
      /* annule le fond Prism si besoin pour garder le blanc de la carte */
      .lc-body pre{ margin:0; background:transparent !important; }
    `.trim();
    const st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);
  }

  /* helpers carte */
  function extractTitle(pre, code){
    // priorité: data-title sur <code> ou <pre>, sinon .code-title juste avant, sinon “Code”
    const dt = code.getAttribute("data-title") || pre.getAttribute("data-title");
    if (dt) return dt.trim();
    const prev = pre.previousElementSibling;
    if(prev && prev.classList.contains("code-title")){
      const t = prev.textContent.trim();
      // on garde l’élément visuellement? on peut le retirer pour éviter doublon
      prev.remove();
      return t || "Code";
    }
    return "Code";
  }

  function shouldDisable(el, attr){ return el?.hasAttribute?.(attr) || el?.querySelector?.(`[${attr}]`); }

  function makeCard(pre){
    const code = pre.querySelector("code") || pre.nextElementSibling?.matches("code") && pre.nextElementSibling;
    const card = document.createElement("div"); card.className="lc-card";
    const head = document.createElement("div"); head.className="lc-head"; head.tabIndex=0; head.setAttribute("role","button"); head.setAttribute("aria-expanded","false");
    const title = document.createElement("div"); title.className="lc-title"; title.textContent = extractTitle(pre, code);
    const tools = document.createElement("div"); tools.className="lc-tools";

    const btnCopy = document.createElement("button");
    btnCopy.className="lc-btn lc-copy"; btnCopy.type="button"; btnCopy.title="Copier le code"; btnCopy.setAttribute("aria-label","Copier le code");
    btnCopy.textContent="📋";

    const btnToggle = document.createElement("button");
    btnToggle.className="lc-btn lc-toggle"; btnToggle.type="button"; btnToggle.title="Replier/Déplier"; btnToggle.setAttribute("aria-label","Replier ou déplier ce code");
    btnToggle.textContent="▸"; // replié par défaut

    tools.appendChild(btnCopy); tools.appendChild(btnToggle);
    head.appendChild(title); head.appendChild(tools);

    const content = document.createElement("div"); content.className="lc-content";
    const body = document.createElement("div"); body.className="lc-body";
    pre.parentNode.insertBefore(card, pre);
    card.appendChild(head); card.appendChild(content);
    content.appendChild(body); body.appendChild(pre);

    // état initial
const opened = true;
      function setOpenState(open){
      head.setAttribute("aria-expanded", String(open));
      btnToggle.textContent = open ? "▾" : "▸";
      if (open){
        content.style.maxHeight = body.scrollHeight + "px";
      } else {
        content.style.maxHeight = "0px";
      }
    }
    setOpenState(!!opened);

    // redimension
    window.addEventListener("resize", ()=>{ if(head.getAttribute("aria-expanded")==="true"){ content.style.maxHeight = body.scrollHeight + "px"; } });

    // interactions
    function toggle(){ const open = head.getAttribute("aria-expanded")==="true"; setOpenState(!open); }
    head.addEventListener("click", (e)=>{ if(e.target.closest(".lc-btn")) return; toggle(); });
    head.addEventListener("keydown", (e)=>{ if(e.key==="Enter"||e.key===" ") { e.preventDefault(); toggle(); } });
    btnToggle.addEventListener("click", (e)=>{ e.stopPropagation(); toggle(); });

    btnCopy.addEventListener("click", async (e)=>{
      e.stopPropagation();
      const text = (pre.querySelector("code")?.textContent || pre.textContent || "").trimEnd();
      try{
        if(navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
        else { const ta=document.createElement("textarea"); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); }
        btnCopy.classList.add("ok"); const old=btnCopy.textContent; btnCopy.textContent="✅"; setTimeout(()=>{ btnCopy.textContent=old; btnCopy.classList.remove("ok"); }, 1200);
      }catch(err){ console.warn("Copie impossible:", err); }
    });

    // options
    if(shouldDisable(pre,"data-no-copy") || shouldDisable(code,"data-no-copy")) btnCopy.style.display="none";
    if(shouldDisable(pre,"data-no-collapse") || shouldDisable(code,"data-no-collapse")){
      btnToggle.style.display="none";
      setOpenState(true);
      head.removeAttribute("role"); head.removeAttribute("tabindex"); head.removeAttribute("aria-expanded");
    }

    return card;
  }

  function enhanceBlocks(){
    injectStyles();
    document.querySelectorAll('pre > code[class*="language-"], pre.code-block > code[class*="language-"]').forEach(code=>{
      const pre = code.parentElement;
      if(pre.closest(".lc-card")) return; // déjà traité
      makeCard(pre);
    });
  }

  async function boot(){
    if(!hasAnyCode()) return;
    const langs = detectLanguages();
    if(!langs.length) return;
    const components = resolveComponents(langs);
    try{
      await ensurePrismAndComponents(components);
      if(window.Prism?.languages?.cpp && !window.Prism.languages.arduino){
        window.Prism.languages.arduino = window.Prism.languages.cpp;
      }
      Prism.highlightAllUnder(document);
      enhanceBlocks();
      document.addEventListener("prism:refresh", ()=>{ Prism.highlightAllUnder(document); enhanceBlocks(); });
    }catch(e){
      console.warn("[langage_code] Échec chargement Prism:", e);
    }
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
