import type { CSSProperties } from "react";
import type { DemoTuru } from "../../tipler";

// Monitörlerdeki temsilî demolar. Hepsi CSS animasyonu; monitör aktif değilken durur (site.css).
const v = (degerler: Record<string, string | number>) => degerler as CSSProperties;

function Imar() {
  const koseler: [number, number][] = [[92, 64], [282, 34], [318, 182], [196, 242], [84, 200]];
  const satirlar = [
    { ad: "Kat adedi", rozet: "Uygun", o: 0.8, asim: false },
    { ad: "Emsal (KAKS)", rozet: "Uygun değil", o: 1, asim: true },
    { ad: "Taban (TAKS)", rozet: "Uygun", o: 0.7, asim: false },
  ];
  return (
    <>
      <svg viewBox="0 0 400 280" preserveAspectRatio="xMidYMid meet">
        {Array.from({ length: 9 }, (_, i) => <line key={`y${i}`} className="izgara" x1="0" x2="400" y1={i * 35} y2={i * 35} />)}
        {Array.from({ length: 12 }, (_, i) => <line key={`x${i}`} className="izgara" y1="0" y2="280" x1={i * 36} x2={i * 36} />)}
        <path className="alan" d="M118 82 L262 58 L290 168 L196 214 L108 182 Z" />
        <path className="cekme" d="M118 82 L262 58 L290 168 L196 214 L108 182 Z" />
        <path className="sinir" pathLength={1} d="M92 64 L282 34 L318 182 L196 242 L84 200 Z" />
        {koseler.map(([x, y]) => <circle key={`${x}-${y}`} className="kose" cx={x} cy={y} r="5" />)}
      </svg>
      <div className="satirlar">
        {satirlar.map((s) => (
          <div key={s.ad} className={`satir${s.asim ? " asim" : ""}`} style={v({ "--o": s.o })}>
            <span>{s.ad}</span><span className="rozet">{s.rozet}</span><span className="bar"><i /></span>
          </div>
        ))}
      </div>
    </>
  );
}

function Hik() {
  const kapilar = ["Ana giriş", "Personel", "Otopark", "Arşiv", "Sunucu", "Arka kapı"];
  const olay = ["Giriş onaylandı", "Kart okundu", "Kapı açıldı", "Çıkış kaydedildi"];
  const satirlar = Array.from({ length: 10 }, (_, i) => [
    `${String(8 + i).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`, kapilar[i % 6], olay[i % 4],
  ]);
  return (
    <>
      <div className="kapilar">
        {kapilar.map((k, i) => (
          <div key={k} className="kapi" style={v({ "--i": i })}>{k}<small>Çevrimiçi</small><span className="okut">Kart okundu ✓</span></div>
        ))}
      </div>
      <div className="kayit">
        <h4>Olay akışı · örnek</h4>
        <div className="akis">
          {[0, 1].map((tur) => satirlar.map(([saat, kapi, ne], i) => <p key={`${tur}-${i}`}><span>{saat}</span><span>{kapi}</span><span>{ne}</span></p>))}
        </div>
      </div>
    </>
  );
}

function Dukkan() {
  return (
    <>
      <div className="vitrin">
        {["Telefon", "Kulaklık", "Kılıf", "Aksesuar"].map((k, i) => (
          <div key={k} className="urun" style={v({ "--i": i })}>
            {i === 0 && <span className="one-cikan">Öne çıkan</span>}
            <svg viewBox="0 0 40 64" aria-hidden="true"><rect x="6" y="2" width="28" height="60" rx="6" /><path d="M16 7h8" /></svg>
            <b>{k}</b><i /><i className="kisa" />
          </div>
        ))}
      </div>
      <div className="takas">
        <h4>Takas teklifi</h4>
        {["Cihaz bilgisi", "Fotoğraflar", "Teklif gönderildi"].map((a, i) => (
          <p key={a} className="adim" style={v({ "--i": i })}><span>{i + 1}</span>{a}</p>
        ))}
        <div className="hizmetler">
          {["Ekran değişimi", "Batarya", "Takas", "Aksesuar"].map((h, i) => <span key={h} style={v({ "--i": i })}>{h}</span>)}
        </div>
      </div>
    </>
  );
}

// QR görünümü temsilîdir: gerçek bir veri kodlamaz
const QR_N = 25;
const QR_KUTULAR: [number, number][] = (() => {
  const kutu: [number, number][] = [];
  let tohum = 7;
  const rastgele = () => (tohum = (tohum * 9301 + 49297) % 233280) / 233280;
  const bulucu = (x: number, y: number) => (x < 7 && y < 7) || (x >= QR_N - 7 && y < 7) || (x < 7 && y >= QR_N - 7);
  for (let y = 0; y < QR_N; y++) for (let x = 0; x < QR_N; x++) if (!bulucu(x, y) && rastgele() > 0.52) kutu.push([x, y]);
  return kutu;
})();

function Bulucu({ x, y }: { x: number; y: number }) {
  return (
    <>
      <rect x={x} y={y} width="7" height="7" className="b-dis" />
      <rect x={x + 1} y={y + 1} width="5" height="5" className="b-ara" />
      <rect x={x + 2} y={y + 2} width="3" height="3" className="b-ic" />
    </>
  );
}

function Qr() {
  return (
    <>
      <div className="qr-form">
        {["Tam adın", "Kan grubu", "Acil durum yakını", "Alerjiler"].map((a, i) => (
          <label key={a} style={v({ "--i": i })}>{a}<span><i /></span></label>
        ))}
        <button type="button" tabIndex={-1}>QR kodunu hazırla</button>
      </div>
      <div className="qr-kart">
        <svg viewBox="-2 -2 29 29" aria-hidden="true">
          <rect x="-2" y="-2" width="29" height="29" rx="2" className="b-zemin" />
          <Bulucu x={0} y={0} /><Bulucu x={QR_N - 7} y={0} /><Bulucu x={0} y={QR_N - 7} />
          {QR_KUTULAR.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" style={v({ "--y": y })} />)}
        </svg>
        <small>EMERGENCY MEDICAL ID</small>
        <span className="indir">PNG olarak indir</span>
      </div>
    </>
  );
}

const DEMOLAR: Record<DemoTuru, () => JSX.Element> = { imar: Imar, hik: Hik, dukkan: Dukkan, qr: Qr };

export function Demo({ tur }: { tur: DemoTuru }) {
  const Icerik = DEMOLAR[tur];
  return (
    <div className={`demo ${tur}`} aria-hidden="true">
      <Icerik />
      <span className="temsili mono">temsilî ekran</span>
    </div>
  );
}
