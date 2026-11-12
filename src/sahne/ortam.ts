export const hareketAzaltildi = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Telefon ve dikey tablet: masadaki tablet küçük kalır, ekranı tam ekran açılır */
export const mobilMi = () => innerWidth < 760 || innerWidth / innerHeight < 0.9;

export const dokunmatikMi = () => matchMedia("(hover: none)").matches;
