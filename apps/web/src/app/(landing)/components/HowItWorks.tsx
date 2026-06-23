'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { UserPlus, Settings, ShoppingBag } from 'lucide-react';

const steps = [
  { icon: UserPlus, title: 'Crea tu Cuenta', description: 'Regístrate en menos de 2 minutos. Solo necesitas un correo electrónico y una contraseña.' },
  { icon: Settings, title: 'Configura a tu Pinta', description: 'Agrega tus productos, personaliza la apariencia y define tus pasarelas de pago favoritas.' },
  { icon: ShoppingBag, title: '¡A Vender!', description: 'Comparte el enlace de tu tienda con el mundo y empieza a recibir pedidos al instante.' },
];

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll progress of this section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'center center'],
  });

  // Map scroll progress to line width
  const lineWidth = useTransform(scrollYProgress, [0.1, 0.8], ['0%', '100%']);

  return (
    <section ref={containerRef} className="relative py-24 overflow-hidden bg-slate-900">
      {/* Background radial highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.03),transparent_50%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-3"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Empezar es simple
          </h2>
          <p className="mx-auto max-w-md text-slate-400 text-sm leading-relaxed">
            Consigue tu e-commerce totalmente funcional siguiendo tres sencillos pasos.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="relative mt-20 grid gap-12 md:grid-cols-3">
          
          {/* Animated Connecting Line (desktop only) */}
          <div className="absolute top-10 left-[20%] right-[20%] h-[3px] hidden md:block bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              style={{ width: lineWidth }}
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"
            />
          </div>

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: index * 0.15, duration: 0.5, ease: 'easeOut' }}
                className="relative flex flex-col items-center text-center group cursor-pointer"
              >
                {/* Step Circle Card */}
                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/80 shadow-xl backdrop-blur-md transition-all duration-500 group-hover:border-indigo-500/40 group-hover:shadow-[0_0_25px_rgba(99,102,241,0.15)]">
                  {/* Hover radial glow effect */}
                  <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500" />
                  
                  {/* Tech dials SVG overlay */}
                  <svg className="absolute inset-0 h-full w-full stroke-slate-800/60" fill="none" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="28" strokeDasharray="4 4" className="group-hover:stroke-indigo-500/20 transition-all duration-500" />
                    <circle cx="50" cy="50" r="36" opacity="0.2" className="group-hover:opacity-40 transition-all duration-500" />
                    <line x1="50" y1="10" x2="50" y2="90" strokeDasharray="1 5" opacity="0.1" />
                    <line x1="10" y1="50" x2="90" y2="50" strokeDasharray="1 5" opacity="0.1" />
                  </svg>
                  
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: -4 }}
                    className="relative z-10 text-indigo-400 group-hover:text-white transition-colors duration-300"
                  >
                    <Icon className="h-7 w-7 stroke-[1.8]" />
                  </motion.div>
                </div>

                {/* Step Number Badge */}
                <div className="mt-5 flex items-center justify-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-950 border border-slate-800 text-xs font-bold text-slate-400 group-hover:bg-indigo-500 group-hover:border-indigo-600 group-hover:text-white transition-all duration-500">
                    {index + 1}
                  </span>
                </div>

                {/* Text Description */}
                <h3 className="mt-4 text-base font-extrabold text-white tracking-tight leading-none group-hover:text-indigo-300 transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed max-w-[240px] font-medium">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
