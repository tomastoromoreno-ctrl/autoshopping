'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-[#0f172a] to-indigo-950">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-purple-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-40 left-1/3 w-[25rem] h-[25rem] bg-teal-500/15 rounded-full blur-3xl animate-blob animation-delay-4000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300 backdrop-blur-sm mb-8">
            <Sparkles className="h-4 w-4" />
            <span>La plataforma todo-en-uno para tu e-commerce</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight"
        >
          <span className="text-white">Crea tu tienda online</span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
            en minutos
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-slate-300 leading-relaxed"
        >
          Lanza tu e-commerce sin conocimientos técnicos. Personaliza, vende y haz crecer tu negocio con la plataforma más completa del mercado.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/auth/register"
            className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
          >
            Crear mi tienda gratis
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800/50 backdrop-blur-sm px-8 py-4 text-base font-semibold text-slate-200 hover:bg-slate-700/50 transition-all duration-300 hover:border-slate-500"
          >
            Conocer más
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-20 relative"
        >
          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-700/50 bg-slate-900 shadow-2xl overflow-hidden text-left">
            {/* Cabecera del Navegador (Microsoft Edge Layout) */}
            <div className="bg-slate-950 px-4 pt-2 pb-2 border-b border-slate-800/80">
              {/* Pestañas de Edge */}
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-t-lg text-slate-200 border-t border-x border-slate-800/80 max-w-[120px] truncate">
                  <span className="text-[10px]">📊</span>
                  <span>SportShop | Panel</span>
                  <span className="text-[8px] text-slate-500 ml-1 hover:text-slate-200">✕</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 text-slate-500 hover:text-slate-300 cursor-pointer">
                  <span>+</span>
                </div>
                <div className="flex-1" />
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-800 hover:bg-slate-700" />
                  <div className="w-3 h-3 rounded-full bg-slate-800 hover:bg-slate-700" />
                  <div className="w-3 h-3 rounded-full bg-slate-800 hover:bg-slate-700" />
                </div>
              </div>

              {/* Barra de Direcciones e Iconos de Edge */}
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex gap-2 text-xs text-slate-500">
                  <span className="hover:text-slate-300 cursor-pointer">←</span>
                  <span className="hover:text-slate-300 cursor-pointer">→</span>
                  <span className="hover:text-slate-300 cursor-pointer">↻</span>
                  <span className="hover:text-slate-300 cursor-pointer">⌂</span>
                </div>
                <div className="flex-1 h-6 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-between px-3 text-[10px] text-slate-400 font-sans">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-500 text-[8px]">🔒</span>
                    <span className="text-slate-500">sportshop.autoshopping.cl/dashboard/products</span>
                  </div>
                  <span className="text-slate-500 text-[8px]">⭐</span>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] text-slate-300 border border-slate-700">👤</div>
                  <span className="text-slate-500 text-xs">⋯</span>
                </div>
              </div>
            </div>

            {/* Contenido del Dashboard (Light Theme - Fiel al diseño real) */}
            <div className="bg-slate-50 flex min-h-[340px] font-sans">
              {/* Sidebar del Dashboard */}
              <aside className="w-44 bg-white border-r border-slate-200 p-3 hidden sm:flex flex-col gap-4">
                <div className="flex items-center gap-2 px-1 py-0.5">
                  <div className="w-5 h-5 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">AS</div>
                  <span className="font-bold text-[10px] text-slate-800 tracking-tight">AutoShopping</span>
                </div>
                <nav className="space-y-0.5">
                  {[
                    { label: 'Dashboard', icon: '◉', active: false },
                    { label: 'Productos', icon: '◈', active: true },
                    { label: 'Categorías', icon: '◎', active: false },
                    { label: 'Promociones', icon: '★', active: false },
                    { label: 'Órdenes', icon: '☰', active: false },
                    { label: 'Configuración', icon: '⚙', active: false },
                    { label: 'Apariencia', icon: '◐', active: false },
                    { label: 'Usuarios', icon: '♢', active: false },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 px-2 py-1 rounded-md text-[9px] font-medium transition-colors ${
                        item.active
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-800'
                      }`}
                    >
                      <span className="text-xs opacity-80">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </nav>
              </aside>

              {/* Contenido Principal */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Header del Dashboard */}
                <header className="h-10 bg-white border-b border-slate-200 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 sm:hidden">
                    <span className="text-slate-600 text-xs">☰</span>
                    <span className="font-bold text-[10px] text-blue-600">AutoShopping</span>
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500 font-medium">sportshop_admin</span>
                    <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px]">👤</div>
                  </div>
                </header>

                {/* Vista de Productos */}
                <div className="p-4 flex-1 overflow-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xs font-bold text-slate-900 leading-tight">Productos</h2>
                      <p className="text-[8px] text-slate-400">Administra el inventario de tu e-commerce</p>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="rounded bg-blue-600 px-2 py-1 text-[8px] font-semibold text-white shadow-sm flex items-center gap-1 hover:bg-blue-700 cursor-pointer">
                        <span>+ Agregar producto</span>
                      </div>
                    </div>
                  </div>

                  {/* Barra de Filtros */}
                  <div className="mt-3 flex gap-1.5">
                    <div className="h-6 rounded border border-slate-200 bg-white flex items-center px-2 text-[8px] text-slate-400 w-32">
                      Buscar productos...
                    </div>
                    <div className="h-6 rounded border border-slate-200 bg-white flex items-center px-2 text-[8px] text-slate-400 w-24">
                      Categoría ▾
                    </div>
                  </div>

                  {/* Tabla de Productos */}
                  <div className="mt-3 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-left text-[8px] text-slate-500">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold">
                          <th className="px-3 py-1.5 font-medium">Imagen</th>
                          <th className="px-3 py-1.5 font-medium">Nombre</th>
                          <th className="px-3 py-1.5 font-medium">Precio</th>
                          <th className="px-3 py-1.5 font-medium">Stock</th>
                          <th className="px-3 py-1.5 font-medium">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          {
                            name: 'Zapatillas Alpha Run Pro',
                            price: '$45.990',
                            stock: '15',
                            image: '/mockup_shoe.png',
                            status: 'active'
                          },
                          {
                            name: 'Camiseta Dry-Fit Breathable',
                            price: '$19.990',
                            stock: '24',
                            image: '/mockup_shirt.png',
                            status: 'active'
                          },
                          {
                            name: 'Smartwatch Alpha Active',
                            price: '$89.990',
                            stock: '8',
                            image: '/mockup_watch.png',
                            status: 'active'
                          }
                        ].map((prod, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="px-3 py-1">
                              <img src={prod.image} alt={prod.name} className="w-5 h-5 rounded border border-slate-100 object-cover" />
                            </td>
                            <td className="px-3 py-1 font-bold text-slate-800">{prod.name}</td>
                            <td className="px-3 py-1 text-slate-900 font-semibold">{prod.price}</td>
                            <td className="px-3 py-1 text-slate-600">{prod.stock} un.</td>
                            <td className="px-3 py-1">
                              <span className="px-1.5 py-0.5 rounded-full text-[7px] bg-green-50 text-green-600 font-medium capitalize">
                                {prod.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -top-6 -right-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 backdrop-blur-sm animate-float flex items-center justify-center text-xl">🛍️</div>
          <div className="absolute -bottom-4 -left-4 w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500/20 to-blue-500/20 border border-teal-500/30 backdrop-blur-sm animate-float-slow flex items-center justify-center text-lg">💳</div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <span className="text-xs">Desplázate para conocer más</span>
          <div className="w-5 h-8 rounded-full border border-slate-600 flex justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-slate-400 animate-bounce" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
