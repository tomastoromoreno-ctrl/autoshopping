# Guía de Integración de Agencias de Envío (Chile) 🚚🇨🇱

Esta guía detalla los requisitos, pasos y páginas oficiales para configurar las integraciones con **Starken**, **Chilexpress** y **Blue Express** en tu tienda online.

---

## 📦 1. Starken (Grupo TurBus)

Starken es una de las empresas de envíos más grandes de Chile. Las integraciones de Starken requieren que tengas una cuenta comercial activa.

### 🔑 Credenciales Necesarias:
1.  **RUT de la Empresa:** El identificador tributario de tu comercio.
2.  **Código de Cliente (Código Abonado):** Tu número de cliente asignado en el contrato.
3.  **API Key / Token:** Llave de autenticación provista por Starken.
4.  **Centro de Costo (opcional):** Usualmente es `0` o el ID de tu sucursal.

### 📌 Pasos para Obtenerlas:
1.  **Tener Cuenta Comercial:** Debes tener un contrato vigente con Starken (cuenta corriente o prepago). Las cuentas personales no tienen acceso a la API.
2.  **Solicitud al Ejecutivo:** Debes enviar un correo electrónico a tu **ejecutivo comercial (KAM)** asignado o al área de soporte integraciones solicitando la *"API Key y Código de Cliente para integración de e-commerce propia"*.
3.  **Habilitación:** El equipo de Starken te enviará los datos en un plazo aproximado de **24 a 48 horas hábiles**.
4.  **Contacto de Soporte:** 
    *   Teléfono: **600 200 0102**
    *   Sitio de Clientes: [Starken Pro](https://www.starkenpro.cl/)

---

## 🚚 2. Chilexpress

Chilexpress cuenta con un entorno de desarrollo muy maduro y un **Portal Developers** automatizado para la autogestión de pruebas.

### 🔑 Credenciales Necesarias:
1.  **API Key de Suscripción:** Token que obtienes al suscribirte a sus APIs.
2.  **Código TCC (Tarjeta Cliente Chilexpress):** Tu código único de cliente abonado.
3.  **RUT de Empresa:** Con el que tienes el contrato.

### 📌 Pasos para Obtenerlas:
1.  **Registro en Portal Developers:** Regístrate en el [Portal Developers de Chilexpress](https://developers.chilexpress.cl/).
2.  **Pruebas (Sandbox):**
    *   Una vez registrado, ve a la sección de "APIs" y suscríbete a las APIs de: *Cotizador*, *Cobertura* y *Envíos*.
    *   Se te entregarán Keys de prueba (**Primary & Secondary Keys**).
3.  **Paso a Producción:**
    *   Debes realizar al menos **10 pruebas de generación de OTs** (Órdenes de Transporte ficticias) en el ambiente de Sandbox para demostrar que tu código funciona.
    *   Envía un correo a **soporteintegraciones@chilexpress.cl** indicando tu RUT, Razón Social, número de TCC y la evidencia de las pruebas.
    *   En 24 horas te enviarán la API Key productiva definitiva.
4.  **Contacto de Soporte:**
    *   Email: **soporteintegraciones@chilexpress.cl**
    *   Teléfono: **+56 2 2869 8311**

---

## 🔵 3. Blue Express

Blue Express se destaca por tarifas muy competitivas y una rápida expansión en e-commerce. Sus accesos son 100% controlados.

### 🔑 Credenciales Necesarias:
1.  **API Key / Client ID:** Identificador único de tu cuenta.
2.  **Client Secret / API Secret:** Clave secreta para autorizar las solicitudes.
3.  **Código de Cuenta:** Código asignado por tu contrato.

### 📌 Pasos para Obtenerlas:
1.  **Contrato Comercial:** Debes registrarte como cliente empresa en su sitio oficial.
2.  **Solicitud de API:** Solicita el token de integración directamente a tu ejecutivo de cuenta (KAM) o a través del centro de ayuda en su plataforma interna.
3.  **Gestión de Envíos:** Una vez configurado en la tienda, las etiquetas y el seguimiento los verás reflejados en tu panel de cliente en [ecommerce.blue.cl](https://ecommerce.blue.cl).
4.  **Contacto de Soporte:**
    *   Portal de Clientes: [ecommerce.blue.cl](https://ecommerce.blue.cl)
    *   Soporte comercial a través de tu ejecutivo asignado.

---

## 💡 Recomendaciones Generales para E-Commerce en Chile

1.  **Dimensiones y Peso:** Todas las agencias de envío calculan la tarifa de acuerdo al **peso físico** y **peso volumétrico** (Largo x Ancho x Alto / 4000). Es fundamental que configures el peso y medidas de tus productos en el catálogo para que las cotizaciones en el checkout sean 100% precisas.
2.  **Comunas Normalizadas:** Starken, Chilexpress y Blue Express usan bases de datos de comunas específicas (por ejemplo, "Coyhaique" vs "Coihaique"). Por esta razón implementamos un selector desplegable en el Checkout en lugar de un campo de texto libre, para evitar que el comprador escriba mal la comuna y falle la cotización.
3.  **Seguros de Carga:** Recuerda declarar el valor real de los productos al generar los despachos masivos, ya que las agencias tienen seguros por pérdida que reembolsan de acuerdo al valor declarado.
