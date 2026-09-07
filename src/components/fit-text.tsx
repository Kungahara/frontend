"use client";

import { useLayoutEffect, useRef } from "react";

/** Keep a full value on one line, using the inherited size whenever it fits. */
export function FitText({ text: formatted, className = "" }: { text: string; className?: string }) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;
    let disposed = false;

    function fit() {
      if (disposed || !container || !text || container.clientWidth === 0) return;
      // Measure at the original size so amounts grow back after a resize/value change.
      text.style.fontSize = "inherit";
      const naturalWidth = text.getBoundingClientRect().width;
      const availableWidth = container.clientWidth;
      if (naturalWidth > availableWidth) {
        const baseSize = parseFloat(getComputedStyle(container).fontSize);
        let smallest = 0;
        let largest = baseSize;
        // Measure actual glyphs: variable fonts do not always scale linearly.
        for (let step = 0; step < 10; step++) {
          const candidate = (smallest + largest) / 2;
          text.style.fontSize = `${candidate}px`;
          if (text.getBoundingClientRect().width <= availableWidth) smallest = candidate;
          else largest = candidate;
        }
        text.style.fontSize = `${Math.floor(smallest * 100) / 100}px`;
      }
    }

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(container);
    window.addEventListener("resize", fit);
    document.fonts.addEventListener("loadingdone", fit);
    void document.fonts.ready.then(fit);
    return () => {
      disposed = true;
      observer.disconnect();
      window.removeEventListener("resize", fit);
      document.fonts.removeEventListener("loadingdone", fit);
    };
  }, [formatted]);

  return <span className={`fit-text ${className}`.trim()} ref={containerRef} title={formatted}>
    <span className="fit-text-content" ref={textRef}>{formatted}</span>
  </span>;
}
