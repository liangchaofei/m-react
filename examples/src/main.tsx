import { StrictMode } from "react";
// import { createRoot } from 'react-dom/client'
import { ReactDOM } from "../which.react.ts";
import "./index.css";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
