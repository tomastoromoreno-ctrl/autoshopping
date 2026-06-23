'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, Server, Zap } from 'lucide-react';

export default function CTA() {
  return (
    <section className="relative py-28 overflow-hidden bg-slate-950">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.06),transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.008)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.008)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* Glow Envelope Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl border border-slate-800/80 bg-slate-900/10 p-8 sm:p-12 lg:p-16 overflow-hidden backdrop-blur-sm text-center space-y-6"
        >
          {/* Neon side glows */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />

          {/* Icon Badge */}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
              Comienza a vender en tu propia tienda hoy mismo
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
              Únete a la nueva generación de e-commerce en Chile. Crea tu plataforma autoadministrable sin pagar comisiones por tus ventas.
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/45 transition-all duration-300 hover:scale-103"
            >
              Crear mi tienda gratis
              <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm px-8 py-4 text-xs sm:text-sm font-extrabold text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-300"
            >
              Ver planes de pago
            </Link>
          </div>

          {/* Tech decorative icons */}
          <div className="absolute top-8 right-8 text-slate-700 opacity-20 hidden md:block animate-float">
            <Server size={32} />
          </div>
          <div className="absolute bottom-8 left-8 text-slate-700 opacity-20 hidden md:block animate-float-slow">
            <Zap size={32} />
          </div>

        </motion.div>
      </div>
    </section>
  );
}
