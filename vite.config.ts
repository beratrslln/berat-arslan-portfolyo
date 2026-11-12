import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

/** Yayın paketine güvenlik kuralı (Content-Security-Policy) ekler.
 *  - Satır içi betiğe izin yok: sayfaya dışarıdan kod sokulamaz. Netlify'ın ücretsiz planda
 *    eklediği "Powered by Netlify" rozeti de satır içi kodla çizildiği için görünmez
 *    (Netlify belgesi bunu rozetin görünmeme nedenlerinden biri olarak sayar).
 *  - Yalnız yayında: geliştirme sunucusu (Vite + React) satır içi betik kullanır, orada kural olmaz.
 *  - Yazı tipleri Google Fonts'tan gelir; backend başka bir adresteyse VITE_API_URL izinlere eklenir. */
function guvenlikKurali(apiUrl: string): Plugin {
  let api = "";
  try { if (apiUrl) api = " " + new URL(apiUrl).origin; } catch { /* geçersiz adres: yok say */ }
  const kural = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    `connect-src 'self'${api}`,
    "base-uri 'self'",
    "form-action 'self' mailto:",
    "object-src 'none'",
  ].join("; ");
  return {
    name: "guvenlik-kurali",
    apply: "build",
    transformIndexHtml: (html) =>
      html.replace("<head>", `<head>\n    <meta http-equiv="Content-Security-Policy" content="${kural}" />`),
  };
}

// Backend geldiğinde geliştirme sırasında /api istekleri ona yönlendirilir:
// .env dosyasına VITE_API_PROXY=http://localhost:3000 yazmanız yeterli.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxy = env.VITE_API_PROXY;
  return {
    plugins: [react(), guvenlikKurali(env.VITE_API_URL || "")],
    server: proxy ? { proxy: { "/api": proxy } } : undefined,
  };
});
