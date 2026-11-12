import { ILETISIM, PROFIL } from "../icerik/profil";
import { PROJELER } from "../icerik/projeler";
import type { Iletisim, Profil, Proje, ProjeTalebi } from "../tipler";

/*
 * Veri katmanı. Bugün site src/icerik içindeki yerel veriyle çalışır.
 * Backend yazıldığında .env dosyasında VITE_API_AKTIF=true yapmanız yeterli; beklenen uç noktalar:
 *   GET  /api/projeler   → Proje[]
 *   GET  /api/profil     → Profil
 *   GET  /api/iletisim   → Iletisim
 *   POST /api/mesajlar   ← ProjeTalebi   → 2xx
 * API'ye ulaşılamazsa içerik yerel veriye düşer; site boş kalmaz.
 */
const AKTIF = import.meta.env.VITE_API_AKTIF === "true";
const TABAN = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export const apiAktif = AKTIF;

async function getir<T>(yol: string): Promise<T> {
  const yanit = await fetch(`${TABAN}${yol}`, { headers: { Accept: "application/json" } });
  if (!yanit.ok) throw new Error(`${yol}: ${yanit.status}`);
  return (await yanit.json()) as T;
}

async function yedekli<T>(yol: string, yerel: T): Promise<T> {
  if (!AKTIF) return yerel;
  try {
    return await getir<T>(yol);
  } catch (hata) {
    console.warn("API'ye ulaşılamadı, yerel veri kullanılıyor:", hata);
    return yerel;
  }
}

export const projeleriGetir = () => yedekli<Proje[]>("/api/projeler", PROJELER);
export const profiliGetir = () => yedekli<Profil>("/api/profil", PROFIL);
export const iletisimiGetir = () => yedekli<Iletisim>("/api/iletisim", ILETISIM);

export type GonderimSonucu = "api" | "form" | "eposta" | "eksik";

/** Netlify Forms: public/__forms.html içindeki iskelet formun adı */
const FORM_ADI = "proje-talebi";

/** Netlify'ın form uç noktasına URL-encoded gövde gönderir. Netlify JSON kabul etmez. */
async function netlifyIleGonder(talep: ProjeTalebi): Promise<boolean> {
  const govde = new URLSearchParams({
    "form-name": FORM_ADI,
    "bot-field": "",
    ad: talep.ad,
    eposta: talep.eposta,
    mesaj: talep.mesaj,
    tur: talep.tur.length ? talep.tur.join(", ") : "belirtilmedi",
    zaman: talep.zaman ?? "belirtilmedi",
  });
  const yanit = await fetch("/__forms.html", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: govde.toString(),
  });
  return yanit.ok;
}

/** Proje talebini gönderir: API varsa ona, yoksa Netlify Forms'a, o da olmazsa e-posta uygulamasına. */
export async function talepGonder(talep: ProjeTalebi, iletisim: Iletisim): Promise<GonderimSonucu> {
  if (AKTIF) {
    const yanit = await fetch(`${TABAN}/api/mesajlar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(talep),
    });
    if (!yanit.ok) throw new Error(`Mesaj gönderilemedi (${yanit.status})`);
    return "api";
  }
  try {
    if (await netlifyIleGonder(talep)) return "form";
  } catch (hata) {
    console.warn("Form gönderilemedi, e-posta yoluna geçiliyor:", hata);
  }
  if (!iletisim.eposta) return "eksik";
  const govde = `${talep.mesaj}\n\nProje türü: ${talep.tur.join(", ") || "belirtilmedi"}\nZaman: ${talep.zaman || "belirtilmedi"}\n\n${talep.ad} · ${talep.eposta}`;
  window.location.href = `mailto:${iletisim.eposta}?subject=${encodeURIComponent("Proje talebi — " + talep.ad)}&body=${encodeURIComponent(govde)}`;
  return "eposta";
}
