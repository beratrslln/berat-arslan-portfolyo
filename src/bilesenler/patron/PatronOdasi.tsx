import { forwardRef, useCallback, type MutableRefObject } from "react";

interface Ozellikler {
  icRef: MutableRefObject<HTMLDivElement | null>;
  hizRef: MutableRefObject<HTMLImageElement | null>;
  /** Masaüstünde tablet bu kabın içine, masadaki tabletin ekranına yerleşir */
  tabletKabi: (el: HTMLDivElement | null) => void;
}

/** Son sahne: ofisin yanındaki oda. Duvar ve kapı kasası geçişte kameranın önünden geçer. */
export const PatronOdasi = forwardRef<HTMLDivElement, Ozellikler>(function PatronOdasi({ icRef, hizRef, tabletKabi }, ref) {
  // Sabit ref fonksiyonu: her çizimde yeniden çağrılıp durum güncellemesi tetiklemesin
  const icKabi = useCallback((el: HTMLDivElement | null) => { icRef.current = el; tabletKabi(el); }, [icRef, tabletKabi]);
  return (
    <div className="sahne2" ref={ref}>
      <div className="duvar" />
      <div className="sahne2-ic" ref={icKabi}>
        <picture>
          <source srcSet="/gorseller/patron.webp" type="image/webp" />
          <img src="/gorseller/patron.jpg" width={1672} height={941} alt="" />
        </picture>
        <img className="katman sahne2-odak" src="/gorseller/patron-odak.jpg" alt="" />
        <img className="katman sahne2-hiz" src="/gorseller/patron-hiz.jpg" alt="" ref={hizRef} />
      </div>
    </div>
  );
});
