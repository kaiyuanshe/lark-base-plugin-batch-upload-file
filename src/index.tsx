import { bitable, ToastType } from "@lark-base-open/js-sdk";
import { HTTPError } from "koajax";
import { createRoot } from "react-dom/client";

import App from "./App";
import "./App.css";
import LoadApp from "./components/LoadApp";
// import './locales/i18n' // 支持国际化

window.addEventListener("unhandledrejection", ({ reason }) => {
  const { message, response } = reason as HTTPError;
  const { statusText, body } = response || {};

  const tips = body?.message || statusText || message;

  if (tips) bitable.ui.showToast({ toastType: ToastType.error, message: tips });
});

createRoot(document.getElementById("root") as HTMLElement).render(
  <LoadApp>
    <App />
  </LoadApp>
);
