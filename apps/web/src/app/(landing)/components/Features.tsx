'use client';

import { motion, useMotionValue, useMotionTemplate } from 'framer-motion';
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
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
} as const;

interface FeatureCardProps {
  icon: any;
  title: string;
  description: string;
  color: string;
}

function FeatureCard({ icon: Icon, title, description, color }: FeatureCardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      variants={cardVariants}
      onMouseMove={handleMouseMove}
      className="group relative rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-sm p-6 overflow-hidden transition-all duration-300 hover:bg-slate-900/40"
    >
      {/* Background Spotlight Glow */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300 z-0"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              160px circle at ${mouseX}px ${mouseY}px,
              rgba(99, 102, 241, 0.08),
              transparent 80%
            )
          `,
        }}
      />

      {/* Border Spotlight Highlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300 z-10 border border-indigo-500/35"
        style={{
          maskImage: useMotionTemplate`
            radial-gradient(
              130px circle at ${mouseX}px ${mouseY}px,
              white,
              transparent 70%
            )
          `,
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(
              130px circle at ${mouseX}px ${mouseY}px,
              white,
              transparent 70%
            )
          `,
        }}
      />

      {/* Icon Area */}
      <div className="relative mb-5 flex h-13 w-13 items-center justify-center rounded-xl border border-slate-800/80 bg-slate-950/50 shadow-inner backdrop-blur-sm transition-all duration-500 group-hover:border-indigo-500/30 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.1)]">
        {/* Glow behind icon */}
        <div className={`absolute -inset-1 rounded-xl bg-gradient-to-br ${color} opacity-15 blur-sm transition-all duration-500 group-hover:opacity-30`} />
        
        {/* Grid pattern background */}
        <svg className="absolute inset-0 h-full w-full stroke-slate-800/50 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]" aria-hidden="true">
          <defs>
            <pattern id={`grid-${title}`} width="6" height="6" patternUnits="userSpaceOnUse" x="-1" y="-1">
              <path d="M.5 6V.5H6" fill="none" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" strokeWidth="0" fill={`url(#grid-${title})`} />
        </svg>

        {/* Animated Icon */}
        <motion.div
          whileHover={{ scale: 1.12, rotate: 6 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="relative z-10 text-slate-400 group-hover:text-slate-200"
        >
          <Icon className="h-5.5 w-5.5 stroke-[1.8]" />
        </motion.div>
      </div>

      <h3 className="mt-2 text-base font-bold text-white tracking-tight">{title}</h3>
      <p className="mt-2 text-xs text-slate-400 leading-relaxed font-medium">{description}</p>
      
      {/* Dynamic bottom line slide-in */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
    </motion.div>
  );
}

export default function Features() {
  return (
    <section id="features" className="relative py-24 overflow-hidden bg-slate-950">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(99,102,241,0.06),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_85%,rgba(59,130,246,0.06),transparent_50%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-3"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-none">
            Todo lo necesario para{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              escalar tu venta
            </span>
          </h2>
          <p className="mx-auto max-w-lg text-slate-400 text-sm leading-relaxed">
            Módulos optimizados para darte autonomía absoluta y potenciar tu negocio sin complicaciones técnicas.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              color={feature.color}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
