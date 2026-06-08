# Desarrollo e Implementación de Software - Plataforma Logística

> [!TIP]
> ### Estado de Implementación del Software (Ventaja Competitiva Verificada)
> Se certifica que el **100% de las funcionalidades del sistema web, móvil PWA y motor de telemetría** detalladas en las Etapas 1, 2, 3 y 4 de esta propuesta **ya se encuentran completamente programadas, probadas y 100% operativas en un servidor de producción activo**.
> * **Valor Agregado Incluido sin Costo Adicional:** El sistema incorpora de fábrica módulos de seguridad biométrica (WebAuthn/FIDO2), alertas automáticas de ruptura de cadena de frío, notificaciones en tiempo real por WebSocket, geocercas de llegada automática, sistema de correo electrónico transaccional, simulador de emergencias térmicas y exportación de reportes en CSV/PDF.

---

## Alcance del Proyecto por Etapas y Estado de Desarrollo

### Etapa 1 — Plataforma base y módulo de despachos
Esta etapa comprende la implementación inicial de la plataforma web y el módulo base de despachos.

* **[x] (Programado y Operativo)** Configuración inicial del sistema web (base de datos PostgreSQL, servidor Node.js/Express y cliente React).
* **[x] (Programado y Operativo)** Acceso mediante usuario y contraseña (inicio de sesión seguro con JWT firmado).
* **[x] (Programado y Operativo)** Restablecimiento de contraseña por correo electrónico (enlace seguro con token de expiración).
* **[x] (Programado y Operativo)** Roles básicos de usuario: `admin`, `operator` y `driver` — con control de acceso por ruta y recurso.
* **[x] (Programado y Operativo)** Panel principal de administración (dashboard gerencial con KPIs en tiempo real).
* **[x] (Programado y Operativo) Módulo de despachos completo:**
  * **[x] (Programado y Operativo)** Creación de despachos con generación automática de folio único (ej: `DISP-XXXXXX`).
  * **[x] (Programado y Operativo)** Edición de despachos con validación de permisos por rol.
  * **[x] (Programado y Operativo)** Registro de finca de origen (catálogo con nombre y ubicación).
  * **[x] (Programado y Operativo)** Registro de destino (catálogo de aeropuertos de exportación).
  * **[x] (Programado y Operativo)** Registro de fecha y hora de despacho.
  * **[x] (Programado y Operativo)** Registro de responsable de la creación (vinculado al empleado del sistema).
  * **[x] (Programado y Operativo)** Registro de observaciones y datos básicos de la carga.
  * **[x] (Programado y Operativo)** Ciclo de vida del despacho con estados: `Creado → Preparación → En carga → Despachado → Finalizado`.
* **[x] (Programado y Operativo)** Listado de despachos con grilla dinámica paginada.
* **[x] (Programado y Operativo)** Filtros avanzados de consulta: por finca, destino, estado, responsable y rango de fechas.

> **Criterio de aceptación de la etapa:**
> La etapa se considerará cumplida cuando EL CLIENTE pueda ingresar a la plataforma web, crear, editar y consultar despachos con la información básica definida para la operación. *(Estado actual: **CUMPLIDA Y PROBADA AL 100%**)*

---

### Etapa 2 — QR, escaneo e interfaz móvil para choferes
Esta etapa comprende la generación de códigos QR y la habilitación de una interfaz móvil web/PWA para uso de choferes u operadores.

