/* ovation_fix.js — robust OVATION parser + diagnostics */
(function(){
  const $ = (id)=>document.getElementById(id);
  function normLonDiff(d){ while(d>180)d-=360; while(d<-180)d+=360; return d; }
  const fmtUTC=(iso)=>{try{return new Date(iso).toLocaleString('fr-CA',{timeZone:'UTC',hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})+" UTC"}catch{return iso}};

  // Heuristic scanner: collect ANY [lon,lat,intensity] triplets from the JSON
  function scanTriplets(node, out){
    if(!node) return;
    if(Array.isArray(node)){
      if(node.length===3 && node.every(v=>typeof v==="number")){
        const [lon, lat, val] = node;
        if(lon>=-180 && lon<=180 && lat>=-90 && lat<=90 && isFinite(val)){
          out.push({lat, lon, intensity: +val});
        }
      }
      for(const v of node) scanTriplets(v,out);
      return;
    }
    if(typeof node==="object"){
      for(const k in node) scanTriplets(node[k], out);
    }
  }

  // Drop-in replacement for extractOvationCells
  window.__extractOvationCellsRobust = function(raw){
    try{
      // Case A: simple array of objects
      if(Array.isArray(raw) && raw.length && typeof raw[0]==="object"){
        const keyLat = ["lat","latitude","Lat","Latitude"].find(k=>k in raw[0]) || "lat";
        const keyLon = ["lon","longitude","Lon","Longitude"].find(k=>k in raw[0]) || "lon";
        const keyVal = ["intensity","probability","value","Intensity","Value"].find(k=>k in raw[0]) || "intensity";
        const cells = raw.map(o=>({lat:+o[keyLat], lon:+o[keyLon], intensity:+o[keyVal], time:o.time || o["Observation Time"] || null}))
                         .filter(c=>Number.isFinite(c.lat)&&Number.isFinite(c.lon)&&Number.isFinite(c.intensity));
        if(cells.length) return cells;
      }
      // Case B: FeatureCollection with coordinates triplets
      if(raw && raw.type==="FeatureCollection"){
        const cells=[];
        if(Array.isArray(raw.features)){
          for(const f of raw.features){
            const coords = f?.geometry?.coordinates;
            if(coords) scanTriplets(coords, cells);
          }
        } else if(raw.geometry?.coordinates){
          scanTriplets(raw.geometry.coordinates, cells);
        }
        return cells;
      }
      // Case C: geometry at top-level
      if(raw?.geometry?.coordinates){
        const cells=[]; scanTriplets(raw.geometry.coordinates, cells); return cells;
      }
      // Case D: desperate scan
      const cells=[]; scanTriplets(raw, cells); return cells;
    }catch(e){
      console.warn("extractOvationCellsRobust error:", e);
      return [];
    }
  };

  // Wrapper to replace loadOvationAt if needed
  window.__loadOvationAtRobust = async function(fetchFn, NOAA_OVATION_URL, lat, lon){
    const out = $("ovation-now"), extra=$("ovation-extra");
    if(!out) return;
    try{
      out.textContent = "Calcul en cours…";
      const raw = await fetchFn(NOAA_OVATION_URL);
      const cells = window.__extractOvationCellsRobust(raw);
      if(!cells.length) throw new Error("Aucune cellule OVATION trouvée — voir console pour le JSON brut.");
      let best=null, bestD=1e9;
      for(const c of cells){
        const d = Math.hypot(lat - c.lat, normLonDiff(lon - c.lon));
        if(d<bestD){ bestD=d; best=c; }
      }
      const p = Math.max(0, Math.min(100, +best.intensity || 0));
      out.innerHTML = `Probabilité à <b>${lat.toFixed(2)}°, ${lon.toFixed(2)}°</b> : <b>${p.toFixed(0)} %</b>`;
      if(extra) extra.textContent = `MàJ modèle : ${fmtUTC(best.time || new Date().toISOString())}.`;
    }catch(err){
      console.error("OVATION robust error:", err);
      console.log("OVATION raw JSON follows ↓ (copie-colle pour debug):");
      try{
        const raw = await fetch(NOAA_OVATION_URL).then(r=>r.json());
        console.log(raw);
      }catch(_){}
      out.textContent = "❌ Impossible de calculer la probabilité OVATION (parser robuste).";
      if(extra) extra.textContent = "";
    }
  };
})();