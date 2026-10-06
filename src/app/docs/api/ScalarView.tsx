"use client";

import { createElement, useEffect } from "react";

/** Me-render dokumentasi API interaktif Scalar dari /api/v1/openapi.json. */
export default function ScalarView() {
  useEffect(() => {
    if (document.querySelector("script[data-scalar]")) return;
    const el = document.createElement("script");
    el.src = "https://cdn.jsdelivr.net/npm/@scalar/api-reference";
    el.async = true;
    el.dataset.scalar = "1";
    document.head.appendChild(el);
  }, []);

  return createElement("scalar-api-reference", {
    configuration: JSON.stringify({
      url: "/api/v1/openapi.json",
      theme: "default",
    }),
  });
}
