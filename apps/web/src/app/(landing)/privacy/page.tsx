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
          <p className="text-xs text-amber-400 mb-8 bg-amber-950/50 border border-amber-800 rounded-xl p-3">
            Esta política cumple con la Ley N° 19.628 sobre Protección de la Vida Privada y la Ley N° 21.719 (vigente desde el 1 de diciembre de 2026) que moderniza la protección de datos personales en Chile.
          </p>

          <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Responsable del Tratamiento</h2>
              <p>
                AutoShopping SpA, Rut XX.XXX.XXX-X, domiciliada en Chile, es responsable del tratamiento de los datos personales recopilados a través de las tiendas que operan en nuestra plataforma. Cada tienda (comercio) es responsable del tratamiento de los datos de sus propios clientes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Datos Personales que Recopilamos</h2>
              <p>En cumplimiento de las Leyes N° 19.628 y N° 21.719, recopilamos únicamente los datos estrictamente necesarios:</p>
              <ul className="mt-3 space-y-2 list-disc list-inside text-slate-400">
                <li><strong className="text-slate-200">Datos de identificación:</strong> nombre completo, correo electrónico, teléfono.</li>
                <li><strong className="text-slate-200">Datos de envío:</strong> dirección, región, comuna, código postal.</li>
                <li><strong className="text-slate-200">Datos de transacción:</strong> historial de compras, métodos de pago utilizados.</li>
                <li><strong className="text-slate-200">Datos de navegación:</strong> dirección IP, tipo de navegador, cookies técnicas.</li>
              </ul>
              <p className="mt-3">No recopilamos datos sensibles (salud, religión, orientación política, etc.) ni datos de menores de edad.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Finalidad y Base Legal del Tratamiento</h2>
              <p>Sus datos personales son tratados conforme a las siguientes bases de licitud (Art. 5, Ley 21.719):</p>
              <ul className="mt-3 space-y-2 list-disc list-inside text-slate-400">
                <li><strong className="text-slate-200">Ejecución de un contrato:</strong> Procesar y gestionar sus pedidos y compras.</li>
                <li><strong className="text-slate-200">Obligación legal:</strong> Cumplir con obligaciones tributarias (SII, boletas, facturas).</li>
                <li><strong className="text-slate-200">Consentimiento:</strong> Enviar comunicaciones de marketing, únicamente con su consentimiento previo y expreso.</li>
                <li><strong className="text-slate-200">Interés legítimo:</strong> Mejorar nuestros servicios y prevenir fraudes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Consentimiento</h2>
              <p>
                Conforme a la Ley N° 21.719, el consentimiento debe ser libre, previo, expreso, informado e inequívoco. Recopilamos su consentimiento de las siguientes maneras:
              </p>
              <ul className="mt-3 space-y-2 list-disc list-inside text-slate-400">
                <li>Al registrar una cuenta, se solicita aceptación expresa de la Política de Privacidad.</li>
                <li>Las comunicaciones de marketing requieren un consentimiento adicional y separado, que puede ser otorgado o revocado en cualquier momento.</li>
                <li>Los consentimientos se registran con fecha, hora, dirección IP y agente de usuario como evidencia de cumplimiento.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Derechos del Titular (ARCO-P-B)</h2>
              <p>Conforme a la Ley N° 21.719, usted tiene los siguientes derechos, que puede ejercer desde la sección "Mis Datos" en su cuenta de cliente:</p>
              <ul className="mt-3 space-y-2 list-disc list-inside text-slate-400">
                <li><strong className="text-slate-200">Acceso:</strong> Conocer qué datos personales tenemos sobre usted.</li>
                <li><strong className="text-slate-200">Rectificación:</strong> Solicitar la corrección de datos inexactos o incompletos.</li>
                <li><strong className="text-slate-200">Cancelación:</strong> Solicitar la eliminación de sus datos personales.</li>
                <li><strong className="text-slate-200">Oposición:</strong> Oponerse al tratamiento de sus datos para fines específicos (marketing, elaboración de perfiles).</li>
                <li><strong className="text-slate-200">Portabilidad:</strong> Recibir sus datos en un formato estructurado, de uso común y lectura mecánica.</li>
                <li><strong className="text-slate-200">Bloqueo:</strong> Solicitar el bloqueo temporal del tratamiento de sus datos.</li>
              </ul>
              <p className="mt-3">
                Plazo de respuesta: máximo 30 días corridos, prorrogables por 30 días adicionales en casos complejos (Art. 14, Ley 21.719).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Delegado de Protección de Datos (DPO)</h2>
              <p>
                Conforme al Art. 14 quáter de la Ley 21.719, hemos designado un Delegado de Protección de Datos para supervisar el cumplimiento normativo y atender sus consultas:
              </p>
              <div className="mt-3 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-slate-300">
                <p><strong className="text-white">DPO:</strong> Delegado de Protección de Datos</p>
                <p><strong className="text-white">Email:</strong> <a href="mailto:privacidad@autoshopping.cl" className="text-blue-400 hover:underline">privacidad@autoshopping.cl</a></p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Almacenamiento y Seguridad</h2>
              <p>
                Sus datos se almacenan en servidores de Supabase (AWS), con cifrado en tránsito (TLS 1.3) y en reposo (AES-256). Implementamos medidas de seguridad técnicas y organizativas:
              </p>
              <ul className="mt-3 space-y-2 list-disc list-inside text-slate-400">
                <li>Cifrado SSL/TLS en todas las comunicaciones.</li>
                <li>Almacenamiento en servidores seguros con acceso restringido.</li>
                <li>Autenticación obligatoria para acceder a datos personales.</li>
                <li>Registros de auditoría de accesos.</li>
                <li>Seudonimización de datos cuando es técnicamente factible.</li>
                <li>Política de seguridad de la información documentada.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Compartición de Datos con Terceros (Encargados)</h2>
              <p>Sus datos podrán ser compartidos exclusivamente con los siguientes encargados de tratamiento, con quienes mantenemos contratos que regulan el tratamiento de datos conforme al Art. 8 de la Ley 21.719:</p>
              <ul className="mt-3 space-y-2 list-disc list-inside text-slate-400">
                <li><strong className="text-slate-200">Procesadores de pago:</strong> MercadoPago y/o Transbank, para procesar transacciones.</li>
                <li><strong className="text-slate-200">Transportistas:</strong> Chilexpress, Starken, Blue Express, etc. para la entrega de productos.</li>
                <li><strong className="text-slate-200">Servicio de correo electrónico:</strong> Resend, para el envío de comunicaciones transaccionales.</li>
                <li><strong className="text-slate-200">Infraestructura cloud:</strong> Supabase (AWS) para almacenamiento de datos.</li>
                <li><strong className="text-slate-200">Autoridades competentes:</strong> Cuando la ley lo requiera (SII, Tribunales, APDP, etc.).</li>
              </ul>
              <p className="mt-3">No vendemos ni comercializamos sus datos personales a terceros.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Transferencias Internacionales de Datos</h2>
              <p>
                Sus datos personales podrán ser transferidos a países que ofrecen un nivel adecuado de protección de datos conforme al Art. 13 de la Ley 21.719. Los servicios que utilizamos (Supabase/AWS, Resend, MercadoPago) pueden implicar transferencias a Estados Unidos y otros países, siempre bajo mecanismos que garantizan un nivel de protección equivalente (cláusulas contractuales tipo, certificaciones internacionales).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. Notificación de Brechas de Datos</h2>
              <p>
                Conforme al Art. 14 sexies de la Ley 21.719, en caso de una violación de seguridad que afecte sus datos personales, nos comprometemos a:
              </p>
              <ul className="mt-3 space-y-2 list-disc list-inside text-slate-400">
                <li>Notificar a la Agencia de Protección de Datos Personales (APDP) dentro de las 72 horas siguientes de conocido el incidente.</li>
                <li>Informar a los titulares afectados sin dilación indebida cuando la brecha pueda generar un riesgo significativo para sus derechos.</li>
                <li>Documentar todas las brechas en un registro interno, incluyendo las medidas correctivas adoptadas.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">11. Retención de Datos</h2>
              <p>Los datos personales se conservan por los siguientes períodos, conforme al principio de limitación del plazo de conservación:</p>
              <ul className="mt-3 space-y-2 list-disc list-inside text-slate-400">
                <li><strong className="text-slate-200">Datos de cuenta:</strong> Mientras la cuenta esté activa. Tras la eliminación, se eliminan en un plazo máximo de 30 días.</li>
                <li><strong className="text-slate-200">Datos de transacciones:</strong> Se conservan por 6 años para cumplir con obligaciones tributarias.</li>
                <li><strong className="text-slate-200">Datos de marketing:</strong> Se eliminan inmediatamente tras la revocación del consentimiento.</li>
                <li><strong className="text-slate-200">Registros de consentimiento:</strong> Se conservan por 5 años como evidencia de cumplimiento.</li>
              </ul>
              <p className="mt-3">Una vez cumplido el plazo de conservación, los datos se eliminan de forma segura.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">12. Cookies</h2>
              <p>Utilizamos cookies para mejorar su experiencia de navegación:</p>
              <ul className="mt-3 space-y-2 list-disc list-inside text-slate-400">
                <li><strong className="text-slate-200">Cookies esenciales:</strong> Necesarias para el funcionamiento del sitio (carrito, sesión, seguridad).</li>
                <li><strong className="text-slate-200">Cookies de rendimiento:</strong> Recopilan información anónima sobre el uso del sitio.</li>
                <li><strong className="text-slate-200">Cookies de funcionalidad:</strong> Permiten recordar sus preferencias (idioma, región).</li>
              </ul>
              <p className="mt-3">Puede configurar su navegador para rechazar cookies. Algunas funciones podrían no funcionar correctamente.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">13. Privacidad de Menores</h2>
              <p>
                Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos intencionalmente datos personales de menores. Si un padre o tutor nos comunica que su hijo nos ha proporcionado datos personales, procederemos a eliminar dicha información.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">14. Autoridad de Control</h2>
              <p>
                La Agencia de Protección de Datos Personales (APDP) es la autoridad encargada de fiscalizar el cumplimiento de la Ley N° 21.719. Si considera que el tratamiento de sus datos no se ajusta a la normativa, puede presentar una reclamación ante la APDP:
              </p>
              <div className="mt-3 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-slate-300">
                <p><strong className="text-white">Agencia de Protección de Datos Personales</strong></p>
                <p>Sitio web: <a href="https://www.apdp.cl" className="text-blue-400 hover:underline">www.apdp.cl</a></p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">15. Cambios en esta Política</h2>
              <p>
                Nos reservamos el derecho de actualizar esta Política de Privacidad. Los cambios serán publicados en esta página con la fecha de última actualización. Le recomendamos revisar periódicamente esta política.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">16. Contacto</h2>
              <p>Para ejercer sus derechos o realizar consultas sobre privacidad:</p>
              <ul className="mt-3 space-y-2 list-disc list-inside text-slate-400">
                <li><strong className="text-slate-200">DPO:</strong> Delegado de Protección de Datos</li>
                <li><strong className="text-slate-200">Correo electrónico:</strong> <a href="mailto:privacidad@autoshopping.cl" className="text-blue-400 hover:underline">privacidad@autoshopping.cl</a></li>
                <li><strong className="text-slate-200">Plataforma:</strong> Desde la sección "Mis Datos" en su cuenta de cliente</li>
                <li><strong className="text-slate-200">Plazo de respuesta:</strong> Máximo 30 días corridos</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