* **[x] (Programado y Operativo)** Generación de código QR único por caja (ej: serial `QR_CAJA-XXXXXXXX` almacenado en base de datos).
* **[x] (Programado y Operativo)** Asociación de QR a despacho (relación uno a muchos: un despacho contiene N cajas).
* **[x] (Programado y Operativo)** Identificador único e irrepetible por caja con validación de duplicados a nivel de base de datos.
* **[x] (Programado y Operativo)** Formato imprimible de etiqueta QR individual (nombre del operador, código de despacho, fecha y código de barras 2D generado dinámicamente).
* **[x] (Programado y Operativo)** **Impresión masiva de etiquetas en lote** (batch printing de todas las cajas de un despacho en una sola orden de impresión — optimizado para impresoras térmicas) y posible de imprimir en impresora normal de tintas.
* **[x] (Programado y Operativo)** Registro masivo de cajas por texto separado por comas (ingreso rápido desde lectores láser USB o teclado).
* **[x] (Programado y Operativo)** Ciclo de vida de la caja con estados: `Pendiente → Cargada → En tránsito → Entregada / Faltante`.
* **[x] (Programado y Operativo) Interfaz móvil web/PWA adaptada para choferes u operadores:**
  * **[x] (Programado y Operativo)** Login del chofer/operador adaptado a pantallas de celular (diseño mobile-first).
  * **[x] (Programado y Operativo)** Dashboard personal del conductor: viajes asignados activos e historial.
  * **[x] (Programado y Operativo)** Vista de detalle del viaje: finca de origen, destino, vehículo, listado de cajas del despacho y estado de cada caja.
  * **[x] (Programado y Operativo)** Escaneo de QR de cajas desde la cámara de cualquier celular (sin necesidad de instalar ninguna aplicación nativa en la tienda de apps).
  * **[x] (Programado y Operativo)** Registro geolocalizado del escaneo (latitud y longitud del punto de escaneo almacenados).
  * **[x] (Programado y Operativo)** Marcado automático de caja como `Cargada` al escanear con confirmación visual.
  * **[x] (Programado y Operativo)** Alerta si se intenta escanear una caja que no pertenece al despacho activo.
  * **[x] (Programado y Operativo)** Registro y alerta visual de cajas en estado `Faltante`.
  * **[x] (Programado y Operativo)** Cambio de estado del viaje por el conductor: `En finca → En tránsito → Llegado a aeropuerto`.
  * **[x] (Programado y Operativo)** Carga fotográfica de guía firmada directamente desde el celular del conductor.
  * **[x] (Programado y Operativo)** Carga de documentos logísticos adicionales: guías de despacho, evidencias fotográficas, documentos de aduana.

> **Criterio de aceptación de la etapa:**
> La etapa se considerará cumplida cuando EL CLIENTE pueda generar QR, asociarlos a cajas/despachos, imprimirlos en formato básico o en lote, y cuando el chofer u operador pueda escanear cajas desde la interfaz móvil, registrando salida de finca y llegada al aeropuerto. *(Estado actual: **CUMPLIDA Y PROBADA AL 100%**)*

---

### Etapa 3 — Viajes, control operativo y monitoreo GPS en tiempo real
Esta etapa comprende la gestión de viajes y la conexión operativa con información logística en tiempo real.

* **[x] (Programado y Operativo)** Creación y asignación de viajes a conductor y vehículo.
* **[x] (Programado y Operativo)** Asociación de vehículo a viaje (catálogo con placa, marca y modelo).
* **[x] (Programado y Operativo)** Asociación de despacho completo al viaje (un viaje transporta un despacho con todas sus cajas).
* **[x] (Programado y Operativo) Estados del viaje con historial trazable:**
  * **[x]** `Asignado` — Viaje creado y asignado al conductor.
  * **[x]** `En finca` — Conductor llegó a la finca de origen.
  * **[x]** `En tránsito` — Vehículo en movimiento; activa automáticamente el motor de telemetría GPS y temperatura.
  * **[x]** `Llegado a aeropuerto` — Activado por geocerca automática o por el conductor.
  * **[x]** `Finalizado` — Cierre logístico completo del despacho.
* **[x] (Programado y Operativo)** Historial completo de cambios de estado con timestamp, usuario responsable del cambio y notas del operador.
* **[x] (Programado y Operativo)** Mapa GPS en tiempo real con trayectoria del vehículo (tecnología Leaflet con OpenStreetMap).
* **[x] (Programado y Operativo)** Gráfico histórico de temperatura en tiempo real durante el trayecto (gráfico de línea con marca de tiempo).
* **[x] (Programado y Operativo)** Indicadores en vivo: velocidad de actualización cada 25 segundos, temperatura actual, última posición conocida.
* **[x] (Programado y Operativo)** **Geocerca automática de llegada a destino:** El servidor detecta automáticamente cuando el vehículo entra en el radio del aeropuerto de destino y cambia el estado del viaje sin intervención del conductor.
* **[x] (Programado y Operativo)** Selector de viaje activo para monitorear múltiples vehículos en simultáneo desde el panel administrativo.
* **[x] (Programado y Operativo)** Infraestructura de servidor lista para recibir tramas de posición GPS y temperatura de dispositivos hardware (Teltonika FMB120) en cuanto se contraten e instalen físicamente.

