// Ön yüz ile ileride yazılacak backend arasındaki ortak veri biçimleri.
// Backend aynı alan adlarıyla JSON döndürürse ön yüzde değişiklik gerekmez.

export type DemoTuru = "imar" | "hik" | "dukkan" | "qr";

export interface Proje {
  id: string;
  ad: string;
  /** Monitörün üst çubuğunda görünen kısa ad */
  kisa: string;
  /** Monitörde oynayan temsilî demo */
  demo: DemoTuru;
  /** Kod ekranındaki dosya sekmesi */
  dosya: string;
  dil: string;
  /** Kod ekranının alt çubuğu; boşsa "örnek kod" */
  kodNotu?: string;
  ozet: string;
  one: string[];
  etiket: string[];
  baglanti?: { metin: string; url: string };
  /** Monitörde yazılan ve perdede akan kod */
  kod: string;
}

export interface Iletisim {
  eposta: string;
  /** Ülke koduyla, yalnız rakam: 905xxxxxxxxx */
  whatsapp: string;
  instagram: string;
  linkedin: string;
  github: string;
  telefon: string;
}

export interface Profil {
  ad: string;
  unvan: string;
  hakkinda: string;
}

/** Tabletteki "Proje yapalım" formunun gönderdiği talep: POST /api/mesajlar */
export interface ProjeTalebi {
  ad: string;
  eposta: string;
  tur: string[];
  zaman: string | null;
  mesaj: string;
}
