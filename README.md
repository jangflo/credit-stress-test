# Stress Report

**[Abrir el dashboard online](https://jangflo.github.io/credit-stress-test/)** — acceso público, sin instalación ni cuenta de GitHub.

Abre **dashboard.html** con doble clic en un navegador moderno. Es un archivo autónomo: contiene los estilos, los gráficos, la lógica y los datos. No requiere instalación, servidor ni conexión a Internet.

## Contenido

- Siete secciones: visión general, calidad crediticia, provisiones, flujos, resultados, comparativa EBA/ICAAP y explorador de datos.
- Selección de modelo y escenario Base/Adverso. Cada vista conserva todos los años 2025–2028 simultáneamente en gráficos, tarjetas y tablas, sin filtro por año.
- Composición por stages, coberturas, transiciones y flujos con el horizonte completo. Los escenarios se consultan por separado; EBA e ICAAP pueden compararse dentro del escenario seleccionado.
- Detalle de cada métrica con sus celdas y fórmulas de origen. Búsqueda con `⌘K` o `Ctrl+K`.
- CSV del escenario seleccionado con cifras sin redondear e impresión de la vista actual. La exportación del libro original conserva todas las celdas de la hoja consultada.
- 71 métricas y las 2.047 celdas pobladas de las cuatro hojas del Excel.

El reporte refleja los valores guardados para **Mortgages / Hipotecas**. Los parámetros de otras carteras se consultan en **Explorador de datos → Libro original → Database**. El año 2029 solo tiene ciertos parámetros forward. La moneda y la escala no están indicadas en el libro: los importes mantienen sus unidades originales.

El P&L acumulado se muestra como una trayectoria: suma de la fila 73 desde 2026 hasta cada año proyectado. El one-off adverso ya está incluido en 2026. El ajuste de transición IFRS 9 registrado en capital se excluye de esa suma. Las celdas sin datos en 2025 permanecen vacías y no se convierten en flujos cero.

## Actualizar la instantánea

Si cambias el Excel, recalcula y guarda el libro en Excel antes de extraerlo. El HTML no modifica, recalcula ni sincroniza el archivo fuente.

```sh
python3 extract_data.py "/ruta/IFRS9 and Stress Test Tool 2026-27.xlsx"
python3 build_dashboard.py
```

La extracción requiere `openpyxl`. La estructura esperada corresponde al libro proporcionado: hojas `ST Engine (EBA)`, `ST Engine (ICAAP)`, `Database` e `Instructions`, con el segmento Hipotecas. Si cambia la estructura o el segmento, hay que adaptar el extractor y el reporte.

Los archivos editables están en `src/`. Ejecuta `python3 build_dashboard.py` tras modificar el HTML base, CSS o JavaScript para regenerar el HTML autónomo.

## Validación

Se comprobó la coincidencia de los valores extraídos con el Excel, la conciliación de exposición y provisiones, los denominadores de los ratios y el P&L acumulado. Las pruebas de DOM cubren 28 combinaciones de navegación/modelo/escenario, los 284 detalles de métricas para ambos modelos y escenarios, la presencia simultánea de todos los años, búsqueda, paginación, exportación e impresión. También comprueban que el escenario seleccionado se respeta y que no quedan selectores ni parámetros de corte anual. No sustituyen una revisión visual en un navegador; la vista previa no estuvo disponible en la sesión de construcción.

Para repetir las pruebas con una instalación temporal de `linkedom`:

```sh
npm install --prefix /tmp/stress-report-qa linkedom --no-save --ignore-scripts
node --check src/dashboard.js
python3 build_dashboard.py
node tests/verify_dashboard.mjs /tmp/stress-report-qa/node_modules/linkedom
```
