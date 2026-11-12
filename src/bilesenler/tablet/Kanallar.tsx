import type { MouseEvent } from "react";
import type { Iletisim } from "../../tipler";

const IKON: Record<string, JSX.Element> = {
  eposta: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 6l8.5 7 8.5-7" /></>,
  whatsapp: <><path d="M4 20l1.4-4A8 8 0 1 1 8.3 18.7z" /><path d="M9.5 9.5c.3 2 2 3.7 4 4l1-1.2 1.8.8c-.3 1.1-1.2 1.7-2.3 1.5-2.8-.6-4.9-2.7-5.4-5.4-.2-1.1.4-2 1.5-2.3l.8 1.8z" /></>,
  instagram: <><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17 7h.01" /></>,
  linkedin: <><rect x="3.5" y="3.5" width="17" height="17" rx="3" /><path d="M8 10.5V16M8 7.8v.01M11.5 16v-3.2a2 2 0 0 1 4 0V16M11.5 10.5V16" /></>,
  github: <path d="M9 8l-4 4 4 4M15 8l4 4-4 4" />,
  telefon: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
};

interface Kanal { k: string; ad: string; deger: string; url: string; kopya?: boolean }

function kanallar(i: Iletisim): Kanal[] {
  const tel = i.telefon.replace(/\D/g, "").replace(/^0/, "");
  return [
    { k: "eposta", ad: "E-posta", deger: i.eposta, url: i.eposta && `mailto:${i.eposta}`, kopya: true },
    { k: "whatsapp", ad: "WhatsApp", deger: i.whatsapp && i.telefon, url: i.whatsapp && `https://wa.me/${i.whatsapp.replace(/\D/g, "")}` },
    { k: "instagram", ad: "Instagram", deger: i.instagram && "@" + i.instagram, url: i.instagram && `https://instagram.com/${i.instagram}` },
    { k: "linkedin", ad: "LinkedIn", deger: i.linkedin && (i.linkedin.match(/in\/([^/-]+-[^/-]+)/)?.[1] ?? "profil"), url: i.linkedin },
    { k: "github", ad: "GitHub", deger: i.github, url: i.github && `https://github.com/${i.github}` },
    { k: "telefon", ad: "Telefon", deger: i.telefon, url: i.telefon && `tel:+90${tel}` },
  ];
}

// Tıklanan noktadan yayılan halka
function halka(e: MouseEvent<HTMLElement>) {
  const k = e.currentTarget, r = k.getBoundingClientRect(), d = document.createElement("span");
  d.className = "dalgacik";
  d.style.width = d.style.height = r.width / 2 + "px";
  d.style.left = e.clientX - r.left - r.width / 4 + "px";
  d.style.top = e.clientY - r.top - r.width / 4 + "px";
  k.appendChild(d);
  setTimeout(() => d.remove(), 700);
}

export function Kanallar({ iletisim, bildir }: { iletisim: Iletisim; bildir: (m: string) => void }) {
  return (
    <div className="t-kanallar">
      {kanallar(iletisim).map((c) => {
        const ic = (
          <>
            <span className="ikon"><svg viewBox="0 0 24 24" aria-hidden="true">{IKON[c.k]}</svg></span>
            <span><b>{c.ad}</b><small>{c.deger || "eklenecek"}</small></span>
            <span className="ok" aria-hidden="true">→</span>
          </>
        );
        return c.url ? (
          <a
            key={c.k}
            className="kanal"
            href={c.url}
            target="_blank"
            rel="noopener"
            data-kanal={c.k}
            onClick={(e) => {
              halka(e);
              if (c.kopya && navigator.clipboard) navigator.clipboard.writeText(c.deger).then(() => bildir("E-posta adresi kopyalandı."), () => {});
            }}
          >
            {ic}
          </a>
        ) : (
          <button key={c.k} type="button" className="kanal" data-kanal={c.k} onClick={(e) => { halka(e); bildir(`${c.ad} bilgisi henüz eklenmedi.`); }}>
            {ic}
          </button>
        );
      })}
    </div>
  );
}
