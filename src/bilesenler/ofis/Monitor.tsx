import { forwardRef, useEffect, useRef } from "react";
import { matris, monitorGenisligi, type Dortgen } from "../../sahne/geometri";
import { hareketAzaltildi } from "../../sahne/ortam";
import { renkle } from "../../sahne/renkle";
import { useSahne } from "../../sahne/SahneBaglami";
import type { Proje } from "../../tipler";
import { Demo } from "./Demolar";

const iki = (n: number) => String(n).padStart(2, "0");

/** Kod yazılıyor: her monitör kendi dosyasını farklı hızda yazar, bitince baştan başlar.
 *  Yalnız ofisin geniş görüntüsünde ve kamera dururken yazar; DOM'a doğrudan yazar, React yeniden çizimi yapmaz. */
function useKodYazimi(kod: string, hiz: number) {
  const { motor } = useSahne();
  const kodRef = useRef<HTMLPreElement>(null);
  const noRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let n = 0, bekle = 0;
    const yaz = (tam = false) => {
      if (tam) n = kod.length;
      else if (n >= kod.length) { if (++bekle > 70) { n = 0; bekle = 0; } }
      else n = Math.min(kod.length, n + Math.ceil(hiz + Math.random() * 2));
      const satirlar = kod.slice(0, n).split("\n");
      const ilk = Math.max(0, satirlar.length - 19);
      if (kodRef.current) kodRef.current.innerHTML = satirlar.slice(ilk).map(renkle).join("\n") + '<span class="imlec"></span>';
      if (noRef.current) noRef.current.textContent = satirlar.slice(ilk).map((_, j) => ilk + j + 1).join("\n");
    };
    const azalt = hareketAzaltildi();
    yaz(azalt);
    if (azalt) return;
    // Yakınlaşınca kod ekranları görünmez; yazmaya devam etmek telefonda boşuna yeniden çizim demek
    const zaman = setInterval(() => {
      const m = motor.current;
      if (m && !m.hareketVar && m.genisGorunum && !document.hidden) yaz();
    }, 70);
    return () => clearInterval(zaman);
  }, [kod, hiz, motor]);
  return { kodRef, noRef };
}

interface Ozellikler {
  proje: Proje;
  sira: number;
  toplam: number;
  dortgen: Dortgen;
}

export const Monitor = forwardRef<HTMLDivElement, Ozellikler>(function Monitor({ proje: p, sira, toplam, dortgen }, ref) {
  const { motor } = useSahne();
  const w = monitorGenisligi(dortgen);
  const { kodRef, noRef } = useKodYazimi(p.kod, 0.9 + sira * 0.25);
  const ac = () => motor.current?.monitoreGit(sira);

  return (
    <div
      ref={ref}
      className="yuzey ekran"
      data-yuzey={`m${sira + 1}`}
      style={{ width: w, transform: matris(w, 800, dortgen) }}
      tabIndex={0}
      role="button"
      aria-label={`${p.ad} projesine yakınlaş`}
      onPointerEnter={() => motor.current?.uzerineGel(sira)}
      onPointerLeave={() => motor.current?.ayril(sira)}
      onFocus={() => motor.current?.uzerineGel(sira)}
      onBlur={() => motor.current?.ayril(sira)}
      onClick={ac}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ac(); } }}
    >
      <div className="kod-katman" aria-hidden="true">
        <div className="ed-ust">
          <span className="noktalar"><i /><i /><i /></span>
          <span className="sekme mono">{p.dosya}</span>
          <span className="sag mono">{p.kisa}</span>
        </div>
        <div className="ed-govde">
          <div className="ed-agac">
            {Array.from({ length: 14 }, (_, j) => (
              <i key={j} className={j === 4 ? "acik" : ""} style={{ width: `${40 + ((j * 37) % 55)}%`, marginLeft: (j % 3) * 10 }} />
            ))}
          </div>
          <div className="ed-no" ref={noRef} />
          <pre className="ed-kod" ref={kodRef} />
        </div>
        <div className="ed-durum mono"><span>⎇ main</span><span>{p.dil}</span><span>{p.kodNotu || "örnek kod"}</span></div>
      </div>
      <div className="proje-katman">
        <div className="poster" aria-hidden="true"><span>{iki(sira + 1)}</span><b>{p.ad}</b></div>
        <div className="pj-ust mono">
          <span className="noktalar"><i /><i /><i /></span>
          <b>{p.kisa}</b>
          <span className="sag">Proje {iki(sira + 1)} / {iki(toplam)}</span>
        </div>
        <div className="pj-govde">
          <header><span className="pj-no">{iki(sira + 1)}</span><h2>{p.ad}</h2><p className="pj-ozet">{p.ozet}</p></header>
          <Demo tur={p.demo} />
          <footer>
            {p.baglanti && <a className="pj-baglanti" href={p.baglanti.url} target="_blank" rel="noopener">{p.baglanti.metin} ↗</a>}
            <ul className="one">{p.one.map((x) => <li key={x}>{x}</li>)}</ul>
            <ul className="etiket mono" lang="en">{p.etiket.map((x) => <li key={x}>{x}</li>)}</ul>
          </footer>
        </div>
      </div>
      <div className="tarama" aria-hidden="true" />
    </div>
  );
});
