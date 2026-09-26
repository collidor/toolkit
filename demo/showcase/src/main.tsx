import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Register Cache-First Service Worker for PokéAPI protection
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => {
        console.log("🛡️ PokéAPI Cache-First ServiceWorker active:", reg.scope);
      })
      .catch((err) => {
        console.warn("ServiceWorker registration skipped:", err);
      });
  });
}
