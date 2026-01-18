'use client';

import { useState } from 'react';
import { Phone, User } from 'lucide-react';

interface TrackingParams {
  gclid?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
}

declare global {
  interface Window {
    getTrackingParams?: () => TrackingParams;
  }
}

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
    if (errors.phone) {
      setErrors({ ...errors, phone: '' });
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, name: e.target.value });
    if (errors.name) {
      setErrors({ ...errors, name: '' });
    }
  };

  const getTrackingData = () => {
    const tracking: TrackingParams = {};
    
    if (typeof window !== 'undefined' && window.getTrackingParams) {
      const params = window.getTrackingParams();
      tracking.gclid = params.gclid || null;
      tracking.utm_source = params.utm_source || null;
      tracking.utm_medium = params.utm_medium || null;
      tracking.utm_campaign = params.utm_campaign || null;
    }

    return {
      ...tracking,
      timestamp: new Date().toISOString(),
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Telefone inválido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Get tracking data
      const trackingData = getTrackingData();

      // Prepare data for Google Sheets
      const sheetsData = {
        nome: formData.name.trim(),
        telefone: formData.phone.replace(/\D/g, ''),
        gclid: trackingData.gclid || '',
        utm_source: trackingData.utm_source || '',
        utm_medium: trackingData.utm_medium || '',
        utm_campaign: trackingData.utm_campaign || '',
        timestamp: trackingData.timestamp,
        page_url: trackingData.page_url,
        user_agent: trackingData.user_agent,
      };

      // Send to Google Sheets
      const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxp4EUPcEh3h5v30cwmT0nZZKnRPZdelhX5530h1Iicj6nd4lpLvReNTgag6vvl2yPk/exec';
      
      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sheetsData),
        });
      } catch (error) {
        console.log('Google Sheets submission (no-cors):', error);
        // Continue even if Sheets submission fails
      }

      // Build WhatsApp message
      const phoneNumber = formData.phone.replace(/\D/g, '');
      const whatsappNumber = '5531982798513';
      
      const message = `Olá! Meu nome é *${formData.name.trim()}* e meu telefone é *${phoneNumber}*.\n\nGostaria de solicitar um orçamento para manutenção de cortina de vidro.`;
      
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

      // Open WhatsApp
      window.open(whatsappUrl, '_blank');

      // Reset form
      setFormData({ name: '', phone: '' });
      setErrors({});
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'Erro ao enviar. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="formulario-contato" className="bg-white rounded-2xl shadow-xl border-2 border-amber-200 p-6 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 mb-2">
          Solicite Seu Orçamento Prioritário
        </h2>
        <p className="text-slate-600">
          Preencha seus dados e vamos conversar no WhatsApp
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div>
          <label htmlFor="contact-name" className="block text-sm font-semibold text-slate-700 mb-2">
            Nome Completo
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              id="contact-name"
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Seu nome completo"
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
                errors.name ? 'border-red-500' : 'border-slate-300'
              }`}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Phone Field */}
        <div>
          <label htmlFor="contact-phone" className="block text-sm font-semibold text-slate-700 mb-2">
            Telefone/WhatsApp
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              id="contact-phone"
              type="tel"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="(31) 99999-9999"
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
                errors.phone ? 'border-red-500' : 'border-slate-300'
              }`}
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <p className="text-sm text-red-600">{errors.submit}</p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Phone className="w-5 h-5" />
              Enviar Dados e Iniciar Atendimento
            </>
          )}
        </button>
      </form>

      {/* Footer Note */}
      <p className="mt-4 text-xs text-slate-500 text-center">
        Seus dados estão seguros e serão usados apenas para contato.
      </p>
    </div>
  );
}
