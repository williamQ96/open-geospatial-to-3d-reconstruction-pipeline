// SPDX-License-Identifier: Apache-2.0
// Pure outdoor graph routing. Coordinates are east/north metres.
export const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

class Heap {
  items = [];
  push(value) {
    const a = this.items;
    let i = a.length;
    a.push(value);
    while (i) {
      const p = (i - 1) >> 1;
      if (a[p][0] <= value[0]) break;
      a[i] = a[p];
      i = p;
    }
    a[i] = value;
  }
  pop() {
    const a = this.items;
    if (!a.length) return null;
    const result = a[0],
      last = a.pop();
    if (a.length) {
      let i = 0;
      while (i * 2 + 1 < a.length) {
        let c = i * 2 + 1;
        if (c + 1 < a.length && a[c + 1][0] < a[c][0]) c++;
        if (a[c][0] >= last[0]) break;
        a[i] = a[c];
        i = c;
      }
      a[i] = last;
    }
    return result;
  }
}

export function createRouter(data, clearSegment = () => true) {
  if (data.version !== 1 || !Array.isArray(data.nodes_enu_m))
    throw Error("Unsupported route graph");
  const nodes = data.nodes_enu_m,
    adj = nodes.map(() => []);
  for (const [a, b, length, kind] of data.edges) {
    if (!nodes[a] || !nodes[b] || !Number.isFinite(length) || length <= 0)
      throw Error("Invalid route edge");
    const cost =
      length * (kind === "road" ? 1.12 : kind === "connector" ? 1.3 : 1);
    adj[a].push([b, cost]);
    adj[b].push([a, cost]);
  }
  function candidates(point, building) {
    const sorted = nodes
      .map((node, id) => ({ id, d: distance(point, node) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 60);
    // Building searches terminate at an approximate exterior approach, never at
    // an invented indoor entrance or through the building centroid.
    return sorted
      .filter(
        ({ id, d }) =>
          d < (building ? Math.min(180, (sorted[0]?.d || 0) + 12) : 45) &&
          (building || clearSegment(point, nodes[id])),
      )
      .slice(0, 18);
  }
  return {
    nodes,
    route(start, end, { startBuilding = false, endBuilding = false } = {}) {
      if (!start || !end) return null;
      const sources = candidates(start, startBuilding),
        targets = candidates(end, endBuilding);
      if (!sources.length || !targets.length) return null;
      const dist = new Float64Array(nodes.length).fill(Infinity),
        previous = new Int32Array(nodes.length).fill(-1),
        heap = new Heap();
      const targetMap = new Map(targets.map((t) => [t.id, t.d]));
      for (const s of sources) {
        dist[s.id] = s.d;
        heap.push([s.d, s.id]);
      }
      let best = Infinity,
        finish = -1;
      while (heap.items.length) {
        const [cost, id] = heap.pop();
        if (cost !== dist[id]) continue;
        if (cost > best) break;
        if (targetMap.has(id) && cost + targetMap.get(id) < best) {
          best = cost + targetMap.get(id);
          finish = id;
        }
        for (const [next, weight] of adj[id])
          if (cost + weight < dist[next]) {
            dist[next] = cost + weight;
            previous[next] = id;
            heap.push([dist[next], next]);
          }
      }
      if (finish < 0) return null;
      const path = [];
      for (let id = finish; id >= 0; id = previous[id])
        path.push([...nodes[id]]);
      path.reverse();
      if (!startBuilding && distance(start, path[0]) > 0.1)
        path.unshift([...start]);
      if (!endBuilding && distance(end, path.at(-1)) > 0.1) path.push([...end]);
      return {
        points: path,
        distance: path
          .slice(1)
          .reduce((sum, p, i) => sum + distance(p, path[i]), 0),
        approximate: true,
      };
    },
  };
}

export function routeSample(points, metres) {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      length = distance(a, b);
    if (metres <= length || i === points.length - 1) {
      const t = length ? Math.min(1, metres / length) : 0;
      return {
        point: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
        direction: [b[0] - a[0], b[1] - a[1]],
      };
    }
    metres -= length;
  }
  return { point: points[0] || [0, 0], direction: [0, 1] };
}
