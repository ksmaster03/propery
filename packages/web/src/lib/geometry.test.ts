import { describe, it, expect } from 'vitest';
import {
  shoelaceArea,
  pointsBounds,
  perpendicularDistance,
  rdpSimplify,
  pointsToPath,
  pointsToPolygon,
  type Point,
} from './geometry';

// === shoelaceArea ===
// ใช้คำนวณพื้นที่ polygon แบบ Shoelace formula
describe('shoelaceArea', () => {
  it('คืน 0 เมื่อจุดน้อยกว่า 3', () => {
    expect(shoelaceArea([])).toBe(0);
    expect(shoelaceArea([{ x: 0, y: 0 }])).toBe(0);
    expect(shoelaceArea([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe(0);
  });

  it('คำนวณสี่เหลี่ยม 10x10 = 100', () => {
    const rect: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(shoelaceArea(rect)).toBe(100);
  });

  it('คำนวณสามเหลี่ยมมุมฉาก base=6 height=8 = 24', () => {
    const triangle: Point[] = [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 0, y: 8 },
    ];
    expect(shoelaceArea(triangle)).toBe(24);
  });

  it('ลำดับจุดย้อนกลับ (CW vs CCW) ต้องได้ค่าเดียวกัน', () => {
    const ccw: Point[] = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 3 }];
    const cw: Point[] = [...ccw].reverse();
    expect(shoelaceArea(ccw)).toBe(shoelaceArea(cw));
    expect(shoelaceArea(ccw)).toBe(6);
  });

  it('ห้าเหลี่ยมไม่สม่ำเสมอ (pentagon) — คำนวณพื้นที่ถูกต้อง', () => {
    // (0,0) (4,0) (5,3) (2,5) (-1,3) → area = 21 (shoelace)
    const pentagon: Point[] = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 5, y: 3 },
      { x: 2, y: 5 },
      { x: -1, y: 3 },
    ];
    expect(shoelaceArea(pentagon)).toBeCloseTo(21, 5);
  });
});

// === pointsBounds ===
describe('pointsBounds', () => {
  it('คืน 0 ทั้งหมดเมื่อ array ว่าง', () => {
    expect(pointsBounds([])).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
  });

  it('คืน bounding box ของจุดเดียว', () => {
    expect(pointsBounds([{ x: 5, y: 7 }])).toEqual({ minX: 5, minY: 7, maxX: 5, maxY: 7 });
  });

  it('คำนวณ bbox ของหลายจุด', () => {
    const pts: Point[] = [{ x: 2, y: 3 }, { x: 8, y: 1 }, { x: 5, y: 7 }, { x: -1, y: 4 }];
    expect(pointsBounds(pts)).toEqual({ minX: -1, minY: 1, maxX: 8, maxY: 7 });
  });
});

// === perpendicularDistance ===
describe('perpendicularDistance', () => {
  it('จุดอยู่บนเส้น → ระยะ 0', () => {
    const d = perpendicularDistance({ x: 5, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 });
    expect(d).toBeCloseTo(0, 5);
  });

  it('จุดเหนือเส้นแนวนอน → ระยะ = y offset', () => {
    const d = perpendicularDistance({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 });
    expect(d).toBeCloseTo(3, 5);
  });

  it('จุด a = b (เส้นยาว 0) → ระยะ = ระยะทางตรง', () => {
    const d = perpendicularDistance({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 });
    expect(d).toBe(5); // sqrt(9+16)
  });
});

// === rdpSimplify ===
describe('rdpSimplify', () => {
  it('คืน points เดิมเมื่อน้อยกว่า 3 จุด', () => {
    const pts: Point[] = [{ x: 0, y: 0 }, { x: 5, y: 5 }];
    expect(rdpSimplify(pts, 1)).toEqual(pts);
  });

  it('ลบจุดกลางบนเส้นตรง', () => {
    // จุดที่ 1, 2, 3, 4, 5 อยู่บนเส้นตรงเดียวกัน (y = 0)
    // RDP ควรเหลือแค่จุดแรกกับจุดสุดท้าย
    const line: Point[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
    ];
    const result = rdpSimplify(line, 0.1);
    expect(result).toEqual([{ x: 0, y: 0 }, { x: 4, y: 0 }]);
  });

  it('เก็บจุดที่เบี่ยงออกมาก', () => {
    const path: Point[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0.05 },
      { x: 2, y: 10 }, // เบี่ยงออกแรง
      { x: 3, y: 0.05 },
      { x: 4, y: 0 },
    ];
    const result = rdpSimplify(path, 0.5);
    // ต้องมีจุด (2, 10) เพราะเบี่ยงไกลกว่า epsilon
    expect(result.some((p) => p.x === 2 && p.y === 10)).toBe(true);
  });

  it('epsilon ใหญ่ → ลดจุดมาก / epsilon เล็ก → ลดจุดน้อย', () => {
    const curve: Point[] = Array.from({ length: 100 }, (_, i) => ({
      x: i,
      y: Math.sin(i / 10) * 5,
    }));
    const loose = rdpSimplify(curve, 3);
    const tight = rdpSimplify(curve, 0.1);
    expect(loose.length).toBeLessThan(tight.length);
    expect(tight.length).toBeLessThan(curve.length); // ต้องลดจุดได้บ้าง
  });

  it('เคส freehand จริงๆ — เหลี่ยมคดเคี้ยว 20 จุด ลด epsilon=0.15 เหลือ ≤ 10', () => {
    const raw: Point[] = Array.from({ length: 20 }, (_, i) => ({
      x: i * 0.1,
      y: i % 2 === 0 ? 0 : 0.01, // ซิกแซกเล็ก
    }));
    const simplified = rdpSimplify(raw, 0.15);
    expect(simplified.length).toBeLessThanOrEqual(10);
    expect(simplified[0]).toEqual(raw[0]);
    expect(simplified[simplified.length - 1]).toEqual(raw[raw.length - 1]);
  });
});

// === pointsToPath ===
describe('pointsToPath', () => {
  it('คืน string ว่างเมื่อไม่มีจุด', () => {
    expect(pointsToPath([], 24)).toBe('');
  });

  it('สร้าง path "M L L Z" ที่ closed=true', () => {
    const pts: Point[] = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }];
    expect(pointsToPath(pts, 10, true)).toBe('M 0,0 L 10,0 L 10,10 Z');
  });

  it('ไม่มี Z เมื่อ closed=false', () => {
    const pts: Point[] = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
    expect(pointsToPath(pts, 10, false)).toBe('M 0,0 L 10,10');
  });

  it('คูณ gridSize ถูกต้อง', () => {
    const pts: Point[] = [{ x: 1, y: 2 }, { x: 3, y: 4 }];
    expect(pointsToPath(pts, 24, true)).toBe('M 24,48 L 72,96 Z');
  });
});

// === pointsToPolygon ===
describe('pointsToPolygon', () => {
  it('สร้าง polygon attribute "x,y x,y ..." ', () => {
    const pts: Point[] = [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }];
    expect(pointsToPolygon(pts, 10)).toBe('10,20 30,40 50,60');
  });

  it('array ว่าง → string ว่าง', () => {
    expect(pointsToPolygon([], 10)).toBe('');
  });
});
