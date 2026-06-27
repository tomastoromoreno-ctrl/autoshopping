'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, CreditCard, Building2, Wallet, Truck, Shield, Check, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { getSessionId } from '@/lib/session';
import { formatPrice } from '@/lib/format';

const REGIONS_AND_COMMUNES = [
  {
    name: "Arica y Parinacota",
    communes: ["Arica", "Camarones", "Putre", "General Lagos"]
  },
  {
    name: "Tarapacá",
    communes: ["Iquique", "Alto Hospicio", "Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica"]
  },
  {
    name: "Antofagasta",
    communes: ["Antofagasta", "Mejillones", "Sierra Gorda", "Taltal", "Calama", "Ollagüe", "San Pedro de Atacama", "Tocopilla", "María Elena"]
  },
  {
    name: "Atacama",
    communes: ["Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro", "Vallenar", "Alto del Carmen", "Freirina", "Huasco"]
  },
  {
    name: "Coquimbo",
    communes: ["La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paiguano", "Vicuña", "Illapel", "Canela", "Los Vilos", "Salamanca", "Ovalle", "Combarbalá", "Monte Patria", "Punitaqui", "Río Hurtado"]
  },
  {
    name: "Valparaíso",
    communes: ["Valparaíso", "Casablanca", "Concón", "Juan Fernández", "Puchuncaví", "Quintero", "Viña del Mar", "Isla de Pascua", "Los Andes", "Calle Larga", "Rinconada", "San Esteban", "La Ligua", "Cabildo", "Papudo", "Petorca", "Zapallar", "Quillota", "Calera", "Hijuelas", "La Cruz", "Nogales", "San Antonio", "Algarrobo", "Cartagena", "El Quisco", "El Tabo", "Santo Domingo", "San Felipe", "Catemu", "Llaillay", "Panquehue", "Putaendo", "Santa María", "Quilpué", "Limache", "Olmué", "Villa Alemana"]
  },
  {
    name: "Región del Libertador Gral. Bernardo O’Higgins",
    communes: ["Rancagua", "Codegua", "Coinco", "Coltauco", "Doñihue", "Graneros", "Las Cabras", "Machalí", "Malloa", "Mostazal", "Olivar", "Peumo", "Pichidegua", "Quinta de Tilcoco", "Rengo", "Requínoa", "San Vicente", "Pichilemu", "La Estrella", "Litueche", "Marchihue", "Navidad", "Paredones", "San Fernando", "Chépica", "Chimbarongo", "Lolol", "Nancagua", "Palmilla", "Peralillo", "Placilla", "Pumanque", "Santa Cruz"]
  },
  {
    name: "Región del Maule",
    communes: ["Talca", "Constitución", "Curepto", "Empedrado", "Maule", "Pelarco", "Pencahue", "Río Claro", "San Clemente", "San Rafael", "Cauquenes", "Chanco", "Pelluhue", "Curicó", "Hualañé", "Licantén", "Molina", "Rauco", "Romeral", "Sagrada Familia", "Teno", "Vichuquén", "Linares", "Colbún", "Longaví", "Parral", "Retiro", "San Javier", "Villa Alegre", "Yerbas Buenas"]
  },
  {
    name: "Región de Ñuble",
    communes: ["Cobquecura", "Coelemu", "Ninhue", "Portezuelo", "Quirihue", "Ránquil", "Treguaco", "Bulnes", "Chillán Viejo", "Chillán", "El Carmen", "Pemuco", "Pinto", "Quillón", "San Ignacio", "Yungay", "Coihueco", "Ñiquén", "San Carlos", "San Fabián", "San Nicolás"]
  },
  {
    name: "Región del Biobío",
    communes: ["Concepción", "Coronel", "Chiguayante", "Florida", "Hualqui", "Lota", "Penco", "San Pedro de la Paz", "Santa Juana", "Talcahuano", "Tomé", "Hualpén", "Lebu", "Arauco", "Cañete", "Contulmo", "Curanilahue", "Los Álamos", "Tirúa", "Los Ángeles", "Antuco", "Cabrero", "Laja", "Mulchén", "Nacimiento", "Negrete", "Quilaco", "Quilleco", "San Rosendo", "Santa Bárbara", "Tucapel", "Yumbel", "Alto Biobío"]
  },
  {
    name: "Región de la Araucanía",
    communes: ["Temuco", "Carahue", "Cunco", "Curarrehue", "Freire", "Galvarino", "Gorbea", "Lautaro", "Loncoche", "Melipeuco", "Nueva Imperial", "Padre las Casas", "Perquenco", "Pitrufquén", "Pucón", "Saavedra", "Teodoro Schmidt", "Toltén", "Vilcún", "Villarrica", "Cholchol", "Angol", "Collipulli", "Curacautín", "Ercilla", "Lonquimay", "Los Sauces", "Lumaco", "Purén", "Renaico", "Traiguén", "Victoria"]
  },
  {
    name: "Región de Los Ríos",
    communes: ["Valdivia", "Corral", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco", "Panguipulli", "La Unión", "Futrono", "Lago Ranco", "Río Bueno"]
  },
  {
    name: "Región de Los Lagos",
    communes: ["Puerto Montt", "Calbuco", "Cochamó", "Fresia", "Frutillar", "Los Muermos", "Llanquihue", "Maullín", "Puerto Varas", "Castro", "Ancud", "Chonchi", "Curaco de Vélez", "Dalcahue", "Puqueldón", "Queilén", "Quellón", "Quemchi", "Quinchao", "Osorno", "Puerto Octay", "Purranque", "Puyehue", "Río Negro", "San Juan de la Costa", "San Pablo", "Chaitén", "Futaleufú", "Hualaihué", "Palena"]
  },
  {
    name: "Región Aisén del Gral. Carlos Ibáñez del Campo",
    communes: ["Coihaique", "Lago Verde", "Aisén", "Cisnes", "Guaitecas", "Cochrane", "O’Higgins", "Tortel", "Chile Chico", "Río Ibáñez"]
  },
  {
    name: "Región de Magallanes y de la Antártica Chilena",
    communes: ["Punta Arenas", "Laguna Blanca", "Río Verde", "San Gregorio", "Cabo de Hornos (Ex Navarino)", "Antártica", "Porvenir", "Primavera", "Timaukel", "Natales", "Torres del Paine"]
  },
  {
    name: "Región Metropolitana de Santiago",
    communes: ["Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "Santiago", "San Joaquín", "San Miguel", "San Ramón", "Vitacura", "Puente Alto", "Pirque", "San José de Maipo", "Colina", "Lampa", "Tiltil", "San Bernardo", "Buin", "Calera de Tango", "Paine", "Melipilla", "Alhué", "Curacaví", "María Pinto", "San Pedro", "Talagante", "El Monte", "Isla de Maipo", "Padre Hurtado", "Peñaflor"]
  }
];

interface CartItem {
  cart_item_key: string;
  product_id: string;
  variant_id?: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'transfer' | 'wallet';
}

interface StoreConfig {
  id: string;
  name: string;
  payment_methods?: PaymentMethod[];
  shipping_enabled?: boolean;
  shipping_cost?: number;
}

interface Step {
  id: number;
  label: string;
  key: string;
}

const steps: Step[] = [
  { id: 1, label: 'Datos', key: 'info' },
  { id: 2, label: 'Envío', key: 'shipping' },
  { id: 3, label: 'Pago', key: 'payment' },
  { id: 4, label: 'Revisar', key: 'confirm' },
];

function StepIndicator({ currentStep, shippingEnabled }: { currentStep: number; shippingEnabled: boolean }) {
  const visible = steps.filter((s) => s.key !== 'shipping' || shippingEnabled);
  return (
    <div className="flex items-center justify-center gap-0 max-w-xl mx-auto mb-8">
      {visible.map((step, i) => {
        const isActive = step.id <= currentStep;
        const isCurrent = step.id === currentStep;
        const isLast = i === visible.length - 1;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                isCurrent ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-110' :
                isActive ? 'bg-emerald-500 text-white' :
                'bg-slate-100 text-slate-400'
              }`}>
                {isActive && !isCurrent ? <Check className="h-5 w-5" /> : step.id}
              </div>
              <span className={`mt-1.5 text-xs font-medium transition-colors duration-300 ${
                isCurrent ? 'text-blue-600' :
                isActive ? 'text-emerald-600' :
                'text-slate-400'
              }`}>{step.label}</span>
            </div>
            {!isLast && (
              <div className={`h-0.5 w-10 sm:w-16 mx-2 transition-colors duration-300 ${
                step.id < currentStep ? 'bg-emerald-400' : 'bg-slate-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const slideVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

function StepContainer({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}

export default function CheckoutPage({ params }: { params: { subdomain: string } }) {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const [items, setItems] = useState<CartItem[]>([]);
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');

  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingZip, setShippingZip] = useState('');
  const [shippingType, setShippingType] = useState<'home' | 'branch'>('home');
  const [shippingBranch, setShippingBranch] = useState('');

  const [quotes, setQuotes] = useState<Array<{ id: string; name: string; cost: number; delivery_time: string; is_collect?: boolean }>>([]);
  const [selectedQuote, setSelectedQuote] = useState<{ id: string; name: string; cost: number; delivery_time: string; is_collect?: boolean } | null>(null);
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  useEffect(() => {
    if (!shippingState || !shippingCity || items.length === 0 || !storeConfig?.shipping_enabled) {
      setQuotes([]);
      setSelectedQuote(null);
      return;
    }

    setLoadingQuotes(true);
    fetch(`${apiUrl}/shipping/public/${params.subdomain}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination_region: shippingState,
        destination_commune: shippingCity,
        items: items.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          price: item.price,
        })),
      }),
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Error al cargar cotizaciones');
      })
      .then((data) => {
        setQuotes(data);
        if (data && data.length > 0) {
          setSelectedQuote(data[0]);
        } else {
          setSelectedQuote(null);
        }
      })
      .catch((err) => {
        console.error(err);
        setQuotes([]);
        setSelectedQuote(null);
      })
      .finally(() => setLoadingQuotes(false));
  }, [shippingState, shippingCity, items, storeConfig?.shipping_enabled, params.subdomain, apiUrl]);

  useEffect(() => {
    const cartKey = `cart_${params.subdomain}`;
    const stored = localStorage.getItem(cartKey);
    let parsedItems: CartItem[] = [];
    if (stored) {
      try {
        parsedItems = JSON.parse(stored);
        setItems(parsedItems);
      } catch {
        setItems([]);
      }
    }
    async function loadStore() {
      try {
        const res = await fetch(`${apiUrl}/stores/${params.subdomain}/public`);
        if (res.ok) {
          const data = await res.json();
          const provider = data.config?.payment_provider || 'mercadopago';
          const paymentMethods: PaymentMethod[] = [];
          if (provider === 'mercadopago') {
            paymentMethods.push({ id: 'mercadopago', name: 'Mercado Pago (Tarjeta, Débito, Transferencia)', type: 'card' });
          } else if (provider === 'transbank') {
            paymentMethods.push({ id: 'transbank', name: 'Webpay Plus (Transbank)', type: 'card' });
          } else {
            paymentMethods.push({ id: 'mercadopago', name: 'Pago Seguro', type: 'card' });
          }
          const mapped: StoreConfig = {
            id: data.id, name: data.name,
            shipping_enabled: data.config?.shipping_enabled,
            shipping_cost: data.config?.shipping_cost,
            payment_methods: paymentMethods,
          };
          setStoreConfig(mapped);
          if (mapped.payment_methods?.length) setSelectedPayment(mapped.payment_methods[0].id);

          // Sync local storage cart to database
          if (parsedItems.length > 0) {
            const sessionId = getSessionId();
            // Clear current cart items in database
            await fetch(`${apiUrl}/cart/${sessionId}/clear`, { method: 'DELETE' });
            
            // Populate database cart with local items
            for (const item of parsedItems) {
              await fetch(`${apiUrl}/cart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tenant_id: data.id,
                  session_id: sessionId,
                  product_id: item.product_id,
                  variant_id: item.variant_id || undefined,
                  quantity: item.quantity,
                })
              });
            }
          }
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    loadStore();
  }, [params.subdomain, apiUrl]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = selectedQuote ? selectedQuote.cost : 0;
  const total = subtotal + shipping;

  const stepsVisible = steps.filter((s) => s.key !== 'shipping' || storeConfig?.shipping_enabled);

  function canProceed(step: number): boolean {
    if (step === 1) return customerName.trim().length > 0 && customerEmail.trim().length > 0;
    if (step === 2) {
      if (!storeConfig?.shipping_enabled) return true;
      const basicValid = shippingAddress.trim().length > 0 && shippingCity.trim().length > 0 && selectedQuote !== null;
      if (shippingType === 'branch') {
        return basicValid && shippingBranch.trim().length > 0;
      }
      return basicValid;
    }
    if (step === 3) return selectedPayment.length > 0;
    return true;
  }

  function nextStep() {
    if (!canProceed(currentStep)) { setError('Completa todos los campos requeridos antes de continuar.'); return; }
    setError('');
    setCurrentStep((s) => Math.min(s + 1, stepsVisible.length));
  }

  function prevStep() {
    setError('');
    setCurrentStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!canProceed(currentStep)) { setError('Completa todos los campos requeridos.'); return; }
    setSubmitting(true);
    try {
      const sessionId = getSessionId();
      const res = await fetch(`${apiUrl}/orders/${params.subdomain}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          payment_method_id: selectedPayment,
          items: items.map((item) => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            price: item.price,
          })),
          shipping_address: storeConfig?.shipping_enabled ? { address: shippingAddress, city: shippingCity, state: shippingState, zip: shippingZip } : undefined,
          shipping_provider: selectedQuote?.name || undefined,
          shipping_cost: selectedQuote?.cost !== undefined ? selectedQuote.cost : undefined,
          shipping_type: shippingType,
          shipping_branch: shippingType === 'branch' ? shippingBranch : undefined,
        }),
      });
      if (res.ok) {
        const order = await res.json();
        localStorage.removeItem(`cart_${params.subdomain}`);
        window.dispatchEvent(new Event('cart-updated'));
        if (order.payment_url) window.location.href = order.payment_url;
        else if (order.id) router.push(`/store/${params.subdomain}/orders`);
      } else {
        const err = await res.json().catch(() => ({ message: 'Error al crear pedido' }));
        setError(err.message || 'Error al crear pedido');
      }
    } catch { setError('Error de conexión. Intenta nuevamente.'); }
    finally { setSubmitting(false); }
  }

  const paymentIcons: Record<string, React.ReactNode> = {
    card: <CreditCard className="h-5 w-5" />,
    transfer: <Building2 className="h-5 w-5" />,
    wallet: <Wallet className="h-5 w-5" />,
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-tight py-8 sm:py-12">
        <button onClick={() => router.back()} className="mb-6 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Volver al carrito
        </button>
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <ShoppingBag className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <p className="text-slate-500">No hay productos en tu carrito.</p>
          <button onClick={() => router.push(`/store/${params.subdomain}`)} className="mt-4 text-sm font-medium text-blue-600 hover:underline">
            Ir a la tienda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-tight py-8 sm:py-12">
      <button onClick={() => router.back()} className="mb-6 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Volver al carrito
      </button>

      <div className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">Checkout</h1>
      </div>

      <StepIndicator currentStep={currentStep} shippingEnabled={!!storeConfig?.shipping_enabled} />

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Customer Info */}
            {currentStep === 1 && (
              <StepContainer key="step1">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</div>
                    <h2 className="text-lg font-heading font-semibold text-slate-900">Información del cliente</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">Nombre completo *</label>
                      <input id="name" type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required aria-label="Nombre completo" className="input-modern" placeholder="Tu nombre completo" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                        <input id="email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} required aria-label="Email" className="input-modern" placeholder="tu@email.com" />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">Teléfono</label>
                        <input id="phone" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} aria-label="Teléfono" className="input-modern" placeholder="+56 9 1234 5678" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button type="button" onClick={nextStep} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all duration-200">
                      Continuar <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </StepContainer>
            )}

            {/* Step 2: Shipping */}
            {currentStep === 2 && storeConfig?.shipping_enabled && (
              <StepContainer key="step2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">2</div>
                    <h2 className="text-lg font-heading font-semibold text-slate-900">Dirección de envío</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Método de Entrega *</label>
                      <div className="grid gap-3 grid-cols-2">
                        <label className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all duration-200 ${
                          shippingType === 'home' ? 'border-primary bg-blue-50/50 ring-1 ring-primary' : 'border-slate-200 hover:border-slate-300'
                        }`}>
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="shipping_type"
                              value="home"
                              checked={shippingType === 'home'}
                              onChange={() => setShippingType('home')}
                              className="h-4 w-4 text-primary focus:ring-primary border-slate-300"
                            />
                            <span className="text-sm font-medium text-slate-900">A Domicilio</span>
                          </div>
                        </label>
                        <label className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all duration-200 ${
                          shippingType === 'branch' ? 'border-primary bg-blue-50/50 ring-1 ring-primary' : 'border-slate-200 hover:border-slate-300'
                        }`}>
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="shipping_type"
                              value="branch"
                              checked={shippingType === 'branch'}
                              onChange={() => setShippingType('branch')}
                              className="h-4 w-4 text-primary focus:ring-primary border-slate-300"
                            />
                            <span className="text-sm font-medium text-slate-900">Retiro en Sucursal</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1.5">
                        {shippingType === 'branch' ? 'Dirección de Referencia *' : 'Dirección *'}
                      </label>
                      <input id="address" type="text" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} required aria-label="Dirección" className="input-modern" placeholder="Calle, número, depto" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-slate-700 mb-1.5">Región *</label>
                        <select
                          id="state"
                          value={shippingState}
                          onChange={(e) => {
                            setShippingState(e.target.value);
                            setShippingCity('');
                            setQuotes([]);
                            setSelectedQuote(null);
                          }}
                          required
                          aria-label="Región"
                          className="input-modern"
                        >
                          <option value="">Selecciona Región</option>
                          {REGIONS_AND_COMMUNES.map((r) => (
                            <option key={r.name} value={r.name}>{r.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1.5">Comuna *</label>
                        <select
                          id="city"
                          value={shippingCity}
                          onChange={(e) => setShippingCity(e.target.value)}
                          required
                          disabled={!shippingState}
                          aria-label="Comuna"
                          className="input-modern"
                        >
                          <option value="">Selecciona Comuna</option>
                          {REGIONS_AND_COMMUNES.find((r) => r.name === shippingState)?.communes.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          )) || []}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="zip" className="block text-sm font-medium text-slate-700 mb-1.5">Código postal</label>
                        <input id="zip" type="text" value={shippingZip} onChange={(e) => setShippingZip(e.target.value)} aria-label="Código postal" className="input-modern" placeholder="7500000" />
                      </div>
                    </div>

                    {/* Selector de Cotizaciones de Envío */}
                    {shippingState && shippingCity && (
                      <div className="mt-6 border-t pt-6">
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Opciones de Despacho</h3>
                        {loadingQuotes ? (
                          <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            Cotizando con transportistas...
                          </div>
                        ) : quotes.length === 0 ? (
                          <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                            ⚠️ No hay transportistas disponibles para esta ubicación. Intenta con otra comuna.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {quotes.map((q) => {
                              const isSelected = selectedQuote?.id === q.id;
                              return (
                                <div
                                  key={q.id}
                                  onClick={() => setSelectedQuote(q)}
                                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all duration-200 ${
                                    isSelected
                                      ? 'border-primary bg-blue-50/50 ring-1 ring-primary'
                                      : 'border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-200 ${
                                      isSelected ? 'border-primary bg-primary' : 'border-slate-300'
                                    }`}>
                                      {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-slate-900">{q.name}</p>
                                      <p className="text-xs text-slate-500">Entrega estimada: {q.delivery_time}</p>
                                    </div>
                                  </div>
                                  <p className="text-sm font-bold text-slate-900">
                                    {q.is_collect ? 'Por Pagar' : (q.cost === 0 ? 'Gratis' : formatPrice(q.cost))}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {shippingType === 'branch' && selectedQuote && (
                          <div className="mt-5 bg-blue-50/40 border border-blue-100 rounded-2xl p-4 space-y-3">
                            <div>
                              <label htmlFor="shipping_branch" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                                Oficina / Sucursal de {selectedQuote.name.split(' ')[0]} *
                              </label>
                              <input
                                id="shipping_branch"
                                type="text"
                                value={shippingBranch}
                                onChange={(e) => setShippingBranch(e.target.value)}
                                required
                                className="input-modern mt-1.5 bg-white"
                                placeholder={
                                  selectedQuote.id.includes('starken')
                                    ? 'Ej: Sucursal Starken Vitacura'
                                    : selectedQuote.id.includes('chilexpress')
                                    ? 'Ej: Oficina Chilexpress Providencia Centro'
                                    : selectedQuote.id.includes('blueexpress')
                                    ? 'Ej: Punto Copec Las Condes'
                                    : 'Ej: Sucursal de Retiro'
                                }
                              />
                            </div>
                            
                            {selectedQuote.id.includes('starken') && (
                              <p className="text-xs text-slate-500 font-normal">
                                🔍 ¿No sabes el nombre exacto? 
                                <a 
                                  href="https://www.starken.cl/sucursales" 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="ml-1 text-blue-600 font-semibold underline hover:text-blue-800 transition-colors"
                                >
                                  Ver sucursales Starken oficiales más cercanas
                                </a>
                              </p>
                            )}
                            {selectedQuote.id.includes('chilexpress') && (
                              <p className="text-xs text-slate-500 font-normal">
                                🔍 ¿No sabes el nombre exacto? 
                                <a 
                                  href="https://www.chilexpress.cl/sucursales-oficinas" 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="ml-1 text-blue-600 font-semibold underline hover:text-blue-800 transition-colors"
                                >
                                  Ver oficinas Chilexpress oficiales más cercanas
                                </a>
                              </p>
                            )}
                            {selectedQuote.id.includes('blueexpress') && (
                              <p className="text-xs text-slate-500 font-normal">
                                🔍 ¿No sabes el nombre exacto? 
                                <a 
                                  href="https://www.blue.cl/lockers-puntos/encuentra-tu-punto" 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="ml-1 text-blue-600 font-semibold underline hover:text-blue-800 transition-colors"
                                >
                                  Ver puntos de retiro Blue Express oficiales
                                </a>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex justify-between">
                    <button type="button" onClick={prevStep} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-200">
                      <ChevronLeft className="h-4 w-4" /> Volver
                    </button>
                    <button type="button" onClick={nextStep} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all duration-200">
                      Continuar <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </StepContainer>
            )}

            {/* Step 2 -> 3 skip if no shipping */}
            {currentStep === 2 && !storeConfig?.shipping_enabled && (
              <StepContainer key="step2-skip">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white"><Check className="h-4 w-4" /></div>
                    <h2 className="text-lg font-heading font-semibold text-slate-900">Envío</h2>
                  </div>
                  <p className="text-sm text-slate-500">Tu tienda no requiere dirección de envío. Puedes continuar al pago.</p>
                  <div className="mt-6 flex justify-end">
                    <button type="button" onClick={nextStep} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all duration-200">
                      Continuar <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </StepContainer>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <StepContainer key="step3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">3</div>
                    <h2 className="text-lg font-heading font-semibold text-slate-900">Método de pago</h2>
                  </div>
                  {storeConfig?.payment_methods && storeConfig.payment_methods.length > 0 ? (
                    <div className="space-y-3">
                      {storeConfig.payment_methods.map((method) => (
                        <label key={method.id} className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all duration-200 ${
                          selectedPayment === method.id ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}>
                          <input type="radio" name="payment_method" value={method.id} checked={selectedPayment === method.id} onChange={() => setSelectedPayment(method.id)} className="h-4 w-4 text-blue-600 focus:ring-blue-600" />
                          <div className={`p-2 rounded-lg ${selectedPayment === method.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-slate-500'}`}>
                            {paymentIcons[method.type] || <CreditCard className="h-5 w-5" />}
                          </div>
                          <span className="text-sm font-medium text-slate-900">{method.name}</span>
                          {selectedPayment === method.id && <Check className="h-5 w-5 text-blue-600 ml-auto" />}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No hay métodos de pago configurados.</p>
                  )}
                  <div className="mt-6 flex justify-between">
                    <button type="button" onClick={prevStep} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-200">
                      <ChevronLeft className="h-4 w-4" /> Volver
                    </button>
                    <button type="button" onClick={nextStep} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all duration-200">
                      Revisar pedido <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </StepContainer>
            )}

            {/* Step 4: Confirm */}
            {currentStep === 4 && (
              <StepContainer key="step4">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white"><Check className="h-4 w-4" /></div>
                    <h2 className="text-lg font-heading font-semibold text-slate-900">Revisa tu pedido</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contacto</h3>
                      <p className="text-sm font-medium text-slate-900">{customerName}</p>
                      <p className="text-sm text-slate-600">{customerEmail}</p>
                      {customerPhone && <p className="text-sm text-slate-600">{customerPhone}</p>}
                    </div>

                    {storeConfig?.shipping_enabled && (
                      <div className="rounded-xl bg-slate-50 p-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dirección de envío</h3>
                        <p className="text-sm font-medium text-slate-900">{shippingAddress}</p>
                        <p className="text-sm text-slate-600">{shippingCity}{shippingState ? `, ${shippingState}` : ''}{shippingZip ? ` - ${shippingZip}` : ''}</p>
                      </div>
                    )}

                    <div className="rounded-xl bg-slate-50 p-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Método de pago</h3>
                      <p className="text-sm font-medium text-slate-900">
                        {storeConfig?.payment_methods?.find((m) => m.id === selectedPayment)?.name || selectedPayment}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Productos</h3>
                      {items.map((item) => (
                        <div key={item.cart_item_key} className="flex items-center justify-between py-1.5">
                          <span className="text-sm text-slate-700">{item.name} <span className="text-slate-400">x{item.quantity}</span></span>
                          <span className="text-sm font-medium text-slate-900">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between">
                    <button type="button" onClick={prevStep} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-200">
                      <ChevronLeft className="h-4 w-4" /> Volver
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {submitting ? 'Procesando...' : `Pagar ${formatPrice(total)}`}
                    </button>
                  </div>
                </div>
              </StepContainer>
            )}
          </AnimatePresence>

          {error && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-red-50 border border-red-100">
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}
        </div>

        {/* Order Summary - Right Column */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-24">
            <h3 className="text-lg font-heading font-semibold text-slate-900 mb-4">Resumen del pedido</h3>

            <div className="space-y-4 mb-4">
              {items.map((item) => (
                <div key={item.cart_item_key} className="flex items-center gap-3">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 line-clamp-1">{item.name}</p>
                    <p className="text-xs text-slate-500">x{item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              {storeConfig?.shipping_enabled && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Envío</span>
                  <span className={`font-medium ${selectedQuote?.is_collect ? 'text-blue-700 font-semibold' : ''}`}>
                    {selectedQuote?.is_collect ? 'Al recibir (por pagar)' : (shipping === 0 ? 'Gratis' : formatPrice(shipping))}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-3">
                <div className="flex justify-between text-base font-bold text-slate-900">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Mobile sticky submit */}
            {currentStep === 4 && (
              <button type="submit" disabled={submitting} className="btn-primary w-full mt-6 lg:hidden">
                {submitting ? 'Procesando...' : `Pagar ${formatPrice(total)}`}
              </button>
            )}

            <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Truck className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span>Envío seguro a todo Chile</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Shield className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span>Pago 100% seguro</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
