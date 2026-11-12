// Ofis ve patron odası görsellerindeki ekranların köşeleri (görsel pikseli).
// Sıra: sol üst, sağ üst, sağ alt, sol alt. Görseller 1672×941.
export type Nokta = [number, number];
export type Dortgen = [Nokta, Nokta, Nokta, Nokta];

export const GORSEL = { w: 1672, h: 941 };

export const DORTGEN: Record<"perde" | "m1" | "m2" | "m3" | "m4", Dortgen> = {
  perde: [[1105, 152], [1613, 108], [1613, 470], [1105, 458]],
  m1: [[107, 438], [264, 439.5], [264, 589], [107.5, 575]],
  m2: [[483, 430], [707, 426.5], [710, 568], [492, 587]],
  m3: [[816.5, 430], [946, 431], [950, 542.5], [821, 554]],
  m4: [[975.75, 451], [1100, 452], [1103.75, 537.5], [978.75, 542]],
};
export const MONITORLER: Dortgen[] = [DORTGEN.m1, DORTGEN.m2, DORTGEN.m3, DORTGEN.m4];

/** Patron masasındaki tabletin ekranı */
export const TABLET_Q: Dortgen = [[104, 476], [630, 494], [727, 787], [162, 824]];
export const TABLET_BOY = { w: 1190, h: 700 };
export const PERDE_BOY = { w: 1200, h: 720 };

/** w×h boyutlu bir öğeyi dört köşeye oturtan perspektif matrisi */
export function matris(w: number, h: number, q: Dortgen): string {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den, k = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3, d = y1 - y0 + g * y1, e = y3 - y0 + k * y3;
  return `matrix3d(${a / w},${d / w},0,${g / w},${b / h},${e / h},0,${k / h},0,0,1,0,${x0},${y0},0,1)`;
}

export const sinirlar = (q: Dortgen): [number, number, number, number] => {
  const xs = q.map((p) => p[0]), ys = q.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
};

/** Monitörün görünen en-boy oranı: içerik bu oranda kurulur, perspektif dışında esnemez */
export const oran = (q: Dortgen) =>
  ((q[1][0] - q[0][0] + q[2][0] - q[3][0]) / 2) / ((q[3][1] - q[0][1] + q[2][1] - q[1][1]) / 2);

/** Monitör ekranının piksel genişliği (yükseklik 800) */
export const monitorGenisligi = (q: Dortgen) => Math.round(800 * oran(q));
