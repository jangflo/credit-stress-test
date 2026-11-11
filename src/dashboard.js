'use strict';
(() => {
const DATA = JSON.parse(document.getElementById('report-data').textContent);

// English presentation labels are independent of the original workbook snapshot.
const METRIC_LABELS = {
  "9": "Exposure growth",
  "10": "New exposures / prepayments",
  "11": "Total exposure",
  "12": "Performing exposure",
  "13": "Stage 1 exposure",
  "14": "Stage 2 exposure",
  "15": "Stage 3 exposure · NPL",
  "16": "Provision stock",
  "17": "Performing provisions",
  "18": "Stage 1 provisions",
  "19": "Stage 2 provisions",
  "20": "Stage 3 provisions",
  "21": "Performing coverage",
  "22": "Stage 1 coverage",
  "23": "Stage 2 coverage",
  "24": "NPL coverage",
  "25": "Transition S1 → S2",
  "26": "Transition S2 → S1",
  "27": "Transition S1 → S3",
  "28": "Transition S2 → S3",
  "29": "Cure S3 → S1",
  "30": "Cure S3 → S2",
  "31": "Write-off rate",
  "32": "Exposure S1 → S2",
  "33": "Exposure S2 → S1",
  "34": "NPL inflows",
  "35": "Exposure S1 → S3",
  "36": "Exposure S2 → S3",
  "37": "NPL outflows",
  "38": "Exposure S3 → S1",
  "39": "Exposure S3 → S2",
  "40": "12-month LGD · Stage 1",
  "41": "12-month LGD · Stage 2",
  "42": "Lifetime PD",
  "43": "Lifetime loss rate S1 → S2",
  "44": "Lifetime loss rate S2 → X",
  "45": "Lifetime loss rate S3 → S3",
  "46": "New-entry impairment / prepayment provision release",
  "47": "Gross impairment S1 → S2",
  "48": "Provision release S1 → S2",
  "49": "Gross impairment S2 → S1",
  "50": "Provision release S2 → S1",
  "51": "Gross impairment of NPL inflows",
  "52": "Gross impairment S1 → S3",
  "53": "Gross impairment S2 → S3",
  "54": "Provision release S1 → S3",
  "55": "Provision release S2 → S3",
  "56": "Gross impairment S3 → S1",
  "57": "Gross impairment S3 → S2",
  "58": "Provision release on NPL outflows",
  "59": "Provision release S3 → S1",
  "60": "Provision release S3 → S2",
  "61": "Gross impairment S1 → S1",
  "62": "Gross impairment S2 → S2",
  "63": "Gross impairment S3 → S3",
  "64": "Gross write-offs",
  "65": "Provision release on write-offs",
  "66": "Write-off recoveries",
  "67": "Net write-offs",
  "69": "Stage 2 / performing ratio",
  "70": "NPL ratio",
  "71": "Write-off recovery rate",
  "73": "Annual P&L impact",
  "75": "IFRS 9 one-off · capital impact",
  "76": "Adverse one-off · included in Y1",
  "77": "Cumulative P&L 2026–2028",
  "78": "Exposure reconciliation",
  "79": "Provision reconciliation",
  "80": "P&L reconciliation",
  "81": "Transition rate check",
  "82": "Constraint / balance check"
};
const METRIC_CATEGORIES = {
  "Crecimiento": "Growth",
  "Exposición": "Exposure",
  "Provisiones": "Provisions",
  "Coberturas": "Coverage",
  "Transiciones": "Transitions",
  "Flujos de exposición": "Exposure flows",
  "Parámetros de riesgo": "Risk parameters",
  "Flujos de deterioro": "Impairment flows",
  "Write-offs": "Write-offs",
  "Ratios": "Ratios",
  "Resultados": "P&L",
  "Controles": "Controls"
};
const SOURCE_TEXT = {
  "Significa que el stock final de Stage 3 está compuesto por las provisiones requeridas sobre los créditos que efectivamente se encuentran en Stage 3 al cierre de 2026.O  sea Gif13+GIF23+GIF33": "The closing Stage 3 stock comprises the provisions required for loans actually in Stage 3 at the end of 2026: GIF13 + GIF23 + GIF33.",
  "cuando esos préstamos salen de Stage 3 hacia Stage 2, dejamos de necesitar las 104.42 unidades de provisiones que tenían asociadas en Stage 3. Sin embargo, simultáneamente reconoceremos nuevas provisiones de Stage 2 mediante el GIF S3→S2. Por tanto, la liberación neta no será necesariamente de 104.42.": "When these loans move from Stage 3 to Stage 2, the 104.42 units of Stage 3 provisions are no longer needed. New Stage 2 provisions are recognised through GIF S3→S2, so the net release is not necessarily 104.42.",
  "Interpretación: después de considerar las provisiones existentes y los importes recuperados, quedan 54.86 unidades de pérdida no cubierta. Este importe será relevante para el cálculo del P&L": "After existing provisions and recovered amounts are considered, 54.86 units of uncovered loss remain. This amount is relevant to the P&L calculation.",
  "El Stock of Provisions representa las provisiones que el banco mantiene al cierre de cada año para cubrir las pérdidas crediticias esperadas.": "Provision stock represents the provisions held by the bank at each year-end to cover expected credit losses.",
  "Fuente: Database · Mortgages | Actualizado: 2026-10-30": "Source: Database · Mortgages | Updated: 2026-10-30",
  "One-off IFRS9: impacto en capital": "IFRS 9 one-off · capital impact",
  "One-off adverse: P&L incluido en Y1": "Adverse one-off · included in Y1",
  "P&L acumulado 2026–2028": "Cumulative P&L 2026–2028",
  "Control conciliación exposición": "Exposure reconciliation",
  "Control conciliación provisiones": "Provision reconciliation",
  "Control conciliación P&L": "P&L reconciliation",
  "Control tasas de transición": "Transition rate check",
  "Control restricciones / saldos": "Constraint / balance check"
};
const sourceText = value => typeof value === 'string' ? (SOURCE_TEXT[value] || value).replace(/PyMES|PYMES/g,'SMEs') : value;
const METRICS = DATA.metrics.map(m => ({...m,label:METRIC_LABELS[m.row] || m.originalLabel,category:METRIC_CATEGORIES[m.category] || m.category}));
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const numeric = v => typeof v === 'number' && Number.isFinite(v);
const format = (v, unit = 'amount', digits) => {
  if (!numeric(v)) return v == null || v === '' ? '—' : esc(v);
  const d = digits ?? (unit === 'percent' ? 2 : 1);
  return new Intl.NumberFormat('en-GB', {minimumFractionDigits:d,maximumFractionDigits:d,useGrouping:true}).format(unit === 'percent' ? v * 100 : v) + (unit === 'percent' ? '%' : '');
};
const signed = (v, d = 2) => numeric(v) ? (v > 0 ? '+' : '') + format(v,'amount',d) : '—';
const compact = v => Math.abs(v) >= 10000 ? format(v / 1000,'amount',1) + 'k' : format(v,'amount',Math.abs(v) < 10 && v !== 0 ? 1 : 0);
const icons = {
  overview:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  credit:'<path d="M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7l-9-4Z"/><path d="m8 12 3 3 5-6"/>',
  provisions:'<path d="M4 21V9l8-6 8 6v12M8 21v-6h8v6M3 21h18"/><path d="M9 9h6"/>',
  flows:'<path d="M4 7h16m-5-5 5 5-5 5M20 17H4m5-5-5 5 5 5"/>',
  results:'<path d="M4 3v17h17M8 15l4-5 4 2 5-7"/>',
  comparison:'<path d="M8 3v18M16 3v18M4 7h8M12 17h8"/><circle cx="8" cy="7" r="2" fill="currentColor"/><circle cx="16" cy="17" r="2" fill="currentColor"/>',
  data:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18M3 15h18"/>',
  book:'<path d="M12 5c-4-3-9-2-9-2v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2Zm0 0v16"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  print:'<path d="M6 8V3h12v5M6 17H3V8h18v9h-3M6 14h12v7H6Z"/><path d="M17 11h1"/>',
  arrow:'<path d="M5 19 19 5M5 5h14v14"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  home:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
  layers:'<path d="m12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  minus:'<path d="M5 12h14"/>',
};
const icon = (name, size=18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.info}</svg>`;
const views = [
  {id:'overview',label:'Overview',title:'Risk under stress',subtitle:'An integrated view of credit quality and its financial impact.'},
  {id:'credit',label:'Credit quality',title:'Credit evolution',subtitle:'Exposure, non-performing loans and portfolio allocation by stage.'},
  {id:'provisions',label:'Provisions & coverage',title:'Risk coverage',subtitle:'Provision stock and coverage of credit exposures.'},
  {id:'flows',label:'Flows & transitions',title:'Portfolio movements',subtitle:'Inflows, outflows and stage transitions under IFRS 9.'},
  {id:'results',label:'P&L impact',title:'The cost of the scenario',subtitle:'Annual and cumulative provision impact on profit and loss.'},
  {id:'comparison',label:'EBA vs. ICAAP',title:'Two models, one portfolio',subtitle:'Compare saved model results under the same scenario.'},
  {id:'data',label:'Data explorer',title:'Behind the numbers',subtitle:'All metrics, parameters and original workbook cells.'},
];
const state = {view:'overview',model:'EBA',scenario:'adverse',dataTab:'metrics',query:'',category:'all',sheet:'ST Engine (EBA)',page:0};
const colors = {baseline:'#57D994',adverse:'#3BC9CD',EBA:'#3BC9CD',ICAAP:'#57D994',stages:['#3BC9CD','#B4D988','#F391A1']};
const years = DATA.meta.resultsYears;
const snapshotDate = DATA.meta.importedAt ? new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(new Date(DATA.meta.importedAt)) : 'Not specified';
const sourceSummary = `Snapshot refreshed: ${snapshotDate}`;

const metric = r => METRICS.find(m => m.row === Number(r));
const values = (r,model=state.model,scenario=state.scenario) => (DATA.engines[model].scenarios[scenario].rows[String(r)] || []).slice(0,4);
const value = (r,model,scenario,i) => values(r,model,scenario)[i] ?? null;
const sources = (r,model=state.model,scenario=state.scenario) => (DATA.engines[model].scenarios[scenario].sources[String(r)] || []).slice(0,4);
const source = (r,model,scenario,i) => `'${DATA.engines[model].sheet}'!${sources(r,model,scenario)[i] || '—'}`;
const scenarioLabel = () => state.scenario === 'adverse' ? 'Adverse' : 'Baseline';
const unitLabel = unit => unit === 'percent' ? '%' : unit === 'text' ? 'Workbook status' : 'Excel units';
const cumulative = (model=state.model,scenario=state.scenario) => {
  const annual = values(73,model,scenario); let sum = 0;
  return annual.map((v,i) => { if(i===0) return 0; if(!numeric(v) || sum===null) {sum=null; return null;} return sum+=v; });
};
const normalize = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
let chartId = 0;

function chartSeries(row, compare=false) {
  if(compare) return ['EBA','ICAAP'].map(model=>({name:model,color:colors[model],values:values(row,model),sources:sources(row,model).map(c=>`'${DATA.engines[model].sheet}'!${c}`),dashed:model==='ICAAP'}));
  return [{name:scenarioLabel(),color:colors[state.scenario],values:values(row),sources:sources(row).map(c=>`'${DATA.engines[state.model].sheet}'!${c}`)}];
}

function chartTable(series, unit, chartYears) {
  return `<details class="chart-data"><summary>View figures and sources</summary><div class="table-wrap"><table><thead><tr><th>Series</th>${chartYears.map(y=>`<th class="num">${y}</th>`).join('')}</tr></thead><tbody>${series.map(s=>`<tr><td>${esc(s.name)}</td>${s.values.map((v,i)=>`<td class="num" title="${esc(s.sources?.[i]||'Derived calculation')}">${format(v,unit)}<span class="table-source">${esc(s.sources?.[i]?.split('!').pop() || 'Derived')}</span></td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
}

function graph(series, unit='amount', opts={}) {
  const id=++chartId, W=600,H=opts.small?225:275,L=57,R=25,T=22,B=37;
  const ys=opts.years||years;
  const mult=unit==='percent'?100:1;
  const all=series.flatMap(s=>s.values).filter(numeric).map(v=>v*mult);
  if(!all.length) return '<div class="empty-state">No saved data is available for this series.</div>';
  const rawMin=Math.min(0,...all),rawMax=Math.max(0,...all);
  const span=(rawMax-rawMin)||1;
  const stepRaw=span/4, magnitude=10**Math.floor(Math.log10(stepRaw));
  const step=[1,2,2.5,5,10].map(x=>x*magnitude).find(x=>x>=stepRaw)||magnitude*10;
  let min=Math.floor(rawMin/step)*step,max=Math.ceil(rawMax/step)*step;
  if(min===max) max=min+1;
  const edgePadding=opts.bars?43:0;
  const px=i=>L+edgePadding+i*(W-L-R-2*edgePadding)/Math.max(1,ys.length-1),py=v=>T+(max-v*mult)/(max-min)*(H-T-B);
  const y0=py(0), ticks=[]; for(let n=min;n<=max+step*.01;n+=step) ticks.push(Math.abs(n)<step*.0001?0:n);
  const tickFmt=n=>unit==='percent'?format(n,'amount',step<1?1:0)+'%':compact(n);
  let svg=`<svg class="line-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.title||'Evolution')} · ${esc(unitLabel(unit))}"><defs>${series.map((s,j)=>`<linearGradient id="area-${id}-${j}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${s.color}" stop-opacity=".32"/><stop offset="100%" stop-color="${s.color}" stop-opacity="0"/></linearGradient><linearGradient id="bar-${id}-${j}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${s.color}"/><stop offset="1" stop-color="#1AA35D"/></linearGradient>`).join('')}</defs>`;
  svg+=ticks.map(n=>`<line class="chart-grid" x1="${L}" y1="${py(n/mult)}" x2="${W-R}" y2="${py(n/mult)}"/><text class="chart-label" x="${L-11}" y="${py(n/mult)+4}" text-anchor="end">${tickFmt(n)}</text>`).join('');
  svg+=ys.map((y,i)=>`<text class="chart-label" x="${px(i)}" y="${H-11}" text-anchor="middle">${y}${y===2025?' · SP':''}</text>`).join('');
  series.forEach((s,j)=>{
    if(opts.bars){
      const bw=ys.length===3?32:23;
      s.values.forEach((v,i)=>{if(!numeric(v))return; const x=px(i)+(j-(series.length-1)/2)*(bw+5)-bw/2;
        const tooltip=`${s.name} · ${ys[i]}|${format(v,unit)}|${s.sources?.[i]||'Derived calculation'}`;
        svg+=`<rect x="${Math.max(L-3,Math.min(W-R-bw+3,x))}" y="${Math.min(py(v),y0)}" width="${bw}" height="${Math.max(2,Math.abs(py(v)-y0))}" rx="4" fill="url(#bar-${id}-${j})" opacity="${j===0?.85:1}" tabindex="0" data-tooltip="${esc(tooltip)}" aria-label="${esc(tooltip.replaceAll('|',', '))}"/>`;
      });
    } else {
      const chunks=[];let chunk=[];
      s.values.forEach((v,i)=>{if(numeric(v))chunk.push([px(i),py(v)]);else if(chunk.length){chunks.push(chunk);chunk=[];}});if(chunk.length)chunks.push(chunk);
      chunks.forEach(points=>{
        const path=points.map((p,i)=>`${i?'L':'M'}${p[0]},${p[1]}`).join(' ');
        if(j===series.length-1&&points.length>1) svg+=`<path d="${path} L${points.at(-1)[0]},${y0} L${points[0][0]},${y0} Z" fill="url(#area-${id}-${j})"/>`;
        svg+=`<path d="${path}" fill="none" stroke="${s.color}" stroke-width="2.5" ${s.dashed?'stroke-dasharray="5 5"':''} stroke-linejoin="round" stroke-linecap="round"/>`;
      });
      s.values.forEach((v,i)=>{if(!numeric(v))return;const tip=`${s.name} · ${ys[i]}|${format(v,unit)}|${s.sources?.[i]||'Derived calculation'}`;
        svg+=`<circle class="chart-node" cx="${px(i)}" cy="${py(v)}" r="4" fill="#043047" stroke="${s.color}" tabindex="0" data-tooltip="${esc(tip)}" aria-label="${esc(tip.replaceAll('|',', '))}"/>`;
      });
    }
  });
  svg+='</svg>';
  return `<div class="chart-legend">${series.map(s=>`<span class="legend-item"><i class="legend-line ${s.dashed?'dashed':''}" style="border-color:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div><div class="chart-wrap">${svg}</div>${chartTable(series,unit,ys)}`;
}

function chartPanel(row,opts={}) {
  const m=metric(row), title=opts.title||m.label;
  const series=chartSeries(row,opts.compare);
  return `<section class="panel"><div class="panel-header"><div><h2>${esc(title)}</h2><p>${esc(opts.subtitle||`${unitLabel(m.unit)} · 2025–2028`)} · ${scenarioLabel()}</p></div><button class="icon-btn" data-detail="${row}" aria-label="Details for ${esc(m.label)}">${icon('arrow',15)}</button></div>${graph(series,m.unit,{...opts,title,years})}</section>`;
}

function kpi(row,label,note,primary=false,override=null) {
  const m=metric(row), series=override?.values||values(row);
  const delta=numeric(series[0])&&numeric(series[3]) ? (m.unit==='percent' ? (series[3]-series[0])*100 : series[0] ? (series[3]/series[0]-1)*100 : null) : null;
  const deltaText=numeric(delta)?`${signed(Math.abs(delta)<.005?0:delta)} ${m.unit==='percent'?'pp':'%'} · 2025–28`:override?'Cumulative · 2026–28':'Projection · 2026–28';
  // A larger provision or exposure stock is not intrinsically a good/bad outcome.
  const tone=row===70&&numeric(delta)?(delta>0?'negative':delta<0?'positive':''):row===73?(series[3]<0?'negative':'positive'):'';
  const glyph=({70:'credit',11:'provisions',16:'layers',73:'results'})[row]||'overview';
  return `<button class="kpi ${primary?'primary':''}" data-detail="${row}" aria-label="${esc(label)} · 2025 to 2028. View details"><span class="kpi-label">${esc(label)}</span><span class="kpi-icon">${icon(glyph,21)}</span><span class="kpi-value">${format(series[3],m.unit,m.unit==='percent'?2:0)}<small>2028</small></span><span class="kpi-delta ${tone}">${deltaText}</span><span class="kpi-years">${years.map((year,i)=>`<span class="kpi-year" data-year-value="${year}"><span>${year}${i===0?' · SP':''}</span><strong>${format(series[i],m.unit,m.unit==='percent'?2:0)}</strong></span>`).join('')}</span><span class="kpi-note">${note}</span></button>`;
}

function kpis() {
  return `<div class="section-intro"><h2>Scenario evolution</h2><span>${state.model} · ${scenarioLabel()} · 2025–2028</span></div><div class="kpi-grid">${kpi(70,'NPL ratio','NPL / total exposure',true)}${kpi(11,'Total exposure','Excel units')}${kpi(16,'Provision stock','Excel units')}${kpi(73,'Cumulative P&L','Sum since 2026 · Excel units',false,{values:cumulative().map((v,i)=>i?v:null)})}</div>`;
}

function stageComposition(provisions=false) {
  const rows=provisions?[18,19,20]:[13,14,15],totals=values(provisions?16:11);
  const series=rows.map((row,i)=>({name:`Stage ${i+1}${i===2?' · NPL':''}`,color:colors.stages[i],values:values(row),sources:sources(row).map(c=>`'${DATA.engines[state.model].sheet}'!${c}`)}));
  return `<section class="panel"><div class="panel-header"><div><h2>${provisions?'Provisions by stage':'Portfolio allocation'}</h2><p>${scenarioLabel()} · allocation in each year</p></div><span class="muted">${icon('layers',16)}</span></div><div class="chart-legend">${series.map((s,i)=>`<button class="legend-item" data-detail="${rows[i]}"><i class="legend-dot" style="background:${s.color}"></i>${s.name}</button>`).join('')}</div><div class="stage-timeline">${years.map((year,i)=>`<div class="stage-year" data-year-row="${year}"><div class="stage-year-label"><span>${year}${i===0?' · SP':''}</span><strong>${format(totals[i],'amount',0)} <small>units</small></strong></div><div class="stage-stack" role="group" aria-label="Allocation in ${year}">${series.map((s,j)=>{const v=s.values[i],share=numeric(v)&&numeric(totals[i])&&totals[i]>0?v/totals[i]:null;return numeric(share)?`<button data-detail="${rows[j]}" style="width:${share*100}%;background:${s.color}" data-tooltip="${esc(`${s.name} · ${year}|${format(v)} units|${format(share,'percent')} of total · ${s.sources[i]}`)}" aria-label="${esc(`${s.name} in ${year}: ${format(v)} units, ${format(share,'percent')} of total`)}"></button>`:'';}).join('')}</div></div>`).join('')}<p class="rail-caption">Bars show 100% of each year. Totals in Excel units.</p></div>${chartTable(series,'amount',years)}</section>`;
}

function metricTable(rows,title='Indicator details',opts={}) {
  const ms=rows.map(metric).filter(Boolean);
  return `<section class="panel"><div class="table-heading"><div><h2>${title}</h2><p>${state.model} · ${scenarioLabel()} · select a metric to view its source</p></div><span class="row-chip">${ms.length} metrics</span></div><div class="table-wrap"><table><thead><tr><th>Indicator</th>${years.map(y=>`<th class="num">${y}${y===2025?' · SP':''}</th>`).join('')}${opts.extra?'<th class="num">2029 · Parameter</th>':''}<th>Unit</th></tr></thead><tbody>${ms.map(m=>`<tr><td class="metric-name"><button class="metric-link" data-detail="${m.row}">${esc(m.label)}${icon('arrow',13)}</button></td>${years.map((y,i)=>`<td class="num " title="${esc(source(m.row,state.model,state.scenario,i))}">${format(value(m.row,state.model,state.scenario,i),m.unit)}</td>`).join('')}${opts.extra?`<td class="num">${format(DATA.engines[state.model].scenarios[state.scenario].rows[String(m.row)]?.[4],m.unit)}</td>`:''}<td>${m.unit==='percent'?'%':m.unit==='amount'?'Excel units':'Status'}</td></tr>`).join('')||'<tr><td colspan="7" class="empty-state">No metrics match this filter.</td></tr>'}</tbody></table></div></section>`;
}

const note = text => `<div class="note">${icon('info',15)}<div>${text}</div></div>`;

function overviewHighlights() {
  const coverage=values(24),migration=values(28), max=Math.max(...migration.filter(numeric),.01);
  return `<div class="grid vision-highlights">
    <section class="panel welcome-panel"><span class="eyebrow">SCENARIO PERSPECTIVE</span><h2>Your portfolio,<br><span>from a new perspective.</span></h2><p>Mortgages · ${state.model} · ${scenarioLabel()}<br>${state.model==='EBA'?'Constant balance sheet. Cure and write-off flows are not reported.':'Dynamic balance sheet, with cures and write-offs.'}</p><button class="welcome-link" data-view="comparison">Compare EBA and ICAAP ${icon('arrow',16)}</button><span class="welcome-orbit" aria-hidden="true"></span></section>
    <section class="panel coverage-summary"><div class="panel-header"><div><h2>NPL coverage</h2><p>Stage 3 provisions / Stage 3 exposure</p></div><button class="icon-btn" data-detail="24" aria-label="NPL coverage details">${icon('arrow',15)}</button></div><div class="coverage-rings">${years.map((y,i)=>{const v=coverage[i],pct=numeric(v)?Math.max(0,Math.min(1,v))*100:0;return `<button class="coverage-ring-item" data-detail="24" aria-label="NPL coverage in ${y}: ${format(v,'percent')}"><span class="coverage-ring" style="--coverage:${pct}%"><strong>${format(v,'percent',1)}</strong></span><span>${y}${i===0?' · SP':''}</span></button>`;}).join('')}</div><p class="summary-caption">Full-horizon evolution · ${scenarioLabel()}</p></section>
    <section class="panel migration-summary"><div class="panel-header"><div><h2>From Stage 2 to default</h2><p>S2 → S3 transition rate</p></div><button class="icon-btn" data-detail="28" aria-label="Stage 2 to Stage 3 transition details">${icon('arrow',15)}</button></div><div class="migration-years">${years.map((y,i)=>`<div><span>${y}${i===0?' · SP':''}</span><strong>${format(migration[i],'percent',1)}</strong><span class="migration-track"><i style="width:${numeric(migration[i])?migration[i]/max*100:0}%"></i></span></div>`).join('')}</div><p class="summary-caption">Common relative scale across all four years</p></section>
  </div>`;
}
function overview() {
  return `${kpis()}${overviewHighlights()}<div class="grid grid-main">${chartPanel(70,{title:'NPL ratio trajectory',subtitle:'NPL / total exposure · 2025–2028'})}${stageComposition()}</div><div class="grid grid-two">${chartPanel(16,{title:'Provision stock evolution',small:true})}${chartPanel(73,{title:'Annual P&L impact',subtitle:'P&L · Excel units · 2025–2028',bars:true,small:true})}</div>${metricTable([11,15,16,24,70,73],'Scenario indicators')}${note('The full horizon stays visible in every chart. Switch between <strong>Baseline</strong> and <strong>Adverse</strong> to review each scenario separately. <strong>SP</strong> is the 2025 starting point; annual flows and P&L begin in 2026.')}`;
}

function credit() {
 return `${kpis()}<div class="grid grid-two">${chartPanel(70,{subtitle:'Stage 3 / total exposure · %'})}${chartPanel(69,{subtitle:'Stage 2 / performing exposure · %'})}</div><div class="grid grid-main">${chartPanel(11)}${stageComposition()}</div>${metricTable([11,12,13,14,15,69,70],'Exposure and portfolio quality')}${note('The Stage 2 ratio uses <strong>performing</strong> exposure as its denominator. Portfolio allocation bars use each year’s <strong>total</strong> exposure; these are different percentages.')}`;
}

function coveragePanel() {
 const series=[22,23,24].map((r,i)=>({name:`Stage ${i+1}`,color:colors.stages[i],values:values(r),sources:sources(r).map(c=>`'${DATA.engines[state.model].sheet}'!${c}`),dashed:i===1}));
 return `<section class="panel"><div class="panel-header"><div><h2>Coverage by stage</h2><p>${state.model} · ${scenarioLabel()} · 2025–2028 · %</p></div></div>${graph(series,'percent',{title:'Coverage by stage'})}</section>`;
}

function provisions() {
 return `<div class="grid grid-two">${chartPanel(16)}${chartPanel(24)}</div><div class="grid grid-two">${stageComposition(true)}${coveragePanel()}</div>${metricTable([16,17,18,19,20,21,22,23,24],'Provisions and coverage ratios')}`;
}

function matrix() {
 const rows=[25,26,27,28,29,30],labels=['S1 → S2','S2 → S1','S1 → S3','S2 → S3','S3 → S1','S3 → S2'];
 const max=Math.max(.01,...rows.flatMap(r=>values(r)).filter(numeric));
 return `<section class="panel"><div class="panel-header"><div><h2>Transition rates over the horizon</h2><p>${scenarioLabel()} · relative intensity on a common scale</p></div></div><div class="table-wrap horizon-table"><table class="transition-table"><thead><tr><th>Transition</th>${years.map(y=>`<th class="num">${y}</th>`).join('')}</tr></thead><tbody>${rows.map((r,j)=>`<tr><td><button class="metric-link" data-detail="${r}">${labels[j]}</button></td>${years.map((year,i)=>{const v=values(r)[i];return `<td class="num heat-cell" style="background:rgba(59,201,205,${numeric(v)?(.04+Math.abs(v)/max*.18):0})" title="${esc(source(r,state.model,state.scenario,i))}">${format(v,'percent')}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div></section>`;
}

function flowBars() {
 const rows=[32,33,35,36,38,39,64],labels=['S1 → S2','S2 → S1','S1 → S3','S2 → S3','S3 → S1','S3 → S2','Write-offs'];
 const max=Math.max(1,...rows.flatMap(r=>values(r)).filter(numeric).map(Math.abs));
 return `<section class="panel"><div class="panel-header"><div><h2>Flow volumes</h2><p>${scenarioLabel()} · Excel units · common scale</p></div></div><div class="table-wrap horizon-table"><table class="flow-timeline"><thead><tr><th>Flow</th>${years.map(y=>`<th class="num">${y}</th>`).join('')}</tr></thead><tbody>${rows.map((r,j)=>`<tr><td><button class="metric-link" data-detail="${r}">${labels[j]}</button></td>${years.map((year,i)=>{const v=values(r)[i];return `<td class="num" title="${esc(source(r,state.model,state.scenario,i))}"><span class="flow-number">${format(v,'amount',0)}</span><span class="flow-trend"><span style="width:${numeric(v)?Math.abs(v)/max*100:0}%;background:${colors[state.scenario]}"></span></span></td>`;}).join('')}</tr>`).join('')}</tbody></table></div></section>`;
}

function flows() {
 return `<div class="grid grid-two">${chartPanel(34,{small:true})}${chartPanel(37,{small:true})}</div><div class="grid grid-two">${matrix()}${flowBars()}</div>${metricTable([9,10,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,64,65,66,67,71],'Transitions, flows and write-offs')}${note('The axis retains all four years. Projected annual flows begin in <strong>2026</strong>; dashes in 2025 indicate missing data, not zero values. Only transitions reported in the workbook are shown.')}`;
}

function results() {
 const sc=state.scenario;
 const series=[{name:scenarioLabel(),color:colors[sc],values:cumulative(),sources:years.map((y,i)=>i===0?'Start of cumulative series (0)':`Sum of '${DATA.engines[state.model].sheet}'!${sc==='baseline'?'F':'K'}73:${sources(73)[i]}`)}];
 return `<div class="section-intro"><h2>Credit risk impact</h2><span>${scenarioLabel()} · 2025–2028 · original accounting sign</span></div><div class="kpi-grid">${kpi(73,'Annual P&L','Excel units',true)}${kpi(73,'Cumulative P&L','Sum since 2026 · Excel units',false,{values:cumulative().map((v,i)=>i?v:null)})}${kpi(16,'Provision stock','Excel units')}${kpi(67,'Net write-offs','Excel units')}</div><div class="grid grid-two">${chartPanel(73,{bars:true,subtitle:'Annual impact · Excel units'})}<section class="panel"><div class="panel-header"><div><h2>Cumulative P&L since 2026</h2><p>${scenarioLabel()} · sum of row 73 · Excel units</p></div></div>${graph(series,'amount',{title:'Cumulative P&L'})}</section></div>${note('<strong>Negative = expense / loss.</strong> Annual P&L uses the saved values in row 73. No additional one-off adjustment is added. The source workbook does not report separate one-off or capital adjustment rows.')}<div class="grid grid-two"><section class="panel"><div class="panel-header"><h2>How annual P&L is calculated</h2></div><div class="reading-list"><p class="reading-item"><strong>EBA</strong><br>Negative change in the provision stock: −(closing provisions − opening provisions).</p><p class="reading-item"><strong>ICAAP</strong><br>Negative sum of the provision stock change and net write-offs, as recorded in the workbook.</p></div></section><section class="panel"><div class="panel-header"><h2>How cumulative P&L is calculated</h2></div><div class="reading-list"><p class="reading-item">Each point sums annual impacts <strong>from 2026 through that year</strong>. All points are shown together. Stocks and percentages are not accumulated.</p><p class="reading-item">The cumulative series is a <strong>derived sum of row 73</strong> for both models. The current workbook does not contain a separate cumulative total row.</p></div></section></div>${metricTable([46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,73],'Impairment flows and their impact')}`;
}

function comparison() {
 const rows=[11,14,15,16,24,69,70,73];
 const comparisonRows=(label,unit,eba,icaap,row=null)=>{
   const series=[{name:'EBA',vals:eba},{name:'ICAAP',vals:icaap},{name:'Difference',vals:eba.map((a,i)=>numeric(a)&&numeric(icaap[i])?(a-icaap[i])*(unit==='percent'?100:1):null)}];
   return series.map((s,j)=>`<tr>${j===0?`<td class="metric-name" rowspan="3">${row?`<button class="metric-link" data-detail="${row}">${esc(label)}${icon('arrow',13)}</button>`:esc(label)}${row?'':'<span class="table-source">Derived sum of annual impacts</span>'}</td>`:''}<td class="comparison-series">${s.name}</td>${s.vals.map(v=>`<td class="num ${j===0?'accent':''}">${j===2?(numeric(v)?signed(v,2)+(unit==='percent'?' pp':' units'):'—'):format(v,unit)}</td>`).join('')}</tr>`).join('');
 };
 const table=`<section class="panel"><div class="table-heading"><div><h2>Full-horizon comparison</h2><p>${scenarioLabel()} · Mortgages · 2025–2028</p></div><span class="row-chip">EBA − ICAAP</span></div><div class="table-wrap"><table class="comparison-table"><thead><tr><th>Indicator</th><th>Series</th>${years.map(y=>`<th class="num">${y}${y===2025?' · SP':''}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>comparisonRows(metric(r).label,metric(r).unit,values(r,'EBA'),values(r,'ICAAP'),r)).join('')}${comparisonRows('Cumulative P&L since 2026','amount',cumulative('EBA').map((v,i)=>i?v:null),cumulative('ICAAP').map((v,i)=>i?v:null))}</tbody></table></div></section>`;
 return `<div class="comparison-banner"><span class="compare-icon">${icon('comparison',23)}</span><div><h2>One scenario. Different balance sheet paths.</h2><p>For the mortgage results, EBA keeps total exposure constant. ICAAP reflects the model’s balance sheet changes. All four years are compared together under the ${scenarioLabel().toLowerCase()} scenario.</p></div></div><div class="grid grid-two">${chartPanel(70,{compare:true})}${chartPanel(16,{compare:true})}${chartPanel(11,{compare:true,small:true})}${chartPanel(73,{compare:true,bars:true,subtitle:'Annual impact · Excel units',small:true})}</div>${table}${note('Differences are shown as <strong>EBA minus ICAAP</strong>: in percentage points (pp) for ratios and Excel units for amounts. Each column compares the same year, scenario and portfolio.')}`;
}

function filteredMetrics() {
 const q=normalize(state.query);
 return METRICS.filter(m=>(state.category==='all'||m.category===state.category)&&(!q||normalize([m.label,m.originalLabel,m.category,m.row].join(' ')).includes(q)));
}

function rawRecords() {
 const sheet=DATA.rawSheets.find(s=>s.name===state.sheet),q=normalize(state.query);
 return (sheet?.cells||[]).filter(c=>!q||normalize([c.address,c.value,sourceText(c.value),c.formula].join(' ')).includes(q));
}

function rawTable() {
  const records=rawRecords(),size=45,pages=Math.max(1,Math.ceil(records.length/size));state.page=Math.min(state.page,pages-1);
 const slice=records.slice(state.page*size,(state.page+1)*size);
 return `<section class="panel"><div class="table-heading"><div><h2>${esc(state.sheet)}</h2><p>Original values and formulas · not recalculated</p></div><span class="row-chip">${records.length} cells</span></div><div class="table-wrap"><table class="raw-table"><thead><tr><th>Cell</th><th>Saved value</th><th>Original formula</th><th>Excel format</th></tr></thead><tbody>${slice.map(c=>`<tr><td><span class="row-chip">${esc(c.address)}</span></td><td class="raw-value">${numeric(c.value)?format(c.value,c.numberFormat?.includes('%')?'percent':'amount',c.numberFormat?.includes('%')?4:6):esc(sourceText(c.value??'—'))}</td><td class="formula">${esc(c.formula||'—')}</td><td class="formula">${esc(c.numberFormat)}</td></tr>`).join('')||'<tr><td colspan="4" class="empty-state">No cells match your search.</td></tr>'}</tbody></table></div><div class="table-foot"><span>${records.length?state.page*size+1:0}–${Math.min((state.page+1)*size,records.length)} of ${records.length} cells</span><div class="pager"><button class="icon-btn" data-page="${state.page-1}" ${state.page===0?'disabled':''} aria-label="Previous page">←</button><span>${state.page+1} / ${pages}</span><button class="icon-btn" data-page="${state.page+1}" ${state.page>=pages-1?'disabled':''} aria-label="Next page">→</button></div></div></section>`;
}

function dataView() {
 const cats=[...new Set(METRICS.map(m=>m.category))];
 return `<div class="tabbar" role="tablist" aria-label="Data view"><button role="tab" data-data-tab="metrics" class="${state.dataTab==='metrics'?'active':''}" aria-selected="${state.dataTab==='metrics'}">Report metrics</button><button role="tab" data-data-tab="raw" class="${state.dataTab==='raw'?'active':''}" aria-selected="${state.dataTab==='raw'}">Original workbook · 4 sheets</button></div><div class="data-toolbar"><div class="input-wrap">${icon('search')}<input id="data-search" type="search" value="${esc(state.query)}" placeholder="${state.dataTab==='raw'?'Search cells, values or formulas…':'Filter metrics…'}" aria-label="Filter data"></div>${state.dataTab==='metrics'?`<select id="category-filter" aria-label="Metric category"><option value="all">All categories</option>${cats.map(c=>`<option ${state.category===c?'selected':''} value="${esc(c)}">${esc(c)}</option>`).join('')}</select>`:`<select id="sheet-filter" aria-label="Workbook sheet">${DATA.rawSheets.map(s=>`<option ${state.sheet===s.name?'selected':''} value="${esc(s.name)}">${esc(s.name)}</option>`).join('')}</select>`}<span class="data-count" id="data-count">${state.dataTab==='metrics'?filteredMetrics().length+' metrics':rawRecords().length+' cells'}</span></div><div id="data-table">${state.dataTab==='metrics'?metricTable(filteredMetrics().map(m=>m.row),'Full model series',{extra:true}):rawTable()}</div>${note(state.dataTab==='metrics'?'The 2029 column retains available forward-looking parameters, <strong>not a full set of projected results</strong>. Dashes preserve empty workbook cells. Additional EBA fields are not available in ICAAP.':'All <strong>four sheets and their populated cells</strong> are included. Database contains the portfolio inputs present in this workbook. Instructions provides workbook documentation; its examples do not represent the portfolio used for the results. Workbook text is translated for display; raw exports retain the original cell values.')}<section class="panel"><div class="panel-header"><h2>Source and scope</h2></div><div class="reading-list"><p class="reading-item"><strong>${esc(DATA.meta.sourceFile)}</strong><br>${esc(sourceSummary)}. The workbook does not specify a version date. Saved results for <strong>Mortgages</strong>.</p><p class="reading-item">${DATA.checks.populatedCells} populated cells · ${DATA.checks.formulaCount} formulas with saved values. <strong>No formula errors detected</strong> during extraction. This HTML is a snapshot of the file; it does not recalculate or sync automatically.</p><p class="reading-item">Currency and monetary scale are not specified in the source. Amounts use <strong>Excel units</strong>. Comparisons, allocation percentages and cumulative sums are derived exclusively from the saved data.</p></div></section>`;
}

function renderDataTable() {
 $('#data-table').innerHTML=state.dataTab==='metrics'?metricTable(filteredMetrics().map(m=>m.row),'Full model series',{extra:true}):rawTable();
 $('#data-count').textContent=state.dataTab==='metrics'?filteredMetrics().length+' metrics':rawRecords().length+' cells';
 const p=$('.raw-table')?.closest('.panel')?.querySelector('.table-heading p');if(p)p.textContent='Original values and formulas · not recalculated';
}

function renderInsights() {
 const block=(name,ico,vals,unit,caption)=>`<div class="insight-item"><span class="insight-icon">${icon(ico)}</span><div><strong>${name}</strong><div class="rail-series">${years.map((year,i)=>`<div><span>${year}</span><b>${format(vals[i],unit,unit==='percent'?2:0)}</b></div>`).join('')}</div><p>${caption}</p></div></div>`;
 $('#insights').innerHTML=`<div class="rail-top"><div class="rail-title">Scenario insights ${icon('info',15)}</div><span class="context-pill"><span class="status-dot"></span>${state.model} · ${scenarioLabel()} · 2025–2028</span></div><div class="insight-block"><div class="rail-label">FULL-HORIZON EVOLUTION</div>${block('NPL ratio','credit',values(70),'percent','NPL / total exposure.')}${block('Provision stock','layers',values(16),'amount','Excel units.')}${block('Cumulative P&L','results',cumulative().map((v,i)=>i?v:null),'amount','Sum since 2026 · Excel units.')}</div><div class="rail-divider"></div><div class="insight-block"><div class="rail-label">REPORTING HORIZON</div><div class="horizon-static">${years.map(y=>`<span>${y}</span>`).join('')}</div><p class="rail-caption">2025 is the starting point.<br>2026–2028 are the projection years.<br>All years remain visible.</p><div class="rail-workbook"><div class="book-icon">${icon('book',20)}</div><strong>${esc(DATA.meta.sourceFile)}</strong><p>Saved portfolio: Mortgages<br>${esc(sourceSummary)}</p><button class="source-link" data-view="data">View source data ${icon('arrow',11)}</button></div></div><div class="rail-end"><div class="rail-divider"></div><div class="rail-label">READING GUIDE</div><p class="rail-caption">Amounts in Excel units.<br>Ratios in %. Differences in pp.<br>“—” means data is unavailable.</p></div>`;
}

function render() {
 const v=views.find(v=>v.id===state.view)||views[0];state.view=v.id;
 $('#breadcrumb').textContent=v.label;$('#page-title').innerHTML=esc(v.title)+'<span>.</span>';$('#page-subtitle').textContent=v.subtitle;
 $$('#navigation a').forEach(a=>{a.classList.toggle('active',a.dataset.view===state.view);if(a.dataset.view===state.view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 $$('[data-model]').forEach(b=>{b.classList.toggle('active',b.dataset.model===state.model);b.setAttribute('aria-pressed',String(b.dataset.model===state.model));});
 $('#scenario-select').value=state.scenario;
 chartId=0;
 $('#view').innerHTML=({overview,credit,provisions,flows,results,comparison,data:dataView})[state.view]();
 if(state.view==='data')renderDataTable();
 $('.source-card strong').textContent='IFRS9 & Stress Test';
 $('.source-card > span:not(.eyebrow)').textContent='Updated dataset';
 $('.report-footer > span').firstChild.textContent=DATA.meta.sourceFile+' ';
 $('#view').getAnimations().forEach(a=>a.cancel());
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)$('#view').animate([{opacity:.55,transform:'translateY(3px)'},{opacity:1,transform:'none'}],{duration:180});
 $('#footer-context').textContent=`${state.view==='comparison'?'EBA and ICAAP':state.model} · ${scenarioLabel()} · Horizon 2025–2028 · Mortgages`;
 const next=views[(views.indexOf(v)+1)%views.length];$('#next-section').textContent=next.label+' →';$('#next-section').dataset.view=next.id;
 $('#model-switch').setAttribute('aria-label',state.view==='comparison'?'Model for metric details. Charts compare both models.':'Report model');
  $('#model-switch').previousElementSibling.textContent=state.view==='comparison'?'Details':'Model';
 renderInsights();syncURL();hideTooltip();
}

function syncURL() {
 const hash=`#${state.view}?modelo=${state.model}&escenario=${state.scenario}`;
 try {history.replaceState(null,'',hash);}catch(_){/* file protocols can restrict history */}
}
function readURL() {
 const [view,params]=location.hash.slice(1).split('?'),p=new URLSearchParams(params);
 if(views.some(v=>v.id===view))state.view=view;
 if(['EBA','ICAAP'].includes(p.get('modelo')))state.model=p.get('modelo');
 if(['baseline','adverse'].includes(p.get('escenario')))state.scenario=p.get('escenario');
}
function navigate(view) {
 if(!views.some(v=>v.id===view))return;
 state.view=view;render();setSidebar(false);$('#main').focus({preventScroll:true});
 window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}

function showDetail(row) {
 const m=metric(row);if(!m)return;
 const notes={69:'Stage 2 exposure divided by performing exposure. This differs from the Stage 2 share of total exposure.',70:'Stage 3 (NPL) exposure divided by total exposure.',73:'Annual P&L impact saved in row 73. Negative values indicate an expense / loss. No additional adjustment is added by the report.',77:'The 2026–2028 total saved in the EBA sheet. No equivalent saved value exists in the ICAAP sheet.',75:'IFRS 9 transition adjustment affecting opening capital. It is separate from annual P&L.'};
 const sheet=DATA.rawSheets.find(s=>s.name===DATA.engines[state.model].sheet);
 const sourceRows=[state.scenario].flatMap(sc=>DATA.engines[state.model].scenarios[sc].sources[String(row)]?.map((address,i)=>({sc,address,year:DATA.periods[i],cell:sheet.cells.find(c=>c.address===address)}))||[]).filter(x=>x.cell&&(x.year!==2029||m.unit==='text'||numeric(x.cell.value)));
 $('#detail-content').innerHTML=`<div class="eyebrow">${state.model} · ${esc(m.category)} · ROW ${row}</div><h2>${esc(m.label)}</h2><p class="detail-description">${esc(notes[row]||m.description||sourceText(m.originalLabel))}</p>${m.unit!=='text'?chartPanel(row,{title:'Scenario evolution '+scenarioLabel()}):''}<div class="detail-sources"><strong>Source:</strong> ${esc(DATA.engines[state.model].sheet)}<br><strong>Source label:</strong> ${esc(sourceText(m.originalLabel))}<br><strong>Unit:</strong> ${unitLabel(m.unit)}</div><details open><summary>Original cells, values and formulas</summary><div class="table-wrap" style="margin-top:12px"><table><thead><tr><th>Cell</th><th>Scenario / year</th><th class="num">Value</th><th>Formula</th></tr></thead><tbody>${sourceRows.map(x=>`<tr><td>${x.address}</td><td>${x.sc==='baseline'?'Baseline':'Adverse'} · ${x.year}</td><td class="num">${format(x.cell.value,m.unit,m.unit==='percent'?4:6)}</td><td class="formula">${esc(x.cell.formula||'Input value')}</td></tr>`).join('')||'<tr><td colspan="4">No saved values are available for this metric in this model.</td></tr>'}</tbody></table></div></details>`;
 if(!$('#detail-dialog').open)$('#detail-dialog').showModal();
}

function searchResults() {
 const q=normalize($('#global-search').value.trim());
 const vs=views.filter(v=>!q||normalize(v.label+' '+v.title).includes(q));
 const ms=METRICS.filter(m=>!q||normalize([m.label,m.originalLabel,m.category,m.row].join(' ')).includes(q)).slice(0,q?18:5);
 $('#search-results').innerHTML=vs.map(v=>`<button class="search-result" data-search-view="${v.id}">${icon(v.id,17)}<div><span>${v.label}</span><small>Report section</small></div>${icon('chevron',14)}</button>`).join('')+ms.map(m=>`<button class="search-result" data-search-detail="${m.row}">${icon('results',17)}<div><span>${esc(m.label)}</span><small>${esc(sourceText(m.originalLabel))}</small></div><span class="row-chip">Row ${m.row}</span></button>`).join('')||'<div class="empty-state">No results found.</div>';
}
function openSearch() {$('#search-dialog').showModal();$('#global-search').value='';searchResults();$('#global-search').focus();}

function csvValue(v) {
 let s=v==null?'':String(v);
 if(typeof v==='string'&&/^[=+\-@\t\r]/.test(s))s="'"+s;
 return '"'+s.replaceAll('"','""')+'"';
}
function exportCSV() {
 let rows,filename;
 if(state.view==='data'&&state.dataTab==='raw') {
   rows=[['Sheet','Cell','Saved value','Original formula','Format'],...rawRecords().map(c=>[state.sheet,c.address,c.value,c.formula,c.numberFormat])];filename='cells-'+state.sheet;
 } else if(state.view==='comparison') {
   rows=[['Model','Scenario','Year','Metric','Unit','Value','Source'],...['EBA','ICAAP'].flatMap(model=>METRICS.flatMap(m=>years.map((y,i)=>[model,scenarioLabel(),y,m.label,m.unit,value(m.row,model,state.scenario,i),source(m.row,model,state.scenario,i)])))];filename='comparison-EBA-ICAAP';
 } else {
   const ms=state.view==='data'?filteredMetrics():METRICS;
   rows=[['Model','Scenario','Year','Metric','Unit','Value','Source'],...ms.flatMap(m=>[state.scenario].flatMap(sc=>DATA.periods.map((y,i)=>[state.model,sc==='baseline'?'Baseline':'Adverse',y,m.label,m.unit,DATA.engines[state.model].scenarios[sc].rows[String(m.row)]?.[i]??null,`'${DATA.engines[state.model].sheet}'!${DATA.engines[state.model].scenarios[sc].sources[String(m.row)]?.[i]||''}`])))];filename='stress-test-'+state.model+'-'+scenarioLabel();
 }
 const csv='\ufeff'+rows.map(r=>r.map(csvValue).join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
 const a=document.createElement('a');a.href=url;a.download=filename.replace(/[^a-zA-Z0-9-]/g,'_')+'.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 toast('CSV exported · original unrounded values');
}
let toastTimer;
function toast(message) {$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3200);}
function hideTooltip() {$('#tooltip').hidden=true;}
function showTooltip(target,x,y) {
 const [label,val,src]=(target.dataset.tooltip||'').split('|');
  const tooltipParent=target.closest('dialog')||document.body;
  if($('#tooltip').parentElement!==tooltipParent)tooltipParent.append($('#tooltip'));
 $('#tooltip').innerHTML=`${esc(label)}<strong>${esc(val)}</strong><small>${esc(src)}</small>`;$('#tooltip').hidden=false;
 const b=$('#tooltip').getBoundingClientRect();$('#tooltip').style.left=Math.max(8,Math.min(innerWidth-b.width-8,x+12))+'px';$('#tooltip').style.top=Math.max(8,Math.min(innerHeight-b.height-8,y-b.height-12))+'px';
}

$('#navigation').innerHTML=views.map((v,i)=>`${i===5?'<div class="nav-divider"></div><div class="nav-label">ANALYSIS & SOURCES</div>':''}<a href="#${v.id}" data-view="${v.id}"><span class="nav-icon">${icon(v.id)}</span><span>${v.label}</span></a>`).join('');
$('#home-icon').innerHTML=icon('home',17);$('#search-icon').innerHTML=icon('search',15);$('#modal-search-icon').innerHTML=icon('search',20);$('#menu-button').innerHTML=icon('menu',18);$('#print-button').innerHTML=icon('print',18);$('#export-button').innerHTML=icon('download',14)+'<span>Export CSV</span>';

document.addEventListener('click',e=>{
 const b=e.target.closest('button,a');if(!b)return;
 if(b.dataset.view){e.preventDefault();navigate(b.dataset.view);}
 if(b.dataset.model){state.model=b.dataset.model;if(state.dataTab==='raw'&&state.sheet.startsWith('ST Engine'))state.sheet=DATA.engines[state.model].sheet;render();}
 if(b.dataset.detail)showDetail(Number(b.dataset.detail));
 if(b.dataset.close)$('#'+b.dataset.close).close();
 if(b.dataset.dataTab){state.dataTab=b.dataset.dataTab;state.query='';state.page=0;render();}
 if(b.dataset.page!==undefined){state.page=Number(b.dataset.page);renderDataTable();$('#data-table').scrollIntoView({behavior:'smooth',block:'start'});}
 if(b.dataset.searchView){$('#search-dialog').close();navigate(b.dataset.searchView);}
 if(b.dataset.searchDetail){$('#search-dialog').close();showDetail(Number(b.dataset.searchDetail));}
});
document.addEventListener('change',e=>{
 if(e.target.id==='scenario-select'){state.scenario=e.target.value;render();}
 if(e.target.id==='category-filter'){state.category=e.target.value;renderDataTable();}
 if(e.target.id==='sheet-filter'){state.sheet=e.target.value;state.page=0;renderDataTable();}
});
document.addEventListener('input',e=>{
 if(e.target.id==='data-search'){state.query=e.target.value;state.page=0;renderDataTable();}
 if(e.target.id==='global-search')searchResults();
});
$('#search-button').addEventListener('click',openSearch);
$('#print-button').addEventListener('click',()=>window.print());
$('#export-button').addEventListener('click',exportCSV);
function setSidebar(open,restoreFocus=false) {
 $('#sidebar').classList.toggle('open',open);
 $('#menu-button').setAttribute('aria-expanded',String(open));
 $('#sidebar-scrim').hidden=!open;
 document.body.classList.toggle('navigation-open',open);
 $('#main').closest('.app-shell').inert=open;
 if(open)$('#sidebar-close').focus();
 else if(restoreFocus)$('#menu-button').focus();
}
$('#menu-button').addEventListener('click',()=>setSidebar(!$('#sidebar').classList.contains('open'),true));
$('#sidebar-close').addEventListener('click',()=>setSidebar(false,true));
$('#sidebar-scrim').addEventListener('click',()=>setSidebar(false,true));
window.addEventListener('resize',()=>{if(innerWidth>800)setSidebar(false);});
document.addEventListener('keydown',e=>{
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(!$('#detail-dialog').open&&!$('#search-dialog').open)openSearch();}
 if(e.key==='Escape'){if($('#sidebar').classList.contains('open'))setSidebar(false,true);hideTooltip();}
 if(e.key==='Tab'&&$('#sidebar').classList.contains('open')){const items=$$('#sidebar a,#sidebar button'),first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
 if(e.target.id==='global-search'&&e.key==='ArrowDown'){e.preventDefault();$('#search-results button')?.focus();}
 if(e.target.closest('#search-results')&&['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();const items=$$('#search-results button'),at=items.indexOf(e.target.closest('button'));items[(at+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();}
});
document.addEventListener('pointerover',e=>{const t=e.target.closest('[data-tooltip]');if(t)showTooltip(t,e.clientX,e.clientY);});
document.addEventListener('pointerout',e=>{if(e.target.closest('[data-tooltip]'))hideTooltip();});
document.addEventListener('focusin',e=>{const t=e.target.closest('[data-tooltip]');if(t){const r=t.getBoundingClientRect();showTooltip(t,r.x+r.width/2,r.y);} });
document.addEventListener('focusout',hideTooltip);
document.addEventListener('scroll',hideTooltip,{passive:true,capture:true});
$$('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});d.addEventListener('close',hideTooltip);});
window.addEventListener('hashchange',()=>{readURL();render();});
readURL();render();
})();
