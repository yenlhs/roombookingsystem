"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const SCREENSHOTS = [
  "/images/screenshots/screenshot-1.png",
  "/images/screenshots/screenshot-2.png",
  "/images/screenshots/screenshot-3.png",
  "/images/screenshots/screenshot-4.png",
];

export function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SCREENSHOTS.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const goToPrevious = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + SCREENSHOTS.length) % SCREENSHOTS.length,
    );
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % SCREENSHOTS.length);
    setIsAutoPlaying(false);
  };

  return (
    <div className="relative w-full h-full">
      {/* Main Image Display */}
      <div className="relative w-full h-[600px] overflow-hidden rounded-lg border bg-gray-100">
        {SCREENSHOTS.map((screenshot, index) => (
          <div
            key={screenshot}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={screenshot}
              alt={`Screenshot ${index + 1}`}
              fill
              className="object-contain"
              priority={index === 0}
            />
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
          aria-label="Previous screenshot"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>

        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
          aria-label="Next screenshot"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {SCREENSHOTS.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex
                ? "bg-blue-600 w-8"
                : "bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to screenshot ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
