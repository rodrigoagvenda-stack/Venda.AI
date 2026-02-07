'use client';

import { useEffect, useState } from 'react';

export function AnimatedHeadline() {
  const [displayText, setDisplayText] = useState('');

  const texts = [
    'transformar buscas em oportunidades reais',
    'capturar leads qualificados automaticamente',
    'acelerar seu pipeline de vendas',
  ];

  useEffect(() => {
    let currentIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const typeWriter = () => {
      const currentText = texts[currentIndex];

      if (!isDeleting) {
        // Digitando
        if (charIndex < currentText.length) {
          setDisplayText(currentText.substring(0, charIndex + 1));
          charIndex++;
          setTimeout(typeWriter, 50);
        } else {
          // Pausa antes de apagar
          setTimeout(() => {
            isDeleting = true;
            typeWriter();
          }, 2000);
        }
      } else {
        // Apagando
        if (charIndex > 0) {
          setDisplayText(currentText.substring(0, charIndex - 1));
          charIndex--;
          setTimeout(typeWriter, 30);
        } else {
          // Próximo texto
          isDeleting = false;
          currentIndex = (currentIndex + 1) % texts.length;
          setTimeout(typeWriter, 500);
        }
      }
    };

    typeWriter();
  }, []);

  return (
    <div className="text-xl md:text-2xl font-normal leading-relaxed">
      <div>O jeito mais <span className="text-primary font-medium">rápido</span> de</div>
      <div className="mt-2">
        {displayText}
        <span className="animate-pulse">|</span>
      </div>
    </div>
  );
}
