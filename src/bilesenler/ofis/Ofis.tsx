import { forwardRef, type MutableRefObject } from "react";
import { MONITORLER } from "../../sahne/geometri";
import type { Profil, Proje } from "../../tipler";
import { Monitor } from "./Monitor";
import { Perde } from "./Perde";

interface Ozellikler {
  profil: Profil;
  projeler: Proje[];
  ekranRefleri: MutableRefObject<(HTMLDivElement | null)[]>;
  odaHizRef: MutableRefObject<HTMLImageElement | null>;
}

/** Ofis sahnesi: fotoğraf, hazır bulanık/hareket izli kopyalar, perde ve dört monitör */
export const Ofis = forwardRef<HTMLDivElement, Ozellikler>(function Ofis({ profil, projeler, ekranRefleri, odaHizRef }, ref) {
  return (
    <div className="scene" ref={ref}>
      <picture>
        <source srcSet="/gorseller/ofis.webp" type="image/webp" />
        <img className="oda" src="/gorseller/ofis.jpg" width={1672} height={941} alt="Gece vakti bir yazılım ofisi: masalarda monitörler, duvarda projeksiyon perdesi." />
      </picture>
      <img className="katman oda-bulanik" src="/gorseller/ofis-bulanik.jpg" alt="" aria-hidden="true" />
      <img className="katman oda-hiz" src="/gorseller/ofis-hiz.jpg" alt="" aria-hidden="true" ref={odaHizRef} />
      <div className="neon" aria-hidden="true" />
      <Perde profil={profil} projeler={projeler} />
      {projeler.map((p, i) => (
        <Monitor
          key={i}
          ref={(el) => { ekranRefleri.current[i] = el; }}
          proje={p}
          sira={i}
          toplam={projeler.length}
          dortgen={MONITORLER[i]}
        />
      ))}
    </div>
  );
});
