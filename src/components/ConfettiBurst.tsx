"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

const EMOJIS = ["🎉", "✨", "🎊", "⭐"];
const PARTICLE_COUNT = 16;

export default function ConfettiBurst() {
  // Random positions are picked once, when the burst first appears
  const [particles] = useState(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.4;
      const distance = 70 + Math.random() * 60;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      const rot = Math.round(Math.random() * 360);
      const delay = Math.round(Math.random() * 100);
      return {
        id: i,
        emoji: EMOJIS[i % EMOJIS.length],
        style: {
          "--tx": `${tx}px`,
          "--ty": `${ty}px`,
          "--rot": `${rot}deg`,
          animation: `confetti-burst 900ms ease-out ${delay}ms forwards`,
        } as CSSProperties,
      };
    });
  });

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <span key={particle.id} className="absolute text-2xl" style={particle.style}>
          {particle.emoji}
        </span>
      ))}
    </div>
  );
}
