// SPDX-License-Identifier: Apache-2.0
// Procedural Cartesian fixture. No real location, survey, provider or campus data.
import * as THREE from "three";
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const output = fileURLToPath(new URL("../public/scene/", import.meta.url));
mkdirSync(output, { recursive: true });
const json = (name, value) =>
  writeFileSync(path.join(output, name), JSON.stringify(value, null, 2) + "\n");
const ground = (east, north) => east * 0.01 + north * 0.02;
const field = {
  schema_version: 1,
  nx: 25,
  ny: 25,
  spacing_m: 5,
  min_east_m: -60,
  min_north_m: -60,
  heights_m: [],
  row_order: "north-ascending",
  axes: "ENU; glTF x=east,y=height,z=-north",
};
const positions = [],
  indices = [];
for (let j = 0; j < 25; j++)
  for (let i = 0; i < 25; i++) {
    const x = -60 + i * 5,
      n = -60 + j * 5,
      h = ground(x, n);
    field.heights_m.push(h);
    positions.push(x, h, -n);
  }
for (let j = 0; j < 24; j++)
  for (let i = 0; i < 24; i++) {
    const a = j * 25 + i;
    indices.push(a, a + 1, a + 26, a, a + 26, a + 25);
  }
const terrain = new THREE.BufferGeometry();
terrain.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(positions, 3),
);
terrain.setIndex(indices);
terrain.computeVertexNormals();
const buildings = [
  ["demo-library", "Demo Library", -28, 26, 22, 18, 10],
  ["demo-laboratory", "Demo Laboratory", 28, 25, 20, 20, 14],
  ["demo-center", "Demo Center", -28, -28, 24, 20, 8],
  ["demo-studio", "Demo Studio", 28, -27, 18, 24, 12],
].map(([id, name, x, n, w, d, h]) => ({
  id,
  name,
  campus_id: id,
  kind: "building",
  status: "approximate-context-placeholder",
  name_match: "synthetic-fixture",
  footprint_enu_m: [
    [x - w / 2, n - d / 2],
    [x + w / 2, n - d / 2],
    [x + w / 2, n + d / 2],
    [x - w / 2, n + d / 2],
  ],
  base_z_m: ground(x, n) - 0.4,
  roof_z_m: ground(x, n) - 0.4 + h,
  height_m: h,
  area_m2: w * d,
  method: "synthetic-fixture",
  quality_note: "Procedural demonstration; not a real building.",
}));
const nodes = [],
  meshes = [],
  views = [],
  accessors = [],
  chunks = [];
