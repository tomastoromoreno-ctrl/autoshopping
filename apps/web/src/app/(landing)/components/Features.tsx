'use client';

import { motion } from 'framer-motion';
import { ShoppingCart, CreditCard, Palette, BarChart3, Shield, Headphones } from 'lucide-react';

const features = [
  { icon: ShoppingCart, title: 'Catálogo Digital', description: 'Crea tu propia tienda online personalizada con carrito de compras integrado.', color: 'from-blue-500 to-blue-600' },
  { icon: CreditCard, title: 'Pagos integrados', description: 'Acepta pagos con MercadoPago y Transbank sin complicaciones.', color: 'from-purple-500 to-purple-600' },
  { icon: Palette, title: 'Personalizable', description: 'Personaliza el diseño de tu tienda sin tocar una línea de código.', color: 'from-pink-500 to-pink-600' },
  { icon: BarChart3, title: 'Analíticas', description: 'Dashboard completo con ventas, visitas y comportamiento de clientes.', color: 'from-amber-500 to-amber-600' },
  { icon: Shield, title: 'Seguro', description: 'Tu negocio protegido con los más altos estándares de seguridad.', color: 'from-green-500 to-green-600' },
  { icon: Headphones, title: 'Soporte 24/7', description: 'Equipo de soporte disponible siempre que lo necesites.', color: 'from-teal-500 to-teal-600' },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Features() {
  return (
    <section id="features" className="relative py-24 overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.08),transparent_50%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Todo lo que necesitas para{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">vender online</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Herramientas diseñadas para que puedas enfocarte en lo que importa: tu negocio.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                className="group relative rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6 transition-all duration-300 hover:border-slate-700 hover:bg-slate-800/50 hover:shadow-xl hover:shadow-blue-500/5"
              >
                <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700/50 bg-slate-900/80 shadow-inner backdrop-blur-md transition-all duration-500 group-hover:border-blue-500/50 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                  {/* Resplandor trasero de fondo */}
                  <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-br ${feature.color} opacity-20 blur-sm transition-all duration-500 group-hover:opacity-40`} />
                  
                  {/* Patrón de Rejilla técnica de fondo */}
                  <svg className="absolute inset-0 h-full w-full stroke-slate-800/60 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]" aria-hidden="true">
                    <defs>
                      <pattern id={`grid-${feature.title}`} width="8" height="8" patternUnits="userSpaceOnUse" x="-1" y="-1">
                        <path d="M.5 8V.5H8" fill="none" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" strokeWidth="0" fill={`url(#grid-${feature.title})`} />
                  </svg>

                  {/* Icono animado */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="relative z-10 text-slate-300 group-hover:text-white"
                  >
                    <Icon className="h-6 w-6 stroke-[1.75]" />
                  </motion.div>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
