# SPDX-License-Identifier: Apache-2.0
"""Approximate outdoor graph from noded centerlines, excluding building interiors."""
import math
from shapely.geometry import LineString, Polygon
from shapely.ops import unary_union
from scipy.spatial import cKDTree


def build_navigation_graph(features, buildings, step_m=7):
    if not math.isfinite(step_m) or step_m<=0:
        raise ValueError('Graph step must be positive')
    obstacles=unary_union([Polygon(b['footprint_enu_m']).buffer(.65) for b in buildings])
    features=[f for f in features if len(f.get('centerline_enu_m',[]))>=2]
    paths=[LineString(f['centerline_enu_m']) for f in features]
    if not paths:return {'version':1,'nodes_enu_m':[],'edges':[]}
    linework=unary_union(paths).difference(obstacles)
    nodes=[];edges=[];lookup={}
    def node(p):
        key=tuple(round(v,3) for v in p)
        if key not in lookup:lookup[key]=len(nodes);nodes.append(list(key))
        return lookup[key]
    lines=list(linework.geoms) if hasattr(linework,'geoms') else [linework]
    for line in lines:
        if line.geom_type!='LineString' or line.length<.1:continue
        # The source type is inherited only when the segment lies on that source.
        kind='path' if any(f.get('kind')=='path' and line.interpolate(.5,normalized=True).distance(p)<.15 for f,p in zip(features,paths)) else 'road'
        coords=list(line.coords)
        for a,b in zip(coords,coords[1:]):
            length=math.dist(a,b);count=max(1,math.ceil(length/step_m));previous=node(a)
            for i in range(1,count+1):
                current=node([a[0]+(b[0]-a[0])*i/count,a[1]+(b[1]-a[1])*i/count])
                if current!=previous:edges.append([previous,current,round(length/count,4),kind])
                previous=current
    parent=list(range(len(nodes)))
    def find(i):
        while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
        return i
    for a,b,*_ in edges:parent[find(a)]=find(b)
    if nodes:
        candidates=sorted(cKDTree(nodes).query_pairs(14),key=lambda pair:math.dist(nodes[pair[0]],nodes[pair[1]]))
        for a,b in candidates:
            if find(a)==find(b):continue
            if LineString([nodes[a],nodes[b]]).intersects(obstacles):continue
            edges.append([a,b,round(math.dist(nodes[a],nodes[b]),4),'connector'])
            parent[find(a)]=find(b)
    return {'version':1,'nodes_enu_m':nodes,'edges':edges,
            'status':'Approximate outdoor centerline graph; no current access, accessibility, entrance or routing guarantee'}