let offset = 0;
const materials = [
  {
    name: "Mineral ground",
    pbrMetallicRoughness: {
      baseColorFactor: [0.3, 0.32, 0.34, 1],
      metallicFactor: 0,
      roughnessFactor: 0.94,
    },
  },
  {
    name: "White placeholders",
    pbrMetallicRoughness: {
      baseColorFactor: [0.91, 0.9, 0.86, 1],
      metallicFactor: 0,
      roughnessFactor: 0.94,
    },
  },
  {
    name: "Roads",
    pbrMetallicRoughness: {
      baseColorFactor: [0.12, 0.14, 0.16, 1],
      metallicFactor: 0,
      roughnessFactor: 0.98,
    },
  },
  {
    name: "Paths",
    pbrMetallicRoughness: {
      baseColorFactor: [0.47, 0.48, 0.46, 1],
      metallicFactor: 0,
      roughnessFactor: 0.98,
    },
  },
];
function accessor(array, type, target) {
  const data = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
  const padded = Buffer.alloc(Math.ceil(data.length / 4) * 4);
  data.copy(padded);
  const view = views.length;
  views.push({
    buffer: 0,
    byteOffset: offset,
    byteLength: data.length,
    target,
  });
  chunks.push(padded);
  offset += padded.length;
  const item = {
    bufferView: view,
    componentType: array instanceof Uint32Array ? 5125 : 5126,
    count: array.length / (type === "VEC3" ? 3 : 1),
    type,
  };
  if (type === "VEC3") {
    item.min = [Infinity, Infinity, Infinity];
    item.max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < array.length; i++) {
      item.min[i % 3] = Math.min(item.min[i % 3], array[i]);
      item.max[i % 3] = Math.max(item.max[i % 3], array[i]);
    }
  }
  accessors.push(item);
  return accessors.length - 1;
}
function mesh(name, geometry, material, extras) {
  const attributes = {
    POSITION: accessor(geometry.attributes.position.array, "VEC3", 34962),
    NORMAL: accessor(geometry.attributes.normal.array, "VEC3", 34962),
  };
  const primitive = { attributes, material };
  if (geometry.index)
    primitive.indices = accessor(
      new Uint32Array(geometry.index.array),
      "SCALAR",
      34963,
    );
  meshes.push({ name, primitives: [primitive] });
  nodes.push({ name, mesh: meshes.length - 1, extras });
}
mesh("terrain", terrain, 0, { asset_kind: "terrain" });
for (const b of buildings) {
  const [sw, se, ne] = b.footprint_enu_m;
  const geometry = new THREE.BoxGeometry(
    se[0] - sw[0],
    b.height_m,
    ne[1] - se[1],
  );
  geometry.translate(
    (sw[0] + se[0]) / 2,
    b.base_z_m + b.height_m / 2,
    -(sw[1] + ne[1]) / 2,
  );
  mesh(b.id, geometry, 1, {
    asset_kind: "building",
    asset_id: b.id,
    display_name: b.name,
    reconstruction_status: "synthetic-demo",
  });
}
function surface(id, kind, ring) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      ring.flatMap(([x, n]) => [x, ground(x, n) + 0.04, -n]),
      3,
    ),
  );
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  mesh(id, geometry, kind === "road" ? 2 : 3, {
    asset_kind: "corridor",
    asset_id: id,
    corridor_kind: kind,
  });
}
surface("demo-road", "road", [
  [-60, -3],
  [60, -3],
  [60, 3],
  [-60, 3],
]);
surface("demo-path-north", "path", [
  [-1.5, 3],
  [1.5, 3],
  [1.5, 60],
  [-1.5, 60],
]);
surface("demo-path-south", "path", [
  [-1.5, -60],
  [1.5, -60],
  [1.5, -3],
  [-1.5, -3],
]);
const gltf = {
  asset: {
    version: "2.0",
    generator: "Geospatial3D procedural viewer fixture",
    copyright:
      "Open Geospatial-to-3D Reconstruction Pipeline — Zhongyi William Qiu and contributors — CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/",
  },
  scene: 0,
  scenes: [{ nodes: nodes.map((_, i) => i) }],
  nodes,
  meshes,
  materials,
  buffers: [{ byteLength: offset }],
  bufferViews: views,
  accessors,
};
const raw = Buffer.from(JSON.stringify(gltf));
const header = Buffer.alloc(Math.ceil(raw.length / 4) * 4, 32);
raw.copy(header);
const binary = Buffer.concat(chunks);
const glb = Buffer.alloc(12 + 8 + header.length + 8 + binary.length);
glb.write("glTF");
glb.writeUInt32LE(2, 4);
glb.writeUInt32LE(glb.length, 8);
glb.writeUInt32LE(header.length, 12);
glb.writeUInt32LE(0x4e4f534a, 16);
header.copy(glb, 20);
const at = 20 + header.length;
glb.writeUInt32LE(binary.length, at);
glb.writeUInt32LE(0x004e4942, at + 4);
binary.copy(glb, at + 8);
writeFileSync(path.join(output, "campus.glb"), glb);
const source = {
  id: "synthetic-demo",
  provider: "Procedural local fixture",
  title: "Synthetic road and path",
  license_note:
    "Original demonstration geometry; no third-party geographic data.",
};
json("heightfield.json", field);
json("sources.json", {
  sources: [source],
  note: "Synthetic data; not a surveyed geographic location.",
});
json("viewer-settings.json", {
  spawn_look_at_enu_m: [-28, 26],
  spawn_description: "Synthetic junction facing Demo Library",
});
json("manifest.json", {
  schema_version: 1,
  project_id: "synthetic-viewer-demo",
  title: "Synthetic Explorer",
  status: "synthetic-demo",
  asset_license: {
    spdx: "CC-BY-4.0",
    url: "https://creativecommons.org/licenses/by/4.0/",
    attribution:
      "Open Geospatial-to-3D Reconstruction Pipeline — Zhongyi William Qiu and contributors",
    scope: "Original synthetic demonstration content only.",
  },
  aoi_size_m: 120,
  coordinate_frame: {
    horizontal_epsg: 32631,
    vertical_epsg: 5703,
    unit: "metre",
    origin_projected_m: [500000, 0, 0],
    gltf_axes: "X east, Y up, Z south",
    origin_note: "Synthetic Cartesian fixture, not a surveyed geolocation.",
  },
  pipeline: { version: "synthetic-fixture", commit: null, dirty: false },
  spawn_enu_m: [0, -35],
  source_dates: [],
  source_ids: [source.id],
  model: {
    url: "campus.glb",
    sha256: createHash("sha256").update(glb).digest("hex"),
    glb_bytes: glb.length,
  },
  heightfield_url: "heightfield.json",
  sources_url: "sources.json",
  quality: {
    cropped_points: 0,
    ground_cell_coverage_fraction: 1,
    external_control_points: 0,
    holdout_rmse_m: null,
    terrain_range_local_m: [-1.8, 1.8],
  },
  buildings,
  corridors: {
    sources: [source],
    surface_nodes: ["demo-road", "demo-path-north", "demo-path-south"],
    features: [
      {
        id: "demo-road",
        name: "Demo Road",
        kind: "road",
        width_m: 6,
        source_id: source.id,
        centerline_enu_m: [
          [-60, 0],
          [60, 0],
        ],
      },
      {
        id: "demo-path",
        name: "Demo Path",
        kind: "path",
        width_m: 3,
        source_id: source.id,
        centerline_enu_m: [
          [0, -60],
          [0, 60],
        ],
      },
    ],
  },
  limitations: [
    "Procedural synthetic demonstration; not a real campus, survey, or geographic reconstruction.",
  ],
});
console.log(
  `Created synthetic demo: ${glb.length} GLB bytes, ${buildings.length} named buildings.`,
);
