// SPDX-License-Identifier: Apache-2.0
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clipTimeFromPhase } from "./ambience.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";

export async function loadStudentFactory(
  url,
  { footfall_phase_offset = 0 } = {},
) {
  const contactOffset = Number.isFinite(footfall_phase_offset)
    ? footfall_phase_offset
    : 0;
  const asset = await new GLTFLoader().loadAsync(url);
  return (properties = null) => {
    const p = properties && typeof properties === "object" ? properties : null;
    const toteFollowers = [];
    const root = new THREE.Group(),
      body = clone(asset.scene),
      owned = [];
    const bounds = new THREE.Box3().setFromObject(body),
      height = p?.heightM || 1.78,
      scale = height / (bounds.max.y - bounds.min.y);
    body.scale.setScalar(scale);
    body.scale.x *= p?.bodyWidth || 1;
    body.position.y = -bounds.min.y * scale;
    root.add(body);
    root.name = "Rigged campus student";
    body.traverse((mesh) => {
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      if (!p) return;
      const old = mesh.material;
      if (!old) return;
      const mat = old.clone();
      owned.push(mat);
      mesh.material = mat;
      if (old.name.includes("face and hands")) {
        mat.map = null;
        mat.color.set(p.skinColor);
        mat.needsUpdate = true;
      }
      if (old.name.includes("Forest")) mat.color.set(p.shirtColor);
      if (old.name.includes("Charcoal")) mat.color.set(p.trouserColor);
      if (
        mesh.name.includes("Original_campus_backpack") ||
        mesh.name.includes("Original campus backpack")
      )
        mesh.visible = false;
    });
    root.updateMatrixWorld(true);
    if (p) {
      const ratio = height / 1.78;
      function material(color) {
        const m = new THREE.MeshStandardMaterial({ color, roughness: 0.92 });
        owned.push(m);
        return m;
      }
      function part(parent, geometry, mat, x, y, z) {
        const m = new THREE.Mesh(geometry, mat);
        owned.push(geometry);
        m.position.set(x, y, z);
        parent.add(m);
        m.receiveShadow = true;
        return m;
      }
      function attach(group, boneName, position) {
        // One vertex-color accessory draw per attachment, not a draw per curl/strap.
        const geometries = [];
        for (const mesh of group.children) {
          mesh.updateMatrix();
          let geometry = mesh.geometry.clone().applyMatrix4(mesh.matrix);
          if (geometry.index) geometry = geometry.toNonIndexed();
          geometry.deleteAttribute("uv");
          const rgb = mesh.material.color,
            colors = [];
          for (let i = 0; i < geometry.attributes.position.count; i++)
            colors.push(rgb.r, rgb.g, rgb.b);
          geometry.setAttribute(
            "color",
            new THREE.Float32BufferAttribute(colors, 3),
          );
          geometries.push(geometry);
        }
        group.clear();
        const geometry = mergeGeometries(geometries, false);
        for (const g of geometries) g.dispose();
        const material = new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.92,
        });
        owned.push(geometry, material);
        group.add(new THREE.Mesh(geometry, material));
        group.position.copy(position);
        group.scale.setScalar(ratio);
        root.add(group);
        root.updateMatrixWorld(true);
        body.getObjectByName(boneName)?.attach(group);
      }
      const head = body.getObjectByName("Head"),
        chest = body.getObjectByName("Chest");
      if (head) {
        const pos = head.getWorldPosition(new THREE.Vector3()),
          hair = new THREE.Group(),
          mat = material(p.hairColor);
        const cap = part(
          hair,
          new THREE.SphereGeometry(
            0.26,
            8,
            5,
            0,
            Math.PI * 2,
            0,
            Math.PI * 0.55,
          ),
          mat,
          0,
          0.39,
          0,
        );
        cap.scale.y = p.hair === "buzz" ? 0.5 : 0.58;
        if (p.hair === "bob")
          part(
            hair,
            new THREE.BoxGeometry(0.46, 0.3, 0.17),
            mat,
            0,
            0.24,
            -0.14,
          );
        if (p.hair === "ponytail")
          part(
            hair,
            new THREE.CapsuleGeometry(0.07, 0.22, 3, 6),
            mat,
            0,
            0.31,
            -0.3,
          );
        if (p.hair === "bun")
          part(
            hair,
            new THREE.IcosahedronGeometry(0.09, 0),
            mat,
            0,
            0.49,
            -0.12,
          );
        if (p.hair === "curls")
          for (let i = 0; i < 7; i++)
            part(
              hair,
              new THREE.IcosahedronGeometry(0.08, 0),
              mat,
              Math.cos((i / 7) * Math.PI * 2) * 0.2,
              0.42,
              Math.sin((i / 7) * Math.PI * 2) * 0.2,
            );
        const eyes = material("#252725");
        for (const x of [-0.055, 0.055])
          part(
            hair,
            new THREE.SphereGeometry(0.016, 6, 4),
            eyes,
            x,
            0.25,
            0.248,
          );
        attach(hair, "Head", pos);
      }
      if (chest && p.bag !== "none") {
        const group = new THREE.Group(),
          mat = material(p.bagColor),
          strap = material("#554c3c");
        const tote = p.bag === "tote",
          single = p.bag.startsWith("single"),
          side = p.bag === "single-left" ? -1 : 1;
        part(
          group,
          new THREE.BoxGeometry(tote ? 0.25 : 0.32, tote ? 0.28 : 0.4, 0.15),
          mat,
          0,
          0,
          0,
        );
        part(
          group,
          new THREE.BoxGeometry(0.22, 0.13, 0.05),
          mat,
          0,
          -0.06,
          -0.09,
        );
        if (tote) {
          part(
            group,
            new THREE.TorusGeometry(0.09, 0.014, 4, 8, Math.PI),
            strap,
            0,
            0.16,
            0,
          );
          const hand = body.getObjectByName("LeftHand");
          attach(
            group,
            "LeftHand",
            (hand || chest)
              .getWorldPosition(new THREE.Vector3())
              .add(new THREE.Vector3(0, -0.25 * ratio, 0)),
          );
          if (hand) toteFollowers.push({ hand, group, ratio });
        } else {
          const shoulders = single ? [side * 0.1] : [-0.1, 0.1];
          for (const x of shoulders)
            part(
              group,
              new THREE.BoxGeometry(0.025, 0.43, 0.035),
              strap,
              x,
              0.06,
              0.13,
            );
          attach(
            group,
            "Chest",
            chest
              .getWorldPosition(new THREE.Vector3())
              .add(
                new THREE.Vector3(
                  (single ? side * 0.13 : 0) * ratio,
                  0.1 * ratio,
                  -0.22 * ratio,
                ),
              ),
          );
        }
      }
    }
    const mixer = new THREE.AnimationMixer(body),
      idle = mixer.clipAction(
        asset.animations.find((c) => /Idle/i.test(c.name)) ||
          asset.animations[0],
      ),
      walk = mixer.clipAction(
        asset.animations.find((c) => /Walk|Run/i.test(c.name)) ||
          asset.animations[0],
      );
    idle.play();
    walk.play();
    walk.setEffectiveWeight(0);
    let last = 0,
      weight = 0,
      phase = 0,
      disposed = false;
    return {
      root,
      rigged: true,
      properties: p,
      animate(time, moving, gait = {}) {
        const dt = Math.min(0.08, Math.max(0, time - last));
        last = time;
        if (gait.phase !== undefined) phase = gait.phase;
        else if (moving)
          phase +=
            (((gait.speed || p?.speedMps || 1.4) * dt) /
              (gait.running ? 4 : 2.6)) *
            Math.PI *
            2;
        const target = moving ? (gait.running ? 1 : 0.52) : 0;
        weight += (target - weight) * (1 - Math.exp(-dt * 15));
        idle.setEffectiveWeight(1 - weight);
        walk.setEffectiveWeight(weight);
        walk.paused = true;
        walk.time = clipTimeFromPhase(
          phase,
          walk.getClip().duration,
          contactOffset,
        );
        mixer.update(dt);
        for (const { hand, group, ratio } of toteFollowers) {
          root.updateMatrixWorld(true);
          const target = hand
            .getWorldPosition(new THREE.Vector3())
            .add(new THREE.Vector3(0, -0.25 * ratio, 0));
          group.position.copy(group.parent.worldToLocal(target));
          group.quaternion.copy(
            group.parent
              .getWorldQuaternion(new THREE.Quaternion())
              .invert()
              .multiply(root.getWorldQuaternion(new THREE.Quaternion())),
          );
        }
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        mixer.stopAllAction();
        mixer.uncacheRoot(body);
        for (const r of owned) r.dispose();
        root.removeFromParent();
      },
      gaitState: () => ({
        phase,
        blend: weight,
        phaseOffset: contactOffset,
        clipCycle: walk.time / walk.getClip().duration,
      }),
    };
  };
}
