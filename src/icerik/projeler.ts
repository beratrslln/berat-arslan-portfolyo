import type { Proje } from "../tipler";

// Dört proje, ofis görselindeki dört monitöre soldan sağa yerleşir.
export const PROJELER: Proje[] = [
  {
    id: "imar-kontrol",
    ad: "İmar Uygunluk Kontrolü",
    kisa: "imar-kontrol",
    demo: "imar",
    dosya: "kurallar.py",
    dil: "Python",
    ozet: "AutoCAD (DWG/DXF) projelerini belediye e-İmar verisine göre ön kontrol eden web uygulaması.",
    one: ["Kat, emsal ve taban kontrolü", "e-İmar'dan otomatik veri", "Parsel haritası ve rapor"],
    etiket: ["React", "TypeScript", "FastAPI", "PostgreSQL", "Redis", "Docker"],
    kod: `# Emsal (KAKS) kontrolü — örnek kod
def emsal_kontrolu(plan, imar):
    izin = imar.kaks * imar.parsel_alani
    projede = sum(
        kat.brut_alan
        for kat in plan.katlar
        if kat.emsale_dahil
    )
    durum = "UYGUN" if projede <= izin else "AYKIRI"
    return KuralSonucu(
        kod="EMSAL",
        izin_verilen=round(izin, 2),
        projede=round(projede, 2),
        fark=round(projede - izin, 2),
        durum=durum,
    )

def taban_kontrolu(plan, imar):
    izin = imar.taks * imar.parsel_alani
    zemin = plan.kat("ZEMIN").oturum
    return karsilastir("TABAN", izin, zemin)`,
  },
  {
    id: "access-manager",
    ad: "Hikvision Access Manager",
    kisa: "access-manager",
    demo: "hik",
    dosya: "cihaz.controller.ts",
    dil: "TypeScript",
    ozet: "Hikvision geçiş kontrol terminallerini tek bir web uygulamasından yöneten full-stack proje.",
    one: ["Terminallerin merkezi yönetimi", "ISAPI ve Digest Auth entegrasyonu", "NestJS API, React arayüz"],
    etiket: ["NestJS", "React", "TypeScript", "PostgreSQL", "Prisma"],
    kod: `// Cihaz uç noktaları — örnek kod
@Controller("cihazlar")
export class CihazController {
  constructor(private readonly isapi: IsapiService) {}

  @Get(":id/durum")
  async durum(@Param("id") id: string) {
    return this.isapi.get(id, "/ISAPI/System/status");
  }

  @Post(":id/kapi/ac")
  async kapiAc(@Param("id") id: string) {
    await this.isapi.put(id, "/ISAPI/AccessControl/door/1", {
      cmd: "open",
    });
    return { ok: true };
  }
}`,
  },
  {
    id: "arslaniletisim",
    ad: "Arslan İletişim",
    kisa: "arslaniletisim.net",
    demo: "dukkan",
    dosya: "Product.js",
    dil: "JavaScript",
    kodNotu: "kaynak koddan",
    ozet: "Konya'da telefon teknik servisi için tamir, takas ve aksesuar sitesi: ürün kataloğu, takas teklifi ve yönetim paneliyle.",
    one: ["Ürün kataloğu ve öne çıkan ürünler", "Üye girişiyle takas teklifi", "Ürün ve teklifler için yönetim paneli"],
    etiket: ["React", "Vite", "Tailwind CSS", "GSAP", "Express", "MongoDB"],
    baglanti: { metin: "Siteyi aç", url: "https://arslaniletisim.net" },
    kod: `const productSchema = new Schema({
    title : {type : String ,required : true , trim: true},
    price : {type : Number ,required : true , min:0},
    description : {type : String ,required : true , trim:true},
    image: { type: String, default: 'https://picsum.photos/400/300' },
    images: { type: [String], default: [] },
    stock :  {type: Number ,required : false , min:0}, /* stok adedi */
    Featured : {type : Boolean ,required : false , default: false}, /*öne çıkan ürün mü*/
    category : {type: String ,required : false , enum:["telefon","kulaklik","hoparlör", "kilif", "aksesuar"] },
    phoneModel : {type : String , required : function(){return this.category === "kilif";}}

} ,{timestamps : true});

productSchema.index({ createdAt: -1 });

const Product = mongoose.model("Product", productSchema)

module.exports = Product;`,
  },
  {
    id: "qr-kod-acil",
    ad: "Acil Durum QR",
    kisa: "qr-kod-acil",
    demo: "qr",
    dosya: "App.jsx",
    dil: "React",
    kodNotu: "kaynak koddan",
    ozet: "Kan grubu, acil durum yakını, kronik rahatsızlık, ilaç ve alerji bilgilerinden acil durum QR kodu üreten ve telefon ekranı boyutunda PNG olarak indiren uygulama.",
    one: ["Kritik sağlık bilgileri formu", "Anında QR kodu önizlemesi", "1080×1920 PNG olarak indirme"],
    etiket: ["React", "Vite", "Tailwind CSS", "Canvas"],
    baglanti: { metin: "GitHub'da aç", url: "https://github.com/beratrslln/qr-kod-acil" },
    kod: `const bloodTypes = ["A Rh+", "A Rh-", "B Rh+", "B Rh-", "AB Rh+", "AB Rh-", "0 Rh+", "0 Rh-"];

const handleChange = (e) => {
  setFormData({ ...formData, [e.target.name]: e.target.value });
  if (showQR) setShowQR(false);
};

const handleDownload = () => {
  setLoading(true);
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = qrUrl;

  img.onload = () => {
    const qrSize = 640;
    const x = (1080 - qrSize) / 2;
    const y = (1920 - qrSize) / 2;
    ctx.drawImage(img, x, y, qrSize, qrSize);
  };
};`,
  },
];
