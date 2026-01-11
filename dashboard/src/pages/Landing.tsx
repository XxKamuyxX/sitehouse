/**
 * High-Conversion SaaS Landing Page
 * 
 * Marketing/Public homepage with advanced animations using framer-motion.
 * Simulates: src/app/(marketing)/page.tsx (Next.js Route Group)
 * Uses MarketingLayout (no sidebar).
 */

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { 
  ArrowRight, 
  FileText,
  BarChart3,
  MessageSquare,
  ClipboardList,
  Star,
  ChevronDown,
  CheckCircle2,
  Zap,
  Smartphone,
  Shield,
  Coffee
} from 'lucide-react';

// ============================================
// TYPEWRITER HOOK
// ============================================

function useTypewriter(words: string[], speed: number = 100) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[currentWordIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && currentText === currentWord) {
      // Wait before deleting
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && currentText === '') {
      // Move to next word
      setIsDeleting(false);
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    } else {
      // Typing or deleting
      const delay = isDeleting ? speed / 2 : speed;
      timeout = setTimeout(() => {
        setCurrentText(
          isDeleting
            ? currentWord.substring(0, currentText.length - 1)
            : currentWord.substring(0, currentText.length + 1)
        );
      }, delay);
    }

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWordIndex, words, speed]);

  return currentText;
}

// ============================================
// INFINITE MARQUEE COMPONENT
// ============================================

