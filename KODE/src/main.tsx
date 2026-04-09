import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

(window as Window & { __TRYKEKSPERTEN_BUILD__?: string }).__TRYKEKSPERTEN_BUILD__ = "2026-04-09-2";

createRoot(document.getElementById("root")!).render(<App />);
