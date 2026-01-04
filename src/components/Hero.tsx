'use client';

import { Shield, Award, Clock, CheckCircle2 } from 'lucide-react';
import ContactForm from './ContactForm';

export default function Hero() {
  // Parallax disabled for better performance
  // const containerRef = useRef<HTMLDivElement>(null);
  // const { scrollYProgress } = useScroll({
  //   target: containerRef,
  //   offset: ['start start', 'end start'],
  // });
  // const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/80 via-white/60 to-amber-50/80 z-10"></div>
        <img 
          src="/images/cortina5.jpg" 
          alt="Cortina de vidro aberta com vista bonita"
          className="w-full h-[120%] object-cover opacity-40"
          loading="eager"
        />
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 z-5 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl relative z-20 pt-24 md:pt-32 pb-24 md:pb-16">
        <div className="max-w-5xl">
          <div className="inline-block mb-4 md:mb-6 px-3 md:px-4 py-1.5 md:py-2 bg-amber-100 text-amber-800 rounded-full text-xs md:text-sm font-semibold">
            ⭐ Especialistas Certificados em Cortinas de Vidro
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold mb-4 md:mb-6 leading-tight tracking-tight text-slate-900 drop-shadow-sm">
            Sua Varanda Perfeita: <span className="text-gold">Segurança</span>, Leveza e Conforto para sua Família.
          </h1>
          
          <p className="text-base md:text-xl lg:text-2xl text-slate-700 mb-6 md:mb-8 leading-relaxed max-w-4xl font-light">
            Especialistas exclusivos em manutenção de Cortinas de Vidro em Belo Horizonte e Região. Tecnologia de blindagem e higienização com atendimento premium.
          </p>
          
          {/* Contact Form - Incorporated directly in page */}
          <div className="mb-6 md:mb-8">
            <ContactForm />
          </div>

          {/* Diferenciais */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 shadow-xl border-2 border-amber-200 mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-bold text-slate-900 mb-3 md:mb-4">Nossos Diferenciais:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
              <div className="flex items-center gap-2 md:gap-3">
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                <span className="text-xs md:text-sm lg:text-base text-slate-700">Técnicos Próprios Certificados</span>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                <span className="text-xs md:text-sm lg:text-base text-slate-700">Garantia Total em Todos os Serviços</span>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                <span className="text-xs md:text-sm lg:text-base text-slate-700">Atendimento em até 24h</span>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                <span className="text-xs md:text-sm lg:text-base text-slate-700">Limpeza Profissional Sem Sujeira</span>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                <span className="text-xs md:text-sm lg:text-base text-slate-700">Peças Premium e Originais</span>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
                <span className="text-xs md:text-sm lg:text-base text-slate-700">Preço Justo e Transparente</span>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap gap-2 md:gap-4 lg:gap-6">
            <div className="flex items-center gap-2 md:gap-3 bg-white/90 backdrop-blur-sm px-3 md:px-6 py-2 md:py-4 rounded-lg md:rounded-xl shadow-lg border-2 border-amber-200">
              <Shield className="w-4 h-4 md:w-6 md:h-6 text-green-600 flex-shrink-0" />
              <div>
                <div className="font-bold text-slate-900 text-xs md:text-base lg:text-lg">Atendimento em BH e Nova Lima</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3 bg-white/90 backdrop-blur-sm px-3 md:px-6 py-2 md:py-4 rounded-lg md:rounded-xl shadow-lg border-2 border-blue-200">
              <Award className="w-4 h-4 md:w-6 md:h-6 text-blue-600 flex-shrink-0" />
              <div>
                <div className="font-bold text-slate-900 text-xs md:text-base lg:text-lg">Técnicos Próprios</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3 bg-white/90 backdrop-blur-sm px-3 md:px-6 py-2 md:py-4 rounded-lg md:rounded-xl shadow-lg border-2 border-amber-200">
              <Clock className="w-4 h-4 md:w-6 md:h-6 text-amber-600 flex-shrink-0" />
              <div>
                <div className="font-bold text-slate-900 text-xs md:text-base lg:text-lg">Garantia Total</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </section>
  );
}