function InfiniteMarquee() {
  const professions = [
    { name: 'Vidraceiros', icon: '🪟' },
    { name: 'Serralheiros', icon: '🔨' },
    { name: 'Eletricistas', icon: '⚡' },
    { name: 'Encanadores', icon: '🔧' },
    { name: 'Gesseiros', icon: '🧱' },
    { name: 'Marceneiros', icon: '🪵' },
    { name: 'Técnicos de TI', icon: '💻' },
    { name: 'Instaladores', icon: '🔩' },
  ];

  return (
    <div className="overflow-hidden py-12 bg-gradient-to-b from-white to-slate-50 border-y border-slate-200">
      <motion.div
        className="flex gap-12"
        animate={{
          x: [0, -50 * professions.length * 2],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: 30,
            ease: 'linear',
          },
        }}
      >
        {[...professions, ...professions, ...professions].map((prof, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 flex-shrink-0 group cursor-default"
          >
            <span className="text-3xl">{prof.icon}</span>
            <span className="text-2xl font-semibold text-slate-400 group-hover:text-navy transition-colors">
              {prof.name}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ============================================
// ANIMATED COUNTER COMPONENT
// ============================================

function AnimatedCounter({ end, suffix = '', duration = 2 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return (
    <span ref={ref}>
      {count > 0 ? '+' : ''}{count.toLocaleString('pt-BR')}{suffix}
    </span>
  );
}

// ============================================
// FAQ ACCORDION COMPONENT
// ============================================

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="border-b border-slate-200 last:border-b-0"
      initial={false}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left hover:text-navy transition-colors"
      >
        <span className="text-lg font-semibold pr-8">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="pb-6 text-slate-600 leading-relaxed">{answer}</p>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// MAIN LANDING PAGE COMPONENT
// ============================================

export function Landing() {
  const typewriterText = useTypewriter(['Vidraceiros', 'Chaveiros', 'Climatização', 'Maridos de Aluguel', 'Empreendedores'], 100);

  return (
    <div className="min-h-screen bg-white">
      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-navy via-blue-900 to-indigo-900">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Headline with Typewriter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8"
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                A gestão completa para{' '}
                <span className="inline-block min-w-[300px] text-left">
                  <span className="bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">
                    {typewriterText}
                  </span>
                  <span className="animate-pulse">|</span>
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                Abandone o papel e caneta. Profissionalize seus orçamentos e controle seu financeiro em um único app.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Link to="/signup">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="relative bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 text-lg font-semibold shadow-2xl shadow-blue-500/50"
                  >
                    <motion.span
                      animate={{
                        boxShadow: [
                          '0 0 0px rgba(59, 130, 246, 0)',
                          '0 0 20px rgba(59, 130, 246, 0.5)',
                          '0 0 0px rgba(59, 130, 246, 0)',
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="absolute inset-0 rounded-lg"
                    />
                    <span className="relative z-10 flex items-center gap-2">
                      Começar Teste Grátis
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </Button>
                </motion.div>
              </Link>
              <Link to="#features">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-8 py-4 text-lg font-semibold backdrop-blur-sm"
                >
                  Ver Funcionalidades
                </Button>
              </Link>
            </motion.div>

            {/* Dashboard Mockup (Floating Animation) */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative mt-16"
            >
              <motion.div
                animate={{
                  y: [0, -20, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl"
              >
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 space-y-4">
                  {/* Mock dashboard bars */}
                  <div className="flex gap-2">
                    <div className="h-4 w-12 bg-blue-500/30 rounded" />
                    <div className="h-4 w-20 bg-indigo-500/30 rounded" />
                    <div className="h-4 w-16 bg-purple-500/30 rounded" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-slate-700/50 rounded-lg" />
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* INFINITE SCROLL (Authority) */}
      {/* ============================================ */}
      <InfiniteMarquee />

      {/* ============================================ */}
      {/* PAIN VS SOLUTION */}
      {/* ============================================ */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-6xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-navy">
              A diferença entre ficar para trás e crescer
            </h2>

            <div className="grid md:grid-cols-2 gap-8 relative">
              {/* The Old Way */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-slate-100 rounded-2xl p-8 border-2 border-slate-200 relative z-10"
              >
                <h3 className="text-2xl font-bold text-slate-600 mb-4">O jeito antigo</h3>
                <ul className="space-y-4 text-slate-500">
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">📄</span>
                    <span className="text-lg">Papelada e planilhas bagunçadas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">😞</span>
                    <span className="text-lg">Perda de clientes por falta de organização</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">💸</span>
                    <span className="text-lg">Contas completamente desorganizadas</span>
                  </li>
                </ul>
              </motion.div>

              {/* The New Way */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/50 relative z-20 md:-ml-8 md:mt-4"
              >
                <h3 className="text-2xl font-bold mb-4">O jeito novo</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">📱</span>
                    <span className="text-lg">Orçamentos em PDF no WhatsApp</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">📊</span>
                    <span className="text-lg">Financeiro automático e organizado</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">💚</span>
                    <span className="text-lg">Clientes fiéis e satisfeitos</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* BENTO GRID FEATURES */}
      {/* ============================================ */}
      <section id="features" className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-navy mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Funcionalidades poderosas para profissionalizar seu negócio
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Orçamentos (Large) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 cursor-pointer group"
            >
              <FileText className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-2xl font-bold text-navy mb-3">Gere PDFs Incríveis</h3>
              <p className="text-slate-600 mb-4">
                Orçamentos profissionais em segundos. Seus clientes vão amar.
              </p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileHover={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-blue-600 font-semibold"
              >
                <FileText className="w-5 h-5" />
                <span>Ver exemplo</span>
              </motion.div>
            </motion.div>

            {/* Card 2: Financeiro */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100 cursor-pointer group"
            >
              <BarChart3 className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-2xl font-bold text-navy mb-3">Para onde foi o dinheiro?</h3>
              <p className="text-slate-600 mb-4">
                Controle financeiro completo. Nunca mais perca uma conta.
              </p>
              <motion.div
                initial={{ scale: 0 }}
                whileHover={{ scale: 1 }}
                className="w-full h-20 bg-green-200 rounded-lg flex items-end justify-center gap-1 p-2"
              >
                {[0.4, 0.7, 0.5, 0.9, 0.6].map((height, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileHover={{ height: `${height * 100}%` }}
                    className="w-8 bg-green-600 rounded-t"
                  />
                ))}
              </motion.div>
            </motion.div>

            {/* Card 3: WhatsApp */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-gradient-to-br from-green-50 to-lime-50 rounded-2xl p-8 border border-green-100 cursor-pointer group"
            >
              <MessageSquare className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-2xl font-bold text-navy mb-3">Envie com 1 clique</h3>
              <p className="text-slate-600 mb-4">
                Orçamentos direto no WhatsApp do cliente.
              </p>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mt-4"
              >
                <MessageSquare className="w-8 h-8 text-white" />
              </motion.div>
            </motion.div>

            {/* Card 4: OS Digital */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="lg:col-span-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100 cursor-pointer group"
            >
              <ClipboardList className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-2xl font-bold text-navy mb-3">OS Digital</h3>
              <p className="text-slate-600 mb-4">
                Assinatura na tela do celular. Cliente aprova na hora.
              </p>
              <div className="flex items-center gap-4 mt-6">
                <Smartphone className="w-16 h-16 text-purple-600" />
                <ArrowRight className="w-8 h-8 text-purple-400" />
                <CheckCircle2 className="w-16 h-16 text-green-600" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SOCIAL PROOF (Stats & Testimonials) */}
      {/* ============================================ */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-3 gap-8 mb-20 max-w-4xl mx-auto"
          >
            <div className="text-center">
              <div className="text-5xl font-bold text-navy mb-2">
                <AnimatedCounter end={1000} suffix="+" />
              </div>
              <p className="text-xl text-slate-600">Orçamentos Gerados</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-navy mb-2">
                <AnimatedCounter end={500} suffix="+" />
              </div>
              <p className="text-xl text-slate-600">Profissionais</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-navy mb-2">99%</div>
              <p className="text-xl text-slate-600">Aprovação</p>
            </div>
          </motion.div>

          {/* Testimonials */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          >
            {[
              {
                name: 'Carlos Silva',
                profession: 'Vidraceiro',
                text: 'Mudou minha vidraçaria. Agora eu pareço uma empresa de verdade.',
                rating: 5,
              },
              {
                name: 'Ana Costa',
                profession: 'Chaveira',
                text: 'Meus clientes elogiam o orçamento. Profissionalismo em cada detalhe.',
                rating: 5,
              },
              {
                name: 'Roberto Santos',
                profession: 'Marceneiro',
                text: 'Finalmente consegui organizar meu financeiro. Recomendo muito!',
                rating: 5,
              },
            ].map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-slate-50 rounded-2xl p-6 border border-slate-200"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold text-navy">{testimonial.name}</p>
                  <p className="text-sm text-slate-500">{testimonial.profession}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FAQ */}
      {/* ============================================ */}
      <section id="faq" className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-navy mb-4">
              Dúvidas Frequentes
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Tudo que você precisa saber antes de começar
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
            {[
              {
                q: 'Precisa de cartão de crédito?',
                a: 'Não! Você pode começar seu teste grátis de 7 dias sem informar nenhum dado de cartão. Apenas quando decidir continuar é que você precisa cadastrar uma forma de pagamento.',
              },
              {
                q: 'Tem fidelidade?',
                a: 'Não! Você pode cancelar sua assinatura a qualquer momento, sem multa ou taxa de cancelamento. Não acreditamos em amarrar nossos clientes.',
              },
              {
                q: 'Funciona no celular?',
                a: 'Sim! Nosso app é totalmente responsivo e funciona perfeitamente no celular, tablet e computador. Você pode criar orçamentos, enviar para clientes e acompanhar suas OS de qualquer lugar.',
              },
              {
                q: 'Quanto tempo leva para configurar?',
                a: 'Menos de 5 minutos! Basta criar sua conta, informar o nome da sua empresa e começar a usar. Não precisa de treinamento complexo ou configuração complicada.',
              },
            ].map((item, idx) => (
              <FAQItem key={idx} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PRICING */}
      {/* ============================================ */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-navy mb-4">
              Menos de um cafezinho por dia
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Investimento que se paga sozinho com o primeiro cliente
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-md mx-auto"
          >
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl shadow-blue-500/50 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
              
              <div className="relative z-10">
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-5xl font-bold">R$ 40</span>
                  <span className="text-xl text-blue-200">/mês</span>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>Orçamentos ilimitados</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>Clientes ilimitados</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>OS digitais</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>Financeiro completo</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>Suporte via WhatsApp</span>
                  </li>
                </ul>

                <Link to="/signup">
                  <Button
                    size="lg"
                    className="w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold text-lg py-4"
                  >
                    Começar Teste Grátis
                  </Button>
                </Link>

                <div className="flex flex-wrap gap-4 justify-center mt-6 text-sm">
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                    <Zap className="w-4 h-4" />
                    <span>7 Dias Grátis</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                    <Shield className="w-4 h-4" />
                    <span>Compra Segura</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                    <Coffee className="w-4 h-4" />
                    <span>Cancele quando quiser</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
