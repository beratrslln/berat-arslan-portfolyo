import { useEffect, useState } from "react";
import { ILETISIM, PROFIL } from "../icerik/profil";
import { PROJELER } from "../icerik/projeler";
import type { Iletisim, Profil, Proje } from "../tipler";
import { apiAktif, iletisimiGetir, profiliGetir, projeleriGetir } from "./istemci";

/** Sitenin içeriği. İlk çizimde yerel veri vardır; API açıksa geldiğinde yerine geçer. */
export function useIcerik() {
  const [projeler, setProjeler] = useState<Proje[]>(PROJELER);
  const [profil, setProfil] = useState<Profil>(PROFIL);
  const [iletisim, setIletisim] = useState<Iletisim>(ILETISIM);

  useEffect(() => {
    if (!apiAktif) return;
    let iptal = false;
    Promise.all([projeleriGetir(), profiliGetir(), iletisimiGetir()]).then(([p, pr, il]) => {
      if (iptal) return;
      // Ofiste dört monitör var: eksik gelirse yerel projelerle tamamlanır
      setProjeler([...p, ...PROJELER].slice(0, 4));
      setProfil(pr);
      setIletisim(il);
    });
    return () => {
      iptal = true;
    };
  }, []);

  return { projeler: projeler.slice(0, 4), profil, iletisim };
}
