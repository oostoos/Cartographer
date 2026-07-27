import { BrowserRouter } from "react-router-dom";

import { mountReactApp } from "@lib-stack/bootstrap/main";

import "./design/global.css";
import { AppRoutes } from "./app/router";

mountReactApp(
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>,
);
