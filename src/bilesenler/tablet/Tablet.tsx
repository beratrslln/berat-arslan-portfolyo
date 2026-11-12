import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { TABLET_BOY, TABLET_Q, matris } from "../../sahne/geometri";
import { hareketAzaltildi } from "../../sahne/ortam";
import { useSahne, type TabletSekmesi } from "../../sahne/SahneBaglami";
import type { Iletisim, Profil } from "../../tipler";
import { Kanallar } from "./Kanallar";
import { ProjeFormu } from "./ProjeFormu";

const SEKMELER: [TabletSekmesi, string][] = [["iletisim", "İletişime geçin"], ["proje", "Proje yapalım"], ["hakkinda", "Hakkında"]];

/** Son sahnedeki tablet. Masaüstünde masadaki tabletin ekranına oturur; telefonda tam ekran açılır. */
export function Tablet({ profil, iletisim, mobil }: { profil: Profil; iletisim: Iletisim; mobil: boolean }) {
  const { motor, tabletAcik, tabletSekme: sekme, setTabletSekme: setSekme } = useSahne();
  const sayfaRefleri = useRef<Partial<Record<TabletSekmesi, HTMLDivElement | null>>>({});
  const ilkCizim = useRef(true);
  const [bildirim, setBildirim] = useState({ metin: "", goster: false });
  const bildirimZaman = useRef(0);

  const bildir = (metin: string) => {
    setBildirim({ metin, goster: true });
    clearTimeout(bildirimZaman.current);
    bildirimZaman.current = window.setTimeout(() => setBildirim((b) => ({ ...b, goster: false })), 2600);
  };

  // Sekme değişince yeni sayfanın parçaları sırayla gelir
  useEffect(() => {
    if (ilkCizim.current) { ilkCizim.current = false; return; }
    const sayfa = sayfaRefleri.current[sekme];
    if (sayfa && !hareketAzaltildi()) gsap.fromTo(sayfa.children, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, stagger: 0.07, duration: 0.5, ease: "power3.out" });
  }, [sekme]);

  const sayfa = (ad: TabletSekmesi) => ({ className: "t-sayfa", "data-sayfa": ad, hidden: sekme !== ad, ref: (el: HTMLDivElement | null) => { sayfaRefleri.current[ad] = el; } });

  return (
    <section
      className={`tablet${mobil ? " mobil" : ""}${tabletAcik ? " acik" : ""}`}
      style={mobil ? undefined : { transform: matris(TABLET_BOY.w, TABLET_BOY.h, TABLET_Q) }}
      aria-label="İletişim tableti"
      data-lenis-prevent
    >
      <div className="t-ekran">
        <div className="t-ust">
          <span className="t-logo" aria-hidden="true">&lt;B&gt;</span>
          <span className="t-kim"><b>{profil.ad}</b>{profil.unvan}</span>
          <div className="t-sekmeler" role="tablist" aria-label="Tablet sekmeleri">
            {SEKMELER.map(([ad, metin]) => (
              <button key={ad} type="button" role="tab" aria-selected={sekme === ad} onClick={() => setSekme(ad)}>{metin}</button>
            ))}
          </div>
        </div>
        <div className="t-govde">
          <div {...sayfa("iletisim")}>
            <div>
              <h2>İletişime <em>geçin.</em></h2>
              <p className="acik">Proje, iş teklifi ya da bir soru: size en uygun kanaldan yazın. Proje fikriniz varsa “Proje yapalım” sekmesindeki formu doldurun.</p>
              <button type="button" className="t-cta" onClick={() => setSekme("proje")}>Proje formuna geç <span aria-hidden="true">→</span></button>
            </div>
            <Kanallar iletisim={iletisim} bildir={bildir} />
          </div>
          <div {...sayfa("proje")}>
            <div>
              <h2>Proje <em>yapalım.</em></h2>
              <p className="acik">Fikrinizi birkaç cümleyle anlatın; size dönüş yapayım.</p>
            </div>
            <ProjeFormu iletisim={iletisim} />
          </div>
          <div {...sayfa("hakkinda")}>
            <div><h2>Hakkında</h2></div>
            <p className="acik" style={{ marginTop: 0 }}>{profil.hakkinda}</p>
          </div>
        </div>
        <div className="t-alt">
          <button type="button" onClick={() => motor.current?.git(0, { ucarak: true })}>← Ofise dön</button>
          <button type="button" onClick={() => motor.current?.git(1, { ucarak: true })}>▦ Projeler</button>
        </div>
        <div className={`t-bildirim${bildirim.goster ? " goster" : ""}`} role="status">{bildirim.metin}</div>
      </div>
    </section>
  );
}
