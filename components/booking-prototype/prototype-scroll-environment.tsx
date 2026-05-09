"use client";

import { useEffect } from "react";

/**
 * Real-device UX: reserve space below the viewport so focused fields scroll above
 * the fixed mobile summary / home indicator (iOS Safari + Android Chrome).
 * Applied only while this component is mounted (prototype route layout).
 */
export function PrototypeScrollEnvironment() {
  useEffect(() => {
    const html = document.documentElement;
    const prevBottom = html.style.scrollPaddingBottom;
    const prevTop = html.style.scrollPaddingTop;

    /* ~height of sticky footer + thumb margin; safe-area for notched devices */
    html.style.scrollPaddingBottom =
      "max(8rem, calc(env(safe-area-inset-bottom, 0px) + 9.25rem))";
    /* Compact booking nav — progress + Leave only */
    html.style.scrollPaddingTop =
      "max(5.5rem, calc(env(safe-area-inset-top, 0px) + 4.25rem))";

    return () => {
      html.style.scrollPaddingBottom = prevBottom;
      html.style.scrollPaddingTop = prevTop;
    };
  }, []);

  return null;
}