> **Criterio de aceptación de la etapa:**
> La etapa se considerará cumplida cuando EL CLIENTE pueda ver en tiempo real la posición y temperatura del vehículo durante el trayecto, consultar el historial de estados del viaje y validar la llegada al aeropuerto. *(Estado actual: **CUMPLIDA Y PROBADA AL 100%**)*

---

### Etapa 4 — Entrega final: Documentos, dashboard ejecutivo, reportes, auditoría y cierre operativo
Esta etapa comprende el cierre funcional de la plataforma con reportes, indicadores gerenciales y trazabilidad total.

* **[x] (Programado y Operativo)** Carga de guías y documentos vinculados al despacho (4 tipos nativos: `Guía firmada`, `Guía de despacho`, `Documentos logísticos`, `Evidencias fotográficas`).
* **[x] (Programado y Operativo)** Visualización y descarga de archivos cargados desde el panel web.
* **[x] (Programado y Operativo)** Registro documental con historial de quién subió el documento y cuándo.
* **[x] (Programado y Operativo) Dashboard ejecutivo con KPIs en tiempo real (auto-actualización cada 15 segundos):**
  * **[x]** Total de despachos (activos e histórico).
  * **[x]** Total de cajas registradas con desglose por estado.
  * **[x]** Cajas cargadas, en tránsito, entregadas y faltantes.
  * **[x]** Viajes activos y viajes finalizados.
  * **[x]** **Temperatura promedio, mínima y máxima** registrada en el sistema.
  * **[x]** Tasa de entrega exitosa (%) calculada sobre cajas entregadas vs. faltantes.
  * **[x]** Tasa de entregas a tiempo (%) calculada sobre el historial de viajes finalizados.
  * **[x]** Listado de viajes activos en tiempo real con enlace directo al mapa de monitoreo.
* **[x] (Programado y Operativo) Módulo de Reportes con exportación:**
  * **[x]** Reporte de despachos: filtro por finca, estado y rango de fechas — exportable a **CSV/Excel**.
  * **[x]** Reporte de viajes: filtro por conductor, estado y rango de fechas — exportable a **CSV/Excel**.
  * **[x]** Reporte de estado de cajas: filtro por estado — exportable a **CSV/Excel**.
  * **[x]** Impresión directa a **PDF** desde cualquier navegador (sin software adicional).
* **[x] (Programado y Operativo) Módulo de Auditoría y Trazabilidad General:**
  * **[x]** Log de cada acción del sistema: creación, edición, eliminación, escaneado QR, carga de documentos, cambios de estado, logins, logouts y logins fallidos.
  * **[x]** Acceso de consulta al operador logístico (no solo al administrador).
  * **[x]** Filtros de auditoría: por usuario, por acción, por entidad (Despacho, Viaje, Caja) y por rango de fechas.
  * **[x]** Registro de IP de origen en cada evento de auditoría.
* **[ ] (Actividad Pendiente)** Capacitación básica de uso — Sesiones presenciales/virtuales con personal administrativo y choferes *(Pendiente coordinar fecha con EL CLIENTE)*.
* **[x] (Programado y Operativo)** Registro de operadores, administradores y conductores en el sistema.
* **[x] (Programado y Operativo)** Documentación técnica digital de uso provista.

> **Criterio de aceptación de la etapa:**
> La etapa se considerará cumplida cuando EL CLIENTE pueda operar el flujo completo: crear despacho → generar QR → escanear cajas → controlar viaje → monitorear temperatura/GPS → registrar salida y llegada → cargar documentos → visualizar dashboard → exportar reportes y revisar trazabilidad general. *(Estado actual: **CUMPLIDA Y PROBADA AL 100% (salvo capacitación)**)*

---

## 🎁 Funciones Avanzadas Incluidas Completamente GRATIS (Valor Agregado de Fábrica)

Con el fin de asegurar la adjudicación del proyecto y ofrecer una plataforma de primer nivel frente a cualquier competidor, **las siguientes características de nivel enterprise se incluyen 100% programadas y operativas, sin costo de desarrollo adicional:**

