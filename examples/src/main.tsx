// import { createRoot } from 'react-dom/client'
import { ReactDOM } from "../which.react.ts";
import "./index.css";
// import App from "./App.tsx";

const jsx = (
  <div className="box border">
    <h1 className="border">hello worl11d</h1>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")!).render(jsx);
