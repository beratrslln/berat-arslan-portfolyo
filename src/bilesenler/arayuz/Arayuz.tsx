import { dokunmatikMi } from "../../sahne/ortam";
import { useSahne } from "../../sahne/SahneBaglami";
import type { Proje } from "../../tipler";

const iki = (n: number) => String(n).padStart(2, "0");

export function Ust({ ad }: { ad: string }) {
  return (
    <header className="ust">
      <span className="marka">{ad}<span>.</span></span>
    </header>
  );
}

/** Sağdaki duraklar: ofis, dört proje, iletişim */
export function Izler({ projeler }: { projeler: Proje[] }) {
  const { motor, durak } = useSahne();
  const adlar = ["Ofis", ...projeler.map((p) => p.ad), "İletişim"];
  return (
    <nav className="izler mono" aria-label="Bölümler">
      {adlar.map((ad, i) => (
        <button
          key={ad}
          type="button"
          className={i === durak ? "etkin" : undefined}
          aria-label={ad}
          aria-current={i === durak ? "true" : undefined}
          onClick={() => motor.current?.git(i, { ucarak: true })}
        >
          <span aria-hidden="true">{ad}</span><i aria-hidden="true" />
        </button>
      ))}
    </nav>
  );
}

export function Ipucu() {
  const { durak } = useSahne();
  return (
    <p className={`ipucu${durak !== 0 ? " gizli" : ""}`}>
      {dokunmatikMi() ? "Bir monitöre dokunun ya da kaydırın" : "Monitörlerin üzerine gelin · tıklayın ya da kaydırın"}
    </p>
  );
}

/** Bir monitöre yakınlaşınca altta çıkan çubuk */
export function AltArayuz({ projeler }: { projeler: Proje[] }) {
  const { motor, durak } = useSahne();
  const p = durak >= 1 && durak <= projeler.length ? projeler[durak - 1] : null;
  return (
    <div className={`alt-arayuz${p ? "" : " gizli"}`}>
      <span className="bilgi">
        {p && <><b>{iki(durak)} / {iki(projeler.length)}</b>{p.ad}<small className="alt-ozet">{p.ozet}</small></>}
      </span>
      <button type="button" className="ikincil" onClick={() => motor.current?.git(0, { ucarak: true })}>← Ofise dön</button>
      <button type="button" className="birincil" onClick={() => motor.current?.ilerle()}>
        {durak < projeler.length ? "Diğer projeye geç →" : "İletişime geç →"}
      </button>
    </div>
  );
}
