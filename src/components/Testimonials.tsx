'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface Testimonial {
  name: string;
  location: string;
  text: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    name: 'Maria Silva',
    location: 'Belvedere',
    text: 'Fiquei impressionada com a organização e limpeza da equipe. Chegaram pontualmente, trabalharam com tapetes de proteção e deixaram tudo impecável. A cortina voltou a funcionar perfeitamente, sem barulho e com movimento suave.',
    rating: 5,
  },
  {
    name: 'Roberto Mendes',
    location: 'Vila da Serra',
    text: 'Profissionais extremamente educados e técnicos. Explicaram todo o processo, usaram uniformes e EPIs adequados. O serviço foi rápido e eficiente. Recomendo sem hesitação.',
    rating: 5,
  },
  {
    name: 'Ana Paula Costa',
    location: 'Nova Lima',
    text: 'A House Manutenção transformou nossa varanda. A equipe foi discreta, organizada e muito profissional. A cortina está funcionando como nova. O melhor: não fizeram nenhuma sujeira!',
    rating: 5,
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const next = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    const timer = setInterval(next, 8000); // 8 segundos para ler melhor
    return () => clearInterval(timer);
  }, [currentIndex]);

  return (
    <section id="depoimentos" className="py-20 md:py-32 bg-gradient-to-b from-amber-50 to-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-center mb-4 text-slate-900">
          O Que Nossos <span className="text-gold">Clientes</span> Dizem
        </h2>
        <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto text-lg">
          Depoimentos reais de quem confia na House Manutenção.
        </p>

        <div className="relative max-w-4xl mx-auto">
          <div className="relative h-auto min-h-[250px] md:min-h-[300px] overflow-hidden rounded-2xl bg-white border-2 border-amber-200 shadow-xl">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="absolute inset-0 p-6 md:p-8 lg:p-12 pl-20 md:pl-24 lg:pl-28 pr-20 md:pr-24 lg:pr-28 flex flex-col justify-center"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-500 fill-amber-500" />
                  ))}
                </div>
                <p className="text-base md:text-lg lg:text-xl text-slate-700 mb-4 md:mb-6 leading-relaxed italic">
                  "{testimonials[currentIndex].text}"
                </p>
                <div>
                  <p className="font-semibold text-slate-900">{testimonials[currentIndex].name}</p>
                  <p className="text-sm text-slate-600">{testimonials[currentIndex].location}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <button
            onClick={prev}
            className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 bg-white p-2 md:p-2.5 rounded-full shadow-xl hover:bg-amber-50 hover:scale-110 transition-all duration-300 border-2 border-amber-400 z-30"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-amber-700" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 bg-white p-2 md:p-2.5 rounded-full shadow-xl hover:bg-amber-50 hover:scale-110 transition-all duration-300 border-2 border-amber-400 z-30"
            aria-label="Próximo"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-amber-700" />
          </button>

          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-amber-600 w-8'
                    : 'bg-slate-300 hover:bg-amber-400 hover:w-4'
                }`}
                aria-label={`Ir para depoimento ${index + 1}`}
              />
            ))}
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('openWhatsAppModal'))}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold text-lg uppercase tracking-wider transition-colors shadow-lg hover:shadow-xl"
          >
            Solicitar Orçamento
          </button>
        </div>
      </div>
    </section>
  );
}