1. **🌡️ Alertas Automáticas de Ruptura de Cadena de Frío:**
   * El motor de telemetría detecta en tiempo real cuando la temperatura supera el rango florícola óptimo (2°C – 8°C) y dispara **automáticamente** una notificación roja de pánico a todos los administradores y operadores logísticos activos.
   * Cuando la temperatura vuelve al rango normal, el sistema envía una notificación de normalización confirmando que la cadena de frío fue restaurada.

2. **🔔 Sistema de Notificaciones en Tiempo Real (WebSocket):**
   * Las alertas se envían instantáneamente por WebSocket (Socket.io) sin necesidad de recargar la pantalla. La campana de notificaciones se actualiza en vivo con contador de no leídas.
   * Incluye notificaciones por correo electrónico transaccional para eventos críticos (contratos, alertas operativas).

3. **📊 Exportador de Historial Completo a CSV/Excel y PDF:**
   * Descarga completa de registros de despachos, viajes y cajas en formato CSV compatible con Excel, con soporte para caracteres especiales (UTF-8 BOM).
   * Impresión a PDF directamente desde el navegador sin instalar software adicional.

4. **🧪 Simulador Interactivo de Emergencias de Frío:**
   * Botón en el panel de monitoreo para forzar un pico de temperatura de prueba (9°C – 11.5°C) y verificar en vivo el comportamiento automático de las alertas. Permite al cliente validar la reacción del sistema antes de la operación real.

5. **🔐 Autenticación Biométrica de Última Generación (WebAuthn / FIDO2):**
   * Registro e inicio de sesión seguros usando la huella digital o reconocimiento facial del usuario: **FaceID, TouchID, Windows Hello** — sin contraseñas escritas.
   * Las credenciales biométricas tienen validez de 90 días y se invalidan automáticamente si se detecta un intento de clonación (análisis de contadores de seguridad por autenticador).
   * Identificación del hardware autenticador (AAGUID) para trazabilidad del dispositivo usado en el login.
   * Habilitación/deshabilitación global de la biometría desde el panel de configuración del sistema.

6. **⚙️ Panel de Configuración Global del Sistema:**
   * Modo mantenimiento con banner personalizable para usuarios (permite programar ventanas de actualización).
   * Control de acceso por IP permitida (whitelist de direcciones IP).
   * Configuración de radio de geocerca global y coordenadas del destino.
   * Activación/desactivación centralizada de módulos de seguridad.

---

## 🤝 Beneficios Adicionales por Adjudicación del Proyecto (Incentivos de Firma de Contrato)

Como incentivo exclusivo por la adjudicación y firma de contrato, **se desarrollarán e integrarán sin costo de desarrollo adicional** las siguientes características avanzadas durante la fase de despliegue y puesta en marcha:

1. **📱 Notificaciones Directas a WhatsApp / Telegram:**
   * Bot automático que enviará notificaciones instantáneas de picos térmicos o alertas logísticas críticas directamente al teléfono de los supervisores del cliente. Sin necesidad de tener la plataforma abierta para enterarse de un incidente.

2. **🗺️ Geocercas de Seguridad y Control de Desvíos de Ruta:**
   * Alarma automática en el panel si el conductor desvía el vehículo de la ruta autorizada entre la finca y el aeropuerto. Prevención de robos de carga, desvíos no autorizados y uso indebido del vehículo.

3. **🌐 Portal del Comprador Internacional (Trazabilidad Compartida):**
   * Portal de consulta externo y seguro (acceso por token dinámico) para que los compradores internacionales en Miami, Ámsterdam o cualquier destino puedan verificar en línea que sus flores mantuvieron la cadena de frío durante todo el trayecto terrestre.

4. **🔧 Módulo de Mantenimiento de Flota y Calibración de Sensores:**
   * Planificador con avisos automáticos sobre fechas de calibración de las sondas de temperatura DS18B20 y mantenimiento preventivo de los vehículos de la flota.

---

## 🏆 Paquete de Gestión Empresarial Incluido: Suite Completa de RR.HH. y Administración (Sin Costo Adicional)

> [!IMPORTANT]
> Esta sección describe módulos **completamente programados y operativos** que **no forman parte del alcance de las Etapas 1-4**, pero que se ofrecen al cliente **de forma gratuita con la adjudicación del contrato**, si así lo desea. El cliente puede activarlos, desactivarlos o simplemente ignorarlos — su inclusión no representa costo de desarrollo adicional ya que están 100% listos.
>
> Si el cliente decide no utilizarlos, la plataforma de logística funciona con plena autonomía sin ellos.

