# Stress Report

**[Abrir el dashboard online](https://jangflo.github.io/credit-stress-test/)** — acceso público, sin instalación ni cuenta de GitHub.

Abre **dashboard.html** con doble clic en un navegador moderno. Es un archivo autónomo: contiene los estilos, los gráficos, la lógica y los datos. No requiere instalación, servidor ni conexión a Internet.

Fuente actual: **FINAL_IFRS9 and Stress Test Tool.xlsx**. La fecha de importación se muestra en el reporte; el nuevo libro no declara una fecha de versión. La instantánea conserva 607 fórmulas con sus valores guardados, sin errores detectados. Las notas de las celdas I16, I20, I60 e I67 se conservan en el libro original y no se interpretan como resultados de 2029.

## Contenido

- Siete secciones: visión general, calidad crediticia, provisiones, flujos, resultados, comparativa EBA/ICAAP y explorador de datos.
- Selección de modelo y escenario Base/Adverso. Cada vista conserva todos los años 2025–2028 simultáneamente en gráficos, tarjetas y tablas, sin filtro por año.
- Composición por stages, coberturas, transiciones y flujos con el horizonte completo. Los escenarios se consultan por separado; EBA e ICAAP pueden compararse dentro del escenario seleccionado.
- Detalle de cada métrica con sus celdas y fórmulas de origen. Búsqueda con `⌘K` o `Ctrl+K`.
- CSV del escenario seleccionado con cifras sin redondear e impresión de la vista actual. La exportación del libro original conserva todas las celdas de la hoja consultada.
- 63 métricas y las 1.385 celdas pobladas de las cuatro hojas del Excel.

El reporte refleja los valores guardados para **Mortgages / Hipotecas**. El nuevo Database contiene únicamente parámetros de Mortgages; todas sus celdas se consultan en **Data explorer → Original workbook → Database**. El año 2029 solo tiene ciertos parámetros forward. La moneda y la escala no están indicadas en el libro: los importes mantienen sus unidades originales.

El P&L acumulado se muestra como una trayectoria: suma de la fila 73 desde 2026 hasta cada año proyectado. La versión FINAL no contiene las filas auxiliares de one-offs, acumulados ni controles del archivo anterior. No se añaden ajustes al P&L guardado. En EBA, la fila 73 es el cambio de provisiones con signo negativo; en ICAAP incluye también los write-offs netos. El acumulado se deriva de la fila 73 en ambos modelos. Las celdas sin datos en 2025 permanecen vacías y no se convierten en flujos cero.

## Diseño de la interfaz

La interfaz adapta la distribución de [Vision UI Dashboard](https://demos.creative-tim.com/vision-ui-dashboard-react/#/dashboard) al reporte financiero y a la referencia local `vision_gradient_dashboard.html`. Utiliza gradientes turquesa, verde y navy, navegación fija de 250 px, tarjetas semitransparentes y cuatro KPI con todo el horizonte visible. Los paneles de cobertura y transición conservan los cuatro años y enlazan con los detalles del Excel.

La página está en inglés, incluidos navegación, métricas, categorías, notas, búsqueda, mensajes, atributos accesibles y encabezados CSV. Los números se presentan con formato `en-GB`. Los textos originales del Excel se traducen para su visualización; la instantánea y las exportaciones de celdas conservan los valores y las fórmulas originales. Las traducciones de las métricas se definen en `src/dashboard.js`, por lo que se mantienen al volver a extraer el libro.

El sistema de diseño se define en las variables de `src/dashboard.css`. La tipografía utiliza Inter cuando está instalada y fuentes del sistema como alternativa, sin solicitudes externas. El menú móvil incluye fondo de cierre, Escape y control del foco; las transiciones respetan la preferencia de movimiento reducido. Las tablas mantienen desplazamiento horizontal dentro de su contenedor. El tema de impresión conserva superficies claras.

Las variaciones de los KPI comparan 2028 con 2025: puntos porcentuales para ratios y porcentajes para importes. El P&L acumulado conserva su suma desde 2026. Las variaciones de exposición y provisiones no se colorean como positivas o negativas porque su dirección no determina por sí sola una mejora del riesgo.

## Actualizar la instantánea

Si cambias el Excel, recalcula y guarda el libro en Excel antes de extraerlo. El HTML no modifica, recalcula ni sincroniza el archivo fuente.

```sh
python3 extract_data.py "/ruta/FINAL_IFRS9 and Stress Test Tool.xlsx"
python3 build_dashboard.py
```

La extracción requiere `openpyxl`. La estructura esperada corresponde al libro proporcionado: hojas `ST Engine (EBA)`, `ST Engine (ICAAP)`, `Database` e `Instructions`, con el segmento Hipotecas. Si cambia la estructura o el segmento, hay que adaptar el extractor y el reporte.

Los archivos editables están en `src/`. Ejecuta `python3 build_dashboard.py` tras modificar el HTML base, CSS o JavaScript para regenerar el HTML autónomo.

## Validación

Se comprobó la coincidencia de los valores extraídos con el Excel, la conciliación de exposición y provisiones, los denominadores de los ratios y el P&L acumulado. Las pruebas de DOM cubren 28 combinaciones de navegación/modelo/escenario, los 252 detalles de métricas para ambos modelos y escenarios, la presencia simultánea de todos los años, búsqueda, paginación, exportación e impresión. También comprueban que el escenario seleccionado se respeta y que no quedan selectores ni parámetros de corte anual. La versión en inglés supera 955 operaciones/comprobaciones de DOM, incluidas las etiquetas visibles y accesibles, los detalles de las 63 métricas y la conservación de los valores originales al exportar el libro. Se revisó en navegador la portada de escritorio y móvil, la navegación por las siete secciones en móvil, los filtros, la búsqueda y los detalles de fuentes. No se detectó desbordamiento horizontal de página en esa revisión. Las capturas de `outputs/` documentan el diseño anterior a esta actualización de datos. Para consultar las cifras actuales, abre `dashboard.html`. Se verificó la coincidencia de las 1.385 celdas y todas las series con el archivo FINAL.

Para repetir las pruebas con una instalación temporal de `linkedom`:

```sh
npm install --prefix /tmp/stress-report-qa linkedom --no-save --ignore-scripts
node --check src/dashboard.js
python3 build_dashboard.py
node tests/verify_dashboard.mjs /tmp/stress-report-qa/node_modules/linkedom
```
