# MindShock — Operaciones Express 01

Estado: **lista para configurar; no lanzar hasta revisión final**

## Objetivo

Conseguir las primeras señales comerciales para Operaciones Express sin gastar a ciegas. La métrica principal es **solicitudes de revisión (`review_submit`)**, no clics ni likes.

## Presupuesto de prueba

- Presupuesto total máximo inicial: **COP 30.000**
- Duración propuesta: **3 días**
- Referencia diaria: **COP 10.000/día**
- Regla de protección: no aumentar presupuesto durante la prueba inicial.
- El saldo restante de Bold queda como reserva.

## Canal inicial

**Meta Ads — Facebook + Instagram**

Objetivo de campaña sugerido: **Tráfico al sitio web**, optimizado a visitas de página de destino si la interfaz lo permite.

Razón: el sitio ya mide internamente el embudo con Supabase y todavía no dependemos de Meta Pixel para decidir si la oferta convierte.

## Estructura

- Campaña: `operaciones_express_01`
- 1 conjunto de anuncios
- 2 anuncios
- Ubicación: Colombia
- Edad inicial: 25–54
- Placements: automáticos / Advantage+ placements
- Audiencia: personas relacionadas con pequeñas empresas, administración, contabilidad, operaciones, Microsoft Excel o emprendimiento. Si un interés no aparece en Meta, no forzarlo; mantener un solo conjunto de anuncios y evitar fragmentar el presupuesto.
- Ad set / término de medición: `colombia_smb_25_54`

## Anuncio A — dolor PDF/Excel

UTM content: `dolor_pdf_excel`

URL:

`https://mindshock.app/?utm_source=meta&utm_medium=paid_social&utm_campaign=operaciones_express_01&utm_content=dolor_pdf_excel&utm_term=colombia_smb_25_54`

Texto principal:

> ¿Sigues copiando datos de PDFs o Excel a mano? MindShock prueba con una muestra anonimizada si esa tarea puede convertirse en una tabla limpia y repetible. La revisión de encaje es gratis. Si el proceso encaja, Operaciones Express cuesta COP 150.000 y se entrega en 48 horas después de confirmar alcance, anticipo e insumos.

Titular:

**Prueba tu archivo gratis**

Descripción:

**PDF o Excel · revisión de encaje sin costo**

CTA sugerido: **Más información**

Visual recomendado: captura limpia de la demo de MindShock mostrando entrada PDF/Excel → tabla útil, sin inventar testimonios ni resultados.

## Anuncio B — 48 horas / sin programar

UTM content: `48h_sin_programar`

URL:

`https://mindshock.app/?utm_source=meta&utm_medium=paid_social&utm_campaign=operaciones_express_01&utm_content=48h_sin_programar&utm_term=colombia_smb_25_54`

Texto principal:

> Una tarea repetitiva de PDF o Excel puede terminar en un archivo de un clic sin que tengas que programar. MindShock revisa gratis si tu proceso encaja. Si es viable, construimos una automatización concreta por COP 150.000, con evidencia de funcionamiento antes del pago del saldo.

Titular:

**Automatiza una tarea en 48 h**

Descripción:

**Sin programar · alcance confirmado antes de pagar**

CTA sugerido: **Más información**

Visual recomendado: la misma composición del anuncio A para que la prueba compare el mensaje y no mezcle demasiadas variables.

## Qué registra MindShock

Supabase guarda por sesión:

- `page_view`
- `validate_click`
- `demo_start`
- `demo_complete`
- `demo_fail`
- `post_demo_validate_click`
- `review_start`
- `review_submit`
- `review_fail`

Y atribuye:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`

No se guardan en la tabla analítica nombres, correos, archivos ni texto del formulario.

## Regla de decisión después de COP 30.000

No juzgar por likes.

1. Si hay visitas pero **0 `validate_click` y 0 `demo_start`**, revisar anuncio/landing antes de gastar más.
2. Si hay demos pero **0 `review_start`**, revisar transición demo → validación.
3. Si hay `review_start` pero **0 `review_submit`**, revisar fricción del formulario o confianza.
4. Si aparece al menos una solicitud real de revisión, evaluar calidad antes de escalar.
5. Si aparece un cliente que paga el anticipo de COP 75.000, detener la prueba y calcular CAC antes de aumentar presupuesto.

## Reportes en Supabase

- `site_funnel_campaign_daily`: embudo por día, campaña y creativo.
- `marketing_campaign_spend`: gasto diario introducido manualmente.
- `site_campaign_performance_daily`: combina gasto + embudo y calcula costo por visita, costo por demo, costo por solicitud y conversión visita → solicitud.

## Antes de activar el gasto

- Confirmar que `mindshock.app` carga `analytics.js`.
- Abrir cada URL UTM en una sesión de prueba y confirmar que aparece el `page_view` con el `utm_content` correcto.
- Borrar esos eventos de QA.
- Configurar ambos anuncios dentro del mismo conjunto.
- Revisar que el presupuesto total no supere COP 30.000.
- Solo entonces publicar.
