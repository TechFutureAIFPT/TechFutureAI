"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

const HERO_TITLE: { text: string; accent?: boolean }[] = [
  { text: "Một nền tảng. Hai lối đi." },
  { text: "Cùng một điểm chạm.", accent: true },
];

function HeroTitle() {
  let order = 0;
  return (
    <h1 className="lp-hero__title">
      {HERO_TITLE.map((segment, segmentIndex) => (
        <span key={segmentIndex} className={`lp-hero__seg${segment.accent ? " is-accent" : ""}`}>
          {segment.text.split(" ").map((word, wordIndex, words) => {
            const wordOrder = order;
            order += 1;
            return (
              <span key={wordIndex}>
                <span className="lp-word" style={{ ["--lp-word" as string]: wordOrder }}>
                  <i>{word}</i>
                </span>
                {wordIndex < words.length - 1 ? " " : ""}
              </span>
            );
          })}
          {segmentIndex < HERO_TITLE.length - 1 ? " " : ""}
        </span>
      ))}
    </h1>
  );
}

export function LandingHero() {
  return (
    <section className="lp-hero">
      <div className="lp-hero__bg" aria-hidden="true">
        <img
          src="/hero/hero-01.jpg"
          alt=""
          className="lp-hero__bgimg is-active"
          decoding="async"
          fetchPriority="high"
        />
      </div>
      <div className="lp-hero__scrim" aria-hidden="true" />

      <div className="lp-container lp-hero__center">
        <span className="lp-hero__eyebrow">
          <i aria-hidden="true" />
          <span>Tuyển dụng</span>
          <strong className="lp-hero__rotword">nhanh hơn</strong>
        </span>

        <HeroTitle />

        <p className="lp-hero__lead">
          CV Match giúp <strong>người tìm việc hiểu hồ sơ của mình</strong> và giúp doanh nghiệp{" "}
          <strong>tìm đúng người cho đúng vai trò</strong>. Trọng số do recruiter kiểm soát, mỗi điểm
          số đều kèm dẫn chứng.
        </p>

        <a href="#gioi-thieu" className="lp-hero__cue" aria-label="Xuống phần giới thiệu">
          <span>Xem cách hoạt động</span>
          <span className="lp-hero__cueicon" aria-hidden="true">
            <ChevronDown size={18} />
          </span>
        </a>
      </div>
    </section>
  );
}