Nos diferenciamos de la competencia entregando no solo una plataforma logística, sino un **ecosistema de gestión empresarial completo** que ningún otro proveedor puede ofrecer al mismo precio. Los siguientes módulos están disponibles e integrados desde el día uno:

---

### 📊 Módulo de Analítica e Inteligencia de Negocios

* **[x] (Programado y Operativo)** Dashboard analítico con gráficos dinámicos e indicadores históricos de operación.
* **[x] (Programado y Operativo)** Visualización de tendencias operativas por período (diario, semanal, mensual).
* **[x] (Programado y Operativo)** Motor de inteligencia empresarial integrado con análisis de datos de toda la plataforma.
* **[x] (Programado y Operativo)** Exportación de datos para análisis externo.

---

### 🕐 Módulo de Asistencia y Control de Jornada del Personal

Este módulo es especialmente valioso para el control de conductores, despachadores y personal de finca.

* **[x] (Programado y Operativo)** **Marcador digital de asistencia** con reloj en tiempo real (entrada, almuerzo y salida).
* **[x] (Programado y Operativo)** **Geolocalización obligatoria al marcar** — el sistema valida que el empleado se encuentre en la zona de trabajo configurada antes de registrar la asistencia.
* **[x] (Programado y Operativo)** **Bloqueo automático de VPN/Proxy** — detección y rechazo de intentos de marcar asistencia desde redes privadas virtuales o proxies, previniendo marcaciones fraudulentas a distancia.
* **[x] (Programado y Operativo)** **Verificación biométrica obligatoria** al marcar asistencia (huella digital o FaceID del dispositivo), garantizando que es el empleado en persona quien registra, no un tercero.
* **[x] (Programado y Operativo)** Detección y registro de llegadas tardías con insignia visual de "Tardío / Puntual".
* **[x] (Programado y Operativo)** Consentimiento de privacidad y tracking con aceptación digital del empleado (cumplimiento legal).
* **[x] (Programado y Operativo)** **Gestión de Turnos y Horarios:** creación de turnos personalizados (Mañana, Tarde, Noche) con tolerancia de entrada y tiempo de almuerzo configurables.
* **[x] (Programado y Operativo)** **Asignación masiva de turnos** a múltiples empleados simultáneamente con rango de fechas de vigencia.
* **[x] (Programado y Operativo)** **Calendario de equipo:** vista mensual de asistencias por persona y día con codificación de colores.
* **[x] (Programado y Operativo)** Gestión de ausencias y novedades (justificadas, injustificadas, vacaciones, incapacidades).
* **[x] (Programado y Operativo)** Reversa de geocodificación — el sistema muestra la dirección exacta (calle y ciudad) del lugar donde el empleado marcó.
* **[x] (Programado y Operativo)** **Reportes de asistencia:** historial completo con filtros por empleado, fecha y estado — exportable.

---

### 💰 Módulo de Nómina y Gestión de Pagos

* **[x] (Programado y Operativo)** **Generador automático de nómina** calculado desde las asistencias registradas y los turnos asignados.
* **[x] (Programado y Operativo)** Configuración de parámetros de nómina: salario base, horas extra, descuentos, beneficios.
* **[x] (Programado y Operativo)** **Mis Pagos:** vista personal del empleado con historial de pagos y comprobantes.
* **[x] (Programado y Operativo)** **Gestión de beneficios y deducciones:** configuración de rubros por categoría de empleado.
* **[x] (Programado y Operativo)** **Reporte de costos de nómina:** desglose por departamento y período.
* **[x] (Programado y Operativo)** Alertas automáticas sobre pagos pendientes.

---

### 🎯 Módulo de Evaluación de Desempeño

