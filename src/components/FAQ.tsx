'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'Como funciona o orçamento?',
    answer: 'Após o contato, agendamos uma visita técnica gratuita para avaliar sua cortina de vidro. Identificamos os problemas, explicamos o que precisa ser feito e apresentamos um orçamento detalhado e transparente, sem surpresas. Você só paga após aprovar o serviço.',
  },
  {
    question: 'Vocês fazem sujeira durante o serviço?',
    answer: 'Não. Utilizamos tapetes de proteção profissionais, propés para móveis e aspiradores durante todo o processo. Nossos técnicos trabalham com uniformes e EPIs adequados, garantindo que sua casa fique mais limpa do que quando chegamos. Removemos toda a poeira e detritos gerados durante a manutenção.',
  },
  {
    question: 'Quais formas de pagamento vocês aceitam?',
    answer: 'Aceitamos dinheiro, PIX, cartão de débito e crédito (até 3x sem juros). O pagamento pode ser feito após a conclusão do serviço, quando você estiver satisfeito com o resultado.',
  },
  {
    question: 'Tem garantia?',
    answer: 'Sim, todos os nossos serviços vêm com garantia de qualidade e durabilidade. Se algo não estiver funcionando perfeitamente após o serviço, voltamos sem custo adicional para corrigir. Fornecemos nota fiscal e laudo técnico que comprovam a garantia formal.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="py-16 md:py-32 bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl">
        <h2 id="faq" className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-center mb-6 text-slate-900">
          Perguntas Frequentes
        </h2>
        <p className="text-center text-slate-600 text-lg mb-12 max-w-3xl mx-auto">
          Respostas detalhadas sobre nosso processo, garantias e diferenciais técnicos.
        </p>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border-2 border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg hover:border-amber-400 transition-all duration-300"
            >
              <button
                onClick={() => toggle(index)}
                type="button"
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-amber-50 transition-colors"
              >
                <span className="font-semibold text-slate-900 pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-600 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 py-4 text-slate-700 leading-relaxed border-t border-slate-100">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
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
