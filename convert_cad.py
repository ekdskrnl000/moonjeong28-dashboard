import ezdxf
from pyproj import Transformer
import geojson
import math

transformer_to_wgs = Transformer.from_crs("epsg:5186", "epsg:4326", always_xy=True)
transformer_to_tm = Transformer.from_crs("epsg:4326", "epsg:5186", always_xy=True)

# [수동 입력 좌표]
CAD_X1 = 10.4638
CAD_Y1 = -3.166
REAL_LAT_1 = 37.489844
REAL_LON_1 = 127.125855

CAD_X2 = -28.999
CAD_Y2 = 55.2275
REAL_LAT_2 = 37.490401
REAL_LON_2 = 127.125389

CAD_X3 = -89.0802
CAD_Y3 = -69.1247
REAL_LAT_3 = 37.489199
REAL_LON_3 = 127.124680

# ★ 지적도 전체 크기 및 위치 조절기 ★
SCALE_FACTOR = 0.97         # 0.97 축소 유지
SHIFT_RIGHT_METERS = 0.0    # 0.0으로 원상복귀!
SHIFT_DOWN_METERS = -1.0     # 0.0으로 원상복귀!

def get_affine_coeffs(x1, y1, x2, y2, x3, y3, u1, u2, u3):
    D = x1*(y2 - y3) - y1*(x2 - x3) + (x2*y3 - x3*y2)
    if D == 0: return 0, 0, 0
    a = (u1*(y2 - y3) - y1*(u2 - u3) + (u2*y3 - u3*y2)) / D
    b = (x1*(u2 - u3) - u1*(x2 - x3) + (x2*u3 - x3*u2)) / D
    c = (x1*(y2*u3 - y3*u2) - y1*(x2*u3 - x3*u2) + u1*(x2*y3 - x3*y2)) / D
    return a, b, c

def get_centroid(points):
    x = sum(p[0] for p in points) / len(points)
    y = sum(p[1] for p in points) / len(points)
    return x, y

def is_point_in_polygon(x, y, poly):
    n = len(poly)
    inside = False
    p1x, p1y = poly[0]
    for i in range(n + 1):
        p2x, p2y = poly[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xints = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xints:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def cad_to_geojson_3point(dxf_filepath, output_filepath):
    tm_x1, tm_y1 = transformer_to_tm.transform(REAL_LON_1, REAL_LAT_1)
    tm_x2, tm_y2 = transformer_to_tm.transform(REAL_LON_2, REAL_LAT_2)
    tm_x3, tm_y3 = transformer_to_tm.transform(REAL_LON_3, REAL_LAT_3)

    a, b, c = get_affine_coeffs(CAD_X1, CAD_Y1, CAD_X2, CAD_Y2, CAD_X3, CAD_Y3, tm_x1, tm_x2, tm_x3)
    d, e, f = get_affine_coeffs(CAD_X1, CAD_Y1, CAD_X2, CAD_Y2, CAD_X3, CAD_Y3, tm_y1, tm_y2, tm_y3)

    center_tm_x = (tm_x1 + tm_x2 + tm_x3) / 3
    center_tm_y = (tm_y1 + tm_y2 + tm_y3) / 3

    def transform_point(cx, cy):
        fx = a * cx + b * cy + c
        fy = d * cx + e * cy + f
        if SCALE_FACTOR != 1.0:
            fx = center_tm_x + (fx - center_tm_x) * SCALE_FACTOR
            fy = center_tm_y + (fy - center_tm_y) * SCALE_FACTOR
        fx += SHIFT_RIGHT_METERS
        fy -= SHIFT_DOWN_METERS
        return transformer_to_wgs.transform(fx, fy)

    doc = ezdxf.readfile(dxf_filepath)
    msp = doc.modelspace()
    polygons = []
    texts = []

    for entity in msp:
        if entity.dxf.layer in ['사업지', '지적']:
            if entity.dxftype() in ['LWPOLYLINE', 'POLYLINE']:
                points = entity.get_points('xy')
                t_points = [transform_point(p[0], p[1]) for p in points]
                if len(t_points) >= 3:
                    is_poly = entity.is_closed or t_points[0] == t_points[-1]
                    if is_poly and t_points[0] != t_points[-1]:
                        t_points.append(t_points[0])
                    polygons.append({"type": "polygon" if is_poly else "line", "points": t_points, "layer": entity.dxf.layer, "centroid": get_centroid(t_points)})
        
        if entity.dxftype() in ['TEXT', 'MTEXT']:
            cx, cy, _ = entity.dxf.insert
            lon, lat = transform_point(cx, cy)
            text_val = str(entity.dxf.text if entity.dxftype() == 'TEXT' else entity.text).strip().replace(" ", "")
            if text_val in ["28-25대", "28-25"]:
                text_val = "28-24대"
            texts.append({"lon": lon, "lat": lat, "label": text_val})

    final_features = []
    for poly in polygons:
        geom_label = ""
        if poly["type"] == "polygon" and poly["layer"] == "지적":
            for t in texts:
                if is_point_in_polygon(t["lon"], t["lat"], poly["points"]):
                    geom_label = t["label"]
                    break
            if not geom_label and texts:
                closest_text = min(texts, key=lambda t: math.hypot(poly["centroid"][0] - t["lon"], poly["centroid"][1] - t["lat"]))
                geom_label = closest_text["label"]
        
        geom = geojson.Polygon([poly["points"]]) if poly["type"] == "polygon" else geojson.LineString(poly["points"])
        final_features.append(geojson.Feature(geometry=geom, properties={"layer": poly["layer"], "label": geom_label}))

    added_labels = set()
    for t in texts:
        if t["label"] not in added_labels:
            final_features.append(geojson.Feature(geometry=geojson.Point((t["lon"], t["lat"])), properties={"layer": "지적", "label": t["label"]}))
            added_labels.add(t["label"])

    with open(output_filepath, 'w', encoding='utf-8') as f:
        geojson.dump(geojson.FeatureCollection(final_features), f, ensure_ascii=False, indent=2)
        
    print("✅ 변환 완료! 지적도 위치 원상복귀됨.")

if __name__ == "__main__":
    INPUT_FILE = "Stura_cadstral_문정동28.dxf"
    OUTPUT_FILE = "moonjeong28_map_3point.geojson"
    cad_to_geojson_3point(INPUT_FILE, OUTPUT_FILE)