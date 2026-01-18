'use client';

import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';

const comparisonData = [
  {
    aspect: 'Lubrificação',
    common: { text: 'Usa óleo/graxa (junta poeira)', icon: X, color: 'text-red-600' },
    house: { text: 'Silicone Seco Importado', icon: Check, color: 'text-green-600' },
  },
  {
    aspect: 'Limpeza',
    common: { text: 'Limpeza superficial', icon: X, color: 'text-red-600' },
    house: { text: 'Limpeza Química de Trilhos', icon: Check, color: 'text-green-600' },
  },
  {
    aspect: 'Garantia',
    common: { text: 'Sem garantia formal', icon: X, color: 'text-red-600' },
    house: { text: 'Laudo Técnico e Nota Fiscal', icon: Check, color: 'text-green-600' },
  },
  {
    aspect: 'Diagnóstico',
    common: { text: "Preço 'fechado' sem critério", icon: X, color: 'text-red-600' },
    house: { text: 'Diagnóstico de 30 pontos', icon: Check, color: 'text-green-600' },
  },
  {
    aspect: 'Peças',
    common: { text: 'Roldanas genéricas', icon: X, color: 'text-red-600' },
    house: { text: 'Roldanas Blindadas de Poliacetal', icon: Check, color: 'text-green-600' },
  },
  {
    aspect: 'Proteção',
    common: { text: 'Sem proteção do ambiente', icon: X, color: 'text-red-600' },
    house: { text: 'Tapetes e propés de proteção', icon: Check, color: 'text-green-600' },
  },
];

export default function Comparison() {
  return (
    <section className="py-20 md:py-32 bg-slate-50">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-center mb-4 text-slate-900">
          Vidraceiro Autônomo vs. <span className="text-gold">House Manutenção</span>
        </h2>
        <p className="text-center text-slate-600 text-lg mb-12 max-w-3xl mx-auto">
          A diferença está nos detalhes técnicos que garantem segurança e durabilidade.
        </p>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="grid grid-cols-3 bg-slate-900 text-white p-6">
            <div className="col-span-1 font-semibold">Aspecto</div>
            <div className="col-span-1 text-center font-semibold">Vidraceiro Comum</div>
            <div className="col-span-1 text-center font-semibold text-gold">House Manutenção</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-200">
            {comparisonData.map((item, index) => {
              const CommonIcon = item.common.icon;
              const HouseIcon = item.house.icon;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="grid grid-cols-3 p-6 hover:bg-slate-50 transition-colors group"
                >
                  <div className="col-span-1 font-medium text-slate-900 flex items-center">
                    {item.aspect}
                  </div>
                  <div className="col-span-1 flex items-center justify-center gap-3">
                    <CommonIcon className={`w-5 h-5 ${item.common.color}`} />
                    <span className="text-slate-600">{item.common.text}</span>
                  </div>
                  <div className="col-span-1 flex items-center justify-center gap-3">
                    <HouseIcon className={`w-5 h-5 ${item.house.color}`} />
                    <span className="text-slate-900 font-medium">{item.house.text}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="mt-12 bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <p className="text-lg text-slate-800 font-medium">
            <strong>Investimento em segurança:</strong> A diferença de preço reflete a diferença em protocolos técnicos, garantias formais e peças certificadas.
          </p>
        </div>
      </div>
    </section>
  );
}




