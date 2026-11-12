/*
 * Ofis fotoğrafındaki dört monitörün yerine 3D monitör modeli (public/modeller/monitor.glb).
 *
 * Nasıl oturuyor:
 * - Fotoğrafa bakan sanal bir kamera varsayılır (odak uzaklığı ODAK px). Her monitörün ekran dörtgeninden
 *   (geometri.ts) monitörün uzaydaki duruşu çıkarılır ve model oraya konur.
 * - Fotoğraf yapay zekâyla üretildiği için perspektifi tam tutarlı değil. Bu yüzden her monitör kendi küçük
 *   2B düzeltmesiyle çizilir: modelin ekranı, sitedeki HTML ekranın dörtgenine birebir oturur.
 * - Motor fotoğrafı kaydırıp büyüttükçe aynı kesit 3D'de de görünür (setViewOffset ile aynı mantık).
 * - Tuval sahnenin üstünde, ekrana sabit durur. Monitörlerin ekran yüzeyi tuvalde saydam bırakılır:
 *   alttaki HTML ekranlar (projeler) oradan görünür. Böylece fotoğraf katmanı bölünmez, kaydırma hafif kalır.
 * - Yalnız kamera değiştiğinde çizilir.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GORSEL, MONITORLER, type Dortgen } from "./geometri";

const ODAK = 1000; // sanal kameranın odak uzaklığı (fotoğraf pikseli)
const EKRAN_GENISLIGI = 0.6; // varsayılan fiziksel ekran genişliği (metre); yalnız derinlik ölçeği
const BUYUTME = 1.05; // model, fotoğraftaki eski monitörün kenarlarını örtsün diye ekranın çevresinde biraz büyük

type V2 = [number, number];

/** 4 nokta eşlemesinden 3×3 homografi (satır düzeninde, h22 = 1) */
function homografi(kaynak: V2[], hedef: V2[]): number[] {
  const A: number[][] = [], b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = kaynak[i], [u, v] = hedef[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
  }
  // Gauss eleme
  for (let c = 0; c < 8; c++) {
    let p = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const k = A[r][c] / A[c][c];
      for (let j = c; j < 8; j++) A[r][j] -= k * A[c][j];
      b[r] -= k * b[c];
    }
  }
  const h = b.map((v, i) => v / A[i][i]);
  return [...h, 1];
}

/** Fotoğraf pikselinden tam görüntünün NDC'sine */
const ndc = ([x, y]: V2): V2 => [(x / GORSEL.w) * 2 - 1, 1 - (y / GORSEL.h) * 2];

/** Ekran dörtgeninden monitörün kamera uzayındaki duruşu (OpenCV düzeni: x sağ, y aşağı, z ileri) */
function durus(q: Dortgen) {
  const cx = GORSEL.w / 2, cy = GORSEL.h / 2;
  const H = homografi([[0, 0], [1, 0], [1, 1], [0, 1]], q as V2[]);
  // K⁻¹·H
  const Kinv = (x: number, y: number, z: number) => new THREE.Vector3((x - cx * z) / ODAK, (y - cy * z) / ODAK, z);
  const a1 = Kinv(H[0], H[3], H[6]), a2 = Kinv(H[1], H[4], H[7]), a3 = Kinv(H[2], H[5], H[8]);
  let l = a1.length() / EKRAN_GENISLIGI;
  if (a3.z / l < 0) l = -l;
  const w = EKRAN_GENISLIGI, h = a2.length() / Math.abs(l);
  const r1 = a1.clone().divideScalar(l).normalize();
  let r2 = a2.clone().divideScalar(l).normalize();
  r2 = r2.sub(r1.clone().multiplyScalar(r2.dot(r1))).normalize(); // dik yap
  const t = a3.clone().divideScalar(l);
  const merkez = t.clone().addScaledVector(r1, w / 2).addScaledVector(r2, h / 2);
  return { r1, r2, merkez, w, h };
}

