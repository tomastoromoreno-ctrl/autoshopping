'use client';

import { motion, useMotionValue, useMotionTemplate, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ArrowRight, Sparkles, TrendingUp, DollarSign, ShoppingBag, Palette, Plus, Check, Upload, Download, BookOpen } from 'lucide-react';

interface MockProduct {
  id: number;
  name: string;
  price: string;
  stock: number;
  image: string;
  category: string;
}

// Particle constellation background
function ParticleField({ mouseX, mouseY }: { mouseX: any; mouseY: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Array<{ x: number; y: number; vx: number; vy: number; size: number; opacity: number }>>([]);
  const animFrame = useRef<number>(0);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    const count = 60;
    particles.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
    }));

    const unsubX = mouseX.on('change', (v: number) => { mousePos.current.x = v; });
    const unsubY = mouseY.on('change', (v: number) => { mousePos.current.y = v; });

    const animate = () => {
      if (!ctx || !canvas) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      particles.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        // Mouse influence
        const dx = mousePos.current.x - p.x;
        const dy = mousePos.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          const force = (200 - dist) / 200 * 0.02;
          p.vx += dx * force * 0.01;
          p.vy += dy * force * 0.01;
        }

        // Dampen velocity
        p.vx *= 0.99;
        p.vy *= 0.99;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${p.opacity})`;
        ctx.fill();
      });

      // Draw connections
      for (let i = 0; i < particles.current.length; i++) {
        for (let j = i + 1; j < particles.current.length; j++) {
          const a = particles.current[i];
          const b = particles.current[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animFrame.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animFrame.current);
      window.removeEventListener('resize', resize);
      unsubX();
      unsubY();
    };
  }, [mouseX, mouseY]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'none' }}
    />
  );
}

// Character-by-character text reveal
function RevealText({ text, delay = 0, className = '' }: { text: string; delay?: number; className?: string }) {
  return (
    <span className={className}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.3, delay: delay + i * 0.03, ease: 'easeOut' }}
          style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : undefined }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

// Floating orb with pulse
function FloatingOrb({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay, type: 'spring', stiffness: 100 }}
      className={className}
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: delay || 0 }}
        className="w-full h-full rounded-full"
      />
    </motion.div>
  );
}

export default function Hero() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [mouseEntered, setMouseEntered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!sectionRef.current) return;
    const { left, top } = sectionRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  // 3D tilt for dashboard mockup
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);

  const handleTilt = (e: React.MouseEvent) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    tiltX.set(y * -8);
    tiltY.set(x * 8);
  };

  const resetTilt = () => {
    tiltX.set(0);
    tiltY.set(0);
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
    const names = ['Polera Dry-Fit Pro', 'Mochila Ciclismo Trail', 'Botella Térmica Sport', 'Calcetines Compresión', 'Gorro Running Light'];
    const icons = ['👕', '🎒', '🧪', '🧦', '🧢'];
    const prices = ['$14.990', '$34.990', '$12.990', '$9.990', '$11.990'];
    const r = Math.floor(Math.random() * names.length);
    setMockProducts([{ id: Date.now(), name: names[r], price: prices[r], stock: Math.floor(Math.random() * 30) + 5, image: icons[r], category: 'Deportes' }, ...mockProducts.slice(0, 3)]);
  };

  const colorMap = {
    blue: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-200', accentBg: 'bg-blue-50', accentBorder: 'border-blue-600' },
    purple: { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-200', accentBg: 'bg-purple-50', accentBorder: 'border-purple-600' },
    amber: { bg: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-200', accentBg: 'bg-amber-50', accentBorder: 'border-amber-600' },
    emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-200', accentBg: 'bg-emerald-50', accentBorder: 'border-emerald-600' },
  };
  const selectedClasses = colorMap[mockColor];

  return (
    <section
      ref={sectionRef}
      onMouseMove={(e) => { handleMouseMove(e); handleTilt(e); }}
      onMouseEnter={() => setMouseEntered(true)}
      onMouseLeave={() => { resetTilt(); setMouseEntered(false); }}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-[#0b0f19] to-slate-950 py-20 px-4"
    >
      {/* Particle Constellation Background */}
      <div className="absolute inset-0 z-0">
        <ParticleField mouseX={mouseX} mouseY={mouseY} />

        {/* Glow Spotlight */}
        <motion.div
          className="pointer-events-none absolute -inset-px opacity-60"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                700px circle at ${mouseX}px ${mouseY}px,
                rgba(99, 102, 241, 0.15),
                rgba(59, 130, 246, 0.08) 35%,
                transparent 70%
              )
            `,
          }}
        />

        {/* Floating orbs */}
        <FloatingOrb className="absolute top-20 left-[15%] w-3 h-3 bg-blue-500/30" delay={0.5} />
        <FloatingOrb className="absolute top-40 right-[20%] w-2 h-2 bg-indigo-400/40" delay={0.8} />
        <FloatingOrb className="absolute bottom-32 left-[25%] w-4 h-4 bg-emerald-400/20" delay={1.0} />
        <FloatingOrb className="absolute top-[60%] right-[10%] w-2.5 h-2.5 bg-purple-400/30" delay={1.2} />
        <FloatingOrb className="absolute bottom-20 right-[30%] w-3 h-3 bg-blue-400/25" delay={0.7} />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl w-full grid lg:grid-cols-12 gap-12 items-center">
        {/* Left Side Info */}
        <div className="lg:col-span-6 text-center lg:text-left space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-xs font-semibold text-blue-400 backdrop-blur-sm"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            >
              <Sparkles className="h-3.5 w-3.5" />
            </motion.div>
            <span>SaaS Multitienda Inteligente para E-Commerce</span>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            <RevealText text="Lanza tu tienda online," delay={0.2} />
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              <RevealText text="sin límites." delay={0.8} />
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed"
          >
            La plataforma multi-tenant definitiva para vender en minutos. Configuración automática de subdominios, facturación SII simplificada e integraciones de pago integradas.
          </motion.p>

          {/* Interactive CTAs with magnetic behavior */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.6 }}
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
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
              >
                Comenzar gratis
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
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
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm px-7 py-3.5 text-sm font-bold text-slate-300 hover:bg-slate-800/80 transition-all duration-200"
              >
                Explorar características
              </Link>
            </motion.div>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="flex items-center gap-6 justify-center lg:justify-start pt-4"
          >
            {[
              { icon: '⚡', text: 'Setup en 2 min' },
              { icon: '🔒', text: 'Pago seguro' },
              { icon: '🇨🇱', text: 'Hecho en Chile' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2 + i * 0.15 }}
                className="flex items-center gap-1.5 text-xs text-slate-500"
              >
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Right Side Showcase - Interactive Dashboard Mockup with 3D Tilt */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateY: -5 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 0.8, delay: 0.3, type: 'spring', stiffness: 80 }}
          style={{
            perspective: 1000,
            transformStyle: 'preserve-3d',
          }}
          className="lg:col-span-6 w-full relative"
        >
          <motion.div
            style={{
              rotateX: tiltX,
              rotateY: tiltY,
              transformStyle: 'preserve-3d',
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            {/* Glow border effect */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-emerald-500/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Dashboard Window Container */}
            <div className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-md shadow-2xl overflow-hidden text-left flex flex-col relative" style={{ transform: 'translateZ(20px)' }}>
              {/* Edge-like Browser Header */}
              <div className="bg-slate-900 px-4 py-3 border-b border-slate-800/80 flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800/50 px-3 py-1 rounded-md text-[10px] text-slate-300 font-sans ml-4 max-w-[150px] truncate">
                    <span className="text-[10px]">⚙️</span>
                    <span>Mi Tienda | AutoShopping</span>
                  </div>
                  <div className="flex-1" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-7 rounded bg-slate-950 border border-slate-800 flex items-center px-3 text-[10px] text-slate-500 font-mono">
                    <span className="text-emerald-500 mr-1.5">🔒</span>
                    <span>https://sportshop.autoshopping.cl/dashboard</span>
                  </div>
                </div>
              </div>

              {/* Dashboard Sidebar & Content */}
              <div className="bg-slate-50 min-h-[380px] flex font-sans text-slate-800">
                <aside className="w-36 bg-white border-r border-slate-200 p-2.5 hidden sm:flex flex-col gap-4">
                  <div className="flex items-center gap-2 px-1.5">
                    <div className={`w-5.5 h-5.5 rounded-lg ${selectedClasses.bg} flex items-center justify-center text-white text-[10px] font-bold shadow-sm transition-all duration-300`}>
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
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] font-semibold transition-all duration-200 ${
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

                <main className="flex-1 p-4 sm:p-5 flex flex-col justify-between overflow-hidden">
                  <AnimatePresence mode="wait">
                    {activeTab === 'sales' && (
                      <motion.div
                        key="sales"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="space-y-4 w-full h-full flex flex-col"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xs font-bold text-slate-900 leading-tight">Panel de Ventas</h3>
                            <p className="text-[9px] text-slate-400">Resumen del rendimiento mensual</p>
                          </div>
                          <motion.span
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="text-[9px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full"
                          >
                            +24% vs ayer
                          </motion.span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-sm flex items-center gap-2.5"
                          >
                            <div className={`p-1.5 rounded-md ${selectedClasses.accentBg} ${selectedClasses.text}`}>
                              <DollarSign size={14} />
                            </div>
                            <div>
                              <p className="text-[8px] text-slate-400 font-medium">Ingresos Totales</p>
                              <p className="text-xs font-bold text-slate-900">$2.450.900</p>
                            </div>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-sm flex items-center gap-2.5"
                          >
                            <div className={`p-1.5 rounded-md ${selectedClasses.accentBg} ${selectedClasses.text}`}>
                              <TrendingUp size={14} />
                            </div>
                            <div>
                              <p className="text-[8px] text-slate-400 font-medium">Conversión</p>
                              <p className="text-xs font-bold text-slate-900">4.2%</p>
                            </div>
                          </motion.div>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-sm flex-1 flex flex-col justify-between min-h-[100px]">
                          <div className="flex justify-between items-center text-[7px] text-slate-400 font-mono">
                            <span>Gráfico de Ventas</span>
                            <span>CLP/día</span>
                          </div>
                          <div className="relative w-full h-14 flex items-end">
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 200 60">
                              <line x1="0" y1="15" x2="200" y2="15" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="0" y1="35" x2="200" y2="35" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="0" y1="55" x2="200" y2="55" stroke="#f1f5f9" strokeWidth="1" />
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
                              <motion.path
                                d="M0,50 Q25,45 50,25 T100,30 T150,10 T200,5 L200,60 L0,60 Z"
                                fill={mockColor === 'blue' ? 'url(#blueGrad)' : mockColor === 'purple' ? 'url(#purpleGrad)' : mockColor === 'amber' ? 'url(#amberGrad)' : 'url(#emeraldGrad)'}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.12 }}
                                transition={{ delay: 0.8 }}
                              />
                              <defs>
                                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" /><stop offset="100%" stopColor="#ffffff" /></linearGradient>
                                <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9333ea" /><stop offset="100%" stopColor="#ffffff" /></linearGradient>
                                <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d97706" /><stop offset="100%" stopColor="#ffffff" /></linearGradient>
                                <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#059669" /><stop offset="100%" stopColor="#ffffff" /></linearGradient>
                              </defs>
                            </svg>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'products' && (
                      <motion.div
                        key="products"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="space-y-4 w-full h-full flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xs font-bold text-slate-900 leading-tight">Inventario de Productos</h3>
                            <p className="text-[9px] text-slate-400">Agrega o edita items en tu catálogo</p>
                          </div>
                          <button
                            onClick={addProduct}
                            className={`rounded px-2.5 py-1.5 text-[8px] font-bold text-white shadow-sm flex items-center gap-1 cursor-pointer transition-all duration-200 ${selectedClasses.bg} hover:opacity-90 active:scale-95`}
                          >
                            <Plus size={10} />
                            <span>Agregar Producto</span>
                          </button>
                        </div>
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
                                    initial={{ opacity: 0, x: -15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 15 }}
                                    transition={{ duration: 0.2, ease: 'easeOut' }}
                                    className="hover:bg-slate-50/50"
                                  >
                                    <td className="px-3 py-2 flex items-center gap-1.5 font-bold text-slate-800">
                                      <span className="text-xs">{prod.image}</span>
                                      <span className="truncate max-w-[120px]">{prod.name}</span>
                                    </td>
                                    <td className="px-3 py-2 text-slate-900 font-bold">{prod.price}</td>
                                    <td className="px-3 py-2 text-slate-600">{prod.stock} un.</td>
                                    <td className="px-3 py-2">
                                      <span className="px-1.5 py-0.5 rounded-full text-[7px] font-semibold bg-green-50 text-green-600">Activo</span>
                                    </td>
                                  </motion.tr>
                                ))}
                              </AnimatePresence>
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'import' && (
                      <motion.div
                        key="import"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="space-y-3.5 w-full h-full flex flex-col justify-between"
                      >
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 leading-tight">Importador Masivo XLSX</h3>
                          <p className="text-[9px] text-slate-400">Sube todos tus productos en segundos mediante Excel</p>
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-white shadow-inner"
                        >
                          <motion.div
                            animate={{ y: [0, -6, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                          >
                            <Upload className="w-8 h-8 text-slate-400 mb-2" />
                          </motion.div>
                          <p className="text-[9px] font-bold text-slate-700">Arrastra tu plantilla XLSX aquí</p>
                          <p className="text-[7px] text-slate-400 mt-0.5">La primera columna debe ser el SKU</p>
                          <button
                            type="button"
                            onClick={() => {
                              setMockProducts([
                                { id: 101, name: 'Shorts Dry-Fit Active', price: '$12.990', stock: 45, image: '🩳', category: 'Ropa' },
                                { id: 102, name: 'Visera Running Aero', price: '$7.990', stock: 60, image: '🧢', category: 'Accesorios' },
                                ...mockProducts.slice(0, 1),
                              ]);
                              setActiveTab('products');
                            }}
                            className={`mt-3 rounded-lg px-3.5 py-1.5 text-[8px] font-extrabold text-white shadow-md transition-all duration-200 ${selectedClasses.bg} hover:scale-[1.03] active:scale-95`}
                          >
                            Cargar Excel Demo
                          </button>
                        </motion.div>
                        <div className="rounded-lg bg-blue-50 text-blue-800 p-2.5 text-[8px] flex items-center gap-1.5 border border-blue-100 font-medium">
                          <span className="text-xs">ℹ️</span>
                          <p className="leading-relaxed">Los productos con SKUs coincidentes se actualizarán de forma segura.</p>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'customize' && (
                      <motion.div
                        key="customize"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="space-y-4 w-full h-full flex flex-col justify-between"
                      >
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 leading-tight">Configuración de Apariencia</h3>
                          <p className="text-[9px] text-slate-400">Personaliza la identidad visual de tu tienda</p>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm space-y-3.5">
                          <div>
                            <p className="text-[8px] font-bold text-slate-500 mb-1.5">Tipografía de la Tienda</p>
                            <div className="flex gap-2 justify-center">
                              {['Inter', 'Montserrat', 'Playfair'].map((f) => (
                                <button
                                  type="button"
                                  key={f}
                                  onClick={() => setMockFont(f)}
                                  className={`px-2.5 py-1 rounded border text-[8px] font-black transition-all duration-200 ${
                                    mockFont === f ? 'border-slate-800 bg-slate-900 text-white shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                                  }`}
                                  style={{ fontFamily: f === 'Playfair' ? 'Playfair Display, serif' : f }}
                                >
                                  {f}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-slate-500 mb-1.5">Color de Marca Principal</p>
                            <div className="flex gap-4 justify-center">
                              {[
                                { key: 'blue', bg: 'bg-blue-600' },
                                { key: 'purple', bg: 'bg-purple-600' },
                                { key: 'amber', bg: 'bg-amber-600' },
                                { key: 'emerald', bg: 'bg-emerald-600' },
                              ].map((theme) => (
                                <button
                                  type="button"
                                  key={theme.key}
                                  onClick={() => setMockColor(theme.key as any)}
                                  className="flex flex-col items-center gap-1 cursor-pointer group"
                                >
                                  <motion.div
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`w-6.5 h-6.5 rounded-full ${theme.bg} flex items-center justify-center shadow-md relative transition-all duration-200 ${
                                      mockColor === theme.key ? 'ring-2 ring-slate-800 ring-offset-1' : ''
                                    }`}
                                  >
                                    {mockColor === theme.key && <Check size={10} className="text-white font-bold" />}
                                  </motion.div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <motion.div
                          key={mockColor + mockFont}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="rounded-lg text-white p-3 text-[8px] flex items-center justify-between shadow-sm"
                          style={{
                            backgroundColor: mockColor === 'blue' ? '#2563eb' : mockColor === 'purple' ? '#9333ea' : mockColor === 'amber' ? '#d97706' : '#059669',
                            fontFamily: mockFont === 'Playfair' ? 'Playfair Display, serif' : mockFont,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs">✨</span>
                            <div>
                              <p className="font-bold text-white">Botón de Tienda Sincronizado</p>
                              <p className="opacity-85 text-[7px]">Cambios tipográficos y de color en tiempo real.</p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 font-bold rounded-full bg-white/20 text-white text-[7px]">Activo</span>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </main>
              </div>
            </div>
          </motion.div>

          {/* Decorative floating widgets */}
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="absolute -top-6 -right-6 w-14 h-14 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl backdrop-blur-sm flex items-center justify-center text-xl z-20"
          >
            🛍️
          </motion.div>
          <motion.div
            animate={{ y: [0, 8, 0], rotate: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut', delay: 0.5 }}
            className="absolute -bottom-4 -left-4 w-12 h-12 rounded-xl bg-slate-950/80 border border-slate-800 shadow-xl backdrop-blur-sm flex items-center justify-center text-lg z-20"
          >
            💳
          </motion.div>

          {/* Phone Mockup - Mobile Store */}
          <motion.div
            initial={{ opacity: 0, x: 40, rotateZ: 5, z: 50 }}
            animate={{ opacity: 1, x: 0, rotateZ: 0, z: 50 }}
            transition={{ duration: 0.8, delay: 1.0, type: 'spring', stiffness: 80 }}
            className="absolute -bottom-10 -right-6 sm:bottom-0 sm:right-4 lg:right-4 z-30 scale-[0.55] sm:scale-100 origin-bottom-right"
          >
            <div className="relative">
              {/* Phone frame */}
              <div className="w-[200px] sm:w-[220px] rounded-[2rem] border-[3px] border-slate-700 bg-slate-900 shadow-2xl shadow-black/40 overflow-hidden">
                {/* Notch */}
                <div className="relative h-5 bg-slate-900 flex justify-center items-end">
                  <div className="w-16 h-3 bg-black rounded-b-xl" />
                </div>
                {/* Screen */}
                <div className="bg-white rounded-b-[1.7rem] overflow-hidden">
                  {/* Status bar */}
                  <div className="flex items-center justify-between px-3 py-1 bg-white">
                    <span className="text-[7px] font-semibold text-slate-900">9:41</span>
                    <div className="flex items-center gap-0.5">
                      <div className="w-3 h-1.5 rounded-sm bg-slate-900" />
                      <div className="w-1 h-1.5 rounded-sm bg-slate-900" />
                      <div className="w-4 h-2 rounded-sm border border-slate-900 flex items-center p-px"><div className="w-2 h-full bg-slate-900 rounded-xs" /></div>
                    </div>
                  </div>

                  {/* Store header */}
                  <div className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center text-[8px] font-bold text-white">AS</div>
                      <div>
                        <p className="text-[9px] font-bold text-white leading-tight">SportShop</p>
                        <p className="text-[6px] text-white/70">Tienda deportiva</p>
                      </div>
                    </div>
                  </div>

                  {/* Search bar */}
                  <div className="px-2.5 py-1.5 bg-gray-50">
                    <div className="flex items-center gap-1.5 bg-white rounded-lg px-2 py-1 border border-gray-200">
                      <svg className="w-2.5 h-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      <span className="text-[7px] text-gray-400">Buscar productos...</span>
                    </div>
                  </div>

                  {/* Category chips */}
                  <div className="px-2.5 py-1.5 flex gap-1 overflow-hidden">
                    {['Todos', 'Calzado', 'Ropa'].map((cat, i) => (
                      <span key={cat} className={`text-[6px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{cat}</span>
                    ))}
                  </div>

                  {/* Product grid */}
                  <div className="px-2 py-1.5 grid grid-cols-2 gap-1.5">
                    {[
                      { name: 'Zapatillas Pro', price: '$45.990', emoji: '👟', discount: '-20%' },
                      { name: 'Cortaviento Trail', price: '$29.990', emoji: '🧥', discount: null },
                      { name: 'Smartwatch Active', price: '$89.990', emoji: '⌚', discount: '-15%' },
                      { name: 'Mochila Sport', price: '$34.990', emoji: '🎒', discount: null },
                    ].map((p, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 + i * 0.1, duration: 0.3 }}
                        className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm"
                      >
                        <div className="relative aspect-square bg-gray-50 flex items-center justify-center">
                          <span className="text-xl">{p.emoji}</span>
                          {p.discount && (
                            <span className="absolute top-0.5 left-0.5 bg-red-500 text-white text-[5px] font-bold px-1 py-px rounded">{p.discount}</span>
                          )}
                        </div>
                        <div className="p-1">
                          <p className="text-[6px] font-semibold text-slate-800 truncate">{p.name}</p>
                          <p className="text-[7px] font-bold text-slate-900">{p.price}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Add to cart button */}
                  <div className="px-2.5 py-2">
                    <div className="bg-blue-600 text-white text-center rounded-lg py-1.5 text-[7px] font-bold">
                      Agregar al carrito
                    </div>
                  </div>

                  {/* Bottom nav */}
                  <div className="flex items-center justify-around border-t border-gray-200 py-1.5 bg-white">
                    {[
                      { icon: '🏠', label: 'Inicio', active: true },
                      { icon: '🔍', label: 'Buscar', active: false },
                      { icon: '🛒', label: 'Carrito', active: false },
                      { icon: '👤', label: 'Cuenta', active: false },
                    ].map((nav, i) => (
                      <div key={i} className="flex flex-col items-center gap-0.5">
                        <span className="text-[9px]">{nav.icon}</span>
                        <span className={`text-[5px] font-semibold ${nav.active ? 'text-blue-600' : 'text-gray-400'}`}>{nav.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notification badge */}
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-slate-900 flex items-center justify-center"
              >
                <span className="text-[7px] font-bold text-white">3</span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bounce scroll down indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-slate-500"
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
