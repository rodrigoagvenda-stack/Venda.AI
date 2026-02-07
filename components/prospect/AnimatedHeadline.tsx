'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export function AnimatedHeadline() {
  const textRef = useRef<HTMLSpanElement>(null);

  const texts = [
    'transformar buscas em oportunidades reais',
    'capturar leads qualificados automaticamente',
    'acelerar seu pipeline de vendas',
  ];

  useEffect(() => {
    if (!textRef.current) return;

    let currentIndex = 0;

    const animateText = () => {
      const timeline = gsap.timeline();

      timeline
        .to(textRef.current, {
          opacity: 0,
          y: -20,
          duration: 0.5,
          ease: 'power2.in',
        })
        .call(() => {
          currentIndex = (currentIndex + 1) % texts.length;
          if (textRef.current) {
            textRef.current.textContent = texts[currentIndex];
          }
        })
        .to(textRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
        });
    };

    // Primeira animação após 3 segundos
    const timer = setInterval(animateText, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight">
      O jeito mais <span className="text-primary">rápido</span> de{' '}
      <span ref={textRef} className="inline-block">
        {texts[0]}
      </span>
      <span className="text-primary">.</span>
    </h2>
  );
}
