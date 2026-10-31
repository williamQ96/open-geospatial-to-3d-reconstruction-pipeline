# SPDX-License-Identifier: Apache-2.0
"""RGB aerial cues for illustrative vegetation placement, not a tree inventory."""
import math
import numpy as np
from scipy.ndimage import uniform_filter


def canopy_probability(rgb):
    """Smoothed dark/textured-green cue for north-up, 0..255 RGB imagery.

    This heuristic can confuse shadows, shrubs and trees. It does not infer
    species, stem locations or heights. Pair it with inspected source imagery,
    georeferencing, footprint/path exclusions and explicit inference notes.
    """
    rgb=np.asarray(rgb,dtype=np.float32)
    if rgb.ndim != 3 or rgb.shape[0] != 3 or min(rgb.shape[1:]) < 1:
        raise ValueError('Expected three nonempty RGB bands')
    if not np.isfinite(rgb).all() or rgb.min()<0 or rgb.max()>255:
        raise ValueError('Expected finite RGB values in 0..255')
    red,green,blue=rgb
    brightness=rgb.mean(axis=0)
    local_mean=uniform_filter(brightness,size=9)
    texture=np.sqrt(np.maximum(0,uniform_filter(brightness**2,size=9)-local_mean**2))
    candidate=(green-red>2)&(green-blue>8)&(brightness<143)&(texture>3)
    return uniform_filter(candidate.astype(np.float32),size=11)


def sample_north_up(cue, bounds, east_m, north_m):
    """Sample a north-up raster at local XY; bounds are west,south,east,north.

    No guessed CRS conversion: callers must supply matching map coordinates.
    Out-of-bounds coordinates return zero. North maps to the first image row.
    """
    cue=np.asarray(cue)
    if cue.ndim != 2 or min(cue.shape)<1:
        raise ValueError('Expected a nonempty 2D cue')
    west,south,east,north=map(float,bounds)
    if not all(math.isfinite(v) for v in [west,south,east,north,east_m,north_m]) or west>=east or south>=north:
        raise ValueError('Invalid raster bounds/coordinates')
    if not west<=east_m<east or not south<north_m<=north:
        return 0.0
    u=int((east_m-west)/(east-west)*cue.shape[1])
    v=int((north-north_m)/(north-south)*cue.shape[0])
    return float(cue[min(v,cue.shape[0]-1),min(u,cue.shape[1]-1)])
