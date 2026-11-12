import { createContext, useContext, type MutableRefObject } from "react";
import type { SahneMotoru } from "./motor";

export type TabletSekmesi = "iletisim" | "proje" | "hakkinda";

export interface SahneDegerleri {
  motor: MutableRefObject<SahneMotoru | null>;
  /** Kameranın oturduğu durak: 0 ofis, 1–4 monitörler, 5 iletişim; -1 yolda */
  durak: number;
  tabletAcik: boolean;
  tabletSekme: TabletSekmesi;
  setTabletSekme: (s: TabletSekmesi) => void;
}

export const SahneBaglami = createContext<SahneDegerleri | null>(null);

export function useSahne() {
  const d = useContext(SahneBaglami);
  if (!d) throw new Error("useSahne yalnız SahneBaglami içinde kullanılabilir");
  return d;
}
