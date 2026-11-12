// Basit sözdizimi renklendirme: monitörlerdeki ve perdedeki kod için.
// Çıktı HTML'dir ama bütün metin kaçışlanır; içerikten gelen kod güvenle basılabilir.
const kac = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const ANAHTAR = /^(def|return|for|in|if|else|import|from|class|public|private|readonly|export|async|await|const|let|new|var|void|this|self|True|False|None|null|true|false|float|int|string)$/;
const JETON = /(#.*|\/\/.*)|("(?:\\.|[^"\\])*"?|'(?:\\.|[^'\\])*'?)|(@[A-Za-z_]+)|(\b\d+(?:\.\d+)?f?\b)|([A-Za-z_][\w]*)/g;

export function renkle(x: string): string {
  let out = "", son = 0;
  let m: RegExpExecArray | null;
  JETON.lastIndex = 0;
  while ((m = JETON.exec(x))) {
    if (!m[0]) { JETON.lastIndex++; continue; }
    const [tam, yorum, metin, dekor, sayi, kelime] = m;
    const sonra = x.slice(m.index + tam.length);
    const sinif = yorum ? "y" : metin ? "m" : dekor ? "d" : sayi ? "s" : ANAHTAR.test(kelime) ? "k" : /^\s*\(/.test(sonra) ? "f" : "";
    out += kac(x.slice(son, m.index)) + (sinif ? `<span class="${sinif}">${kac(tam)}</span>` : kac(tam));
    son = m.index + tam.length;
  }
  return out + kac(x.slice(son));
}
