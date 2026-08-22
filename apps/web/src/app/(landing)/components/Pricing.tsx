'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { Check, Info, TrendingDown } from 'lucide-react';

const plans = [
  {
    name: 'Básico',
    price: 'Gratis',
    period: 'para siempre',
    description: 'Perfecto para empezar tu negocio',
    features: ['1 tienda online', 'Hasta 50 productos', 'Pasarela MercadoPago', 'Soporte estándar por email'],
    cta: 'Comenzar gratis',
    featured: false,
  },
  {
    name: 'Profesional',
    price: '$26.900',
    period: '/mes',
    description: 'Para tiendas en crecimiento',
    features: [
      'Hasta 5 tiendas online',
      'Productos ilimitados',
      'MercadoPago + Webpay Plus',
      'Soporte prioritario 24/7',
      'Analíticas avanzadas de venta',
      'Control total de inventario y stock',
    ],
    cta: 'Probar gratis 14 días',
    featured: true,
  },
  {
    name: 'Empresarial',
    price: '$89.900',
    period: '/mes',
    description: 'Para marcas consolidadas y alto volumen',
    features: [
      'Tiendas ilimitadas',
      'Productos ilimitados',
      'Medios de pago personalizados',
      'Soporte dedicado dedicado',
      'API exclusiva para desarrolladores',
      'Dominio propio Whitelabel',
    ],
    cta: 'Contactar ventas',
    featured: false,
  },
];

export default function Pricing() {
  const [monthlySales, setMonthlySales] = useState(2000000); // Default to 2 million CLP

  // Calculations for savings comparison
  const shopifyBase = 27000; // ~29 USD
  const shopifyCommission = monthlySales * 0.02; // 2.0% commission
  const shopifyTotal = shopifyBase + shopifyCommission;

  const tiendanubeBase = 14900;
  const tiendanubeCommission = monthlySales * 0.015; // 1.5% commission
  const tiendanubeTotal = tiendanubeBase + tiendanubeCommission;

  const autoshoppingTotal = 26900; // Professional plan price

  const monthlySavings = shopifyTotal - autoshoppingTotal;
  const yearlySavings = monthlySavings * 12;

  return (
    <section id="pricing" className="relative py-24 overflow-hidden bg-slate-950">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.05),transparent_50%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-20">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-3"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Precios <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">transparentes, sin comisiones</span>
          </h2>
          <p className="mx-auto max-w-lg text-slate-400 text-sm leading-relaxed">
            Conserva el 100% de tus ingresos. Sin costos fantasmas, cargos ocultos ni comisiones por transacción.
          </p>
        </motion.div>

        {/* Dynamic Savings Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-sm p-6 sm:p-8 flex flex-col md:flex-row gap-8 shadow-xl"
        >
          {/* Slider input */}
          <div className="flex-1 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-3 py-0.5 text-[10px] font-bold text-indigo-400">
                <Info size={10} />
                <span>Simulador de Ahorro</span>
              </div>
              <h3 className="text-lg font-extrabold text-white mt-2">¿Cuánto vendes al mes?</h3>
              <p className="text-xs text-slate-400 mt-1">Usa la barra para calcular cuánto pagas de comisiones en otras plataformas.</p>
            </div>

            {/* Simulated Sales Slider */}
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400 text-xs font-semibold">Tus ventas mensuales:</span>
                <span className="text-xl font-black text-indigo-400 font-mono">
                  ${monthlySales.toLocaleString('es-CL')} CLP
                </span>
              </div>
              
              <input
                type="range"
                aria-label="Ventas mensuales estimadas"
                min="500000"
                max="25000000"
                step="500000"
                value={monthlySales}
                onChange={(e) => setMonthlySales(Number(e.target.value))}
                className="w-full h-1.5 rounded-lg bg-slate-800 appearance-none cursor-pointer accent-indigo-500"
              />
              
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>$500 MIL</span>
                <span>$10 MILLONES</span>
                <span>$25 MILLONES</span>
              </div>
            </div>
          </div>

          {/* Calculator Output */}
          <div className="md:w-96 rounded-xl bg-slate-950/80 border border-slate-800/80 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold border-b border-slate-900 pb-2">
                <span>Plataforma</span>
                <span>Costo Total Estimado</span>
              </div>
              
              <div className="flex justify-between text-xs font-medium text-slate-400">
                <span>Shopify (Plan Base + 2% comisión)</span>
                <span className="font-mono text-white">${Math.round(shopifyTotal).toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-400">
                <span>Tiendanube (Plan Base + 1.5% comisión)</span>
                <span className="font-mono text-white">${Math.round(tiendanubeTotal).toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-indigo-400 border-t border-slate-900 pt-2.5">
                <span>AutoShopping (Plan Pro - 0% comisión)</span>
                <span className="font-mono text-indigo-400">${autoshoppingTotal.toLocaleString('es-CL')}</span>
              </div>
            </div>

            {/* Savings Callout */}
            <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-md bg-indigo-500 text-white flex items-center justify-center">
                <TrendingDown size={16} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-indigo-300">AHORRO NETO ESTIMADO</p>
                <p className="text-sm font-extrabold text-white">
                  ${Math.round(monthlySavings).toLocaleString('es-CL')} <span className="text-[10px] text-slate-400 font-normal">/mes</span>
                </p>
                <p className="text-[8px] text-slate-500 font-bold mt-0.5">(${Math.round(yearlySavings).toLocaleString('es-CL')} al año)</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pricing Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid gap-8 lg:grid-cols-3 items-stretch pt-4"
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between ${
                plan.featured
                  ? 'border-indigo-500 bg-indigo-500/[0.04] shadow-xl shadow-indigo-500/5 scale-100 lg:scale-105 z-10'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1 text-[10px] font-extrabold text-white uppercase tracking-wider">
                  Recomendado
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-extrabold text-white tracking-tight">{plan.name}</h3>
                <p className="mt-1 text-xs text-slate-400 font-medium leading-snug">{plan.description}</p>
                
                <div className="mt-6 flex items-baseline gap-1 text-white">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">{plan.price}</span>
                  <span className="text-xs text-slate-400 font-semibold">{plan.period}</span>
                </div>

                <ul className="mt-8 space-y-3.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-xs text-slate-300 font-medium">
                      <Check className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/auth/register"
                className={`mt-8 block w-full rounded-xl py-3 text-center text-xs font-extrabold transition-all duration-300 ${
                  plan.featured
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/45 hover:scale-102'
                    : 'border border-slate-800 text-slate-200 bg-slate-900/40 hover:bg-slate-800'
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
