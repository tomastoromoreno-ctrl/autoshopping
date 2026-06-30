import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
            ← Volver al inicio
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-white mb-2">Política de Privacidad</h1>
          <p className="text-sm text-slate-400 mb-8">Última actualización: {new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Responsable del Tratamiento</h2>
              <p>
                AutoShopping SpA, Rut XX.XXX.XXX-X, domiciliada en Chile, es responsable del tratamiento de los datos personales recopilados a través de las tiendas que operan en nuestra plataforma. Cada tienda (comercio) es responsable del tratamiento de los datos de sus propios clientes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Datos Personales que Recopilamos</h2>
              <p>En cumplimiento de la Ley N° 19.628 sobre Protección de la Vida Privada y la Ley N° 21.096, recopilamos únicamente los datos estrictamente necesarios:</p>
              <ul className="mt-3 space-y-2 list-disc list-inside text-slate-400">
                <li><strong className="text-slate-200">Datos de identificación:</strong> nombre completo, correo electrónico, teléfono.</li>
                <li><strong className="text-slate-200">Datos de envío:</strong> dirección, región, comuna, código postal.</li>
                <li><strong className="text-slate-200">Datos de transacción:</strong> historial de compras, métodos de pago utilizados.</li>
                <li><strong className="text-slate-200">Datos de navegación:</strong> dirección IP, tipo de navegador, cookies técnicas.</li>
              </ul>
              <p className="mt-3">No recopilamos datos sensibles (salud, religión, orientación política, etc.) ni datos de menores de edad.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Finalidad del Tratamiento</h2>
              <p>Sus datos personales son utilizados exclusivamente para:</p>
              <ul className="mt-3 space-y-2 list-disc list-inside text-slate-400">
                <li>Procesar y gestionar sus pedidos y compras.</li>
                <li>Enviar confirmaciones de pedido y actualizaciones de envío.</li>
                <li>Gestionar su cuenta de cliente en la tienda.</li>
                <li>Cumplir con obligaciones legales y tributarias (SII, boletas, facturas).</li>
                <li>Enviar comunicaciones de marketing, <strong className="text-slate-200">únicamente con su consentimiento previo y expreso</strong>.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Consentimiento</h2>
              <p>
                Conforme a la Ley N° 19.628, el consentimiento para el tratamiento de datos personales debe ser libre, previo, expreso e informado. Recopilamos su consentimiento de las siguientes maneras:
              </p>
              <ul className="mt-3 space-y-2 list-disc list-inside text-slate-400">
                <li>Al registrar una cuenta, se solicita aceptación expresa de la Política de Privacidad.</li>
                <li>Las comunicaciones de marketing requieren un consentimiento adicional y separado, que puede ser otorgado o revocado en cualquier momento.</li>
                <li>Los consentimientos se registran con fecha, hora, dirección IP y agente de usuario como evidencia.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Almacenamiento y Seguridad</h2>
              <p>
                Sus datos se almacenan en servidores de Supabase (AWS), con cifrado en tránsito (TLS 1.3) y en reposo. Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos contra acceso no autorizado, pérdida o alteración.
              </p>
              <ul className="mt-3 space-y-2 list-disc list-inside text-slate-400">
                <li>Cifrado SSL/TLS en todas las comunicaciones.</li>
                <li>Almacenamiento en servidores seguros con acceso restringido.</li>
                <li>Autenticación obligatoria para acceder a datos personales.</li>
                <li>Registros de auditoría de accesos.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Compartición de Datos con Terceros</h2>
              <p>Sus datos podrán ser compartidos exclusivamente con:</p>
              <ul className="mt-3 space-y-2 list-disc list-inside text-slate-400">
                <li><strong className="text-slate-200">Procesadores de pago:</strong> MercadoPago y/o Transbank, para procesar transacciones de forma segura.</li>
                <li><strong className="text-slate-200">Transportistas:</strong> Empresas de despacho (Chilexpress, Starken, Blue Express, etc.) para la entrega de productos.</li>
                <li><strong className="text-slate-200">Servicio de correo electrónico:</strong> Resend, para el envío de confirmaciones de pedido y comunicaciones transaccionales.</li>
                <li><strong className="text-slate-200">Autoridades competentes:</strong> Cuando la ley lo requiera (Servicio de Impuestos Internos, Juzgados, etc.).</li>
              </ul>
              <p className="mt-3">No vendemos ni comercializamos sus datos personales a terceros.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Derechos del Titular de los Datos</h2>
              <p>Conforme a la Ley N° 19.628 y la Ley N° 21.096, usted tiene derecho a:</p>
              <ul className="mt-3 space-y-2 list-disc list-inside text-slate-400">
                <li><strong className="text-slate-200">Acceso:</strong> Conocer qué datos personales tenemos sobre usted.</li>
                <li><strong className="text-slate-200">Rectificación:</strong> Solicitar la corrección de datos inexactos.</li>
                <li><strong className="text-slate-200">Eliminación:</strong> Solicitar la eliminación de sus datos personales.</li>
                <li><strong className="text-slate-200">Portabilidad:</strong> Recibir sus datos en un formato estructurado y de uso común.</li>
                <li><strong className="text-slate-200">Oposición:</strong> Oponerse al tratamiento de sus datos con fines de marketing.</li>
                <li><strong className="text-slate-200">Revocación:</strong> Revocar su consentimiento en cualquier momento.</li>
              </ul>
              <p className="mt-3">
                Para ejercer estos derechos, puede solicitarlo desde la sección &quot;Mis Datos&quot; en su cuenta de cliente, o contactarnos a través de los medios indicados al final de esta política.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Retención de Datos</h2>
              <p>Los datos personales se conservan por los siguientes períodos:</p>
              <ul className="mt-3 space-y-2 list-disc list-inside text-slate-400">
                <li><strong className="text-slate-200">Datos de cuenta:</strong> Mientras la cuenta esté activa. Tras la eliminación solicitada, los datos se eliminan en un plazo máximo de 30 días.</li>
                <li><strong className="text-slate-200">Datos de transacciones:</strong> Se conservan por un período de 6 años para cumplir con obligaciones tributarias (Ley sobre Impuesto a la Renta).</li>
                <li><strong className="text-slate-200">Datos de marketing:</strong> Se eliminan inmediatamente tras la revocación del consentimiento.</li>
                <li><strong className="text-slate-200">Registros de consentimiento:</strong> Se conservan por un período de 5 años como evidencia del otorgamiento.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Cookies</h2>
              <p>Utilizamos cookies para mejorar su experiencia de navegación:</p>
              <ul className="mt-3 space-y-2 list-disc list-inside text-slate-400">
                <li><strong className="text-slate-200">Cookies esenciales:</strong> Necesarias para el funcionamiento del sitio (carrito de compras, sesión de usuario, seguridad).</li>
                <li><strong className="text-slate-200">Cookies de rendimiento:</strong> Recopilan información anónima sobre cómo los visitantes utilizan el sitio.</li>
                <li><strong className="text-slate-200">Cookies de funcionalidad:</strong> Permiten recordar sus preferencias (idioma, región).</li>
              </ul>
              <p className="mt-3">Puede configurar su navegador para rechazar cookies. Sin embargo, algunas funciones del sitio podrían no funcionar correctamente.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. Privacidad de Menores</h2>
              <p>
                Nuestros servicios de comercio electrónico no están dirigidos a menores de 18 años. No recopilamos intencionalmente datos personales de menores de edad. Si un padre o tutor nos comunica que su hijo nos ha proporcionado datos personales, procederemos a eliminar dicha información de nuestros registros.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">11. Cambios en esta Política</h2>
              <p>
                Nos reservamos el derecho de actualizar esta Política de Privacidad en cualquier momento. Los cambios serán publicados en esta página con la fecha de última actualización. Le recomendamos revisar periódicamente esta política.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">12. Contacto</h2>
              <p>Para ejercer sus derechos o realizar consultas sobre privacidad:</p>
              <ul className="mt-3 space-y-2 list-disc list-inside text-slate-400">
                <li><strong className="text-slate-200">Correo electrónico:</strong> privacidad@autoshopping.cl</li>
                <li><strong className="text-slate-200">Plataforma:</strong> Desde la sección &quot;Mis Datos&quot; en su cuenta de cliente</li>
              </ul>
              <p className="mt-3">
                Si considera que el tratamiento de sus datos no se ajusta a la normativa, puede presentar una reclamación ante el Tribunal Civil competente.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
