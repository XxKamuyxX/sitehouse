'use client';

import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

const problems = [
  {
    problem: 'Vidro Travado ou Cortina Não Abre',
    symptoms: ['Cortina não desliza', 'Vidro preso na guia', 'Dificuldade para abrir e fechar'],
    solution: 'Realizamos limpeza completa, lubrificação das roldanas e ajuste das guias. Em casos mais graves, fazemos a troca das roldanas.',
    time: '1-2 horas',
  },
  {
    problem: 'Cortina Dura ou Difícil de Mover',
    symptoms: ['Esforço excessivo para abrir', 'Barulho ao deslizar', 'Movimento irregular'],
    solution: 'Lubrificação profissional das roldanas e guias, limpeza completa do sistema e ajuste de tensão.',
    time: '1 hora',
  },
  {
    problem: 'Vidro Caindo ou Solto',
    symptoms: ['Vidro desencaixado', 'Risco de queda', 'Vidro não fica na posição'],
    solution: 'Colagem profissional do vidro na estrutura, verificação e reposição de guias danificadas.',
    time: '2-3 horas',
  },
  {
    problem: 'Vedação Ruim - Entra Água ou Vento',
    symptoms: ['Goteiras na chuva', 'Vento entra pela fresta', 'Umidade interna'],
    solution: 'Substituição completa da vedação, ajuste das guias e verificação de alinhamento.',
    time: '2-4 horas',
  },
  {
    problem: 'Roldanas Quebradas ou Desgastadas',
    symptoms: ['Barulho de metal', 'Cortina não desliza', 'Roldanas soltas'],
    solution: 'Troca completa das roldanas por modelos premium, garantindo durabilidade e movimento suave.',
    time: '1-2 horas',
  },
  {
    problem: 'Vidro Quebrado ou Trincado',
    symptoms: ['Rachaduras visíveis', 'Vidro quebrado', 'Segurança comprometida'],
    solution: 'Reposição imediata do vidro com medida exata, mantendo a estética e segurança.',
    time: '2-3 horas',
  },
];

export default function ProblemsSolutions() {
  return (
    <section id="problemas" className="py-20 md:py-32 bg-gradient-to-b from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 text-slate-900">
            Problemas Comuns e <span className="text-gold">Nossas Soluções</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Identificamos o problema e aplicamos a solução técnica adequada para sua cortina de vidro.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {problems.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-slate-200 hover:border-amber-400 hover:-translate-y-2"
            >
              {/* Problem */}
              <div className="mb-4">
                <h3 className="text-xl font-serif font-bold mb-3 text-slate-900">
                  {item.problem}
                </h3>
                <div className="space-y-1 mb-4">
                  <p className="text-sm font-semibold text-slate-600 mb-2">Sintomas:</p>
                  {item.symptoms.map((symptom, i) => (
                    <p key={i} className="text-sm text-slate-600 flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{symptom}</span>
                    </p>
                  ))}
                </div>
              </div>

              {/* Solution */}
              <div className="border-t border-slate-200 pt-4 mb-4">
                <p className="text-sm font-semibold text-slate-900 mb-2">Solução:</p>
                <p className="text-slate-700 leading-relaxed text-sm">
                  {item.solution}
                </p>
              </div>

              {/* Time */}
              <div className="flex items-center gap-2 text-amber-600 pt-4 border-t border-slate-100">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-semibold">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <button 
            onClick={() => {
              const formElement = document.getElementById('formulario-contato');
              if (formElement) {
                formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                window.scrollBy(0, -20);
              }
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-lg font-semibold text-lg uppercase tracking-wider transition-colors shadow-lg hover:shadow-xl"
          >
            Quero Resolver Meu Problema Agora
          </button>
        </div>
      </div>
    </section>
  );
}
