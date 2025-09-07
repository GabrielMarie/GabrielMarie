/* aurora_widgets.js — widgets only, no banner/layout changes */
(function(){
  // ----- CONFIG (set your worker if needed) -----
  const PROXY_BASE = ""; // e.g., "https://YOUR-WORKER.workers.dev/?url="

  // ----- NOAA endpoints -----
  const NOAA = {
    KP_1M: "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json",
    KP_FC3D: "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json",
    OVATION: "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json"
  };

  // ----- helpers -----
  const $ = (id)=>document.getElementById(id);
  const fmtUTC = (iso) => {
    try{
      return new Date(iso).toLocaleString('fr-CA',{timeZone:'UTC',hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) + " UTC";
    }catch{return iso}
  };
  const kpColor = (kp)=> kp<3 ? "#1e90ff" : kp<5 ? "#4caf50" : kp<7 ? "#ff9800" : "#f44336";

  async function fetchWithFallback(url){
    try{
      const r = await fetch(url,{cache:"no-store"});
      if(!r.ok) throw new Error("HTTP "+r.status);
      return await r.json();
    }catch(e){
      if(!PROXY_BASE) throw e;
      const r2 = await fetch(PROXY_BASE + encodeURIComponent(url), {cache:"no-store"});
      if(!r2.ok) throw new Error("PROXY HTTP "+r2.status);
      return await r2.json();
    }
  }

  // ----- OVATION parser (handles common formats) -----
  function extractOvationCells(raw){
    if (Array.isArray(raw) && raw.length && typeof raw[0]==="object" && "lat" in raw[0] && "lon" in raw[0]) {
      return raw.map(o=>({lat:+o.lat, lon:+o.lon, intensity:+(o.intensity ?? o.probability ?? 0), time:o.time || o["Observation Time"] || null}));
    }
    if (raw && raw.type==="FeatureCollection" && Array.isArray(raw.features)) {
      const cells=[];
      for (const f of raw.features){
        const props=f.properties||{};
        const coords=f.geometry?.coordinates||[];
        const flat=coords.flat(3);
        for(let i=0;i+2<flat.length;i+=3){
          const lon=+flat[i], lat=+flat[i+1], intensity=+flat[i+2];
          if(Number.isFinite(lat)&&Number.isFinite(lon)&&Number.isFinite(intensity)){
            cells.push({lat,lon,intensity,time:props.time||null});
          }
        }
      }
      return cells;
    }
    return [];
  }
  function normLonDiff(d){ while(d>180)d-=360; while(d<-180)d+=360; return d; }

  // ----- Widgets -----
  async function loadKpLive(){
    const live = $("kp-live"), note=$("kp-live-note");
    if(!live || !note) return; // allow page without these ids
    try{
      const data = await fetchWithFallback(NOAA.KP_1M);
      const last = data[data.length-1];
      const kp = parseFloat(last.kp_index);
      live.innerHTML = `📡 Indice Kp (1‑min) : <b>${kp.toFixed(1)}</b> <span style="display:inline-block;padding:3px 8px;border-radius:999px;border:1px solid #333;background:${kpColor(kp)};margin-left:8px">Kp</span>`;
      note.textContent = `Mesuré ${fmtUTC(last.time_tag)}.`;
    }catch(err){
      console.error("Kp1m error:", err);
      live.textContent = "❌ Impossible de récupérer le Kp (1‑min).";
      note.textContent = "";
    }
  }

  async function loadOvationAt(lat, lon){
    const out = $("ovation-now"), extra=$("ovation-extra");
    if(!out) return;
    try{
      out.textContent = "Calcul en cours…";
      const raw = await fetchWithFallback(NOAA.OVATION);
      const cells = extractOvationCells(raw);
      if(!cells.length) throw new Error("Format OVATION inattendu");
      let best=null, bestD=1e9;
      for(const c of cells){
        const d = Math.hypot(lat - c.lat, normLonDiff(lon - c.lon));
        if(d<bestD){ bestD=d; best=c; }
      }
      const p = Math.max(0, Math.min(100, +best.intensity || 0));
      out.innerHTML = `Probabilité à <b>${lat.toFixed(2)}°, ${lon.toFixed(2)}°</b> : <b>${p.toFixed(0)} %</b>`;
      if(extra) extra.textContent = `MàJ modèle : ${best.time ? fmtUTC(best.time) : "N/D"}.`;
    }catch(err){
      console.error("OVATION error:", err);
      out.textContent = "❌ Impossible de calculer la probabilité OVATION.";
      if(extra) extra.textContent = "";
    }
  }

  function geolocateAndLoad(){
    const status = $("loc-status");
    const latEl=$("lat"), lonEl=$("lon");
    if(!latEl || !lonEl) return; // allow page without manual inputs
    if(!navigator.geolocation){
      if(status) status.textContent = "Géolocalisation non disponible — entrer lat/lon.";
      return;
    }
    if(status) status.textContent = "Demande d’autorisation de géolocalisation…";
    navigator.geolocation.getCurrentPosition((pos)=>{
      const lat = pos.coords.latitude, lon = pos.coords.longitude;
      if(status) status.textContent = `Position détectée : ${lat.toFixed(3)}°, ${lon.toFixed(3)}°.`;
      latEl.value = lat.toFixed(3);
      lonEl.value = lon.toFixed(3);
      loadOvationAt(lat, lon);
    }, (_err)=>{
      if(status) status.textContent = "Accès refusé — entrez lat/lon puis cliquez “Mettre à jour”.";
    }, { enableHighAccuracy:true, timeout:8000, maximumAge:300000 });
  }

  function wireManual(){
    const btn = $("btnManual"), latEl=$("lat"), lonEl=$("lon"), status=$("loc-status");
    if(!btn || !latEl || !lonEl) return;
    btn.addEventListener("click", ()=>{
      const lat = parseFloat(latEl.value), lon = parseFloat(lonEl.value);
      if(Number.isFinite(lat) && Number.isFinite(lon)){
        if(status) status.textContent = `Position définie manuellement : ${lat.toFixed(3)}°, ${lon.toFixed(3)}°.`;
        loadOvationAt(lat, lon);
      }
    });
  }

  let chartRef=null;
  async function loadKpForecast(){
    const note = $("kp-forecast-note");
    const canvas = $("kp-forecast-chart");
    if(!canvas) return;
    try{
      const rows = await fetchWithFallback(NOAA.KP_FC3D);
      const head = rows[0];
      const idxTime = head.indexOf("time_tag");
      const idxKp = head.indexOf("kp_forecast");
      const data = rows.slice(1).map(r=>({t:r[idxTime], kp:+r[idxKp]}));
      const labels = data.map(d=> new Date(d.t).toLocaleString(undefined, {month:'2-digit',day:'2-digit',hour:'2-digit'}));
      const values = data.map(d=> d.kp);
      if(window.Chart){
        if(chartRef){ chartRef.destroy(); }
        chartRef = new Chart(canvas, {
          type:"bar",
          data:{ labels, datasets:[{ label:"Kp (3 h)", data:values, backgroundColor:values.map(kpColor) }]},
          options:{
            animation:false,
            scales:{ y:{min:0,max:9,ticks:{stepSize:1}}},
            plugins:{ legend:{display:false}, tooltip:{callbacks:{label:(c)=>"Kp "+c.raw}} }
          }
        });
      }
      if(note && data.length){
        note.textContent = `Fenêtre de prévision : ${fmtUTC(data[0].t)} → ${fmtUTC(data[data.length-1].t)}.`;
      }
    }catch(err){
      console.error("Forecast error:", err);
      if(note) note.textContent = "❌ Impossible de charger la prévision Kp 3 jours.";
    }
  }

  // kickoff
  loadKpLive();
  loadKpForecast();
  geolocateAndLoad();
  wireManual();
  setInterval(loadKpLive, 5*60*1000);
})();