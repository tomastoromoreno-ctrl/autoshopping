import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
            ← Volver al inicio
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-white mb-2">Términos y Condiciones</h1>
          <p className="text-sm text-slate-400 mb-8">Última actualización: 30 de junio de 2026</p>

          <div className="space-y-8 text-slate-300 text-sm leading-relaxed">

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Aceptación de los Términos</h2>
              <p>
                Al acceder, registrarse o utilizar la plataforma AutoShopping (en adelante, "la Plataforma"),
                usted acepta quedar vinculado por los presentes Términos y Condiciones (en adelante, "Términos").
                Si no está de acuerdo con alguna de estas disposiciones, no podrá utilizar la Plataforma.
              </p>
              <p>
                AutoShopping SpA, Rut XX.XXX.XXX-X, domiciliada en Chile, es la empresa operadora de la Plataforma
                y se reserva el derecho de modificar estos Términos en cualquier momento, notificando los cambios
                con al menos 15 días de antelación a través de la Plataforma o por correo electrónico.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Definiciones</h2>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li><strong className="text-slate-200">AutoShopping:</strong> Plataforma SaaS de comercio electrónico que permite a comerciantes crear y operar tiendas online.</li>
                <li><strong className="text-slate-200">Usuario:</strong> Toda persona natural o jurídica que acceda a la Plataforma, ya sea como visitante, comerciante o cliente final.</li>
                <li><strong className="text-slate-200">Comerciante:</strong> Usuario registrado que crea y opera una o más tiendas en la Plataforma.</li>
                <li><strong className="text-slate-200">Cliente:</strong> Usuario que realiza compras en las tiendas alojadas en la Plataforma.</li>
                <li><strong className="text-slate-200">Tienda:</strong> Espacio virtual individualizado dentro de la Plataforma, gestionado por un Comerciante.</li>
                <li><strong className="text-slate-200">Servicios:</strong> Funcionalidades ofrecidas por AutoShopping, incluyendo catálogo de productos, carrito de compras, procesamiento de pagos, facturación, y demás herramientas comerciales.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Registro y Cuentas</h2>
              <p>3.1. Para acceder a los Servicios como Comerciante, el Usuario debe registrarse proporcionando información veraz, completa y actualizada.</p>
              <p>3.2. El Comerciante es responsable de mantener la confidencialidad de sus credenciales de acceso y de todas las actividades que ocurran bajo su cuenta.</p>
              <p>3.3. AutoShopping se reserva el derecho de rechazar, suspender o cancelar cualquier cuenta si se detectan actividades fraudulentas, información falsa o incumplimiento de estos Términos.</p>
              <p>3.4. Los Clientes finales se registran directamente en cada Tienda y están sujetos a los términos particulares de cada Comerciante, sin perjuicio de las disposiciones generales de estos Términos.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Planes y Facturación</h2>
              <p>4.1. AutoShopping ofrece planes de suscripción con diferentes niveles de funcionalidades, según lo publicado en la sección de Precios de la Plataforma.</p>
              <p>4.2. El plan Starter es gratuito e incluye funcionalidades limitadas. Los planes Growth y Pro tienen un costo mensual que será informado al Comerciante al momento de la contratación.</p>
              <p>4.3. La facturación se realiza de forma mensual anticipada. El Comerciante autoriza a AutoShopping a realizar los cobros a través del medio de pago registrado.</p>
              <p>4.4. En caso de mora, AutoShopping podrá suspender la Tienda hasta que se regularice el pago. Transcurridos 30 días de mora, la cuenta podrá ser cancelada definitivamente.</p>
              <p>4.5. El Comerciante puede cancelar su suscripción en cualquier momento desde el panel de configuración. La cancelación tendrá efecto al final del período de facturación vigente.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Obligaciones del Comerciante</h2>
              <p>El Comerciante se obliga a:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>Cumplir con todas las leyes aplicables, incluyendo las leyes de protección al consumidor (Ley N° 19.496), protección de datos personales (Ley N° 19.628 y Ley N° 21.719) y tributarias (Código Tributario, D.L. N° 825).</li>
                <li>Publicar productos lícitos, con descripciones veraces y precios claros en pesos chilenos, incluyendo impuestos aplicables.</li>
                <li>Gestionar y despachar los pedidos recibidos en los plazos ofrecidos al Cliente.</li>
                <li>Mantener una política de cambios, devoluciones y reembolsos conforme a la Ley del Consumidor.</li>
                <li>No utilizar la Plataforma para actividades ilícitas, fraudulentas o que infrinjan derechos de terceros.</li>
                <li>No vender productos prohibidos por la ley (armas, drogas, contenidos ilegales, etc.).</li>
                <li>Designar un Delegado de Protección de Datos (DPO) cuando corresponda conforme a la Ley N° 21.719.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Procesamiento de Pagos</h2>
              <p>6.1. Los pagos de los Clientes son procesados a través de proveedores externos (MercadoPago y/o Transbank). AutoShopping no almacena ni tiene acceso a los datos de tarjetas de crédito, débito u otros medios de pago.</p>
              <p>6.2. El Comerciante autoriza a AutoShopping a retener las comisiones correspondientes por el uso de la Plataforma.</p>
              <p>6.3. Los montos recaudados por ventas serán transferidos al Comerciante según los plazos y condiciones establecidos por cada medio de pago, menos las comisiones aplicables.</p>
              <p>6.4. Las disputas entre Comerciante y Cliente respecto de pagos deberán ser resueltas directamente entre las partes. AutoShopping podrá mediar a solicitud de cualquiera de ellas.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Facturación Electrónica (SII)</h2>
              <p>7.1. AutoShopping ofrece la generación automática de documentos tributarios electrónicos (boletas y facturas) conforme a las normas del Servicio de Impuestos Internos (SII).</p>
              <p>7.2. El Comerciante es responsable de mantener actualizados sus datos tributarios y certificados de firma electrónica avanzada.</p>
              <p>7.3. Los documentos tributarios emitidos a través de la Plataforma tienen plena validez legal.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Propiedad Intelectual</h2>
              <p>8.1. AutoShopping es titular de todos los derechos de propiedad intelectual sobre la Plataforma, incluyendo su código fuente, diseño, marcas, logotipos y contenido, salvo aquello que sea proporcionado por los Comerciantes.</p>
              <p>8.2. El Comerciante conserva todos los derechos sobre su marca, nombre comercial, productos, imágenes y contenido propio.</p>
              <p>8.3. Se concede al Comerciante una licencia limitada, no exclusiva e intransferible para utilizar la Plataforma durante la vigencia de su suscripción.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Protección de Datos Personales</h2>
              <p>9.1. El tratamiento de datos personales se realiza conforme a nuestra <Link href="/privacy" className="text-blue-400 hover:underline">Política de Privacidad</Link> y en cumplimiento de las Leyes N° 19.628 y N° 21.719.</p>
              <p>9.2. AutoShopping actúa como Encargado del Tratamiento respecto de los datos de los Clientes de cada Tienda. El Comerciante es el Responsable del Tratamiento.</p>
              <p>9.3. El Comerciante declara haber informado a sus Clientes sobre el tratamiento de sus datos personales y haber obtenido los consentimientos necesarios.</p>
              <p>9.4. AutoShopping implementa medidas de seguridad técnicas y organizativas para proteger los datos personales, incluyendo cifrado TLS en tránsito y AES-256 en reposo.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. Limitación de Responsabilidad</h2>
              <p>10.1. AutoShopping no será responsable por daños directos, indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso de la Plataforma.</p>
              <p>10.2. AutoShopping no garantiza que la Plataforma esté libre de errores, interrupciones o virus, pero realizará los mejores esfuerzos para mantener su correcto funcionamiento.</p>
              <p>10.3. AutoShopping no será responsable por los actos u omisiones de los Comerciantes, incluyendo incumplimientos en la entrega de productos, calidad de los mismos o políticas de cambios y devoluciones.</p>
              <p>10.4. La responsabilidad total de AutoShopping frente al Comerciante por cualquier causa se limitará al valor total de las comisiones pagadas por dicho Comerciante en los 12 meses anteriores al evento que dio origen a la reclamación.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">11. Suspensión y Terminación</h2>
              <p>11.1. AutoShopping podrá suspender temporalmente una Tienda por: (a) mora en el pago, (b) incumplimiento grave de estos Términos, (c) actividades fraudulentas o ilícitas, o (d) solicitud de autoridad competente.</p>
              <p>11.2. Cualquiera de las partes puede terminar la relación contractual con aviso previo de 30 días.</p>
              <p>11.3. Terminada la relación, el Comerciante deberá descargar sus datos dentro de los 30 días siguientes. Transcurrido ese plazo, AutoShopping podrá eliminar definitivamente los datos de la Tienda.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">12. Canal de Comunicación y Notificaciones</h2>
              <p>12.1. AutoShopping se comunicará con los Comerciantes a través del correo electrónico registrado en la cuenta y mediante notificaciones en el panel de administración.</p>
              <p>12.2. Toda notificación legal deberá dirigirse a: <strong className="text-slate-200">AutoShopping SpA</strong>, email: <a href="mailto:legal@autoshopping.cl" className="text-blue-400 hover:underline">legal@autoshopping.cl</a>.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">13. Ley Aplicable y Jurisdicción</h2>
              <p>13.1. Estos Términos se rigen por la legislación chilena.</p>
              <p>13.2. Para cualquier controversia derivada de estos Términos, las partes se someten a la jurisdicción de los tribunales ordinarios de la ciudad de Santiago, Chile, renunciando a cualquier otro fuero que pudiera corresponderles.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">14. Disposiciones Finales</h2>
              <p>14.1. La declaración de nulidad o inexigibilidad de alguna disposición de estos Términos no afectará la validez de las restantes.</p>
              <p>14.2. Estos Términos constituyen el acuerdo íntegro entre las partes respecto de su objeto, reemplazando cualquier acuerdo previo.</p>
              <p>14.3. El hecho de que AutoShopping no exija el cumplimiento estricto de alguna de estas disposiciones no constituirá una renuncia a sus derechos.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">15. Contacto</h2>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <p className="text-slate-300"><strong className="text-white">AutoShopping SpA</strong></p>
                <p className="text-slate-400 mt-1">Email: <a href="mailto:legal@autoshopping.cl" className="text-blue-400 hover:underline">legal@autoshopping.cl</a></p>
                <p className="text-slate-400">Plataforma: <Link href="/" className="text-blue-400 hover:underline">autoshopping.cl</Link></p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
