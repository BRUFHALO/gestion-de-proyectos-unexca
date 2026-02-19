import './index.css';
import React from "react";
import { render } from "react-dom";
import { App } from "./App";
import { ToastProvider } from "./components/ui/Toast";

render(
  <ToastProvider>
    <App />
  </ToastProvider>,
  document.getElementById("root")
);