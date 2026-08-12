import React from "react";
import { createRoot } from "react-dom/client";
import "../app/globals.css";
import TrackerClient from "../app/tracker-client";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode><TrackerClient /></React.StrictMode>,
);