* **[x] (Programado y Operativo)** **Creación de evaluaciones** con criterios y escalas personalizadas.
* **[x] (Programado y Operativo)** **Asignación de evaluaciones** a empleados o grupos.
* **[x] (Programado y Operativo)** **Ejecución de evaluaciones** desde la plataforma (autoevaluación o evaluación por parte del supervisor).
* **[x] (Programado y Operativo)** **Dashboard de resultados** con gráficos de desempeño individual y comparativo.
* **[x] (Programado y Operativo)** **Gestión de metas** individuales por empleado con seguimiento de avance.
* **[x] (Programado y Operativo)** **Mis evaluaciones:** vista personal del empleado con historial de evaluaciones recibidas.
* **[x] (Programado y Operativo)** **Reporte de desempeño:** resumen organizacional de resultados y tendencias.

---

### 🧑‍💼 Módulo de Reclutamiento y Selección de Personal

* **[x] (Programado y Operativo)** **Creación de vacantes** con descripción del cargo, departamento, tipo de empleo y ubicación.
* **[x] (Programado y Operativo)** **Portal de carreras público** (`/careers`) — los candidatos externos pueden ver y aplicar a las vacantes publicadas desde el sitio web de la empresa sin necesidad de crear una cuenta.
* **[x] (Programado y Operativo)** **Postulación en línea:** el candidato sube su hoja de vida y datos directamente desde el portal; la postulación llega automáticamente al panel del administrador o responsable de RRHH.
* **[x] (Programado y Operativo)** **Dashboard de reclutamiento:** listado de vacantes activas con contador de postulaciones recibidas.
* **[x] (Programado y Operativo)** **Detalles de postulación:** revisión completa de la hoja de vida, carta de presentación y datos del candidato con historial de seguimiento.
* **[x] (Programado y Operativo)** **Gestión del estado de la vacante:** abrir, cerrar o relanzar publicaciones con un clic.
* **[x] (Programado y Operativo)** **Enlace compartible de vacante:** generación de link copiable para distribuir la vacante en redes sociales o portales de empleo externos.

---

### 📋 Módulo de Reportes Generales Avanzados

* **[x] (Programado y Operativo)** **Reportes de asistencia** con análisis de puntualidad, ausentismo y horas trabajadas.
* **[x] (Programado y Operativo)** **Reportes de desempeño organizacional** con gráficos comparativos.
* **[x] (Programado y Operativo)** **Reportes de costo de nómina** por período y departamento.
* **[x] (Programado y Operativo)** **Reportes de rotación de personal** (turnover) con análisis de retención.
* **[x] (Programado y Operativo)** **Reportes de satisfacción** del equipo.
* **[x] (Programado y Operativo)** **Reportes personalizados** con constructor de filtros ad-hoc.

---

### 📢 Módulo de Notificaciones Inteligentes

* **[x] (Programado y Operativo)** Centro de notificaciones unificado con campana de alertas en tiempo real (WebSocket).
* **[x] (Programado y Operativo)** Historial completo de notificaciones recibidas con paginación y marcado de leídas.
* **[x] (Programado y Operativo)** **Preferencias de notificación por usuario:** el empleado configura qué tipos de alertas desea recibir (por correo, in-app, o ambas).
* **[x] (Programado y Operativo)** Notificaciones automáticas de contratos próximos a vencer.
* **[x] (Programado y Operativo)** Notificaciones automáticas de alertas logísticas (temperatura, viajes).
* **[x] (Programado y Operativo)** Sistema de correo electrónico transaccional integrado (restablecimiento de contraseña, alertas críticas).

---

### 📑 Módulo de Contratos del Personal

* **[x] (Programado y Operativo)** Registro y gestión de contratos de empleados con fechas de inicio y vencimiento.
* **[x] (Programado y Operativo)** **Alertas automáticas de vencimiento** — el sistema notifica al administrador con anticipación cuando un contrato está próximo a expirar, evitando incumplimientos laborales.
* **[x] (Programado y Operativo)** Listado de contratos próximos a vencer con panel de acción rápida.

---

### 💼 Módulo de Contabilidad Básica

* **[x] (Programado y Operativo)** **Plan de cuentas contable** configurable con estructura jerárquica.
* **[x] (Programado y Operativo)** **Registro de asientos contables** (diario de contabilidad).
* **[x] (Programado y Operativo)** **Balance de comprobación** generado automáticamente.
* **[x] (Programado y Operativo)** **Gestión de centros de costo** por departamento o proyecto.
* **[x] (Programado y Operativo)** **Gestión de períodos contables** con apertura y cierre.
* **[x] (Programado y Operativo)** Dashboard contable con indicadores financieros básicos.

