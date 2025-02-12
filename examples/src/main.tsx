// import { createRoot } from 'react-dom/client'
import { Fragment } from "react/jsx-runtime";
import { ReactDOM } from "../which.react.ts";
import "./index.css";
// import App from "./App.tsx";

const fragment = (
  <>
    <h1>222</h1>
    12
    <>32</>
  </>
);

function FunctionComponent() {
  return <h1>FunctionComponent</h1>;
}

const jsx = (
  <div className="box border">
    <h1 className="border">hello worl11d</h1>
    <h2>aa</h2>
    <h2>22</h2>
    dd
    {fragment}
    <Fragment key="a">121</Fragment>
    <FunctionComponent />
  </div>
);

ReactDOM.createRoot(document.getElementById("root")!).render(jsx);
