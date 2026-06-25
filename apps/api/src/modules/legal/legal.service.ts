import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

// Legal document templates for Chilean ecommerce
const TEMPLATES: Record<string, { title: string; template: string }> = {
  terms_conditions: {
    title: 'Términos y Condiciones',
    template: `# Términos y Condiciones de {{nombre_tienda}}

**Última actualización:** {{fecha}}

## 1. Información General

El presente documento establece los Términos y Condiciones generales de uso del sitio web {{sitio_web}}, propiedad de {{nombre_tienda}} (en adelante, "la Empresa"), con RUT {{rut_empresa}}, domiciliada en {{direccion}}, {{comuna}}, {{ciudad}}, Chile.

## 2. Aceptación de los Términos

Al acceder y utilizar este sitio web, usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no deberá utilizar nuestro sitio.

## 3. Productos y Precios

- Los precios están expresados en pesos chilenos (CLP) e incluyen IVA según la legislación tributaria chilena vigente.
- {{nombre_tienda}} se reserva el derecho de modificar los precios sin previo aviso.
- Las imágenes de los productos son referenciales y pueden variar del producto real.
- La disponibilidad de productos está sujeta a stock.

## 4. Proceso de Compra

- Para realizar una compra, el usuario debe seguir el proceso de checkout indicado en el sitio.
- La confirmación del pedido se realizará mediante correo electrónico.
- {{nombre_tienda}} se reserva el derecho de cancelar pedidos en caso de errores de precio o falta de stock.

## 5. Medios de Pago

Se aceptan los siguientes medios de pago:
- Tarjetas de crédito y débito (a través de los proveedores de pago habilitados)
- Transferencia bancaria (cuando esté disponible)

## 6. Despacho y Entrega

- Los plazos y costos de envío se informan durante el proceso de compra.
- Los plazos de entrega son estimados y pueden variar según la zona de despacho.
- {{nombre_tienda}} no se responsabiliza por retrasos ocasionados por el servicio de transporte.

## 7. Derecho de Retracto

De acuerdo con la Ley N° 19.496 sobre Protección de los Derechos de los Consumidores, el consumidor tiene derecho a retractarse de la compra dentro de los 10 días siguientes a la recepción del producto, siempre que:
- El producto se encuentre en las mismas condiciones en que fue recibido.
- Se presente el comprobante de compra o boleta/factura.

## 8. Garantía Legal

Todos los productos cuentan con la garantía legal de 6 meses establecida por la Ley del Consumidor chilena (Ley 19.496). En caso de productos defectuosos, el consumidor podrá optar por la reparación, cambio o devolución del dinero.

## 9. Protección de Datos

{{nombre_tienda}} se compromete a proteger la información personal de sus clientes conforme a la Ley N° 19.628 sobre Protección de la Vida Privada y la Ley N° 21.096 que consagra el derecho a la protección de datos personales.

## 10. Propiedad Intelectual

Todo el contenido del sitio web, incluyendo textos, imágenes, logotipos y diseño, es propiedad de {{nombre_tienda}} y está protegido por las leyes de propiedad intelectual de Chile.

## 11. Ley Aplicable

Estos Términos y Condiciones se rigen por las leyes de la República de Chile. Cualquier controversia será sometida a los tribunales competentes de {{ciudad}}.

## 12. Contacto

Para consultas sobre estos Términos y Condiciones, puede contactarnos en:
- Email: {{email_contacto}}
- Dirección: {{direccion}}, {{comuna}}, {{ciudad}}`,
  },

  privacy_policy: {
    title: 'Política de Privacidad',
    template: `# Política de Privacidad de {{nombre_tienda}}

**Última actualización:** {{fecha}}

## 1. Responsable del Tratamiento

{{nombre_tienda}}, con RUT {{rut_empresa}}, domiciliada en {{direccion}}, {{comuna}}, {{ciudad}}, Chile, es responsable del tratamiento de sus datos personales.

## 2. Datos que Recopilamos

Recopilamos la siguiente información:
- **Datos de identificación:** nombre, apellido, RUT, correo electrónico.
- **Datos de contacto:** teléfono, dirección de envío.
- **Datos de transacción:** historial de compras, métodos de pago utilizados.
- **Datos de navegación:** dirección IP, tipo de navegador, páginas visitadas, cookies.

## 3. Finalidad del Tratamiento

Sus datos personales son utilizados para:
- Procesar y gestionar sus pedidos y compras.
- Enviar confirmaciones de pedido y actualizaciones de envío.
- Mejorar nuestros productos y servicios.
- Enviar comunicaciones comerciales (con su consentimiento previo).
- Cumplir con obligaciones legales y tributarias.

## 4. Base Legal

El tratamiento de datos se realiza conforme a:
- La Ley N° 19.628 sobre Protección de la Vida Privada.
- La Ley N° 21.096 sobre protección de datos personales.
- El consentimiento del titular de los datos.
- La ejecución de un contrato de compraventa.

## 5. Compartición de Datos

Sus datos podrán ser compartidos con:
- Proveedores de servicios de pago para procesar transacciones.
- Empresas de transporte para la entrega de productos.
- Autoridades competentes cuando la ley lo requiera (SII, etc.).

No vendemos ni comercializamos sus datos personales a terceros.

## 6. Derechos del Titular

Usted tiene derecho a:
- **Acceder** a sus datos personales.
- **Rectificar** datos inexactos.
- **Cancelar** el tratamiento de sus datos.
- **Oponerse** al tratamiento con fines de marketing.

Para ejercer estos derechos, contacte a: {{email_contacto}}

## 7. Seguridad

Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos contra acceso no autorizado, pérdida o alteración, incluyendo cifrado SSL/TLS y almacenamiento seguro.

## 8. Cookies

Utilizamos cookies para mejorar la experiencia de navegación. Consulte nuestra Política de Cookies para más información.

## 9. Contacto

Para consultas sobre privacidad: {{email_contacto}}`,
  },

  refund_policy: {
    title: 'Política de Devoluciones',
    template: `# Política de Devoluciones y Reembolsos de {{nombre_tienda}}

**Última actualización:** {{fecha}}

## 1. Derecho de Retracto

De acuerdo con el artículo 3 bis de la Ley N° 19.496, usted tiene derecho a retractarse de su compra dentro de los **10 días corridos** desde la recepción del producto, cuando la compra se realiza por medios electrónicos.

## 2. Condiciones para la Devolución

Para procesar una devolución, el producto debe:
- Encontrarse sin uso y en su empaque original.
- Incluir todos los accesorios, manuales y etiquetas.
- Presentar el comprobante de compra (boleta o factura).

## 3. Productos No Retornables

No se aceptan devoluciones de:
- Productos de higiene personal una vez abiertos.
- Productos perecibles.
- Productos personalizados o hechos a medida.
- Software descargado o activado.

## 4. Proceso de Devolución

1. Contacte a nuestro equipo en {{email_contacto}} indicando su número de pedido.
2. Recibirá instrucciones para el envío del producto.
3. Una vez recibido y verificado el producto, procesaremos el reembolso.

## 5. Reembolsos

- El reembolso se realizará por el mismo medio de pago utilizado en la compra.
- El plazo de reembolso es de **10 días hábiles** desde la recepción del producto devuelto.
- Los costos de envío de la devolución son responsabilidad del cliente, salvo que el producto presente defectos.

## 6. Garantía Legal

Conforme al artículo 20 de la Ley N° 19.496, usted tiene derecho a la garantía legal de **6 meses** en caso de:
- Productos defectuosos.
- Productos que no correspondan a lo ofrecido.
- Productos que no sean aptos para el uso previsto.

En estos casos, podrá optar por: reparación gratuita, cambio del producto o devolución del dinero.

## 7. Contacto

{{email_contacto}}
{{direccion}}, {{comuna}}, {{ciudad}}`,
  },

  shipping_policy: {
    title: 'Política de Envíos',
    template: `# Política de Envíos de {{nombre_tienda}}

**Última actualización:** {{fecha}}

## 1. Cobertura de Envío

{{nombre_tienda}} realiza envíos a todo Chile continental. Consulte disponibilidad para zonas extremas (Arica, Punta Arenas, etc.).

## 2. Plazos de Entrega

- **Región Metropolitana:** 1 a 3 días hábiles.
- **Regiones principales:** 3 a 5 días hábiles.
- **Zonas extremas:** 5 a 10 días hábiles.

Los plazos son estimados y pueden variar según la disponibilidad del transportista.

## 3. Costos de Envío

- Los costos de envío se calculan según el peso, volumen y destino del pedido.
- El costo final se informa antes de confirmar la compra.
- Promociones de envío gratuito pueden aplicar según el monto de compra.

## 4. Seguimiento del Pedido

Una vez despachado su pedido, recibirá un correo electrónico con el número de seguimiento para rastrear su envío.

## 5. Recepción del Pedido

- Verifique el estado del paquete al momento de la recepción.
- En caso de daños visibles en el embalaje, registre una observación con el transportista.
- Reporte cualquier problema dentro de las 48 horas siguientes a la recepción.

## 6. Contacto

Para consultas sobre envíos: {{email_contacto}}`,
  },

  cookies_policy: {
    title: 'Política de Cookies',
    template: `# Política de Cookies de {{nombre_tienda}}

**Última actualización:** {{fecha}}

## 1. ¿Qué son las Cookies?

Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita nuestro sitio web. Nos permiten mejorar su experiencia de navegación.

## 2. Tipos de Cookies que Utilizamos

### Cookies Esenciales
Necesarias para el funcionamiento del sitio (carrito de compras, sesión de usuario, seguridad).

### Cookies de Rendimiento
Recopilan información anónima sobre cómo los visitantes utilizan el sitio, ayudándonos a mejorar.

### Cookies de Funcionalidad
Permiten recordar sus preferencias (idioma, región, configuración de visualización).

### Cookies de Marketing
Utilizadas para mostrar publicidad relevante según sus intereses.

## 3. Control de Cookies

Puede configurar su navegador para rechazar cookies. Sin embargo, algunas funciones del sitio podrían no funcionar correctamente.

## 4. Cookies de Terceros

Utilizamos servicios de terceros que pueden instalar cookies:
- **Google Analytics:** para análisis de tráfico web.
- **Proveedores de pago:** para procesar transacciones seguras.

## 5. Contacto

Para consultas: {{email_contacto}}`,
  },
};