/** OpenCV kamera uzayından three.js kamera uzayına (x aynı, y ve z ters) */
const cevir = (v: THREE.Vector3) => new THREE.Vector3(v.x, -v.y, -v.z);

export class Monitor3B {
  private readonly cizici: THREE.WebGLRenderer;
  private readonly kamera = new THREE.PerspectiveCamera(2 * Math.atan(GORSEL.h / 2 / ODAK) * (180 / Math.PI), GORSEL.w / GORSEL.h, 0.05, 50);
  private readonly sahne = new THREE.Scene();
  private readonly izdusumler: { value: THREE.Matrix4 }[] = [];
  private duzeltmeler: THREE.Matrix4[] = [];
  private hazir = false;
  private son = { tx: 0, ty: 0, S: 1, gorunur: true };
  private kirli = true;

  constructor(private readonly tuval: HTMLCanvasElement) {
    const dokunmatik = matchMedia("(hover: none)").matches;
    this.cizici = new THREE.WebGLRenderer({ canvas: tuval, alpha: true, antialias: !dokunmatik, powerPreference: "high-performance" });
    // Monitörler ekranın küçük bir kısmı: telefonda 1x çözünürlük yeter, masaüstünde en çok 1,5x
    this.cizici.setPixelRatio(Math.min(devicePixelRatio || 1, dokunmatik ? 1 : 1.5));
    this.cizici.outputColorSpace = THREE.SRGBColorSpace;
    this.cizici.toneMapping = THREE.ACESFilmicToneMapping;
    this.cizici.toneMappingExposure = 0.85;
    this.cizici.autoClear = false;
    this.boyut();
    this.kamera.position.set(0, 0, 0);
    this.kamera.updateMatrixWorld();
    addEventListener("resize", this.boyutDinle);
  }

  private boyutDinle = () => { this.boyut(); this.kirli = true; this.ciz(); };

  private boyut() {
    this.cizici.setSize(innerWidth, innerHeight, false);
    this.tuval.style.width = `${innerWidth}px`;
    this.tuval.style.height = `${innerHeight}px`;
  }