---

> **Resumen del Paquete Adicional Gratuito:** Con la adjudicación del contrato, el cliente recibe, además de la plataforma logística completa de las Etapas 1-4, una **suite empresarial de 8 módulos adicionales** (Analítica, Asistencia, Nómina, Desempeño, Reclutamiento, Reportes, Contratos y Contabilidad) que normalmente representarían una inversión de desarrollo adicional significativa. Todos estos módulos pueden habilitarse, deshabilitarse o personalizarse según las necesidades específicas de la operación del cliente.

---

## Requisitos de Servidor e Infraestructura Recomendada (AWS Lightsail)

Para garantizar la soberanía de la base de datos y la automatización de backups, se ha dimensionado el siguiente servidor:

* **Plan AWS Lightsail Seleccionado:** **$12 USD / mes** (2 GB RAM, 2 vCPUs, 60 GB SSD, 3 TB de transferencia mensual).
* **Soberanía Absoluta de Datos:** Base de datos PostgreSQL instalada en una instancia privada dedicada, de propiedad exclusiva del cliente. Sin compartir infraestructura con terceros.
* **Backups Automáticos Diarios:** Snapshots programados para recuperación inmediata ante incidentes o corrupción de datos.
* **Capacidad Dual de Procesamiento:** Las 2 vCPUs permiten recibir y procesar tramas de telemetría de los camiones en paralelo sin comprometer el rendimiento del panel administrativo.
* **Escalable:** El plan puede escalarse en minutos si la flota de vehículos crece.

---

## Solución Tecnológica de Telemetría Seleccionada (Hardware — Excluido del Costo de Software)

Para cumplir el requerimiento de temperatura y rastreo en tiempo real de forma automática, se recomienda el siguiente hardware (su adquisición, instalación y conectividad están excluidas del costo de desarrollo de software):

| Componente | Modelo Recomendado | Costo Aproximado |
|---|---|---|
| Rastreador GPS | **Teltonika FMB120** | $35 – $45 USD por vehículo |
| Sensor de Temperatura | **Sonda DS18B20** (acero inoxidable, cable 1-Wire, 3–5 m) | $4 – $7 USD por vehículo |
| Conectividad celular | **Chip M2M** GPRS/TCP (cualquier operador local) | $3 – $5 USD/mes por vehículo |
| Instalación física | Cableado cabina → furgón refrigerado | Variable según taller |

---

## Exclusiones del Alcance Inicial y Estado de Compatibilidad

* **Dispositivos GPS:** **Excluido** de la cotización de software. Adquisición a cargo del cliente.
* **Instalación de GPS y sensores:** **Excluido** de la cotización de software. Instalación física y cableado a cargo del cliente.
* **Chips o conectividad celular M2M:** **Excluido** de la cotización de software. Plan mensual contratado por el cliente con su operador de telefonía.
* **Mensualidad de plataformas GPS de terceros:** **No aplica.** El sistema es soberano: no requiere pagos a plataformas externas de monitoreo vehicular.
* **Sensores de temperatura:** **¡COMPATIBILIDAD INTEGRADA SIN COSTO!** El software ya está preparado para almacenar, graficar y generar alarmas con las lecturas de los sensores físicos. La exclusión aplica únicamente a la adquisición del sensor DS18B20 físico.
* **Alarmas automáticas por temperatura:** **¡INTEGRADO Y OPERATIVO SIN COSTO!** El software genera alertas automáticas in-app y notificaciones WebSocket de forma nativa. La exclusión aplica únicamente a servicios externos de SMS masivo de pago.
* **Lectores láser industriales USB:** **¡COMPATIBILIDAD NATIVA!** Cualquier lector industrial con emulación de teclado USB (HID) funciona sin configuración adicional.
* **Aplicación móvil nativa (Play Store / App Store):** **Excluido** como APK/IPA publicado en tienda. Se provee la interfaz PWA responsiva para conductores, ya programada y operativa, que funciona desde cualquier navegador móvil.
* **Inteligencia Artificial u optimización de rutas:** **Excluido** del alcance de este proyecto.
* **Integración con bus CAN del motor** (revoluciones, consumo de combustible exacto): **Excluido.**
* **Módulos adicionales no descritos expresamente en este documento:** **Excluido.**
