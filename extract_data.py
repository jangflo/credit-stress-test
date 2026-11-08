#!/usr/bin/env python3
"""Read the supplied workbook without modifying/recalculating it.

Usage: python3 extract_data.py [path/to/workbook.xlsx]
The report uses Excel's saved values, and preserves formulas for traceability.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import warnings
from datetime import date, datetime
from pathlib import Path

import openpyxl
from openpyxl.utils import get_column_letter

DEFAULT_SOURCE = Path(__file__).resolve().parent.parent / 'IFRS9 and Stress Test Tool 2026-27.xlsx'
PERIODS = [2025, 2026, 2027, 2028, 2029]
LABELS = {
    9: 'Crecimiento de la exposición', 10: 'Nuevas exposiciones / amortizaciones',
    11: 'Exposición total', 12: 'Exposición performing', 13: 'Exposición Stage 1',
    14: 'Exposición Stage 2', 15: 'Exposición Stage 3 · NPL',
    16: 'Stock de provisiones', 17: 'Provisiones performing', 18: 'Provisiones Stage 1',
    19: 'Provisiones Stage 2', 20: 'Provisiones Stage 3',
    21: 'Cobertura performing', 22: 'Cobertura Stage 1', 23: 'Cobertura Stage 2',
    24: 'Cobertura NPL', 25: 'Transición S1 → S2', 26: 'Transición S2 → S1',
    27: 'Transición S1 → S3', 28: 'Transición S2 → S3', 29: 'Cura S3 → S1',
    30: 'Cura S3 → S2', 31: 'Tasa de write-offs',
    32: 'Exposición S1 → S2', 33: 'Exposición S2 → S1', 34: 'Entradas en NPL',
    35: 'Exposición S1 → S3', 36: 'Exposición S2 → S3', 37: 'Salidas de NPL',
    38: 'Exposición S3 → S1', 39: 'Exposición S3 → S2',
    40: 'LGD 12 meses · Stage 1', 41: 'LGD 12 meses · Stage 2', 42: 'PD lifetime',
    43: 'Loss rate lifetime S1 → S2', 44: 'Loss rate lifetime S2 → X',
    45: 'Loss rate lifetime S3 → S3',
    46: 'Deterioro de nuevas entradas / liberación por amortizaciones',
    47: 'Deterioro bruto S1 → S2', 48: 'Liberación de provisiones S1 → S2',
    49: 'Deterioro bruto S2 → S1', 50: 'Liberación de provisiones S2 → S1',
    51: 'Deterioro bruto de entradas en NPL', 52: 'Deterioro bruto S1 → S3',
    53: 'Deterioro bruto S2 → S3', 54: 'Liberación de provisiones S1 → S3',
    55: 'Liberación de provisiones S2 → S3', 56: 'Deterioro bruto S3 → S1',
    57: 'Deterioro bruto S3 → S2', 58: 'Liberación de provisiones en salidas de NPL',
    59: 'Liberación de provisiones S3 → S1', 60: 'Liberación de provisiones S3 → S2',
    61: 'Deterioro bruto S1 → S1', 62: 'Deterioro bruto S2 → S2',
    63: 'Deterioro bruto S3 → S3', 64: 'Write-offs brutos',
    65: 'Liberación de provisiones por write-offs', 66: 'Recuperaciones de write-offs',
    67: 'Write-offs netos', 69: 'Ratio Stage 2 / performing', 70: 'Ratio NPL',
    71: 'Tasa de recuperación de write-offs', 73: 'Impacto P&L anual',
    75: 'One-off IFRS 9 · impacto en capital', 76: 'One-off adverso · incluido en Y1',
    77: 'P&L acumulado 2026–2028', 78: 'Conciliación de exposición',
    79: 'Conciliación de provisiones', 80: 'Conciliación de P&L',
    81: 'Control de tasas de transición', 82: 'Control de restricciones / saldos',
}
PERCENT_ROWS = {9, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 40, 41, 42, 43, 44, 45, 69, 70, 71}


def category(row):
    if row <= 10: return 'Crecimiento'
    if row <= 15: return 'Exposición'
    if row <= 20: return 'Provisiones'
    if row <= 24: return 'Coberturas'
    if row <= 31: return 'Transiciones'
    if row <= 39: return 'Flujos de exposición'
    if row <= 45: return 'Parámetros de riesgo'
    if row <= 63: return 'Flujos de deterioro'
    if row <= 67: return 'Write-offs'
    if row <= 71: return 'Ratios'
    if row <= 77: return 'Resultados'
    return 'Controles'


def serial(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value


def extract(source):
    with warnings.catch_warnings():
        warnings.simplefilter('ignore', UserWarning)
        formulas = openpyxl.load_workbook(source, data_only=False)
        values = openpyxl.load_workbook(source, data_only=True)

    raw_sheets = []
    missing_cache, errors = [], []
    formula_count = 0
    inventory = []
    for sheet in formulas:
        value_sheet = values[sheet.title]
        cells = []
        inventory.append('\n' + sheet.title + '\n' + '=' * len(sheet.title))
        for row in sheet:
            row_output = []
            for cell in row:
                if cell.value is None:
                    continue
                value = serial(value_sheet[cell.coordinate].value)
                formula = cell.value if cell.data_type == 'f' else None
                if formula:
                    formula_count += 1
                    if value is None:
                        missing_cache.append(f'{sheet.title}!{cell.coordinate}')
                if value_sheet[cell.coordinate].data_type == 'e':
                    errors.append({'source': f'{sheet.title}!{cell.coordinate}', 'error': value})
                cells.append({
                    'address': cell.coordinate, 'row': cell.row, 'column': cell.column,
                    'value': value, 'formula': formula, 'numberFormat': cell.number_format,
                })
                row_output.append(f'{cell.coordinate}={value}')
            if row_output:
                inventory.append(' | '.join(row_output))
        raw_sheets.append({
            'name': sheet.title, 'maxRow': sheet.max_row, 'maxColumn': sheet.max_column,
            'cells': cells, 'mergedRanges': [str(r) for r in sheet.merged_cells.ranges],
        })

    metrics = []
    for row, label in LABELS.items():
        original = values['ST Engine (EBA)'][f'C{row}'].value or values['ST Engine (EBA)'][f'B{row}'].value
        description = values['Instructions'][f'J{row}'].value
        metrics.append({
            'id': f'r{row}', 'row': row, 'label': label,
            'originalLabel': original, 'description': description,
            'unit': 'percent' if row in PERCENT_ROWS else ('text' if row >= 78 else 'amount'),
            'category': category(row),
        })

    engines = {}
    for model in ['EBA', 'ICAAP']:
        sheet_name = f'ST Engine ({model})'
        sheet = values[sheet_name]
        scenarios = {}
        for scenario, first, label in [('baseline', 5, 'Base'), ('adverse', 10, 'Adverso')]:
            columns = [get_column_letter(i) for i in range(first, first + 5)]
            scenarios[scenario] = {
                'label': label, 'columns': columns,
                'rows': {str(r): [serial(sheet[f'{col}{r}'].value) for col in columns] for r in LABELS},
                'sources': {str(r): [f'{col}{r}' for col in columns] for r in LABELS},
            }
        engines[model] = {'sheet': sheet_name, 'segment': sheet['C5'].value, 'scenarios': scenarios}

    database_metrics = []
    db = values['Database']
    portfolios = []
    for r in range(1, db.max_row + 1):
        portfolio, label = db[f'C{r}'].value, db[f'D{r}'].value
        if not portfolio or not label or r < 8:
            continue
        if portfolio not in portfolios:
            portfolios.append(portfolio)
        source_baseline = [f'{get_column_letter(c)}{r}' for c in range(5, 10)]
        source_adverse = [f'{get_column_letter(c)}{r}' for c in range(10, 15)]
        database_metrics.append({
            'row': r, 'portfolio': portfolio, 'label': label,
            'unit': 'amount' if label == 'Total Exposure' else 'percent',
            'baseline': [serial(db[a].value) for a in source_baseline],
            'adverse': [serial(db[a].value) for a in source_adverse],
            'sources': {'baseline': source_baseline, 'adverse': source_adverse},
        })

    # Independent additive checks inspect reported values, never overwrite them.
    reconciliation = []
    for model, engine in engines.items():
        for scenario, dataset in engine['scenarios'].items():
            rr = dataset['rows']
            for index, year in enumerate(PERIODS[:4]):
                for name, total, parts in [('exposure', 11, [13,14,15]), ('provisions', 16, [18,19,20])]:
                    delta = rr[str(total)][index] - sum(rr[str(p)][index] for p in parts)
                    reconciliation.append({'model': model, 'scenario': scenario, 'year': year,
                                           'check': name, 'difference': delta, 'pass': abs(delta) < 1e-7})

    data = {
        'meta': {
            'sourceFile': source.name, 'sourceDate': '2026-10-30',
            'sourceDateReference': "'ST Engine (EBA)'!C84; 'ST Engine (ICAAP)'!C84",
            'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
            'segment': 'Mortgages', 'segmentLabel': 'Hipotecas',
            'amountUnit': 'unidades del Excel', 'currency': None,
            'resultsYears': PERIODS[:4], 'parameterYears': [2029],
            'valueBasis': 'Valores guardados en el Excel, sin recalcular ni modificar el libro.',
            'notes': [
                'Los dos motores contienen resultados guardados para Mortgages (Hipotecas).',
                'Database contiene parámetros de otras tres carteras; no contiene sus resultados de stress test.',
                '2029 aparece solo para algunos parámetros forward; no es un ejercicio completo de resultados.',
                'El Excel no declara moneda ni escala monetaria. Se conservan las unidades originales.',
                'Impacto P&L anual: signo negativo indica gasto/pérdida; el escenario adverso incluye su one-off en 2026.',
                'El one-off IFRS 9 de la fila 75 impacta capital, separado del P&L.',
            ],
        },
        'periods': PERIODS, 'metrics': metrics, 'engines': engines,
        'rawSheets': raw_sheets,
        'database': {'portfolios': portfolios, 'metrics': database_metrics},
        'checks': {
            'formulaCount': formula_count, 'missingFormulaCaches': missing_cache, 'excelErrors': errors,
            'reconciliation': reconciliation,
            'populatedCells': sum(len(s['cells']) for s in raw_sheets),
        },
    }
    return data, '\n'.join(inventory) + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', nargs='?', type=Path, default=DEFAULT_SOURCE)
    parser.add_argument('--output', type=Path, default=Path(__file__).parent / 'data' / 'stress-data.json')
    args = parser.parse_args()
    data, inventory = extract(args.source)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':'), allow_nan=False), encoding='utf-8')
    (args.output.parent / 'workbook_inventory.txt').write_text(inventory, encoding='utf-8')
    print(json.dumps({'output': str(args.output), 'cells': data['checks']['populatedCells'],
                      'metrics': len(data['metrics']), 'formulaCount': data['checks']['formulaCount'],
                      'missingCaches': len(data['checks']['missingFormulaCaches']),
                      'errors': len(data['checks']['excelErrors']),
                      'reconciliationsPass': all(c['pass'] for c in data['checks']['reconciliation'])}, ensure_ascii=False))


if __name__ == '__main__':
    main()
