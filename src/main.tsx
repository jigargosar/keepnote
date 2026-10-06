import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { NoteStoreProvider } from "./store";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NoteStoreProvider>
      <App />
    </NoteStoreProvider>
  </StrictMode>,
);
