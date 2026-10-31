# SPDX-License-Identifier: Apache-2.0
"""Data-neutral modular facade poses for authored, editable art.

These are design parameters, not estimates of measured geometry. Blender or
another consumer supplies the actual window/door/column meshes and materials.
"""
from dataclasses import dataclass
import math


@dataclass(frozen=True)
class FacadeModule:
    east_m: float
    north_m: float
    height_m: float
    yaw_rad: float
    bay_width_m: float


def facade_modules(start, end, count, levels_m, *, inset_m=0, normal_offset_m=0):
    """Evenly place bays along an ENU segment, once at each absolute Z level.

    Local X follows start→end; local -Y is the exterior/right normal. Reverse
    the segment to reverse the exterior. Insets reserve space at both ends.
    """
    if isinstance(count, bool) or not isinstance(count, int) or count < 1:
        raise ValueError('Facade count must be a positive integer')
    x0,y0=map(float,start);x1,y1=map(float,end)
    levels=tuple(map(float,levels_m))
    if not levels or not all(math.isfinite(v) for v in [x0,y0,x1,y1,inset_m,normal_offset_m,*levels]):
        raise ValueError('Facade coordinates and levels must be finite and nonempty')
    length=math.hypot(x1-x0,y1-y0)
    if inset_m < 0 or length <= 2*inset_m:
        raise ValueError('Facade length must exceed its end insets')
    ux,uy=(x1-x0)/length,(y1-y0)/length
    width=(length-2*inset_m)/count
    yaw=math.atan2(uy,ux)
    return [FacadeModule(x0+ux*(inset_m+(i+.5)*width)+uy*normal_offset_m,
                         y0+uy*(inset_m+(i+.5)*width)-ux*normal_offset_m,
                         z,yaw,width) for z in levels for i in range(count)]
