// SPDX-License-Identifier: Apache-2.0
export function createMinimap(canvas, buildings, half, corridors = []) {
  const background = document.createElement("canvas");
  background.width = canvas.width;
  background.height = canvas.height;
  const b = background.getContext("2d"),
    n = canvas.width,
    scale = n / (half * 2);
  const point = (x, north) => [(x + half) * scale, (half - north) * scale];
  b.fillStyle = "#d2d5d6";
  b.fillRect(0, 0, n, n);
  b.lineWidth = 0.5;
  b.strokeStyle = "#bbc1c1";
  for (let i = 0; i <= 8; i++) {
    b.beginPath();
    b.moveTo((i * n) / 8, 0);
    b.lineTo((i * n) / 8, n);
    b.moveTo(0, (i * n) / 8);
    b.lineTo(n, (i * n) / 8);
    b.stroke();
  }
  b.lineCap = "round";
  b.lineJoin = "round";
  for (const corridor of corridors) {
    b.beginPath();
    corridor.centerline_enu_m.forEach(([x, north], i) =>
      i ? b.lineTo(...point(x, north)) : b.moveTo(...point(x, north)),
    );
    b.lineWidth = Math.max(0.65, corridor.width_m * scale);
    b.strokeStyle = corridor.kind === "path" ? "#e2e2db" : "#78838b";
    b.stroke();
  }
  for (const building of buildings) {
    b.beginPath();
    building.footprint_enu_m.forEach(([x, y], i) =>
      i ? b.lineTo(...point(x, y)) : b.moveTo(...point(x, y)),
    );
    b.closePath();
    b.fillStyle = building.name ? "#72867d" : "#b0b8b5";
    b.fill();
  }
  const context = canvas.getContext("2d");
  return (player, yaw, target, route = []) => {
    context.drawImage(background, 0, 0);
    if (route?.length) {
      context.beginPath();
      route.forEach(([x, n], i) =>
        i ? context.lineTo(...point(x, n)) : context.moveTo(...point(x, n)),
      );
      context.strokeStyle = "#2584ef";
      context.lineWidth = 2.5;
      context.stroke();
    }
    if (target) {
      const [x, y] = point(target.x, -target.z);
      context.beginPath();
      context.arc(x, y, 5, 0, Math.PI * 2);
      context.strokeStyle = "#9c713b";
      context.lineWidth = 2;
      context.stroke();
    }
    const [x, y] = point(player.x, -player.z);
    context.beginPath();
    context.arc(x, y, 4, 0, Math.PI * 2);
    context.fillStyle = "#173d2e";
    context.fill();
    context.strokeStyle = "#fff";
    context.lineWidth = 2;
    context.stroke();
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x - Math.sin(yaw) * 12, y - Math.cos(yaw) * 12);
    context.strokeStyle = "#173d2e";
    context.lineWidth = 1.5;
    context.stroke();
  };
}
