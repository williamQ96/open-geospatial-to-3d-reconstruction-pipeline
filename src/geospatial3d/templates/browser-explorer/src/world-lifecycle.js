// SPDX-License-Identifier: Apache-2.0
// Full navigation is the world boundary. Also release GPU resources for BFCache.
export function installWorldLifecycle(renderer, scene) {
  addEventListener(
    "pagehide",
    () => {
      renderer.setAnimationLoop(null);
      const geometries = new Set(),
        materials = new Set(),
        textures = new Set();
      scene.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        for (const material of [object.material].flat().filter(Boolean)) {
          materials.add(material);
          for (const value of Object.values(material))
            if (value?.isTexture) textures.add(value);
        }
        if (object.skeleton?.boneTexture)
          textures.add(object.skeleton.boneTexture);
      });
      for (const resource of [...textures, ...materials, ...geometries])
        resource.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
    { once: true },
  );
  addEventListener("pageshow", (event) => {
    // A cached document has deliberately disposed its GPU world; rebuild once.
    if (event.persisted) {
      const url = new URL(location.href);
      if (!url.searchParams.has("interior"))
        url.searchParams.set("return", "1");
      location.replace(url.href);
    }
  });
}
