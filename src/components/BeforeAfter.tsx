'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const comparisons = [
  {
    before: {
      title: 'Trilho Contaminado e Sistema Travado',
      image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80',
      description: 'Acúmulo de anos de poeira, pelos e detritos. Roldanas de plástico ressecadas e quebradas. Risco iminente de acidente e necessidade de força excessiva para abrir.',
    },
    after: {
      title: 'Trilho Restaurado e Sistema Operacional',
      image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80',
      description: 'Trilho completamente higienizado quimicamente. Roldanas blindadas de poliacetal instaladas. Sistema funcionando com leveza, silêncio e segurança total. Calibragem perfeita.',
    },
  },
];

export default function BeforeAfter() {
  const [showAfter, setShowAfter] = useState(false);

  return (
    <section className="py-16 md:py-32 bg-soft-gray">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-center mb-6 text-slate-900">
          Antes e Depois: A Diferença é Visível
        </h2>
        <p className="text-center text-slate-600 text-lg mb-12 max-w-3xl mx-auto">
          Arraste para ver a diferença entre um trilho contaminado e um restaurado pela House. A qualidade do nosso trabalho fala por si só.
        </p>

        <div className="max-w-4xl mx-auto">
          <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Toggle Buttons */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setShowAfter(false)}
                className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                  !showAfter
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Antes
              </button>
              <button
                onClick={() => setShowAfter(true)}
                className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                  showAfter
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Depois
              </button>
            </div>

            {/* Content */}
            <div className="relative h-96 md:h-[500px]">
              <AnimatePresence mode="wait">
                {!showAfter ? (
                  <motion.div
                    key="before"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute inset-0"
                  >
                    <img
                      src={comparisons[0].before.image}
                      alt={comparisons[0].before.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                      <h3 className="text-2xl font-serif font-bold text-white mb-2">
                        {comparisons[0].before.title}
                      </h3>
                      <p className="text-slate-200">{comparisons[0].before.description}</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="after"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="absolute inset-0"
                  >
                    <img
                      src={comparisons[0].after.image}
                      alt={comparisons[0].after.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                      <h3 className="text-2xl font-serif font-bold text-white mb-2">
                        {comparisons[0].after.title}
                      </h3>
                      <p className="text-slate-200">{comparisons[0].after.description}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

