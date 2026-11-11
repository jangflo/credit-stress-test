# Stress Report

**[Abrir el dashboard online](https://jangflo.github.io/credit-stress-test/)** — acceso público, sin instalación.

Abre **dashboard.html** con doble clic en un navegador moderno. Es un archivo autónomo: contiene los estilos, los gráficos, la lógica y los datos. No requiere instalación, servidor ni conexión a Internet.

Fuente actual: **FINAL_IFRS9 and Stress Test Tool.xlsx**. La fecha de importación se muestra en el reporte; el nuevo libro no declara una fecha de versión. La instantánea conserva 607 fórmulas con sus valores guardados, sin errores detectados. Las notas de las celdas I16, I20, I60 e I67 se conservan en el libro original y no se interpretan como resultados de 2029.

## Contenido

- Nueve secciones: visión general, calidad crediticia, provisiones, flujos, resultados, comparativa EBA/ICAAP, Risk drivers, Risk lab y explorador de datos.
- Selección de modelo y escenario Base/Adverso. Cada vista conserva todos los años 2025–2028 simultáneamente en gráficos, tarjetas y tablas, sin filtro por año.
- Composición por stages, coberturas, transiciones y flujos con el horizonte completo. Las comparativas y coberturas permiten alternar entre el contexto seleccionado y ambos escenarios. Las comparativas combinadas identifican cada modelo y escenario; sus CSV respetan ese alcance.
- Detalle de cada métrica con sus celdas y fórmulas de origen. Búsqueda con `⌘K` o `Ctrl+K`.
- CSV del escenario seleccionado con cifras sin redondear e impresión de la vista actual. La exportación del libro original conserva todas las celdas de la hoja consultada.
- 63 métricas y las 1.385 celdas pobladas de las cuatro hojas del Excel.

El reporte refleja los valores guardados para **Mortgages / Hipotecas**. El nuevo Database contiene únicamente parámetros de Mortgages; todas sus celdas se consultan en **Data explorer → Original workbook → Database**. El año 2029 solo tiene ciertos parámetros forward. La moneda y la escala no están indicadas en el libro: los importes mantienen sus unidades originales.

El P&L acumulado se muestra como una trayectoria: suma de la fila 73 desde 2026 hasta cada año proyectado. La versión FINAL no contiene las filas auxiliares de one-offs, acumulados ni controles del archivo anterior. No se añaden ajustes al P&L guardado. En EBA, la fila 73 es el cambio de provisiones con signo negativo; en ICAAP incluye también los write-offs netos. El acumulado se deriva de la fila 73 en ambos modelos. Las celdas sin datos en 2025 permanecen vacías y no se convierten en flujos cero.

## Diseño de la interfaz

La interfaz adapta la distribución de [Vision UI Dashboard](https://demos.creative-tim.com/vision-ui-dashboard-react/#/dashboard) al reporte financiero y a la referencia local `vision_gradient_dashboard.html`. Utiliza gradientes turquesa, verde y navy, navegación fija de 250 px, tarjetas semitransparentes y cuatro KPI con todo el horizonte visible. Los paneles de cobertura y transición conservan los cuatro años y enlazan con los detalles del Excel.

La página está en inglés, incluidos navegación, métricas, categorías, notas, búsqueda, mensajes, atributos accesibles y encabezados CSV. Los números se presentan con formato `en-GB`. Los textos originales del Excel se traducen para su visualización; la instantánea y las exportaciones de celdas conservan los valores y las fórmulas originales. Las traducciones de las métricas se definen en `src/dashboard.js`, por lo que se mantienen al volver a extraer el libro.

El cursor de escritorio reproduce la flecha negra con borde blanco del vídeo de referencia. La navegación lateral resalta el texto al pasar por encima y marca la sección activa con un punto a su derecha. El efecto usa CSS, conserva el foco de teclado y respeta movimiento reducido; en pantallas táctiles se mantiene la interacción nativa.

El sistema de diseño se define en las variables de `src/dashboard.css`. La tipografía utiliza Inter cuando está instalada y fuentes del sistema como alternativa, sin solicitudes externas. El menú móvil incluye fondo de cierre, Escape y control del foco; las transiciones respetan la preferencia de movimiento reducido. Las tablas mantienen desplazamiento horizontal dentro de su contenedor. El tema de impresión conserva superficies claras.

Las variaciones de los KPI comparan 2028 con 2025: puntos porcentuales para ratios y porcentajes para importes. El P&L acumulado conserva su suma desde 2026. Las variaciones de exposición y provisiones no se colorean como positivas o negativas porque su dirección no determina por sí sola una mejora del riesgo.

## Análisis de los factores de riesgo

Los siete gráficos de referencia se recrean con gráficos SVG interactivos, integrados en sus secciones existentes y con el diseño turquesa, verde y navy del reporte. No se incrustan las imágenes antiguas ni se añade una galería que repita esos indicadores. La composición comparada conserva una escala absoluta común, además de mostrar las participaciones en los tooltips. El resultado de crecimiento de Stage 3 EBA incluye la variación desde 2025 y Adverse frente a Baseline en cada año.

- **Risk drivers:** cascadas de Stage 3 por modelo y conciliación del saldo final ICAAP con EBA. Separan entradas desde S1 y S2, curas y write-offs; todas las cifras cuadran con las salidas guardadas. Son conciliaciones contables, no una atribución causal independiente de cada supuesto.
- **Flows & transitions:** diagrama Sankey reconciliado, seleccionable para 2026, 2027 y 2028. Incluye permanencias, migraciones, nuevas exposiciones, amortizaciones y write-offs donde corresponden. La lectura de Stage 2 distingue retornos a S1 de migraciones a default.
- **P&L impact:** cascada del P&L acumulado por variación de provisiones S1/S2/S3 y write-offs netos. El coste crediticio modelizado en puntos básicos se calcula como −P&L anual / exposición total media de apertura y cierre × 10.000; un coste negativo indica liberación neta.

## Risk lab

El motor de `src/risk-engine.js` reproduce las fórmulas de crédito de la versión FINAL; no es un motor general de Excel ni un marco regulatorio completo. La instantánea original y sus exportaciones permanecen separadas de las simulaciones. Al iniciar, se contrasta la reproducción de 754 valores numéricos de ambos modelos y escenarios. Si esta comprobación falla, las simulaciones quedan deshabilitadas.

**What-if & sensitivity.** Mantiene fijos los saldos y provisiones de 2025. Recalcula 2026–2028 y utiliza los parámetros forward de 2029 cuando las fórmulas de provisión de 2028 los requieren. Permite modificar las transiciones a default (filas 27–28), severidad de pérdida (LGD de filas 40–41 y LRLT3-3 de fila 45), PD lifetime (42), curas (29–30), recuperaciones de write-offs (71) y crecimiento de exposición (9). Los shocks son cambios relativos, salvo el crecimiento, que se desplaza en puntos porcentuales. Los controles inaplicables a EBA están deshabilitados. El tornado cambia un factor por vez alrededor del caso guardado: ±10 % relativo, o ±1 pp para crecimiento. La exportación identifica las hipótesis aplicadas y los valores recalculados.

**Reverse stress test.** Evalúa un límite editable de NPL final o pérdida crediticia acumulada. Los límites iniciales son ilustrativos, no límites aprobados del banco. Busca el primer cruce aumentando conjuntamente las transiciones a default y la severidad entre +0 % y +80 %, con refinamiento del intervalo. La solución se refiere a esa trayectoria concreta, no al mínimo entre todos los escenarios posibles. El mapa de calor recalcula 25 combinaciones de default y severidad. Las probabilidades fuera de rango, transiciones incoherentes, saldos negativos y parámetros necesarios ausentes se presentan como errores, sin sustituirlos por cero.

**Capital capacity.** Requiere CET1 inicial, cuatro valores de RWA, tres movimientos netos adicionales de CET1 después de impuestos, un porcentaje de compensación fiscal reconocida y un umbral CET1. Los campos empiezan vacíos. Usa el P&L guardado del modelo y escenario seleccionados. Proyecta CET1 y holgura a partir de esas entradas; no pretende sustituir una proyección regulatoria completa. Las unidades deben coincidir con las del modelo de crédito. Los ceros válidos deben introducirse explícitamente.

Los resultados pendientes de recalcular no se exportan como si estuvieran actualizados. Las vistas conservan las hipótesis aplicadas; editar entradas marca el cálculo como pendiente. Los CSV de Risk lab contienen simulaciones y supuestos, y los de Risk drivers contienen las conciliaciones derivadas.

## Actualizar la instantánea

Si cambias el Excel, recalcula y guarda el libro en Excel antes de extraerlo. El HTML no modifica, recalcula ni sincroniza el archivo fuente.

```sh
python3 extract_data.py "/ruta/FINAL_IFRS9 and Stress Test Tool.xlsx"
python3 build_dashboard.py
```

La extracción requiere `openpyxl`. La estructura esperada corresponde al libro proporcionado: hojas `ST Engine (EBA)`, `ST Engine (ICAAP)`, `Database` e `Instructions`, con el segmento Hipotecas. Si cambia la estructura o el segmento, hay que adaptar el extractor y el reporte.

Los archivos editables están en `src/`. Ejecuta `python3 build_dashboard.py` tras modificar el HTML base, CSS, JavaScript, motor de riesgo o vistas analíticas para regenerar el HTML autónomo. El constructor incluye los tres módulos JavaScript y los datos; no hay dependencias externas para abrir el reporte. Si cambia la estructura o las fórmulas del Excel, hay que revisar el motor y repetir la validación contra la nueva instantánea.

## Validación

Se comprobó la coincidencia de los valores extraídos con el Excel, la conciliación de exposición y provisiones, los denominadores de los ratios y el P&L acumulado. Las pruebas de DOM cubren 28 combinaciones de navegación/modelo/escenario, los 252 detalles de métricas para ambos modelos y escenarios, la presencia simultánea de todos los años, búsqueda, paginación, exportación e impresión. También comprueban que el escenario seleccionado se respeta y que no quedan selectores ni parámetros de corte anual. La versión en inglés supera 955 operaciones/comprobaciones de DOM, incluidas las etiquetas visibles y accesibles, los detalles de las 63 métricas y la conservación de los valores originales al exportar el libro. Se revisó en navegador la portada de escritorio y móvil, la navegación por las siete secciones en móvil, los filtros, la búsqueda y los detalles de fuentes. No se detectó desbordamiento horizontal de página en esa revisión. Las capturas de `outputs/` documentan el diseño anterior a esta actualización de datos. Para consultar las cifras actuales, abre `dashboard.html`. Se verificó la coincidencia de las 1.385 celdas y todas las series con el archivo FINAL.

Para repetir las pruebas con una instalación temporal de `linkedom`:

```sh
npm install --prefix /tmp/stress-report-qa linkedom --no-save --ignore-scripts
node --check src/dashboard.js
python3 build_dashboard.py
node tests/verify_dashboard.mjs /tmp/stress-report-qa/node_modules/linkedom
node tests/verify_risk_engine.mjs
```

La ampliación supera 1.259 operaciones/comprobaciones DOM. Las pruebas del motor contrastan los 754 valores guardados, 16 casos recalculados, las conciliaciones de exposición/provisiones/P&L, el uso de parámetros forward, los límites de probabilidades, valores ausentes, las fronteras del reverse stress test y las entradas de capital. Se revisaron las nuevas pantallas en Chrome a 1600 px y 390 px de ancho, sin errores JavaScript ni desbordamiento horizontal de página; los diagramas y tablas anchos se desplazan dentro de sus paneles.
