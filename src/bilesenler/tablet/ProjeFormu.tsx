import { useRef, useState, type FormEvent } from "react";
import { talepGonder } from "../../api/istemci";
import { SECIMLER } from "../../icerik/profil";
import type { Iletisim } from "../../tipler";

type Alan = "ad" | "eposta" | "mesaj";
type Hatalar = Partial<Record<Alan, string>>;

function Secimler({ ad, etiket, secenekler, secili, coklu, degistir }: {
  ad: string; etiket: string; secenekler: string[]; secili: string[]; coklu?: boolean; degistir: (s: string[]) => void;
}) {
  return (
    <div className="t-grup">
      <span id={`${ad}-etiket`}>{etiket}</span>
      <div className="cipler" role="group" aria-labelledby={`${ad}-etiket`}>
        {secenekler.map((x) => {
          const acik = secili.includes(x);
          return (
            <button
              key={x}
              type="button"
              className="secim"
              aria-pressed={acik}
              onClick={() => degistir(acik ? secili.filter((y) => y !== x) : coklu ? [...secili, x] : [x])}
            >
              {x}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProjeFormu({ iletisim }: { iletisim: Iletisim }) {
  const [deger, setDeger] = useState({ ad: "", eposta: "", mesaj: "" });
  const [tur, setTur] = useState<string[]>([]);
  const [zaman, setZaman] = useState<string[]>([]);
  const [hatalar, setHatalar] = useState<Hatalar>({});
  const [durum, setDurum] = useState("");
  const [tamam, setTamam] = useState(false);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const refler = { ad: useRef<HTMLInputElement>(null), eposta: useRef<HTMLInputElement>(null), mesaj: useRef<HTMLTextAreaElement>(null) };

  async function gonder(e: FormEvent) {
    e.preventDefault();
    const yeni: Hatalar = {
      ad: deger.ad.trim() ? "" : "Adınızı yazın.",
      eposta: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(deger.eposta.trim()) ? "" : "Geçerli bir e-posta yazın.",
      mesaj: deger.mesaj.trim().length >= 10 ? "" : "Fikrinizi birkaç cümleyle anlatın.",
    };
    setHatalar(yeni);
    const ilk = (["ad", "eposta", "mesaj"] as Alan[]).find((a) => yeni[a]);
    if (ilk) { refler[ilk].current?.focus(); setDurum(""); return; }
    setGonderiliyor(true);
    try {
      const sonuc = await talepGonder({ ad: deger.ad.trim(), eposta: deger.eposta.trim(), mesaj: deger.mesaj.trim(), tur, zaman: zaman[0] ?? null }, iletisim);
      if (sonuc === "eksik") {
        setDurum("Deneme sürümü: alıcı e-posta adresi henüz eklenmedi. src/icerik/profil.ts dosyasına adresinizi yazın.");
      } else if (sonuc === "eposta") {
        setDurum(`E-posta uygulamanız mesaj taslağıyla açıldı. Açılmadıysa doğrudan ${iletisim.eposta} adresine yazabilirsiniz.`);
      } else {
        setTamam(true);
        setDurum("Mesajınız iletildi; en kısa sürede dönüş yapacağım.");
      }
    } catch {
      setDurum("Mesaj gönderilemedi. Bağlantınızı kontrol edip yeniden deneyin ya da e-postayla yazın.");
    } finally {
      setGonderiliyor(false);
    }
  }

  const alan = (a: Alan) => ({
    id: `t-${a}`,
    name: a,
    value: deger[a],
    onChange: (e: { target: { value: string } }) => setDeger((d) => ({ ...d, [a]: e.target.value })),
    "aria-invalid": hatalar[a] ? true : false,
    "aria-describedby": `t-${a}-hata`,
  });

  return (
    <form className="t-form" name="proje-talebi" method="POST" noValidate onSubmit={gonder}>
      <input type="hidden" name="form-name" value="proje-talebi" />
      <p hidden><label>Doldurmayın: <input name="bot-field" tabIndex={-1} autoComplete="off" /></label></p>
      <div className="iki">
        <div className="t-alan"><label htmlFor="t-ad">Adınız</label><input {...alan("ad")} ref={refler.ad} autoComplete="name" /><p className="hata" id="t-ad-hata">{hatalar.ad}</p></div>
        <div className="t-alan"><label htmlFor="t-eposta">E-posta</label><input {...alan("eposta")} ref={refler.eposta} type="email" autoComplete="email" /><p className="hata" id="t-eposta-hata">{hatalar.eposta}</p></div>
      </div>
      <Secimler ad="tur" etiket="Proje türü" secenekler={SECIMLER.tur} secili={tur} coklu degistir={setTur} />
      <Secimler ad="zaman" etiket="Zaman" secenekler={SECIMLER.zaman} secili={zaman} degistir={setZaman} />
      <div className="t-alan"><label htmlFor="t-mesaj">Fikrinizi anlatın</label><textarea {...alan("mesaj")} ref={refler.mesaj} rows={3} /><p className="hata" id="t-mesaj-hata">{hatalar.mesaj}</p></div>
      <button type="submit" className={`gonder${tamam ? " tamam" : ""}`} disabled={gonderiliyor}>
        {tamam ? "Hazır ✓" : <>Gönder <span aria-hidden="true">→</span></>}
      </button>
      <p className="t-durum" role="status">{durum}</p>
    </form>
  );
}
