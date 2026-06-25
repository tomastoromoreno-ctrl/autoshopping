'use client';

import { motion, useInView } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { TrendingUp, Award, Users, Server } from 'lucide-react';

const stats = [
  { value: 1200, suffix: '+', label: 'Tiendas creadas', icon: Server, color: 'text-blue-400', bgClass: 'bg-blue-500/10 border-blue-500/20' },
  { value: 85000, suffix: '+', label: 'Pedidos procesados', icon: TrendingUp, color: 'text-purple-400', bgClass: 'bg-purple-500/10 border-purple-500/20' },
  { value: 99, suffix: '%', label: 'Satisfacción Clientes', icon: Award, color: 'text-emerald-400', bgClass: 'bg-emerald-500/10 border-emerald-500/20' },
  { value: 99.9, suffix: '%', label: 'Tiempo de Actividad', icon: Users, color: 'text-amber-400', bgClass: 'bg-amber-500/10 border-amber-500/20' },
];

const chartData = [
  { month: 'Ene', sales: 120, users: 100 },
  { month: 'Feb', sales: 180, users: 150 },
  { month: 'Mar', sales: 260, users: 220 },
  { month: 'Abr', sales: 390, users: 310 },
  { month: 'May', sales: 550, users: 480 },
  { month: 'Jun', sales: 820, users: 650 },
];

function Counter({ value, suffix, label, isVisible }: { value: number; suffix: string; label: string; isVisible: boolean }) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;
    const duration = 1800;
    const steps = 50;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Number(current.toFixed(value % 1 === 0 ? 0 : 1)));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value, isVisible]);

  return (
    <span className="tabular-nums font-extrabold text-white tracking-tight">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function Stats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // SVG Chart path generation
  const chartHeight = 100;
  const chartWidth = 500;
  const padding = 30;
  
  const points = chartData.map((d, i) => {
    const x = padding + (i * (chartWidth - padding * 2)) / (chartData.length - 1);
    const y = chartHeight - padding - (d.sales * (chartHeight - padding * 2)) / 900;
    return { x, y, ...d };
  });

  const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;

  const tooltipStylesHtml = points.map((p, idx) => `
    .stat-tooltip-${idx} {
      left: ${(idx * (100 / (chartData.length - 1))) - (idx === 0 ? 0 : idx === chartData.length - 1 ? 16 : 8)}% !important;
      bottom: ${chartHeight - p.y + 10}px !important;
    }
  `).join('\n');

  return (
    <section ref={ref} className="relative py-24 overflow-hidden bg-slate-950">
      <style dangerouslySetInnerHTML={{ __html: tooltipStylesHtml }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.04),transparent_50%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Stat Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group relative rounded-2xl border border-slate-900 bg-slate-950 p-6 flex items-center gap-5 overflow-hidden transition-all duration-300 hover:border-slate-800 hover:bg-slate-900/10 shadow-lg"
              >
                {/* Background glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.03),transparent_70%)]" />
                
                {/* Icon wrapper */}
                <div
                  className={`p-3.5 rounded-xl border transition-transform duration-300 group-hover:scale-110 flex items-center justify-center ${stat.bgClass}`}
                >
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>

                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white">
                    <Counter value={stat.value} suffix={stat.suffix} label={stat.label} isVisible={isInView} />
                  </div>
                  <p className="text-slate-400 text-xs font-semibold mt-1">{stat.label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Dynamic Growth Chart Panel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="rounded-2xl border border-slate-900 bg-slate-950 p-6 sm:p-8 shadow-xl max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center"
        >
          {/* Chart Info */}
          <div className="space-y-4 md:w-1/3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-1 text-[10px] font-bold text-emerald-400">
              <span>Crecimiento Exponencial</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
              Tu volumen de venta se dispara
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">
              Mira el crecimiento promedio acumulado de transacciones mensuales de comercios que migran a nuestra infraestructura.
            </p>
            <div className="flex justify-center md:justify-start items-center gap-2 text-xs font-semibold text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>Transacciones promedio</span>
            </div>
          </div>

          {/* SVG Animated Chart Graph */}
          <div className="flex-1 w-full relative bg-slate-900/20 border border-slate-900/60 rounded-xl p-4 min-h-[160px] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>VOLUMEN TRANSACCIONAL</span>
              <span>USD/MES</span>
            </div>

            <div className="relative w-full h-[110px] mt-4 flex items-end">
              <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                {/* Horizontal grid lines */}
                <line x1="0" y1="15" x2={chartWidth} y2="15" stroke="#1e293b" strokeWidth="0.5" />
                <line x1="0" y1="45" x2={chartWidth} y2="45" stroke="#1e293b" strokeWidth="0.5" />
                <line x1="0" y1="75" x2={chartWidth} y2="75" stroke="#1e293b" strokeWidth="0.5" />

                {/* Animated Path */}
                {isInView && (
                  <>
                    <motion.path
                      d={pathD}
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, ease: 'easeInOut' }}
                    />
                    {/* Glow background area */}
                    <motion.path
                      d={`${pathD} L ${points[points.length - 1].x},${chartHeight} L ${points[0].x},${chartHeight} Z`}
                      fill="url(#chartGlow)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.1 }}
                      transition={{ delay: 1 }}
                    />
                  </>
                )}

                {/* Definitions for gradient */}
                <defs>
                  <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#0b0f19" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Interactive Points */}
                {points.map((p, idx) => (
                  <g key={idx} className="cursor-pointer">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="12"
                      fill="transparent"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                    <motion.circle
                      cx={p.x}
                      cy={p.y}
                      r={hoveredIndex === idx ? '5.5' : '3.5'}
                      fill="#6366f1"
                      stroke="#0f172a"
                      strokeWidth={hoveredIndex === idx ? '2.5' : '1.5'}
                      animate={{ scale: hoveredIndex === idx ? 1.2 : 1 }}
                      transition={{ duration: 0.15 }}
                    />
                  </g>
                ))}
              </svg>

              {/* Tooltip Overlay */}
              {hoveredIndex !== null && (
                <div
                  className={`absolute z-30 bg-slate-900 border border-slate-800 text-white rounded-lg p-2 shadow-xl text-[9px] pointer-events-none space-y-0.5 -translate-x-[30%] stat-tooltip-${hoveredIndex}`}
                >
                  <p className="font-bold text-slate-300">{chartData[hoveredIndex].month}</p>
                  <p className="text-[10px] font-bold text-indigo-400">${(chartData[hoveredIndex].sales * 100).toLocaleString()} USD</p>
                </div>
              )}
            </div>

            {/* X Axis Labels */}
            <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono mt-2.5 px-3">
              {chartData.map((d) => (
                <span key={d.month}>{d.month}</span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
