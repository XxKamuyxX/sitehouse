'use client';

import { Phone, ArrowUp } from 'lucide-react';

export default function MobileStickyBar() {
  const whatsappNumber = '5531982798513';
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  const scrollToForm = () => {
    const formElement = document.getElementById('formulario-contato');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Add a small offset to account for sticky header
      window.scrollBy(0, -20);
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-slate-200 shadow-2xl">
      <div className="flex gap-2 p-3">
        {/* Botão WhatsApp Direto */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2 text-sm"
        >
          <Phone className="w-5 h-5" />
          <span>Atendimento Rápido (Sem Form)</span>
        </a>

        {/* Botão Orçamento Prioritário */}
        <button
          onClick={scrollToForm}
          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2 text-sm"
        >
          <ArrowUp className="w-5 h-5" />
          <span>Orçamento Prioritário</span>
        </button>
      </div>
    </div>
  );
}
