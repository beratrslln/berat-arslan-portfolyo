import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useIcerik } from "./api/useIcerik";
import { AltArayuz, Ipucu, Izler, Ust } from "./bilesenler/arayuz/Arayuz";
import { Ofis } from "./bilesenler/ofis/Ofis";
import { PatronOdasi } from "./bilesenler/patron/PatronOdasi";
import { Tablet } from "./bilesenler/tablet/Tablet";
import { SahneMotoru } from "./sahne/motor";
import { mobilMi } from "./sahne/ortam";
import { SahneBaglami, type TabletSekmesi } from "./sahne/SahneBaglami";

export default function App() {
  const { projeler, profil, iletisim } = useIcerik();
  const motor = useRef<SahneMotoru | null>(null);
  const [durak, setDurak] = useState(0);
  const [tabletAcik, setTabletAcik] = useState(false);
  const [tabletSekme, setTabletSekme] = useState<TabletSekmesi>("iletisim");
  const [mobil, setMobil] = useState(mobilMi);

  // Motorun kullandığı öğeler
  const scene = useRef<HTMLDivElement>(null);
  const sahne2 = useRef<HTMLDivElement>(null);
  const sahne2Ic = useRef<HTMLDivElement | null>(null);
  const hiz = useRef<HTMLDivElement>(null);
  const odaHiz = useRef<HTMLImageElement | null>(null);
  const sahne2Hiz = useRef<HTMLImageElement | null>(null);
  const ekranlar = useRef<(HTMLDivElement | null)[]>([]);
  // 3D monitörler: masaüstünde açık; dokunmatik cihazlarda kaydırmayı ağırlaştırdığı için kapalı (fotoğraftaki monitörler).
  // ?3d=1 her cihazda açar, ?3d=0 kapatır. WebGL yoksa fotoğraftaki monitörler kalır.
  const monitorTuvali = useRef<HTMLCanvasElement | null>(null);
  const uc = useMemo(() => {
    const iste = new URLSearchParams(location.search).get("3d");
    if (iste === "1") return true;
    if (iste === "0") return false;
    return !matchMedia("(hover: none)").matches;
  }, []);

  // Tablet masaüstünde odanın içinde, telefonda ekranın önünde durur
  const [masaKabi, setMasaKabi] = useState<HTMLDivElement | null>(null);
  const [onKap, setOnKap] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    let m3: import("./sahne/monitor3d").Monitor3B | null = null;
    let sonKamera: [number, number, number, boolean] | null = null;
    let iptal = false;
    // three.js ayrı parça olarak, sayfa açıldıktan sonra yüklenir: ilk görüntüyü bekletmez
    if (uc && monitorTuvali.current) {
      const tuval = monitorTuvali.current;
      import("./sahne/monitor3d").then(async ({ Monitor3B }) => {
        if (iptal) return;
        const yeni = new Monitor3B(tuval);
        await yeni.yukle("/modeller/monitor.glb");
        if (iptal) { yeni.destroy(); return; }
        m3 = yeni;
        if (sonKamera) m3.guncelle(...sonKamera);
        tuval.classList.add("hazir");
      }).catch((e) => { console.warn("3D monitörler açılamadı, fotoğraftakiler kalıyor:", e); tuval.remove(); });
    }
    const m = new SahneMotoru(
      {
        scene: scene.current!, sahne2: sahne2.current!, sahne2Ic: sahne2Ic.current!, hiz: hiz.current!,
        odaHiz: odaHiz.current!, sahne2Hiz: sahne2Hiz.current!, ekranlar: ekranlar.current.filter(Boolean) as HTMLElement[],
      },
      { durakDegisti: setDurak, tabletDegisti: setTabletAcik, kameraDegisti: (tx, ty, S, g) => { sonKamera = [tx, ty, S, g]; m3?.guncelle(tx, ty, S, g); } },
    );
    motor.current = m;
    (window as unknown as { __motor: SahneMotoru }).__motor = m;
    const boyut = () => setMobil(mobilMi());
    addEventListener("resize", boyut);
    return () => { iptal = true; m3?.destroy(); removeEventListener("resize", boyut); m.destroy(); motor.current = null; };
  }, []);

  const baglam = useMemo(() => ({ motor, durak, tabletAcik, tabletSekme, setTabletSekme }), [durak, tabletAcik, tabletSekme]);
  const tabletKabi = mobil ? onKap : masaKabi;

  return (
    <SahneBaglami.Provider value={baglam}>
      <Ust ad={profil.ad} />
      <Izler projeler={projeler} />
      <Ipucu />
      <AltArayuz projeler={projeler} />

      <div className="kaydirma" aria-hidden="true" />

      <main className="stage">
        <Ofis ref={scene} profil={profil} projeler={projeler} ekranRefleri={ekranlar} odaHizRef={odaHiz} />
        {/* 3D monitörler: ofisin üstünde, ekrana sabit; ekran yüzeyleri saydam, projeler alttan görünür */}
        {uc && <canvas className="monitor3d" ref={monitorTuvali} aria-hidden="true" />}
        {uc && <p className="model-kaynak">3D monitör: <a href="https://sketchfab.com/3d-models/office-monitor-workstation-monitor-6a7b0147890242418a49f6db26657ab4" target="_blank" rel="noopener">DatSketch</a> · <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a></p>}
        <PatronOdasi ref={sahne2} icRef={sahne2Ic} hizRef={sahne2Hiz} tabletKabi={setMasaKabi} />
        <div className="hiz" aria-hidden="true" ref={hiz} />
        <div className="vinyet" aria-hidden="true" />
        <div className="tablet-sahne" ref={setOnKap} />
        <div className="kapak" aria-hidden="true" />
      </main>
      {tabletKabi && createPortal(<Tablet profil={profil} iletisim={iletisim} mobil={mobil} />, tabletKabi)}
    </SahneBaglami.Provider>
  );
}
