# SPDX-License-Identifier: Apache-2.0
"""Georeferenced terrain and conservative roof candidates from LAS/LAZ.

The v0.1 roof detector is a heuristic blockout, not a surveyed footprint extractor.
"""

import hashlib
import importlib.metadata
from pathlib import Path

import laspy
import numpy as np
from pyproj import CRS, Transformer
from rasterio.features import shapes
from rasterio.transform import from_origin
from scipy import ndimage
from scipy.interpolate import LinearNDInterpolator, NearestNDInterpolator
from shapely.geometry import Polygon, shape

from . import __version__
from .io import revision, sha256, write_json


def fill_grid(values):
    """Nearest fill only internal raster gaps; never silently accept an empty grid."""
    finite = np.isfinite(values)
    if not finite.any():
        raise ValueError("No valid cells in source grid")
    if finite.all():
        return values.copy()
    indices = ndimage.distance_transform_edt(~finite, return_distances=False, return_indices=True)
    return values[tuple(indices)]


def ground_surface(x, y, z, half, spacing):
    """Bin ground medians, then interpolate a north-ascending regular vertex grid."""
    n = int(round(2 * half / spacing))
    ix = np.clip(((x + half) / spacing).astype(int), 0, n - 1)
    iy = np.clip(((y + half) / spacing).astype(int), 0, n - 1)
    ids = iy * n + ix
    order = np.argsort(ids)
    unique, starts = np.unique(ids[order], return_index=True)
    medians = np.array([np.median(v) for v in np.split(z[order], starts[1:])])
    centers = np.column_stack(((unique % n + 0.5) * spacing - half, (unique // n + 0.5) * spacing - half))
    if len(centers) < 20:
        raise ValueError("Insufficient ground coverage")
    axis = np.linspace(-half, half, n + 1)
    gx, gy = np.meshgrid(axis, axis)
    interpolator = LinearNDInterpolator(centers, medians)
    grid = interpolator(gx, gy)
    missing = ~np.isfinite(grid)
    grid[missing] = NearestNDInterpolator(centers, medians)(gx[missing], gy[missing])
    # Spatial cell holdout checks interpolation consistency, not external survey accuracy.
    holdout = np.arange(len(centers)) % 11 == 0
    pred = LinearNDInterpolator(centers[~holdout], medians[~holdout])(centers[holdout])
    ok = np.isfinite(pred)
    error = pred[ok] - medians[holdout][ok]
    report = {
        "ground_cells": int(len(centers)),
        "ground_cell_coverage_fraction": round(len(centers) / (n * n), 5),
        "edge_nearest_fill_vertices": int(missing.sum()),
        "holdout_cells": int(ok.sum()),
        "holdout_rmse_m": round(float(np.sqrt(np.mean(error ** 2))), 4) if ok.any() else None,
        "holdout_p95_absolute_m": round(float(np.percentile(np.abs(error), 95)), 4) if ok.any() else None,
        "accuracy_note": "Internal ground-cell holdout consistency; not independently surveyed absolute accuracy."
    }
    return grid, report


def roof_candidates(x, y, z, classes, single_returns, terrain, half, terrain_spacing, options):
    spacing = options["raster_spacing_m"]
    n = int(round(2 * half / spacing))
    ix = np.clip(((x + half) / spacing).astype(int), 0, n - 1)
    iy = np.clip(((y + half) / spacing).astype(int), 0, n - 1)
    surface = np.full((n, n), -np.inf)
    np.maximum.at(surface, (iy, ix), z)
    surface[surface == -np.inf] = np.nan
    surface = fill_grid(surface)
    count = np.zeros((n, n))
    single = np.zeros((n, n))
    np.add.at(count, (iy, ix), 1)
    np.add.at(single, (iy, ix), single_returns)
    single_fraction = ndimage.uniform_filter(single, 3) / np.maximum(ndimage.uniform_filter(count, 3), 1e-6)
    # Smooth isolated returns. Roof seeds must be both elevated and locally planar.
    smooth = ndimage.median_filter(surface, size=3)
    roughness = np.sqrt(np.maximum(0, ndimage.uniform_filter(smooth ** 2, 5) - ndimage.uniform_filter(smooth, 5) ** 2))
    local_ground = ndimage.map_coordinates(terrain, [(np.arange(n)[:, None] + .5) * spacing / terrain_spacing + np.zeros((n, n)), (np.arange(n)[None, :] + .5) * spacing / terrain_spacing + np.zeros((n, n))], order=1, mode="nearest")
    elevated = smooth - local_ground > options.get("min_height_m", 3.5)
    planar = roughness < options.get("max_roof_roughness_m", 0.85)
    # Vegetation often creates elevated smooth patches too, but tends to produce
    # multiple returns. This is a heuristic filter, not a semantic guarantee.
    solid_return = single_fraction > options.get("min_single_return_fraction", .72)
    seeds = ndimage.binary_opening(elevated & planar & solid_return, iterations=1)
    seeds = ndimage.binary_closing(seeds, iterations=2)
    seeds = ndimage.binary_fill_holes(seeds)
    # Grow planar roof interiors modestly to recover the edge lost in the 5-cell test.
    mask = ndimage.binary_dilation(seeds, iterations=2) & elevated
    mask = ndimage.binary_fill_holes(mask)
    labels, count = ndimage.label(mask)
    objects = []
    transform = from_origin(-half, half, spacing, spacing)
    for geo, value in shapes(np.flipud(labels).astype(np.int32), mask=np.flipud(labels > 0), transform=transform):
        polygon = shape(geo).simplify(spacing, preserve_topology=True)
        # Small canopy fragments are discarded. Ambiguous larger candidates remain marked.
        if polygon.area < options["min_building_area_m2"]:
            continue
        if polygon.area / polygon.minimum_rotated_rectangle.area < .35:
            continue
        polygon = Polygon(polygon.exterior)  # v0.1 blockouts intentionally omit courtyards.
        selected = labels == int(value)
        roof = float(np.percentile(smooth[selected], 60))
        base = float(np.percentile(local_ground[selected], 10)) - .25
        if roof - base < 3:
            continue
        ring = [[round(float(a), 3), round(float(b), 3)] for a, b in list(polygon.exterior.coords)[:-1]]
        centroid = polygon.centroid
        # Quantized location forms a stable seed identity; downstream IDs can later supersede it.
        digest = hashlib.sha256(f"{round(centroid.x/5)*5}:{round(centroid.y/5)*5}".encode()).hexdigest()[:8]
        objects.append({
            "id": f"roof-{digest}", "kind": "building", "status": "estimated-blockout",
            "footprint_enu_m": ring, "base_z_m": round(base, 3), "roof_z_m": round(roof, 3),
            "area_m2": round(polygon.area, 1), "height_m": round(roof - base, 2),
            "method": "elevated-planar-return-mask-v0.1",
            "quality_note": "LiDAR-derived candidate; may include canopy, miss walls or merge roof sections. Courtyards omitted."
        })
    objects.sort(key=lambda b: b["id"])
    return objects, smooth - local_ground


def reconstruct(config, paths, output):
    from datetime import datetime, timezone
    half = config["aoi"]["size_m"] / 2
    spacing = config["reconstruction"]["terrain_spacing_m"]
    raster_spacing = config["reconstruction"]["raster_spacing_m"]
    for value in [spacing, raster_spacing]:
        if abs(2 * half / value - round(2 * half / value)) > 1e-8:
            raise ValueError("AOI size must be divisible by terrain and raster spacing")
    target = CRS.from_epsg(config["aoi"]["horizontal_epsg"])
    if not target.is_projected or target.axis_info[0].unit_name != "metre":
        raise ValueError("v0.1 requires a projected horizontal CRS in metres")
    origin_x, origin_y = Transformer.from_crs(4326, target, always_xy=True).transform(*config["aoi"]["center_lon_lat"])
    arrays = []
    source_details = []
    for source, path in zip(config["sources"], paths):
        with laspy.open(path) as reader:
            source_crs = reader.header.parse_crs()
            if source_crs is None:
                raise ValueError(f"Missing LAS CRS: {path}")
            components = source_crs.sub_crs_list if source_crs.is_compound else [source_crs]
            if components[0] != target:
                raise ValueError("v0.1 requires matching source horizontal CRS; reproject explicitly before use")
            if not any(c.to_epsg() == config["aoi"].get("vertical_epsg") for c in components):
                raise ValueError("Input vertical CRS does not match the declared project vertical EPSG")
            source_details.append({**source, "actual_sha256": sha256(path), "bytes": Path(path).stat().st_size,
                                   "las_crs_wkt": source_crs.to_wkt(), "total_source_points": reader.header.point_count})
            for points in reader.chunk_iterator(1_000_000):
                x = np.asarray(points.x) - origin_x
                y = np.asarray(points.y) - origin_y
                keep = (np.abs(x) <= half) & (np.abs(y) <= half)
                keep &= ~np.asarray(points.withheld, dtype=bool)
                if keep.any():
                    arrays.append(np.column_stack((x[keep], y[keep], np.asarray(points.z)[keep], np.asarray(points.classification)[keep], np.asarray(points.number_of_returns)[keep] == 1)).astype(np.float32))
    if not arrays:
        raise ValueError("No input points overlap the AOI")
    points = np.concatenate(arrays)
    x, y, z, classes, single_returns = points.T
    ground = classes == 2
    terrain_abs, quality = ground_surface(x[ground], y[ground], z[ground], half, spacing)
    origin_h = float(terrain_abs[len(terrain_abs)//2, len(terrain_abs)//2])
    terrain = np.round(terrain_abs - origin_h, 4)
    buildings, heights = roof_candidates(x, y, z - origin_h, classes, single_returns, terrain, half, spacing, config["reconstruction"])
    if not buildings:
        raise ValueError("No building candidates found; inspect data and detector settings")
    coordinate_frame = {
        "horizontal_epsg": target.to_epsg(), "vertical_epsg": config["aoi"]["vertical_epsg"],
        "vertical_datum": config["aoi"]["vertical_datum"],
        "origin_projected_m": [origin_x, origin_y, origin_h],
        "origin_lon_lat": config["aoi"]["center_lon_lat"], "unit": "metre",
        "blender_axes": "X east, Y north, Z up", "gltf_axes": "X east, Y up, Z south",
        "origin_note": "Horizontal center selected for experiment; local Z=0 is interpolated class-2 ground at center."
    }
    heightfield = {"schema_version": 1, "nx": terrain.shape[1], "ny": terrain.shape[0], "spacing_m": spacing,
                   "min_east_m": -half, "min_north_m": -half, "heights_m": terrain.ravel().tolist(),
                   "row_order": "north-ascending", "axes": "ENU; glTF x=east,y=height,z=-north"}
    quality.update({
        "cropped_points": len(points), "class_counts": {str(int(c)): int((classes == c).sum()) for c in np.unique(classes)},
        "building_candidates": len(buildings), "terrain_range_local_m": [float(terrain.min()), float(terrain.max())],
        "building_height_range_m": [min(b["height_m"] for b in buildings), max(b["height_m"] for b in buildings)],
        "building_accuracy": "Unvalidated heuristic placeholders, not authoritative footprints or current conditions.",
        "external_control_points": 0
    })
    bundle = {
        "schema_version": 1, "project_id": config["project_id"], "title": config["title"],
        "created_utc": datetime.now(timezone.utc).isoformat(), "coordinate_frame": coordinate_frame,
        "aoi_size_m": 2 * half, "terrain": heightfield, "buildings": buildings,
        "sources": source_details, "quality": quality,
        "pipeline": {"version": __version__, **revision(), "dependencies": {
            name: importlib.metadata.version(name) for name in ["numpy", "scipy", "laspy", "pyproj", "rasterio", "shapely"]}},
        "configuration_sha256": hashlib.sha256(__import__("json").dumps(config, sort_keys=True).encode()).hexdigest(),
        "configuration": config
    }
    output = Path(output)
    write_json(output / "reconstruction.json", bundle)
    write_json(output / "heightfield.json", heightfield)
    write_json(output / "quality.json", quality)
    write_json(output / "sources.json", {"sources": source_details, "coordinate_frame": coordinate_frame})
    np.save(output / "surface-heights.npy", heights)
    return bundle
