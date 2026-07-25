import { BrowserRouter } from "react-router-dom";

import { mountReactApp } from "@common/bootstrap/main";

import { AppRoutes } from "./app/router";

mountReactApp(
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>,
);
