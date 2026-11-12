import gsap from "gsap";
import Lenis from "lenis";
import { DORTGEN, TABLET_Q, sinirlar, type Dortgen } from "./geometri";
import { hareketAzaltildi, mobilMi } from "./ortam";

/*
 * Sahne motoru: kaydırma, kamera, geçişler ve son sahnedeki odak.
 * Her karede çalışan bu kısım bilerek React dışında tutulur: kare başına React yeniden çizimi
 * akıcılığı bozar. React yalnız seyrek değişen durumu (hangi durakta olunduğu, tabletin açık olması) dinler.
 */

type Poz = { cx: number; cy: number; S: number };
type Ucus = { bas: Poz; hedef: number; basF: number; t: number; dalis: number };

export interface MotorOgeleri {
  scene: HTMLElement;
  sahne2: HTMLElement;
  sahne2Ic: HTMLElement;
  hiz: HTMLElement;
  odaHiz: HTMLElement;
  sahne2Hiz: HTMLElement;
  /** Monitör ekranları, soldan sağa */
  ekranlar: HTMLElement[];
}

export interface MotorOlaylari {
  /** Kamera bir durağa oturunca ya da duraktan ayrılınca (-1) */
  durakDegisti: (durak: number) => void;
  /** Son sahnede kamera tablete yaklaşıp ekran uyandığında */
  tabletDegisti: (acik: boolean) => void;
  /** Ofis sahnesi taşındığında: .scene dönüşümü translate(tx, ty) scale(S); 3D monitörler buna uyar */
  kameraDegisti?: (tx: number, ty: number, S: number, gorunur: boolean) => void;
}

const yumusak = (u: number) => u * u * (3 - 2 * u);
const gecisEgri = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const r2 = (v: number) => Math.round(v * 100) / 100;
const kapla = () => Math.max(innerWidth / 1672, innerHeight / 941);

function cerceve(q: Dortgen, dw: number, dh: number, kayY = 0): Poz {
  const [x0, y0, x1, y1] = sinirlar(q);
  const S = Math.min((dw * innerWidth) / (x1 - x0), (dh * innerHeight) / (y1 - y0));
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 + kayY / S, S };
}

function pozAra(A: Poz, B: Poz, u: number, dalis: number): Poz {
  const e = yumusak(u);
  const logS = Math.log(A.S) + (Math.log(B.S) - Math.log(A.S)) * e - dalis * Math.sin(Math.PI * e);
  return { cx: A.cx + (B.cx - A.cx) * e, cy: A.cy + (B.cy - A.cy) * e, S: Math.exp(logS) };
}

export class SahneMotoru {
  /** Kamera hareket ederken true: monitörlerdeki kod yazımı bu sırada bekler */
  hareketVar = false;
  /** Ofisin geniş görüntüsündeyken true: kod ekranları yalnız o zaman görünür, yazım yalnız o zaman sürer */
  genisGorunum = true;
  readonly durakSayisi: number;

  private readonly o: MotorOgeleri;
  private readonly olay: MotorOlaylari;
  private readonly azalt = hareketAzaltildi();
  private readonly lenis: Lenis | null;
  private readonly SON: number;
  private readonly duraklar: (() => Poz)[];
  private kam: Poz;
  private ucus: Ucus | null = null;
  private uzerinde = -1;
  private otomatik = false;
  private bekle = 0;
  private sonDurak = 0;
  private yak = { v: 0 };
  private yakTw: gsap.core.Tween | null = null;
  private tabletAcik = false;
  private etkin = -2;
  private durumAnahtari = "";
  private sonHareket = 0;
  private kareNo = 0;
  private lenisTik: ((t: number) => void) | null = null;
  private kapanislar: (() => void)[] = [];
  /** Ekranların gösterdiği durak: kamera bir durağa oturunca değişir, uçarken eski hali korur */
  private ekranDurak = 0;
  private canliZaman: number[] = [];

