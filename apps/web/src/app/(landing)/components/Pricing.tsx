'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Básico',
    price: 'Gratis',
    description: 'Perfecto para empezar',
    features: ['1 tienda', 'Hasta 50 productos', 'MercadoPago', 'Soporte por email'],
    cta: 'Comenzar gratis',
    featured: false,
  },
  {
    name: 'Profesional',
    price: '$29/mes',
    description: 'Para negocios en crecimiento',
    features: ['Hasta 5 tiendas', 'Productos ilimitados', 'MercadoPago + Transbank', 'Soporte prioritario', 'Analíticas avanzadas'],
    cta: 'Probar gratis 14 días',
    featured: true,
  },
  {
    name: 'Empresarial',
    price: '$99/mes',
    description: 'Para grandes operaciones',
    features: ['Tiendas ilimitadas', 'Productos ilimitados', 'Todos los medios de pago', 'Soporte 24/7 dedicado', 'API personalizada', 'SSL Whitelabel'],
    cta: 'Contactar ventas',
    featured: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="relative py-24 overflow-hidden bg-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.08),transparent_50%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Precios <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">transparentes</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Sin comisiones ocultas ni sorpresas. Escoge el plan que mejor se adapte a tu negocio.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 grid gap-8 lg:grid-cols-3 items-start"
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 ${
                plan.featured
                  ? 'border-blue-500/50 bg-blue-600/10 shadow-xl shadow-blue-500/10 scale-105 lg:scale-110'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1 text-xs font-semibold text-white">
                  Más popular
                </div>
              )}
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{plan.description}</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
              </div>
              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register"
                className={`mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all duration-300 ${
                  plan.featured
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
                    : 'border border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
