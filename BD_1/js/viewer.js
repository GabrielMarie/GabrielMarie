customElements.whenDefined("model-viewer").then(() => {
  const viewers = document.querySelectorAll(".js-smart-viewer");

  viewers.forEach((viewer) => {
    const wrapper = viewer.closest(".viewer-wrapper");
    const infoBox = wrapper ? wrapper.querySelector(".infoBox") : null;
    const loadingBox = wrapper ? wrapper.querySelector(".viewer-loading") : null;

    const defaultInfo = viewer.dataset.infoDefault || "Clique sur un point";
    const metallic = parseFloat(viewer.dataset.metallic ?? "0.3");
    const roughness = parseFloat(viewer.dataset.roughness ?? "0.3");

    if (infoBox) {
      infoBox.textContent = defaultInfo;
    }

    const hotspots = viewer.querySelectorAll(".hotspot");

    hotspots.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.orbit) {
          viewer.cameraOrbit = btn.dataset.orbit;
        }

        if (infoBox) {
          const title = btn.dataset.title || "";
          const text = btn.dataset.text || "";

          infoBox.innerHTML = title
            ? `<h3>${title}</h3><p>${text}</p>`
            : `<p>${text}</p>`;
        }
      });
    });

    const markLoaded = () => {
      if (wrapper) {
        wrapper.classList.add("is-loaded");
      }
      if (loadingBox) {
        loadingBox.setAttribute("aria-hidden", "true");
      }
    };

    viewer.addEventListener("load", () => {
      if (viewer.model && viewer.model.materials) {
        viewer.model.materials.forEach((material) => {
          if (!material.pbrMetallicRoughness) return;
          material.pbrMetallicRoughness.setMetallicFactor(metallic);
          material.pbrMetallicRoughness.setRoughnessFactor(roughness);
        });
      }

      markLoaded();
    });

    viewer.addEventListener("error", () => {
      if (loadingBox) {
        loadingBox.textContent = "Erreur de chargement du robot";
      }
    });
  });
});