  constructor(ogeler: MotorOgeleri, olaylar: MotorOlaylari) {
    this.o = ogeler;
    this.olay = olaylar;
    const monitorDortgenleri = [DORTGEN.m1, DORTGEN.m2, DORTGEN.m3, DORTGEN.m4];
    this.duraklar = [
      () => this.genisPoz(),
      ...monitorDortgenleri.map((q) => () => cerceve(q, 0.78, innerWidth < 760 ? 0.6 : 0.74, 40)),
      // Son durak ofisten çıkış: kamera geniş plana açılıp sağa döner; yandaki oda bu sırada gelir.
      // Telefonda kamera yerinde kalır (4. monitör kadrajı): geçiş yalnız iki odanın yana kaymasıdır.
      () => (mobilMi() ? cerceve(DORTGEN.m4, 0.78, innerWidth < 760 ? 0.6 : 0.74, 40) : { cx: 1672 - innerWidth / 2 / (kapla() * 1.1), cy: 470, S: kapla() * 1.1 }),
    ];
    this.SON = this.duraklar.length - 1;
    this.durakSayisi = this.duraklar.length;
    this.kam = this.genisPoz();

    history.scrollRestoration = "manual";
    scrollTo(0, 0);

    this.lenis = this.azalt ? null : new Lenis({ lerp: 0.075, wheelMultiplier: 0.75 });
    const izle = () => { clearTimeout(this.bekle); this.bekle = window.setTimeout(() => this.otur(), 140); };
    if (this.lenis) {
      this.lenis.on("scroll", izle);
      this.lenisTik = (t: number) => this.lenis!.raf(t * 1000);
      gsap.ticker.add(this.lenisTik);
      gsap.ticker.lagSmoothing(0);
    } else {
      addEventListener("scroll", izle, { passive: true });
      this.kapanislar.push(() => removeEventListener("scroll", izle));
    }

    const tus = (e: KeyboardEvent) => {
      const hedef = e.target as HTMLElement | null;
      if (hedef?.closest?.("input, textarea, .tablet")) return;
      const k = Math.round(this.kaydirma() / innerHeight);
      if (e.key === "ArrowDown" || e.key === "PageDown") { e.preventDefault(); this.git(k + 1); }
      if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); this.git(k - 1); }
    };
    addEventListener("keydown", tus);
    this.kapanislar.push(() => removeEventListener("keydown", tus));

    const dongu = (t: number) => { this.kare(t); this.kareNo = requestAnimationFrame(dongu); };
    this.kareNo = requestAnimationFrame(dongu);
  }

  destroy() {
    cancelAnimationFrame(this.kareNo);
    clearTimeout(this.bekle);
    if (this.lenisTik) gsap.ticker.remove(this.lenisTik);
    this.lenis?.destroy();
    this.yakTw?.kill();
    this.canliZaman.forEach((z) => clearTimeout(z));
    this.kapanislar.forEach((k) => k());
  }

  // ---------- Dışarıdan kullanılanlar ----------

  /** k. durağa git. ucarak: aradaki monitörlerden geçmeden doğrudan uç */
  git(k: number, { ucarak = false } = {}) {
    k = Math.max(0, Math.min(this.SON, k));
    this.sonDurak = k;
    if (ucarak && !this.azalt) {
      const aktifF = this.kaydirma() / innerHeight;
      const ucus: Ucus = {
        bas: { ...this.kam }, hedef: k, basF: aktifF, t: 0,
        dalis: Math.abs(aktifF - k) > 0.5 && Math.round(aktifF) >= 1 && k >= 1 && k <= 4 ? 0.5 : 0.1,
      };
      this.ucus = ucus;
      this.otomatik = true;
      gsap.to(ucus, { t: 1, duration: 1.6, ease: "none", onComplete: () => { if (this.ucus === ucus) this.ucus = null; this.otomatik = false; } });
      if (this.lenis) this.lenis.scrollTo(this.durakY(k), { immediate: true, force: true });
      else scrollTo(0, this.durakY(k));
      return;
    }
    this.otomatik = true;
    const bitti = () => { this.otomatik = false; };
    if (this.lenis) this.lenis.scrollTo(this.durakY(k), { duration: 1.5, onComplete: bitti });
    else { scrollTo({ top: this.durakY(k), behavior: this.azalt ? "auto" : "smooth" }); setTimeout(bitti, 900); }
  }

  /** Bir sonraki durağa kaydırarak geç ("Diğer projeye geç") */
  ilerle() { this.git(Math.round(this.kaydirma() / innerHeight) + 1); }

  /** i. monitörün üzerine gelindi (-1: hiçbiri) */
  uzerineGel(i: number) { this.uzerinde = i; }
  ayril(i: number) { if (this.uzerinde === i) this.uzerinde = -1; }

  /** Monitöre tıklandı: zaten oradaysa bir şey yapma */
  monitoreGit(i: number) {
    if (Math.round(this.kaydirma() / innerHeight) !== i + 1) this.git(i + 1, { ucarak: true });
  }

  get iletisimDuragi() { return this.SON; }

  // ---------- İç işleyiş ----------

  private kaydirma() { return this.lenis ? this.lenis.scroll : scrollY; }
  private durakY(k: number) { return k * innerHeight; }

  // Dikey ekranda açılış: solda bir monitör, sağda perde; tavan, masa ve sandalyelerle ofis olduğu belli olur.
  // Görüntünün sol kenarı 4. monitörün hemen solunda (x≈965) başlar, perde sağdan kırpılır.
  private genisPoz(): Poz {
    if (innerWidth / innerHeight >= 1) {
      // Geniş ve basık ekranlarda (ör. 21:9 ya da kısa tarayıcı penceresi) fotoğraf ekrana yayılınca üstten kırpılır;
      // perdenin tepesi (y≈108) ve üstündeki "Berat Arslan" yazısı ekranda kalsın diye kamera gerektiği kadar yukarı bakar.
      const S = kapla(), yarim = innerHeight / 2 / S;
      const PERDE_UST = Math.min(...DORTGEN.perde.map(([, y]) => y)) - 24;
      return { cx: 836, cy: Math.max(yarim, Math.min(470, PERDE_UST + yarim)), S };
    }
    const S = kapla();
    return { cx: Math.min(1672 - innerWidth / 2 / S, 965 + innerWidth / 2 / S), cy: 470, S };
  }

  // Monitörden monitöre geçerken kamera biraz geri çekilip yeniden yaklaşır
  // Telefonda son sahneye giderken geri çekilme yok: kamera yerinde kalır, yalnız odalar kayar
  private dalisPayi(a: number, b: number) {
    if (a === b) return 0;
    if (b === this.SON && mobilMi()) return 0;
    return a >= 1 && b <= 4 ? 0.55 : 0.12;
  }

  private kaydirmaPozu(f: number): Poz {
    const a = Math.max(0, Math.min(this.SON, Math.floor(f))), b = Math.min(this.SON, a + 1);
    return pozAra(this.duraklar[a](), this.duraklar[b](), Math.max(0, Math.min(1, f - a)), this.dalisPayi(a, b));
  }

  // Bırakınca kaydırma yönündeki durağa oturur: küçük bir tekerlek hareketi bile bir sonraki monitöre geçirir
  private otur() {
    if (this.otomatik || this.ucus) return;
    const f = this.kaydirma() / innerHeight;
    let k = this.sonDurak;
    if (f > this.sonDurak + 0.04) k = Math.max(this.sonDurak + 1, Math.round(f));
    else if (f < this.sonDurak - 0.04) k = Math.min(this.sonDurak - 1, Math.round(f));
    if (Math.abs(f - k) < 0.004) { this.sonDurak = k; return; }
    this.git(k);
  }

  // Ofisten yandaki odaya geçiş oranı (0: ofis, 1: son sahne). Soldurma yok: iki oda yan yana kayar.
  private gecisOrani(f: number) {
    const s = (x: number) => Math.max(0, Math.min(1, x));
    const u = this.ucus, SON = this.SON;
    // Telefonda kamera beklemez: kayma uçuşun başında başlar ve tek, düzgün bir hareketle biter
    if (u && u.hedef === SON && u.basF < SON - 0.5) return mobilMi() ? gecisEgri(s(u.t / 0.85)) : gecisEgri(s((u.t - 0.3) / 0.6));
    if (u && u.basF > SON - 0.5 && u.hedef !== SON) return 1 - gecisEgri(s(u.t / 0.55));
    if (u) return u.hedef === SON ? 1 : 0;
    return gecisEgri(s((f - (SON - 0.55)) / 0.5));
  }

  // Son sahne: önce odanın geniş görüntüsü, sonra kamera masadaki tablete yaklaşır; kişi sağda bulanık kalır
  private patronPozu(): Poz {
    const k = kapla();
    const bas = { cx: 836, cy: 470, S: k * 1.06 };
    const [x0, y0, x1, y1] = sinirlar(TABLET_Q);
    let son: Poz;
    if (mobilMi()) son = { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, S: k * 1.15 };
    else {
      const S2 = Math.max(k, Math.min((0.5 * innerWidth) / (x1 - x0), (0.78 * innerHeight) / (y1 - y0)));
      son = { cx: x0 - 30 + innerWidth / 2 / S2, cy: (y0 + y1) / 2 - 40, S: S2 };
    }
    // Telefonda son oda doğrudan tabletin kadrajıyla gelir; kayma bittikten sonra ikinci bir kamera hareketi olmaz
    const e = mobilMi() ? 1 : yumusak(this.yak.v);
    const S = Math.max(k, Math.exp(Math.log(bas.S) + (Math.log(son.S) - Math.log(bas.S)) * e));
    const yW = innerWidth / 2 / S, yH = innerHeight / 2 / S;
    const sinirla = (v: number, yarim: number, boy: number) => Math.max(yarim, Math.min(boy - yarim, v));
    return { cx: sinirla(bas.cx + (son.cx - bas.cx) * e, yW, 1672), cy: sinirla(bas.cy + (son.cy - bas.cy) * e, yH, 941), S };
  }

  private tabletAc() {
    if (this.tabletAcik) return;
    this.tabletAcik = true;
    this.yakTw?.kill();
    this.o.sahne2.classList.add("odak");
    const bitti = () => this.olay.tabletDegisti(true);
    if (this.azalt) { this.yak.v = 1; bitti(); return; }
    // Telefonda kamera zaten tabletin kadrajında: ekran kısa bir gecikmeyle açılır
    this.yakTw = gsap.to(this.yak, { v: 1, duration: mobilMi() ? 0.35 : 1.9, ease: "power2.inOut", onComplete: bitti });
  }

  private tabletKapat() {
    if (!this.tabletAcik) return;
    this.tabletAcik = false;
    this.olay.tabletDegisti(false);
    this.o.sahne2.classList.remove("odak");
    this.yakTw?.kill();
    if (this.azalt) { this.yak.v = 0; return; }
    this.yakTw = gsap.to(this.yak, { v: 0, duration: 0.7, ease: "power2.in" });
  }

  /** Yalnız değişen değer yazılır: aynı değeri yeniden yazmak bile stil hesabı başlatır */
  private yaz(el: HTMLElement, ozellik: "transform" | "visibility" | "pointerEvents" | "opacity", deger: string) {
    const anahtar = "_" + ozellik;
    const kayit = el as unknown as Record<string, string>;
    if (kayit[anahtar] === deger) return false;
    kayit[anahtar] = deger;
    el.style[ozellik] = deger;
    return true;
  }

  private kare(t: number) {
    const { scene, sahne2, sahne2Ic, hiz, odaHiz, sahne2Hiz, ekranlar } = this.o;
    const SON = this.SON;
    const f = Math.max(0, Math.min(SON, this.kaydirma() / innerHeight));
    const u = this.ucus;
    // Telefonda son sahneye uçarken ofis kamerası yerinde kalır; yalnız odalar yana kayar
    this.kam = u ? (u.hedef === SON && mobilMi() ? u.bas : pozAra(u.bas, this.duraklar[u.hedef](), u.t, u.dalis)) : this.kaydirmaPozu(f);
    const kam = this.kam;
    const g = this.gecisOrani(f);
    const D = innerWidth * 1.18; // iki oda arasındaki yol: ekran genişliği + duvar

    // Ofis: kamera pozu ve yandaki odaya doğru kayma
    let degisti = false;
    if (g < 1) {
      const tx = r2(innerWidth / 2 - kam.cx * kam.S - g * D), ty = r2(innerHeight / 2 - kam.cy * kam.S);
      const yazildi = this.yaz(scene, "transform", `translate3d(${tx}px, ${ty}px, 0) scale(${kam.S.toFixed(4)})`);
      degisti = yazildi || degisti;
      if (yazildi) this.olay.kameraDegisti?.(tx, ty, Number(kam.S.toFixed(4)), true);
    } else this.olay.kameraDegisti?.(0, 0, 1, false);
    this.yaz(scene, "visibility", g >= 1 ? "hidden" : "visible");
    // Son sahne: sağdan gelir, kamera masaya ve tablete yaklaşır
    this.yaz(sahne2, "visibility", g <= 0 ? "hidden" : "visible");
    this.yaz(sahne2, "pointerEvents", g > 0.98 ? "auto" : "none");
    if (g > 0) {
      degisti = this.yaz(sahne2, "transform", `translate3d(${r2((1 - g) * D)}px, 0, 0)`) || degisti;
      const p2 = this.patronPozu();
      degisti = this.yaz(sahne2Ic, "transform", `translate3d(${r2(innerWidth / 2 - p2.cx * p2.S)}px, ${r2(innerHeight / 2 - p2.cy * p2.S)}px, 0) scale(${p2.S.toFixed(4)})`) || degisti;
    }
    // Geçişte hareket izi: iki odanın yatay bulanık kopyaları
    const iz = g > 0 && g < 1 ? r2(Math.sin(Math.PI * g) * 0.95) : 0;
    this.yaz(odaHiz, "opacity", String(iz));
    this.yaz(sahne2Hiz, "opacity", String(iz));
    if (g > 0.97 && (!u || u.t > 0.92)) this.tabletAc();
    else if (g < 0.9) this.tabletKapat();

    // Hareket sürerken katmanlar GPU'da taşınır; durunca keskin çizim için bırakılır
    if (degisti) this.sonHareket = t;
    const hareketli = t - this.sonHareket < 220;
    if (hareketli !== this.hareketVar) {
      this.hareketVar = hareketli;
      scene.classList.toggle("hareket", hareketli);
      sahne2.classList.toggle("hareket", hareketli);
      sahne2Ic.classList.toggle("hareket", hareketli);
    }

    const durak = u ? u.hedef : Math.abs(f - Math.round(f)) < 0.2 ? Math.round(f) : -1;
    const genis = !u && f < 0.15;
    this.genisGorunum = genis;
    const ara = Math.abs(f - Math.round(f));
    this.yaz(hiz, "opacity", String(r2(u && u.hedef !== SON ? Math.sin(Math.PI * u.t) * 0.8 : f > 0.5 && f < SON - 0.6 ? Math.sin((Math.min(1, ara * 2) * Math.PI) / 2) * 0.8 : 0)));

    // Monitörler arasında gezerken arka plan odağı (bulanıklık) açık kalır: her geçişte sönüp yanmaz
    const monitorBolgesi = u ? u.hedef >= 1 && u.hedef <= 4 : f > 0.8 && f < 4.2;

    // Ekran içeriği kamera durağa oturunca değişir (uçarken ya da kayarken değil):
    // hareket ve ekran geçişi aynı karelere binmez, takılma olmaz
    if (!u && ara < 0.02) this.ekranDurak = Math.round(f);
    const ekranDurak = this.ekranDurak;

    // Monitör sınıfları yalnız durum değişince güncellenir
    const anahtar = `${ekranDurak}|${genis}|${this.uzerinde}|${monitorBolgesi}`;
    if (anahtar !== this.durumAnahtari) {
      this.durumAnahtari = anahtar;
      ekranlar.forEach((el, i) => {
        const aktif = ekranDurak === i + 1;
        const eskiAktif = el.classList.contains("aktif");
        // Başka monitöre geçilince ayrılan ekran animasyonsuz koda döner (o sırada kadrajın dışında);
        // ofise geri dönülünce yumuşakça döner
        if (eskiAktif && !aktif && ekranDurak >= 1 && ekranDurak <= 4) {
          el.classList.add("ani");
          requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove("ani")));
        }
        el.classList.toggle("aktif", aktif);
        el.classList.toggle("proje", aktif || (genis && this.uzerinde === i));
        el.classList.toggle("parla", genis && this.uzerinde === i);
        // Demo ve içerik girişleri ekran açıldıktan kısa süre sonra başlar: aynı ana tek iş düşsün
        clearTimeout(this.canliZaman[i]);
        if (aktif && !el.classList.contains("canli")) this.canliZaman[i] = window.setTimeout(() => el.classList.add("canli"), 160);
        else if (!aktif) el.classList.remove("canli");
      });
      scene.classList.toggle("odak", monitorBolgesi);
    }
    if (durak !== this.etkin) {
      this.etkin = durak;
      this.olay.durakDegisti(durak);
    }
  }
}
