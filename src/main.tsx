import { createRoot } from "react-dom/client";
import App from "./App";
import "./stiller/site.css";

// StrictMode bilerek kullanılmıyor: sahne motoru kaydırmayı ve kamerayı tek örnek olarak yönetir.
createRoot(document.getElementById("kok")!).render(<App />);
