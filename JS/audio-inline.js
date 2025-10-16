// audio-inline.js — lecteur audio inline (vanilla, accessible)
//<script src="JS/audio-inline.js" defer></script>


// <p>
//  Voici mon texte.
//  <span class="audio-inline" data-src="audio/mon_extrait.mp3" data-label="Écouter"></span>
//  et je continue après le lecteur.
//</p>

(function () {
 const STYLE = `
/* Conteneur minimal (sans cadre) */
.ai{
  display:inline-flex;
  align-items:center;
  gap:.5rem;
  padding:.25rem .25rem;
  border:none;
  border-radius:999px;
  vertical-align:baseline;
}

/* État au repos : on ne montre que le bouton (largeur serrée) */
.ai.ai-collapsed{
  gap:0;
  overflow:hidden;
}

/* Bouton circulaire */
.ai-btn{
  width:34px; height:34px; border-radius:50%;
  border:0; background:#111; color:#fff;
  cursor:pointer; display:grid; place-items:center;
  transition: transform .35s ease;
}
.ai-btn:focus{ outline:2px solid #66a3ff; outline-offset:2px }

/* Piste + temps (cachés au repos, animés à l’ouverture) */
.ai-track{
  display:inline-flex; align-items:center; gap:.5rem;
  /* on animera la largeur */
  width:0;
  opacity:0;
  transition: width .35s ease, opacity .35s ease;
}

/* Quand le lecteur est “ouvert” */
.ai.ai-expanded .ai-track{
  width:190px;      /* ajuste si tu veux plus long */
  opacity:1;
}

/* petit “glissement” du bouton vers la gauche à l’ouverture */
.ai.ai-expanded .ai-btn{ transform: translateX(-4px); }

/* Barre très fine */
.ai-range{
  -webkit-appearance:none; appearance:none;
  width:140px; height:3px; background:#e6e6e6; border-radius:999px; cursor:pointer;
}
.ai-range::-webkit-slider-thumb{
  -webkit-appearance:none; width:12px; height:12px; border-radius:50%; background:#111; border:0; margin-top:-4.5px;
}
.ai-range::-moz-range-thumb{
  width:12px; height:12px; border-radius:50%; background:#111; border:0;
}

/* Temps (caché tant que fermé) */
.ai-time{
  font:12px/1.2 system-ui, sans-serif;
  white-space:nowrap; opacity:.85;
  transition: opacity .35s ease;
}
.ai.ai-collapsed .ai-time{ opacity:0 }

/* Étiquette (on la masque pour ton design) */
.ai-label{ display:none }
`;

  const injectStyleOnce = () => {
    if (document.getElementById("ai-style")) return;
    const s = document.createElement("style");
    s.id = "ai-style"; s.textContent = STYLE; document.head.appendChild(s);
  };

  const fmt = s => {
    if (!isFinite(s)) return "0:00";
    s = Math.max(0, Math.floor(s));
    const m = Math.floor(s / 60), ss = String(s % 60).padStart(2, "0");
    return `${m}:${ss}`;
  };
  const iconPlay  = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>`;
  const iconPause = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>`;

  const players = new Set();
  function pauseOthers(me){ players.forEach(p => { if(p!==me) p.audio.pause(); }); }

  function build(el, src, label) {
    injectStyleOnce();
    const audio = new Audio(src);
    audio.preload = el.dataset.preload || "metadata";

    const btn = document.createElement("button");
    btn.className = "ai-btn"; btn.type = "button";
    btn.setAttribute("aria-label", label || "Écouter"); btn.innerHTML = iconPlay;

    const lab = document.createElement("span");
    lab.className = "ai-label"; lab.textContent = label || "Écouter";

    const range = document.createElement("input");
    range.className = "ai-range"; range.type = "range";
    range.min = 0; range.max = 1000; range.value = 0;

    const time = document.createElement("span");
    time.className = "ai-time"; time.textContent = "0:00 / 0:00";

    const track = document.createElement("span");
    track.className = "ai-track"; track.append(range, time);

    el.classList.add("ai"); el.replaceChildren(btn, lab, track);
    el.classList.add("ai-collapsed");


    const state = { audio, dragging:false };
    players.add(state);

    function sync(){
      const d = audio.duration, t = audio.currentTime;
      if (isFinite(d) && d>0 && !state.dragging) {
        range.value = Math.round((t/d)*1000);
        time.textContent = `${fmt(t)} / ${fmt(d)}`;
      }
      btn.innerHTML = audio.paused ? iconPlay : iconPause;
    }

    btn.addEventListener("click", ()=>{
      if (audio.paused) { pauseOthers(state); audio.play(); }
      else { audio.pause(); }
    });
    btn.addEventListener("click", ()=>{
  if (!el.classList.contains("ai-expanded")) {
    el.classList.remove("ai-collapsed");
    // petit timeout pour laisser le layout s’installer avant l’anim
    requestAnimationFrame(()=> el.classList.add("ai-expanded"));
  }
  if (audio.paused) { pauseOthers(state); audio.play(); }
  else { audio.pause(); }
});


    range.addEventListener("input", ()=>{
      const d = audio.duration; if (!isFinite(d) || d<=0) return;
      state.dragging = true;
      const t = (range.value/1000)*d;
      time.textContent = `${fmt(t)} / ${fmt(d)}`;
    });
    range.addEventListener("change", ()=>{
      const d = audio.duration; if (!isFinite(d) || d<=0) return;
      audio.currentTime = (range.value/1000)*d; state.dragging = false;
    });

    audio.addEventListener("timeupdate", sync);
    audio.addEventListener("durationchange", sync);
    audio.addEventListener("loadedmetadata", sync);
    audio.addEventListener("pause", sync);
    audio.addEventListener("play", ()=>{ pauseOthers(state); sync(); });
    audio.addEventListener("ended", ()=>{ audio.currentTime = 0; audio.pause(); });
  }

  // API publique
  const API = {
    /** Upgrade tous les éléments correspondants (par défaut: .audio-inline) */
    upgradeAll(selector = ".audio-inline") {
      document.querySelectorAll(selector).forEach(el => {
        if (el.dataset.aiReady) return;
        const src = el.dataset.src;
        if (!src) return console.warn("[audio-inline] data-src manquant", el);
        build(el, src, el.dataset.label);
        el.dataset.aiReady = "1";
      });
    },
    /** Monte un lecteur sur un élément/selector précis */
    mount(target, opts) {
      const el = typeof target === "string" ? document.querySelector(target) : target;
      if (!el) return console.warn("[audio-inline] cible introuvable:", target);
      if (el.dataset.aiReady) return;
      build(el, opts?.src, opts?.label);
      el.dataset.aiReady = "1";
    }
  };

  // Auto-init: transforme toutes les .audio-inline présentes au DOMReady
  function ready(fn){ if(document.readyState!=="loading") fn(); else document.addEventListener("DOMContentLoaded", fn); }
  ready(()=> API.upgradeAll());

  // Expose dans window
  window.AudioInline = API;
})();
