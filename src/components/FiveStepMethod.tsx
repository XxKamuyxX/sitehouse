'use client';

import { motion } from 'framer-motion';
import { Shield, Wrench, Sparkles, Settings, CheckCircle } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Shield,
    title: 'Proteção Total',
    description: 'Aplicação de passadeiras e propés. Seu piso não é tocado. Protegemos móveis, tapetes e toda a área de trabalho antes de iniciar qualquer procedimento.',
    detail: 'Utilizamos materiais de proteção profissionais que garantem zero danos ao seu patrimônio durante todo o processo de restauração.',
  },
  {
    number: '02',
    icon: Wrench,
    title: 'Desmontagem Técnica',
    description: 'Remoção segura das folhas para acesso aos rolamentos. Cada folha é identificada, catalogada e tratada individualmente para garantir reposição perfeita.',
    detail: 'Nossos técnicos seguem protocolo específico de desmontagem que preserva a integridade estrutural do sistema.',
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'Higienização Profunda',
    description: 'Aspiração de detritos e limpeza química dos trilhos. Removemos anos de acúmulo de poeira, pelos, insetos e resíduos que comprometem o funcionamento.',
    detail: 'Utilizamos produtos químicos específicos para alumínio que removem oxidação sem danificar o acabamento.',
  },
  {
    number: '04',
    icon: Settings,
    title: 'Substituição Blindada',
    description: 'Instalação de roldanas de poliacetal com rolamento duplo. Peças importadas de alta resistência que suportam até 50kg por unidade.',
    detail: 'Cada roldana é testada antes da instalação. Garantimos que o sistema suporte o peso total com margem de segurança de 30%.',
  },
  {
    number: '05',
    icon: CheckCircle,
    title: 'Calibragem',
    description: 'Nivelamento a laser das folhas para vedação acústica perfeita. Ajuste milimétrico que elimina vazamentos de ar, ruído e infiltração.',
    detail: 'Utilizamos nível laser profissional para garantir que todas as folhas estejam perfeitamente alinhadas e niveladas.',
  },
];

export default function FiveStepMethod() {
  return (
    <section id="solucao" className="py-20 md:py-32 bg-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 text-slate-900">
            O Protocolo House de <span className="text-gold">Restauração</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Um método sistemático desenvolvido através de centenas de restaurações, garantindo resultados previsíveis e duradouros.
          </p>
        </div>

        <div className="space-y-8 md:space-y-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isEven = index % 2 === 0;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 md:gap-12`}
              >
                {/* Icon & Number */}
                <div className="flex-shrink-0 w-full md:w-64 flex flex-col items-center md:items-start">
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center shadow-lg">
                      <Icon className="w-16 h-16 text-amber-700" />
                    </div>
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center font-serif font-bold text-xl">
                      {step.number}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-slate-50 rounded-2xl p-8 md:p-10 shadow-md">
                  <h3 className="text-2xl md:text-3xl font-serif font-bold mb-4 text-slate-900">
                    {step.title}
                  </h3>
                  <p className="text-lg text-slate-700 mb-4 leading-relaxed">
                    {step.description}
                  </p>
                  <p className="text-slate-600 leading-relaxed italic">
                    {step.detail}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}




