import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface StatProps {
  value: number;
  suffix?: string;
  label: string;
  prefix?: string;
}

function StatCounter({ value, suffix = '', label, prefix = '' }: StatProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  });
  
  const displayValue = useTransform(springValue, (latest) => Math.floor(latest));

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-gold mb-2">
        {prefix}
        <motion.span>
          {displayValue}
        </motion.span>
        {suffix}
      </div>
      <p className="text-sm md:text-base text-paper-white/70 uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}

export default function StatsCounter() {
  return (
    <section id="numeros" className="py-16 md:py-32 bg-deep-navy">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <StatCounter value={500} prefix="+" suffix="" label="Varandas Blindadas" />
          <StatCounter value={0} suffix="" label="Acidentes Registrados" />
          <StatCounter value={24} suffix="h" label="Tempo de Resposta" />
          <StatCounter value={100} suffix="%" label="Aprovação Técnica" />
        </div>
      </div>
    </section>
  );
}

