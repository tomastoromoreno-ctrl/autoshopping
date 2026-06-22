'use client';

import { motion } from 'framer-motion';
import { UserPlus, Settings, ShoppingBag } from 'lucide-react';

const steps = [
  { icon: UserPlus, title: 'Regístrate', description: 'Crea tu cuenta en menos de 2 minutos. Solo necesitas tu correo y una contraseña.' },
  { icon: Settings, title: 'Configura tu tienda', description: 'Agrega productos, personaliza el diseño y define tus métodos de pago favoritos.' },
  { icon: ShoppingBag, title: 'Empieza a vender', description: 'Comparte tu tienda con el mundo y comienza a recibir pedidos al instante.' },
];

export default function HowItWorks() {
  return (
    <section className="relative py-24 overflow-hidden bg-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_50%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Cómo funciona
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Empezar a vender online nunca fue tan fácil. Solo sigue estos tres pasos.
          </p>
        </motion.div>

        <div className="relative mt-16 grid gap-12 md:grid-cols-3">
          <div className="absolute top-12 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-0.5 hidden md:block bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-700/60 bg-slate-900/90 shadow-2xl backdrop-blur-md transition-all duration-500 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                  {/* Glow layer */}
                  <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 opacity-40 blur-md transition-all" />
                  
                  {/* Technical radial pattern */}
                  <svg className="absolute inset-0 h-full w-full stroke-slate-800/80" fill="none" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="28" strokeDasharray="3 3" />
                    <circle cx="50" cy="50" r="36" opacity="0.3" />
                    <line x1="50" y1="10" x2="50" y2="90" strokeDasharray="2 4" opacity="0.2" />
                    <line x1="10" y1="50" x2="90" y2="50" strokeDasharray="2 4" opacity="0.2" />
                  </svg>
                  
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: -5 }}
                    className="relative z-10 text-blue-400 hover:text-white"
                  >
                    <Icon className="h-8 w-8 stroke-[1.5]" />
                  </motion.div>
                </div>
                <div className="mt-4 flex items-center justify-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 text-sm font-semibold text-blue-300">
                    {index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-xs">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
