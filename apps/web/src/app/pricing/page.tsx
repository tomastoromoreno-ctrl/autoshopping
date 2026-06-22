'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: '$0',
    period: '/mes',
    description: 'Perfecto para empezar a vender online',
    features: [
      'Tienda online personalizada',
      'Hasta 50 productos',
      'Pasarela de pago MercadoPago',
      'Dominio personalizado',
      'Dashboard de pedidos',
      'Soporte por email',
    ],
    cta: 'Empezar gratis',
    href: '/auth/register',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '$19.990',
    period: '/mes',
    description: 'Para tiendas que están creciendo',
    features: [
      'Todo lo del plan Starter',
      'Productos ilimitados',
      'Cupones y descuentos',
      'Analytics avanzados',
      'Múltiples métodos de pago',
      'Envíos integrados',
      'Soporte prioritario',
      'Sin comisión por venta',
    ],
    cta: 'Empezar prueba gratis',
    href: '/auth/register',
    highlight: true,
  },
  {
    name: 'Pro',
    price: '$49.990',
    period: '/mes',
    description: 'Para tiendas establecidas que quieren escalar',
    features: [
      'Todo lo del plan Growth',
      'Multi-bodega',
      'Blog integrado',
      'WhatsApp Commerce',
      'Facturación electrónica SII',
      'API completa',
      'Soporte dedicado 24/7',
      'Personalización avanzada',
    ],
    cta: 'Contactar ventas',
    href: '/auth/register',
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Precios simples y transparentes</h1>
        <p className="mt-3 text-lg text-slate-500">Elige el plan que mejor se adapte a tu negocio</p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.name} className={`relative rounded-2xl border p-6 sm:p-8 flex flex-col ${plan.highlight ? 'border-blue-600 bg-white shadow-lg shadow-blue-100' : 'border-slate-200 bg-white'}`}>
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">Más popular</div>
            )}
            <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-bold text-slate-900">{plan.price}</span>
              <span className="text-sm text-slate-500">{plan.period}</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{plan.description}</p>
            <ul className="mt-6 space-y-3 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /> {f}
                </li>
              ))}
            </ul>
            <Link href={plan.href}
              className={`mt-8 block rounded-lg py-2.5 text-center text-sm font-medium transition-colors ${plan.highlight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 max-w-2xl text-center">
        <p className="text-sm text-slate-500">Todos los planes incluyen SSL, CDN global y 99.9% uptime. Sin costos ocultos.</p>
      </div>
    </div>
  );
}