@Injectable()
export class LegalService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async listDocuments(tenantId: string) {
    const { data, error } = await this.supabase
      .from('legal_documents')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('type')
      .order('version', { ascending: false });

    if (error) throw new BadRequestException(error.message);

    // Return available types with their status
    const types = Object.keys(TEMPLATES);
    const result = types.map((type) => {
      const docs = (data || []).filter((d) => d.type === type);
      const activeDoc = docs.find((d) => d.is_active);
      return {
        type,
        title: TEMPLATES[type].title,
        document: activeDoc || null,
        versions: docs.length,
        hasDocument: !!activeDoc,
      };
    });

    return result;
  }

  async generateDocument(tenantId: string, type: string) {
    const template = TEMPLATES[type];
    if (!template) throw new BadRequestException(`Tipo de documento inválido: ${type}`);

    // Get tenant info for template variables
    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('name, subdomain')
      .eq('id', tenantId)
      .single();

    // Get invoicing config for business data
    const { data: invConfig } = await this.supabase
      .from('invoicing_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    // Get store config for contact info
    const { data: storeConfig } = await this.supabase
      .from('store_configs')
      .select('whatsapp_number')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    // Replace template variables
    const variables: Record<string, string> = {
      '{{nombre_tienda}}': tenant?.name || 'Mi Tienda',
      '{{sitio_web}}': `https://${tenant?.subdomain || 'mi-tienda'}.autoshopping.cl`,
      '{{rut_empresa}}': invConfig?.rut_empresa || '[RUT no configurado]',
      '{{direccion}}': invConfig?.direccion || '[Dirección no configurada]',
      '{{comuna}}': invConfig?.comuna || '[Comuna]',
      '{{ciudad}}': invConfig?.ciudad || '[Ciudad]',
      '{{email_contacto}}': storeConfig?.whatsapp_number ? `+${storeConfig.whatsapp_number}` : '[Email no configurado]',
      '{{fecha}}': new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' }),
    };

    let content = template.template;
    Object.entries(variables).forEach(([key, value]) => {
      content = content.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    // Get current version number
    const { data: existingDocs } = await this.supabase
      .from('legal_documents')
      .select('version')
      .eq('tenant_id', tenantId)
      .eq('type', type)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = existingDocs && existingDocs.length > 0 ? existingDocs[0].version + 1 : 1;

    // Deactivate old versions
    await this.supabase
      .from('legal_documents')
      .update({ is_active: false })
      .eq('tenant_id', tenantId)
      .eq('type', type);

    // Insert new document
    const { data, error } = await this.supabase
      .from('legal_documents')
      .insert({
        tenant_id: tenantId,
        type,
        content,
        version: nextVersion,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateDocument(tenantId: string, id: string, content: string) {
    const { data, error } = await this.supabase
      .from('legal_documents')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Documento no encontrado');
    return data;
  }

  async toggleActive(tenantId: string, id: string, isActive: boolean) {
    if (isActive) {
      // Get the document type first
      const { data: doc } = await this.supabase
        .from('legal_documents')
        .select('type')
        .eq('id', id)
        .single();

      if (doc) {
        // Deactivate other versions of same type
        await this.supabase
          .from('legal_documents')
          .update({ is_active: false })
          .eq('tenant_id', tenantId)
          .eq('type', doc.type);
      }
    }

    const { data, error } = await this.supabase
      .from('legal_documents')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getPublicDocument(subdomain: string, type: string) {
    // Find tenant by subdomain
    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', subdomain)
      .single();

    if (!tenant) throw new NotFoundException('Tienda no encontrada');

    const { data, error } = await this.supabase
      .from('legal_documents')
      .select('type, content, updated_at, version')
      .eq('tenant_id', tenant.id)
      .eq('type', type)
      .eq('is_active', true)
      .single();

    if (error || !data) throw new NotFoundException('Documento no encontrado');
    return { ...data, title: TEMPLATES[type]?.title || type };
  }
}
