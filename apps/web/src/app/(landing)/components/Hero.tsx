'use client';

import { motion, useMotionValue, useMotionTemplate, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, TrendingUp, DollarSign, ShoppingBag, Palette, Plus, Check, Upload, Download, BookOpen } from 'lucide-react';

interface MockProduct {
  id: number;
  name: string;
  price: string;
  stock: number;
  image: string;
  category: string;
}

export default function Hero() {
  // Mouse position tracking for background spotlight
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!sectionRef.current) return;
    const { left, top } = sectionRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  // Magnetic button physics
  const [magnetic1, setMagnetic1] = useState({ x: 0, y: 0 });
  const [magnetic2, setMagnetic2] = useState({ x: 0, y: 0 });

  const handleMagnetic = (e: React.MouseEvent, buttonIndex: 1 | 2) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;
    
    const setMagnetic = buttonIndex === 1 ? setMagnetic1 : setMagnetic2;
    setMagnetic({ x: distanceX * 0.35, y: distanceY * 0.35 });
  };

  const resetMagnetic = (buttonIndex: 1 | 2) => {
    const setMagnetic = buttonIndex === 1 ? setMagnetic1 : setMagnetic2;
    setMagnetic({ x: 0, y: 0 });
  };

  // Dashboard Mockup State
  const [activeTab, setActiveTab] = useState<'sales' | 'products' | 'import' | 'customize'>('sales');
  const [mockColor, setMockColor] = useState<'blue' | 'purple' | 'amber' | 'emerald'>('blue');
  const [mockFont, setMockFont] = useState<string>('Inter');
  const [mockProducts, setMockProducts] = useState<MockProduct[]>([
    { id: 1, name: 'Zapatillas Alpha Run Pro', price: '$45.990', stock: 15, image: '👟', category: 'Calzado' },
    { id: 2, name: 'Cortaviento Impermeable Trail', price: '$29.990', stock: 8, image: '🧥', category: 'Ropa' },
    { id: 3, name: 'Smartwatch Alpha Active', price: '$89.990', stock: 24, image: '⌚', category: 'Accesorios' },
  ]);

  const addProduct = () => {
    const names = [
      'Polera Dry-Fit Pro',
      'Mochila Ciclismo Trail',
      'Botella Térmica Sport',
      'Calcetines Compresión',
      'Gorro Running Light',
    ];
    const icons = ['👕', '🎒', '🧪', '🧦', '🧢'];
    const prices = ['$14.990', '$34.990', '$12.990', '$9.990', '$11.990'];
    const randomIndex = Math.floor(Math.random() * names.length);
    
    const newProduct: MockProduct = {
      id: Date.now(),
      name: names[randomIndex],
      price: prices[randomIndex],
      stock: Math.floor(Math.random() * 30) + 5,
      image: icons[randomIndex],
      category: 'Deportes',
    };
    setMockProducts([newProduct, ...mockProducts.slice(0, 3)]);
  };

  // Color classes map for mockup dashboard
  const colorMap = {
    blue: {
      bg: 'bg-blue-600',
      text: 'text-blue-600',
      border: 'border-blue-200',
      accentBg: 'bg-blue-50',
      accentBorder: 'border-blue-600',
    },
    purple: {
      bg: 'bg-purple-600',
      text: 'text-purple-600',
      border: 'border-purple-200',
      accentBg: 'bg-purple-50',
      accentBorder: 'border-purple-600',
    },
    amber: {
      bg: 'bg-amber-600',
      text: 'text-amber-600',
      border: 'border-amber-200',
      accentBg: 'bg-amber-50',
      accentBorder: 'border-amber-600',
    },
    emerald: {
      bg: 'bg-emerald-600',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      accentBg: 'bg-emerald-50',
      accentBorder: 'border-emerald-600',
    },
  };

  const selectedClasses = colorMap[mockColor];

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-[#0b0f19] to-slate-950 py-20 px-4"
    >
      {/* Dynamic Grid Background with Cursor Tracking */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:50px_50px]" />
        
        {/* Glow Spotlight mapping mouseX/mouseY */}
        <motion.div
          className="pointer-events-none absolute -inset-px opacity-60 transition duration-300"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                700px circle at ${mouseX}px ${mouseY}px,
                rgba(99, 102, 241, 0.12),
                rgba(59, 130, 246, 0.08) 35%,
                transparent 70%
              )
            `,
          }}
        />
        
        {/* Ambient Blur Blobs */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl w-full grid lg:grid-cols-12 gap-12 items-center">
        {/* Left Side Info */}
        <div className="lg:col-span-6 text-center lg:text-left space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-xs font-semibold text-blue-400 backdrop-blur-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>SaaS Multitienda Inteligente para E-Commerce</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]"
          >
            Lanza tu tienda online, <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              sin límites.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed"
          >
            La plataforma multi-tenant definitiva para vender en minutos. Configuración automática de subdominios, facturación SII simplificada e integraciones de pago integradas.
          </motion.p>

          {/* Interactive CTAs with magnetic behavior */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4"
          >
            <motion.div
              animate={{ x: magnetic1.x, y: magnetic1.y }}
              transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
              onMouseMove={(e) => handleMagnetic(e, 1)}
              onMouseLeave={() => resetMagnetic(1)}
              className="w-full sm:w-auto"
            >
              <Link
                href="/auth/register"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
              >
                Comenzar gratis
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>

            <motion.div
              animate={{ x: magnetic2.x, y: magnetic2.y }}
              transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
              onMouseMove={(e) => handleMagnetic(e, 2)}
              onMouseLeave={() => resetMagnetic(2)}
              className="w-full sm:w-auto"
            >
              <Link
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm px-7 py-3.5 text-sm font-bold text-slate-300 hover:bg-slate-800/80 transition-all duration-300"
              >
                Explorar características
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Side Showcase - Interactive Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:col-span-6 w-full relative"
        >
          {/* Dashboard Window Container */}
          <div className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-md shadow-2xl overflow-hidden text-left flex flex-col">
            
            {/* Edge-like Browser Header */}
            <div className="bg-slate-900 px-4 py-3 border-b border-slate-800/80 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                {/* Window Dots */}
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                </div>
                {/* Active Tab */}
                <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800/50 px-3 py-1 rounded-md text-[10px] text-slate-300 font-sans ml-4 max-w-[150px] truncate">
                  <span className="text-[10px]">⚙️</span>
                  <span>Mi Tienda | AutoShopping</span>
                </div>
                <div className="flex-1" />
                <span className="text-slate-500 text-xs font-mono font-bold">127.0.0.1:3000</span>
              </div>

              {/* Address bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-7 rounded bg-slate-950 border border-slate-800 flex items-center px-3 text-[10px] text-slate-500 font-mono">
                  <span className="text-emerald-500 mr-1.5">🔒</span>
                  <span>https://sportshop.autoshopping.cl/dashboard</span>
                </div>
              </div>
            </div>

            {/* Dashboard Sidebar & Content */}
            <div className="bg-slate-50 min-h-[380px] flex font-sans text-slate-800">
              
              {/* Mock Sidebar */}
              <aside className="w-36 bg-white border-r border-slate-200 p-2.5 hidden sm:flex flex-col gap-4">
                <div className="flex items-center gap-2 px-1.5">
                  <div className={`w-5.5 h-5.5 rounded-lg ${selectedClasses.bg} flex items-center justify-center text-white text-[10px] font-bold shadow-sm transition-colors duration-500`}>
                    AS
                  </div>
                  <span className="font-extrabold text-[10px] text-slate-800 tracking-tight">AutoShopping</span>
                </div>
                
                <nav className="space-y-1">
                  {[
                    { key: 'sales', label: 'Ventas', icon: <TrendingUp size={12} /> },
                    { key: 'products', label: 'Productos', icon: <ShoppingBag size={12} /> },
                    { key: 'import', label: 'Importación XLSX', icon: <Upload size={12} /> },
                    { key: 'customize', label: 'Personalizar', icon: <Palette size={12} /> },
                  ].map((item) => {
                    const isSelected = activeTab === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setActiveTab(item.key as any)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] font-semibold transition-all ${
                          isSelected
                            ? `${selectedClasses.accentBg} ${selectedClasses.text} border-l-2 ${selectedClasses.accentBorder}`
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </aside>

              {/* Main Content Area */}
              <main className="flex-1 p-4 sm:p-5 flex flex-col justify-between overflow-hidden">
                <AnimatePresence mode="wait">
                  {/* Tab 1: Sales statistics */}
                  {activeTab === 'sales' && (
                    <motion.div
                      key="sales"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 w-full h-full flex flex-col"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 leading-tight">Panel de Ventas</h3>
                          <p className="text-[9px] text-slate-400">Resumen del rendimiento mensual</p>
                        </div>
                        <span className="text-[9px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full">+24% vs ayer</span>
                      </div>

                      {/* Info cards */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-sm flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-md ${selectedClasses.accentBg} ${selectedClasses.text}`}>
                            <DollarSign size={14} />
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-400 font-medium">Ingresos Totales</p>
                            <p className="text-xs font-bold text-slate-900">$2.450.900</p>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-sm flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-md ${selectedClasses.accentBg} ${selectedClasses.text}`}>
                            <TrendingUp size={14} />
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-400 font-medium">Conversión</p>
                            <p className="text-xs font-bold text-slate-900">4.2%</p>
                          </div>
                        </div>
                      </div>

                      {/* SVG Line Chart Animation */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-sm flex-1 flex flex-col justify-between min-h-[100px]">
                        <div className="flex justify-between items-center text-[7px] text-slate-400 font-mono">
                          <span>Gráfico de Ventas</span>
                          <span>CLP/día</span>
                        </div>
                        <div className="relative w-full h-14 flex items-end">
                          <svg className="w-full h-full overflow-visible" viewBox="0 0 200 60">
                            {/* SVG Grid Lines */}
                            <line x1="0" y1="15" x2="200" y2="15" stroke="#f1f5f9" strokeWidth="1" />
                            <line x1="0" y1="35" x2="200" y2="35" stroke="#f1f5f9" strokeWidth="1" />
                            <line x1="0" y1="55" x2="200" y2="55" stroke="#f1f5f9" strokeWidth="1" />
                            
                            {/* Animated line path */}
                            <motion.path
                              d="M0,50 Q25,45 50,25 T100,30 T150,10 T200,5"
                              fill="none"
                              stroke={mockColor === 'blue' ? '#2563eb' : mockColor === 'purple' ? '#9333ea' : mockColor === 'amber' ? '#d97706' : '#059669'}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 1.2, ease: 'easeOut' }}
                            />
                            {/* Animated gradient area underneath */}
                            <motion.path
                              d="M0,50 Q25,45 50,25 T100,30 T150,10 T200,5 L200,60 L0,60 Z"
                              fill={mockColor === 'blue' ? 'url(#blueGrad)' : mockColor === 'purple' ? 'url(#purpleGrad)' : mockColor === 'amber' ? 'url(#amberGrad)' : 'url(#emeraldGrad)'}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 0.12 }}
                              transition={{ delay: 0.8 }}
                            />
                            <defs>
                              <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2563eb" />
                                <stop offset="100%" stopColor="#ffffff" />
                              </linearGradient>
                              <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#9333ea" />
                                <stop offset="100%" stopColor="#ffffff" />
                              </linearGradient>
                              <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#d97706" />
                                <stop offset="100%" stopColor="#ffffff" />
                              </linearGradient>
                              <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#059669" />
                                <stop offset="100%" stopColor="#ffffff" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Tab 2: Products management */}
                  {activeTab === 'products' && (
                    <motion.div
                      key="products"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 w-full h-full flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 leading-tight">Inventario de Productos</h3>
                          <p className="text-[9px] text-slate-400">Agrega o edita items en tu catálogo</p>
                        </div>
                        <button
                          onClick={addProduct}
                          className={`rounded px-2.5 py-1.5 text-[8px] font-bold text-white shadow-sm flex items-center gap-1 cursor-pointer transition ${selectedClasses.bg} hover:opacity-90`}
                        >
                          <Plus size={10} />
                          <span>Agregar Producto</span>
                        </button>
                      </div>

                      {/* Product list */}
                      <div className="bg-white border border-slate-200/80 rounded-lg overflow-hidden flex-1 shadow-sm">
                        <table className="w-full text-left text-[8px] text-slate-500">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold">
                              <th className="px-3 py-2">Item</th>
                              <th className="px-3 py-2">Precio</th>
                              <th className="px-3 py-2">Stock</th>
                              <th className="px-3 py-2">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <AnimatePresence>
                              {mockProducts.map((prod) => (
                                <motion.tr
                                  key={prod.id}
                                  initial={{ opacity: 0, x: -20, height: 0 }}
                                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                                  exit={{ opacity: 0, x: 20, height: 0 }}
                                  transition={{ duration: 0.25 }}
                                  className="hover:bg-slate-50/50"
                                >
                                  <td className="px-3 py-2 flex items-center gap-1.5 font-bold text-slate-800">
                                    <span className="text-xs">{prod.image}</span>
                                    <span className="truncate max-w-[120px]">{prod.name}</span>
                                  </td>
                                  <td className="px-3 py-2 text-slate-900 font-bold">{prod.price}</td>
                                  <td className="px-3 py-2 text-slate-600">{prod.stock} un.</td>
                                  <td className="px-3 py-2">
                                    <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-semibold bg-green-50 text-green-600`}>
                                      Activo
                                    </span>
                                  </td>
                                </motion.tr>
                              ))}
                            </AnimatePresence>
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}

                  {/* Tab 3: Import XLSX */}
                  {activeTab === 'import' && (
                    <motion.div
                      key="import"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3.5 w-full h-full flex flex-col justify-between"
                    >
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 leading-tight">Importador Masivo XLSX</h3>
                        <p className="text-[9px] text-slate-400">Sube todos tus productos en segundos mediante Excel</p>
                      </div>

                      {/* Mock Drop Zone */}
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-white shadow-inner">
                        <Upload className={`w-8 h-8 text-slate-400 mb-2 animate-bounce`} />
                        <p className="text-[9px] font-bold text-slate-700">Arrastra tu plantilla XLSX aquí</p>
                        <p className="text-[7px] text-slate-400 mt-0.5">La primera columna debe ser el SKU</p>
                        
                        <button
                          type="button"
                          onClick={() => {
                            // Simulate upload
                            alert("¡Simulación XLSX exitosa! Se han importado 2 nuevos productos a tu catálogo demo.");
                            // Add some mock products
                            setMockProducts([
                              { id: 101, name: 'Shorts Dry-Fit Active', price: '$12.990', stock: 45, image: '🩳', category: 'Ropa' },
                              { id: 102, name: 'Visera Running Aero', price: '$7.990', stock: 60, image: '🧢', category: 'Accesorios' },
                              ...mockProducts.slice(0, 1)
                            ]);
                            setActiveTab('products');
                          }}
                          className={`mt-3 rounded-lg px-3.5 py-1.5 text-[8px] font-extrabold text-white shadow-md transition duration-200 ${selectedClasses.bg} hover:scale-[1.03]`}
                        >
                          Cargar Excel Demo
                        </button>
                      </div>

                      <div className="rounded-lg bg-blue-50 text-blue-800 p-2.5 text-[8px] flex items-center gap-1.5 border border-blue-100 font-medium">
                        <span className="text-xs">ℹ️</span>
                        <p className="leading-relaxed">Los productos con SKUs coincidentes se actualizarán de forma segura.</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Tab 4: Customize Theme Colors & Fonts */}
                  {activeTab === 'customize' && (
                    <motion.div
                      key="customize"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 w-full h-full flex flex-col justify-between"
                    >
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 leading-tight">Configuración de Apariencia</h3>
                        <p className="text-[9px] text-slate-400">Personaliza la identidad visual de tu tienda</p>
                      </div>

                      {/* Options Card */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm space-y-3.5">
                        {/* Font selection */}
                        <div>
                          <p className="text-[8px] font-bold text-slate-500 mb-1.5">Tipografía de la Tienda</p>
                          <div className="flex gap-2 justify-center">
                            {['Inter', 'Montserrat', 'Playfair'].map((f) => {
                              const isSel = mockFont === f;
                              return (
                                <button
                                  type="button"
                                  key={f}
                                  onClick={() => setMockFont(f)}
                                  className={`px-2.5 py-1 rounded border text-[8px] font-black transition duration-200 ${
                                    isSel ? 'border-slate-800 bg-slate-900 text-white shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                                  }`}
                                  style={{ fontFamily: f === 'Playfair' ? 'Playfair Display, serif' : f }}
                                >
                                  {f}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Color selection */}
                        <div>
                          <p className="text-[8px] font-bold text-slate-500 mb-1.5">Color de Marca Principal</p>
                          <div className="flex gap-4 justify-center">
                            {[
                              { key: 'blue', name: 'Azul', bg: 'bg-blue-600' },
                              { key: 'purple', name: 'Púrpura', bg: 'bg-purple-600' },
                              { key: 'amber', name: 'Ámbar', bg: 'bg-amber-600' },
                              { key: 'emerald', name: 'Menta', bg: 'bg-emerald-600' },
                            ].map((theme) => {
                              const isSelected = mockColor === theme.key;
                              return (
                                <button
                                  type="button"
                                  key={theme.key}
                                  onClick={() => setMockColor(theme.key as any)}
                                  className="flex flex-col items-center gap-1 cursor-pointer group"
                                >
                                  <div className={`w-6.5 h-6.5 rounded-full ${theme.bg} flex items-center justify-center shadow-md relative transition-transform duration-200 group-hover:scale-110 ${
                                    isSelected ? 'ring-2 ring-slate-800 ring-offset-1' : ''
                                  }`}>
                                    {isSelected && <Check size={10} className="text-white font-bold" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Real time simulated preview feedback */}
                      <div 
                        className="rounded-lg text-white p-3 text-[8px] flex items-center justify-between shadow-sm transition-all duration-300"
                        style={{ 
                          backgroundColor: mockColor === 'blue' ? '#2563eb' : mockColor === 'purple' ? '#9333ea' : mockColor === 'amber' ? '#d97706' : '#059669',
                          fontFamily: mockFont === 'Playfair' ? 'Playfair Display, serif' : mockFont
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs">✨</span>
                          <div>
                            <p className="font-bold text-white">Botón de Tienda Sincronizado</p>
                            <p className="opacity-85 text-[7px]">Cambios tipográficos y de color en tiempo real.</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 font-bold rounded-full bg-white/20 text-white text-[7px]">
                          Activo
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </main>
            </div>
          </div>

          {/* Decorative floating widgets with interactive micro-animations */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="absolute -top-6 -right-6 w-14 h-14 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl backdrop-blur-sm flex items-center justify-center text-xl z-20"
          >
            🛍️
          </motion.div>
          
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut', delay: 0.5 }}
            className="absolute -bottom-4 -left-4 w-12 h-12 rounded-xl bg-slate-950/80 border border-slate-800 shadow-xl backdrop-blur-sm flex items-center justify-center text-lg z-20"
          >
            💳
          </motion.div>
        </motion.div>
      </div>

      {/* Bounce scroll down indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-slate-500 cursor-pointer pointer-events-none"
      >
        <span className="text-[10px] uppercase font-bold tracking-wider">Conoce más</span>
        <div className="w-5 h-8 rounded-full border border-slate-800 flex justify-center pt-1">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="w-1 h-2 rounded-full bg-slate-500"
          />
        </div>
      </motion.div>
    </section>
  );
}
