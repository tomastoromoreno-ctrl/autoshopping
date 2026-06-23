export type Locale = 'es' | 'en';

const translations = {
  es: {
    nav: { home: 'Inicio', products: 'Productos', cart: 'Carrito', orders: 'Mis Pedidos', login: 'Iniciar sesión', register: 'Crear cuenta' },
    landing: { title: 'Crea tu tienda online', subtitle: 'La plataforma todo-en-uno para tu e-commerce', cta: 'Crear mi tienda gratis', pricing: 'Ver precios' },
    dashboard: { title: 'Dashboard', products: 'Productos', categories: 'Categorías', promotions: 'Promociones', orders: 'Órdenes', config: 'Configuración', appearance: 'Apariencia', users: 'Usuarios' },
    onboarding: { title: 'Crea tu tienda', subtitle: 'Configura tu e-commerce en menos de 1 minuto', storeName: 'Nombre de tu tienda', subdomain: 'Subdominio', create: 'Crear mi tienda', free: 'Gratis para empezar. Sin tarjeta de crédito.' },
    cart: { title: 'Carrito', empty: 'Tu carrito está vacío', total: 'Total', checkout: 'Ir a pagar', continue: 'Seguir comprando' },
    checkout: { title: 'Checkout', name: 'Nombre completo', email: 'Email', phone: 'Teléfono', address: 'Dirección', pay: 'Pagar', success: '¡Pedido confirmado!' },
    admin: { title: 'Panel de Administración', tenants: 'Tiendas', users: 'Usuarios', orders: 'Órdenes', stats: 'Estadísticas' },
    common: { save: 'Guardar', cancel: 'Cancelar', delete: 'Eliminar', edit: 'Editar', search: 'Buscar', loading: 'Cargando...', error: 'Error', success: 'Éxito', confirm: '¿Estás seguro?' },
  },
  en: {
    nav: { home: 'Home', products: 'Products', cart: 'Cart', orders: 'My Orders', login: 'Sign in', register: 'Create account' },
    landing: { title: 'Create your online store', subtitle: 'The all-in-one platform for your e-commerce', cta: 'Create my free store', pricing: 'View pricing' },
    dashboard: { title: 'Dashboard', products: 'Products', categories: 'Categories', promotions: 'Promotions', orders: 'Orders', config: 'Settings', appearance: 'Appearance', users: 'Users' },
    onboarding: { title: 'Create your store', subtitle: 'Set up your e-commerce in less than 1 minute', storeName: 'Store name', subdomain: 'Subdomain', create: 'Create my store', free: 'Free to start. No credit card required.' },
    cart: { title: 'Cart', empty: 'Your cart is empty', total: 'Total', checkout: 'Checkout', continue: 'Continue shopping' },
    checkout: { title: 'Checkout', name: 'Full name', email: 'Email', phone: 'Phone', address: 'Address', pay: 'Pay', success: 'Order confirmed!' },
    admin: { title: 'Administration Panel', tenants: 'Stores', users: 'Users', orders: 'Orders', stats: 'Statistics' },
    common: { save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', search: 'Search', loading: 'Loading...', error: 'Error', success: 'Success', confirm: 'Are you sure?' },
  },
} as const;

export function t(locale: Locale, key: string): string {
  const keys = key.split('.');
  let result: any = translations[locale];
  for (const k of keys) {
    result = result?.[k];
  }
  return (typeof result === 'string' ? result : key) as string;
}