  async yukle(url: string) {
    const gltf = await new GLTFLoader().loadAsync(url);
    const kaynak = gltf.scene;
    kaynak.updateMatrixWorld(true);

    // Modelin ekran yüzeyi ve eksenleri
    let ekran: THREE.Mesh | null = null;
    kaynak.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && (m.material as THREE.Material).name === "layar") ekran = m; });
    if (!ekran) throw new Error("Modelde ekran yüzeyi yok");
    const em = ekran as THREE.Mesh;
    em.geometry.computeBoundingBox();
    const bb = em.geometry.boundingBox!;
    const yerel = bb.getSize(new THREE.Vector3());
    const yerelMerkez = bb.getCenter(new THREE.Vector3());
    const eksen = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];
    const sira = [0, 1, 2].sort((a, b) => yerel.getComponent(a) - yerel.getComponent(b));
    const dunyaEkseni = (i: number) => eksen[i].clone().transformDirection(em.matrixWorld);
    const uzunluk = (i: number) => {
      const y = eksen[i].clone().multiplyScalar(yerel.getComponent(i) / 2);
      return yerelMerkez.clone().add(y).applyMatrix4(em.matrixWorld).distanceTo(yerelMerkez.clone().sub(y).applyMatrix4(em.matrixWorld));
    };
    let U = dunyaEkseni(sira[1]), R = dunyaEkseni(sira[2]), hM = uzunluk(sira[1]), wM = uzunluk(sira[2]);
    if (Math.abs(R.y) > Math.abs(U.y)) { [U, R] = [R, U]; [hM, wM] = [wM, hM]; }
    if (U.y < 0) U.negate();
    const N = new THREE.Vector3().fromBufferAttribute(em.geometry.getAttribute("normal"), 0).transformDirection(em.matrixWorld);
    N.sub(U.clone().multiplyScalar(N.dot(U))).normalize();
    R = new THREE.Vector3().crossVectors(U, N).normalize();
    const C = yerelMerkez.clone().applyMatrix4(em.matrixWorld);
    // Modeli ekran merkezi başlangıçta, ekran sağ = X, yukarı = Y, ön = Z olacak şekilde hizala
    const hizalama = new THREE.Matrix4().makeBasis(R, U, N).setPosition(C).invert();

    // Malzemeler: gece ofisine uyan koyu, hafif parlak yüzeyler. Her monitörün kendi takımı var:
    // köşeleri kendi ekran dörtgenine oturtan izdüşüm (uProj) malzemede tutulur, dördü tek çizimde çizilir.
    const takim = (uProj: { value: THREE.Matrix4 }) => {
      const yap = (m: THREE.MeshStandardMaterial) => {
        m.onBeforeCompile = (gs) => {
          gs.uniforms.uProj = uProj;
          gs.vertexShader = "uniform mat4 uProj;\n" + gs.vertexShader.replace(
            "#include <project_vertex>",
            THREE.ShaderChunk.project_vertex.replace("gl_Position = projectionMatrix * mvPosition;", "gl_Position = uProj * mvPosition;"),
          );
        };
        m.customProgramCacheKey = () => "monitor3d";
        return m;
      };
      return {
        govde: yap(new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: 0.42, metalness: 0.2 })),
        ayak: yap(new THREE.MeshStandardMaterial({ color: 0x111113, roughness: 0.55, metalness: 0.35 })),
        metal: yap(new THREE.MeshStandardMaterial({ color: 0x5c6066, roughness: 0.38, metalness: 0.85 })),
        cam: yap(new THREE.MeshStandardMaterial({ color: 0x020304, roughness: 0.2, metalness: 0 })),
        // Delik: ekran dörtgeni kadar saydam alan; alttaki HTML ekran buradan görünür
        delik: (() => {
          const m = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, blending: THREE.NoBlending, depthWrite: false });
          m.onBeforeCompile = (gs) => {
            gs.uniforms.uProj = uProj;
            gs.vertexShader = "uniform mat4 uProj;\n" + gs.vertexShader.replace(
              "#include <project_vertex>",
              THREE.ShaderChunk.project_vertex.replace("gl_Position = projectionMatrix * mvPosition;", "gl_Position = uProj * mvPosition;"),
            );
          };
          m.customProgramCacheKey = () => "monitor3d-delik";
          return m;
        })(),
      };
    };

    const sahne = this.sahne;
    sahne.environment = new THREE.PMREMGenerator(this.cizici).fromScene(new RoomEnvironment(), 0.04).texture;
    sahne.environmentIntensity = 0.16;
    // Işık: soldaki masa lambası (sıcak), arkadan cam ve şehir (soğuk)
    const lamba = new THREE.DirectionalLight(0xffc89a, 1.1);
    lamba.position.set(-3, 2.5, 1);
    sahne.add(lamba, lamba.target);
    const kenar = new THREE.DirectionalLight(0x8fdcff, 0.35);
    kenar.position.set(1.5, 2, -4);
    sahne.add(kenar, kenar.target);
    sahne.add(new THREE.HemisphereLight(0x1a2630, 0x050403, 0.5));

    this.kamera.clearViewOffset();
    this.kamera.updateProjectionMatrix();
    MONITORLER.forEach((q) => {
      const uProj = { value: new THREE.Matrix4() };
      const m = takim(uProj);
      const model = kaynak.clone(true);
      model.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        const ad = (mesh.material as THREE.Material).name;
        mesh.material = ad === "layar" ? m.cam : ad === "Material.001" ? m.govde : ad === "Material.002" ? m.ayak : m.metal;
      });
      const hizali = new THREE.Group();
      hizali.matrixAutoUpdate = false;
      hizali.matrix.copy(hizalama);
      hizali.add(model);

      const d = durus(q);
      const grup = new THREE.Group();
      const sag = cevir(d.r1), yukari = cevir(d.r2.clone().negate()), on = new THREE.Vector3().crossVectors(sag, yukari).normalize();
      grup.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(sag, yukari, on));
      grup.position.copy(cevir(d.merkez));
      grup.scale.set(d.w / wM, d.h / hM, d.w / wM);
      const buyut = new THREE.Group();
      buyut.scale.setScalar(BUYUTME);
      buyut.add(hizali);
      grup.add(buyut);
      // Ekran dörtgenini tam kaplayan saydam delik (büyütmesiz), modelin ekranının hemen önünde
      const delik = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m.delik);
      delik.scale.set(wM, hM, 1);
      delik.position.z = wM * 0.002;
      delik.renderOrder = 2;
      grup.add(delik);
      sahne.add(grup);

      // Ekranın önünde hafif ışık: proje ekranının parlaklığı çerçeveye vursun
      const ekranIsik = new THREE.PointLight(0x9fe8ff, 0.3, d.w * 2.5, 2);
      ekranIsik.position.copy(cevir(d.merkez).addScaledVector(on, d.w * 0.35));
      sahne.add(ekranIsik);

      // Düzeltme: modelin ekran köşeleri tam olarak sitedeki ekran dörtgenine otursun
      const kose = (sx: number, sy: number) => {
        const p = new THREE.Vector3(sx * d.w / 2, sy * d.h / 2, 0).applyQuaternion(grup.quaternion).add(grup.position);
        p.project(this.kamera);
        return [p.x, p.y] as V2;
      };
      const h = homografi([kose(-1, 1), kose(1, 1), kose(1, -1), kose(-1, -1)], (q as V2[]).map(ndc));
      this.duzeltmeler.push(new THREE.Matrix4().set(
        h[0], h[1], 0, h[2],
        h[3], h[4], 0, h[5],
        0, 0, 1, 0,
        h[6], h[7], 0, h[8],
      ));
      this.izdusumler.push(uProj);
    });
    sahne.updateMatrixWorld(true);

    // Gölgelendiricileri önceden derle: ilk kamera hareketinde takılma olmasın
    this.cizici.compile(sahne, this.kamera);
    this.hazir = true;
    this.kirli = true;
    this.ciz();
  }

  /** Motor sahneyi her taşıdığında: .scene dönüşümü translate(tx,ty) scale(S) */
  guncelle(tx: number, ty: number, S: number, gorunur: boolean) {
    const s = this.son;
    if (s.tx === tx && s.ty === ty && s.S === S && s.gorunur === gorunur) return;
    this.son = { tx, ty, S, gorunur };
    this.tuval.style.visibility = gorunur ? "visible" : "hidden";
    this.kirli = true;
    this.ciz();
  }

  private ciz() {
    if (!this.hazir || !this.kirli || !this.son.gorunur) return;
    this.kirli = false;
    const { tx, ty, S } = this.son;
    // Görünen fotoğraf kesiti (fotoğraf pikseli) → tam görüntü NDC'sinden kesit NDC'sine geçiş
    const x0 = -tx / S, y0 = -ty / S, wv = innerWidth / S, hv = innerHeight / S;
    const A = new THREE.Matrix4().set(
      GORSEL.w / wv, 0, 0, (GORSEL.w - 2 * x0) / wv - 1,
      0, GORSEL.h / hv, 0, 1 - (GORSEL.h - 2 * y0) / hv,
      0, 0, 1, 0,
      0, 0, 0, 1,
    );
    const tam = this.kamera.projectionMatrix;
    this.izdusumler.forEach((u, i) => u.value.copy(A).multiply(this.duzeltmeler[i]).multiply(tam));
    this.cizici.clear();
    this.cizici.render(this.sahne, this.kamera);
  }

  destroy() {
    removeEventListener("resize", this.boyutDinle);
    this.cizici.dispose();
  }
}
