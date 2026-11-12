import { useMemo, useRef, type CSSProperties, type PointerEvent } from "react";
import { DORTGEN, PERDE_BOY, matris } from "../../sahne/geometri";
import { renkle } from "../../sahne/renkle";
import { useSahne } from "../../sahne/SahneBaglami";
import type { Profil, Proje } from "../../tipler";

// Perdede imlecin yeri (ışık onu izler): dönüşüm uygulanmış öğe içinde offsetX hedefe göredir, perdeye kadar toplanır
function yerel(e: PointerEvent<HTMLElement>, kok: HTMLElement): [number, number] {
  let x = e.nativeEvent.offsetX, y = e.nativeEvent.offsetY;
  let el = e.target as HTMLElement | null;
  while (el && el !== kok) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent as HTMLElement | null; }
  return [x, y];
}

export function Perde({ profil, projeler }: { profil: Profil; projeler: Proje[] }) {
  const { motor, setTabletSekme } = useSahne();
  const kokRef = useRef<HTMLDivElement>(null);

  // Alt yarıda projelerin kodu akar; içerik iki kez yazılır, yarısı kadar kayınca başa döner
  const kod = useMemo(() => {
    const satirlar = projeler.flatMap((p) => [`// ${p.ad}`, ...p.kod.split("\n").filter((x) => x.trim()), ""]);
    const html = satirlar.map(renkle).join("\n");
    return { html: html + "\n" + html, sure: `${Math.round(satirlar.length * 1.6)}s` };
  }, [projeler]);

  const [unvan1, ...unvanKalan] = profil.unvan.split(" ");

  const perdeMatrisi = matris(PERDE_BOY.w, PERDE_BOY.h, DORTGEN.perde);

  return (
    <>
    <div
      ref={kokRef}
      className="yuzey perde"
      data-yuzey="perde"
      style={{ transform: perdeMatrisi }}
      onPointerMove={(e) => {
        const kok = kokRef.current;
        if (!kok) return;
        const [x, y] = yerel(e, kok);
        kok.style.setProperty("--mx", x + "px");
        kok.style.setProperty("--my", y + "px");
      }}
    >
      <div className="isik" aria-hidden="true" />
      <section className="p-sayfa p-giris">
        <h1 className="p-ad" aria-label={profil.ad}>
          {[...profil.ad].map((h, i) => (h === " " ? <span key={i} className="h bosluk"> </span> : <span key={i} className="h">{h}</span>))}
        </h1>
        <p className="p-alt">{unvan1} <em>{unvanKalan.join(" ")}</em></p>
        <nav className="p-menu" aria-label="Ana menü">
          <button type="button" className="ana" onClick={() => motor.current?.git(1, { ucarak: true })}>Projeleri gez ↓</button>
          <button
            type="button"
            className="ana ikinci"
            onClick={() => { setTabletSekme("iletisim"); const m = motor.current; m?.git(m.iletisimDuragi, { ucarak: true }); }}
          >
            İletişim
          </button>
        </nav>
      </section>
    </div>
    {/* Akan kod ayrı katmanda, perdenin düzleminde 386. pikselden aşağısı: perspektifli perdenin içinde
        hareketli katman olunca bazı tarayıcılar perdedeki yazıyı çizmeyi bırakıyor */}
    <div className="yuzey perde-kod" aria-hidden="true" style={{ transform: `${perdeMatrisi} translateY(386px)` }}>
      <div className="p-kod">
        <span className="p-kod-etiket">// projelerden kod</span>
        <div className="p-kod-ic" style={{ "--sure": kod.sure } as CSSProperties} dangerouslySetInnerHTML={{ __html: kod.html }} />
      </div>
    </div>
    </>
  );
}
