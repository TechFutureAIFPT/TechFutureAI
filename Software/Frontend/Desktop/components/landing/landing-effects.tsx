"use client";

import { useEffect } from "react";

const ROTATING_WORDS = ["nhanh hơn", "chuẩn xác hơn", "tiết kiệm hơn"];

function prefersReducedMotion() {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Cuộn tới đâu, khối `.lp-reveal` trồi lên tới đó — cổng 1:1 từ landing.js `enableReveal()`. */
function enableReveal() {
  const items = Array.from(document.querySelectorAll<HTMLElement>(".lp-reveal"));
  if (!items.length) return () => {};

  if (prefersReducedMotion() || typeof IntersectionObserver !== "function") {
    items.forEach((item) => item.classList.add("is-in"));
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8%", threshold: 0.12 }
  );
  items.forEach((item) => observer.observe(item));
  return () => observer.disconnect();
}

/** Tô sáng từng chữ của đoạn giới thiệu theo vị trí cuộn — cổng 1:1 từ landing-intro.js. */
function startIntroHighlight() {
  const section = document.querySelector<HTMLElement>(".lp-intro");
  const words = section ? Array.from(section.querySelectorAll<HTMLElement>(".lp-intro__word")) : [];
  if (!words.length) return () => {};

  if (prefersReducedMotion()) {
    words.forEach((word) => word.classList.add("is-lit"));
    return () => {};
  }

  let ticking = false;
  let lit = -1;

  function apply() {
    ticking = false;
    const rect = section!.getBoundingClientRect();
    const viewport = window.innerHeight || 0;
    const span = rect.height + viewport * 0.35;
    const progress = span > 0 ? (viewport * 0.75 - rect.top) / span : 0;
    const target = Math.round(Math.min(Math.max(progress, 0), 1) * words.length);
    if (target === lit) return;

    const from = Math.min(lit < 0 ? 0 : lit, target);
    const to = Math.max(lit < 0 ? words.length : lit, target);
    for (let i = from; i < to; i += 1) {
      words[i].classList.toggle("is-lit", i < target);
    }
    lit = target;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(apply);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  apply();

  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  };
}

/** Nhãn luân phiên 3 lợi ích ở eyebrow hero — cổng 1:1 từ landing-hero.js `startRotator()`. */
function startRotator() {
  const el = document.querySelector<HTMLElement>(".lp-hero__rotword");
  if (!el || prefersReducedMotion()) return () => {};

  let index = 0;
  let swapTimer: any = null;
  const cycle = window.setInterval(() => {
    index = (index + 1) % ROTATING_WORDS.length;
    el.classList.add("is-out");
    swapTimer = window.setTimeout(() => {
      el.textContent = ROTATING_WORDS[index];
      el.classList.remove("is-out");
      swapTimer = null;
    }, 200);
  }, 2400);

  return () => {
    window.clearInterval(cycle);
    if (swapTimer) window.clearTimeout(swapTimer);
  };
}

/** Không render gì — chỉ gắn các hiệu ứng cuộn/luân phiên của landing sau khi mount. */
export function LandingEffects() {
  useEffect(() => {
    document.documentElement.classList.add("has-landing");
    const cleanups = [enableReveal(), startIntroHighlight(), startRotator()];
    return () => {
      document.documentElement.classList.remove("has-landing");
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return null;
}
