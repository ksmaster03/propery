// === Geometry helpers สำหรับ Floor Plan ===
// ใช้คำนวณพื้นที่ bounding box simplify path ฯลฯ
// รวมที่นี่เพื่อให้ unit test + reuse ได้หลายหน้า

export interface Point {
  x: number;
  y: number;
}

// พื้นที่ polygon ด้วย Shoelace formula — คืนค่าเป็น unit^2 (เช่น ถ้า x,y เป็นเมตรก็ได้ sqm)
export function shoelaceArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

// หา bounding box ของชุด point
export function pointsBounds(points: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
  if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let minX = points[0].x, minY = points[0].y, maxX = points[0].x, maxY = points[0].y;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

// ระยะห่างจากจุด p ไปยังเส้นตรง ab — ใช้ใน RDP
export function perpendicularDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (dx === 0 && dy === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
  const projX = a.x + t * dx, projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

// Ramer-Douglas-Peucker — ลดจำนวนจุดของ path ที่คดเคี้ยวให้เหลือเฉพาะจุดที่สำคัญ
// epsilon: ระยะห่างสูงสุดที่ยอมให้เบี่ยงออกจากเส้นตรง (ยิ่งมากยิ่งลดจุดมาก)
export function rdpSimplify(points: Point[], epsilon: number): Point[] {
  if (points.length < 3) return points;
  let maxDist = 0;
  let maxIndex = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (d > maxDist) {
      maxDist = d;
      maxIndex = i;
    }
  }
  if (maxDist > epsilon) {
    const left = rdpSimplify(points.slice(0, maxIndex + 1), epsilon);
    const right = rdpSimplify(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [points[0], points[points.length - 1]];
}

// แปลง points → SVG path "M x,y L x,y ... Z"
export function pointsToPath(points: Point[], gridSize: number, closed = true): string {
  if (points.length === 0) return '';
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * gridSize},${p.y * gridSize}`).join(' ');
  return closed ? `${d} Z` : d;
}

// แปลง points → SVG polygon points attribute "x,y x,y x,y"
export function pointsToPolygon(points: Point[], gridSize: number): string {
  return points.map((p) => `${p.x * gridSize},${p.y * gridSize}`).join(' ');
}
