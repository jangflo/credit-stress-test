'use strict';
(() => {
const DATA = JSON.parse(document.getElementById('report-data').textContent);
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const numeric = v => typeof v === 'number' && Number.isFinite(v);
const format = (v, unit = 'amount', digits) => {
  if (!numeric(v)) return v == null || v === '' ? '—' : esc(v);
  const d = digits ?? (unit === 'percent' ? 2 : 1);
  return new Intl.NumberFormat('es-ES', {minimumFractionDigits:d,maximumFractionDigits:d,useGrouping:true}).format(unit === 'percent' ? v * 100 : v) + (unit === 'percent' ? ' %' : '');
};
const signed = (v, d = 2) => numeric(v) ? (v > 0 ? '+' : '') + format(v,'amount',d) : '—';
const compact = v => Math.abs(v) >= 10000 ? format(v / 1000,'amount',1) + ' mil' : format(v,'amount',Math.abs(v) < 10 && v !== 0 ? 1 : 0);
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
  {id:'overview',label:'Visión general',title:'Riesgo bajo estrés',subtitle:'Una visión integrada de la calidad crediticia y su impacto financiero.'},
  {id:'credit',label:'Calidad crediticia',title:'La evolución del crédito',subtitle:'Exposición, morosidad y distribución de la cartera por stages.'},
  {id:'provisions',label:'Provisiones y cobertura',title:'La cobertura del riesgo',subtitle:'Stock de provisiones y cobertura de las exposiciones crediticias.'},
  {id:'flows',label:'Flujos y transiciones',title:'Cómo se mueve la cartera',subtitle:'Entradas, salidas y transiciones entre stages del modelo IFRS 9.'},
  {id:'results',label:'Impacto en resultados',title:'El coste del escenario',subtitle:'Impacto anual y acumulado de las provisiones en la cuenta de resultados.'},
  {id:'comparison',label:'EBA vs. ICAAP',title:'Dos modelos, una cartera',subtitle:'Comparación de los resultados guardados bajo un mismo escenario.'},
  {id:'data',label:'Explorador de datos',title:'Detrás de cada cifra',subtitle:'Todas las métricas, parámetros y celdas originales del libro.'},
];
const state = {view:'overview',model:'EBA',scenario:'adverse',dataTab:'metrics',query:'',category:'all',sheet:'ST Engine (EBA)',page:0};
const colors = {baseline:'#1582e8',adverse:'#076dcc',EBA:'#087be6',ICAAP:'#137f72',stages:['#087be6','#c77b13','#d14e60']};
const years = DATA.meta.resultsYears;
const metric = r => DATA.metrics.find(m => m.row === Number(r));
const values = (r,model=state.model,scenario=state.scenario) => (DATA.engines[model].scenarios[scenario].rows[String(r)] || []).slice(0,4);
const value = (r,model,scenario,i) => values(r,model,scenario)[i] ?? null;
const sources = (r,model=state.model,scenario=state.scenario) => (DATA.engines[model].scenarios[scenario].sources[String(r)] || []).slice(0,4);
const source = (r,model,scenario,i) => `'${DATA.engines[model].sheet}'!${sources(r,model,scenario)[i] || '—'}`;
const scenarioLabel = () => state.scenario === 'adverse' ? 'Adverso' : 'Base';
const unitLabel = unit => unit === 'percent' ? '%' : unit === 'text' ? 'Estado del Excel' : 'Unidades del Excel';
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
  return `<details class="chart-data"><summary>Ver cifras y fuentes</summary><div class="table-wrap"><table><thead><tr><th>Serie</th>${chartYears.map(y=>`<th class="num">${y}</th>`).join('')}</tr></thead><tbody>${series.map(s=>`<tr><td>${esc(s.name)}</td>${s.values.map((v,i)=>`<td class="num" title="${esc(s.sources?.[i]||'Cálculo derivado')}">${format(v,unit)}<span class="table-source">${esc(s.sources?.[i]?.split('!').pop() || 'Derivado')}</span></td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
}

function graph(series, unit='amount', opts={}) {
  const id=++chartId, W=600,H=opts.small?225:275,L=57,R=25,T=22,B=37;
  const ys=opts.years||years;
  const mult=unit==='percent'?100:1;
  const all=series.flatMap(s=>s.values).filter(numeric).map(v=>v*mult);
  if(!all.length) return '<div class="empty-state">No hay datos guardados para esta serie.</div>';
  const rawMin=Math.min(0,...all),rawMax=Math.max(0,...all);
  const span=(rawMax-rawMin)||1;
  const stepRaw=span/4, magnitude=10**Math.floor(Math.log10(stepRaw));
  const step=[1,2,2.5,5,10].map(x=>x*magnitude).find(x=>x>=stepRaw)||magnitude*10;
  let min=Math.floor(rawMin/step)*step,max=Math.ceil(rawMax/step)*step;
  if(min===max) max=min+1;
  const edgePadding=opts.bars?43:0;
  const px=i=>L+edgePadding+i*(W-L-R-2*edgePadding)/Math.max(1,ys.length-1),py=v=>T+(max-v*mult)/(max-min)*(H-T-B);
  const y0=py(0), ticks=[]; for(let n=min;n<=max+step*.01;n+=step) ticks.push(Math.abs(n)<step*.0001?0:n);
  const tickFmt=n=>unit==='percent'?format(n,'amount',step<1?1:0)+' %':compact(n);
  let svg=`<svg class="line-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.title||'Evolución')} · ${esc(unitLabel(unit))}"><defs>${series.map((s,j)=>`<linearGradient id="area-${id}-${j}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${s.color}" stop-opacity=".15"/><stop offset="100%" stop-color="${s.color}" stop-opacity="0"/></linearGradient>`).join('')}</defs>`;
  svg+=ticks.map(n=>`<line class="chart-grid" x1="${L}" y1="${py(n/mult)}" x2="${W-R}" y2="${py(n/mult)}"/><text class="chart-label" x="${L-11}" y="${py(n/mult)+4}" text-anchor="end">${tickFmt(n)}</text>`).join('');
  svg+=ys.map((y,i)=>`<text class="chart-label" x="${px(i)}" y="${H-11}" text-anchor="middle">${y}${y===2025?' · SP':''}</text>`).join('');
  series.forEach((s,j)=>{
    if(opts.bars){
      const bw=ys.length===3?32:23;
      s.values.forEach((v,i)=>{if(!numeric(v))return; const x=px(i)+(j-(series.length-1)/2)*(bw+5)-bw/2;
        const tooltip=`${s.name} · ${ys[i]}|${format(v,unit)}|${s.sources?.[i]||'Cálculo derivado'}`;
        svg+=`<rect x="${Math.max(L-3,Math.min(W-R-bw+3,x))}" y="${Math.min(py(v),y0)}" width="${bw}" height="${Math.max(2,Math.abs(py(v)-y0))}" rx="4" fill="${s.color}" opacity="${j===0?.68:.95}" tabindex="0" data-tooltip="${esc(tooltip)}" aria-label="${esc(tooltip.replaceAll('|',', '))}"/>`;
      });
    } else {
      const chunks=[];let chunk=[];
      s.values.forEach((v,i)=>{if(numeric(v))chunk.push([px(i),py(v)]);else if(chunk.length){chunks.push(chunk);chunk=[];}});if(chunk.length)chunks.push(chunk);
      chunks.forEach(points=>{
        const path=points.map((p,i)=>`${i?'L':'M'}${p[0]},${p[1]}`).join(' ');
        if(j===series.length-1&&points.length>1) svg+=`<path d="${path} L${points.at(-1)[0]},${y0} L${points[0][0]},${y0} Z" fill="url(#area-${id}-${j})"/>`;
        svg+=`<path d="${path}" fill="none" stroke="${s.color}" stroke-width="2.5" ${s.dashed?'stroke-dasharray="5 5"':''} stroke-linejoin="round" stroke-linecap="round"/>`;
      });
      s.values.forEach((v,i)=>{if(!numeric(v))return;const tip=`${s.name} · ${ys[i]}|${format(v,unit)}|${s.sources?.[i]||'Cálculo derivado'}`;
        svg+=`<circle class="chart-node" cx="${px(i)}" cy="${py(v)}" r="4" fill="#ffffff" stroke="${s.color}" tabindex="0" data-tooltip="${esc(tip)}" aria-label="${esc(tip.replaceAll('|',', '))}"/>`;
      });
    }
  });
  svg+='</svg>';
  return `<div class="chart-legend">${series.map(s=>`<span class="legend-item"><i class="legend-line ${s.dashed?'dashed':''}" style="border-color:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div><div class="chart-wrap">${svg}</div>${chartTable(series,unit,ys)}`;
}

function chartPanel(row,opts={}) {
  const m=metric(row), title=opts.title||m.label;
  const series=chartSeries(row,opts.compare);
  return `<section class="panel"><div class="panel-header"><div><h2>${esc(title)}</h2><p>${esc(opts.subtitle||`${unitLabel(m.unit)} · 2025–2028`)} · ${scenarioLabel()}</p></div><button class="icon-btn" data-detail="${row}" aria-label="Detalle de ${esc(m.label)}">${icon('arrow',15)}</button></div>${graph(series,m.unit,{...opts,title,years})}</section>`;
}

function kpi(row,label,note,primary=false,override=null) {
  const m=metric(row), series=override?.values||values(row);
  return `<button class="kpi ${primary?'primary':''}" data-detail="${row}" aria-label="${esc(label)} · 2025 a 2028. Ver detalle"><span class="kpi-label">${esc(label)}${icon('arrow',14)}</span><span class="kpi-years">${years.map((year,i)=>`<span class="kpi-year" data-year-value="${year}"><span>${year}${i===0?' · SP':''}</span><strong>${format(series[i],m.unit,m.unit==='percent'?2:0)}</strong></span>`).join('')}</span><span class="kpi-note">${note}</span></button>`;
}

function kpis() {
  return `<div class="section-intro"><h2>Evolución del escenario</h2><span>${state.model} · ${scenarioLabel()} · 2025–2028</span></div><div class="kpi-grid">${kpi(70,'Ratio de morosidad','NPL / exposición total',true)}${kpi(11,'Exposición total','Unidades del Excel')}${kpi(16,'Stock de provisiones','Unidades del Excel')}${kpi(73,'P&L acumulado','Suma desde 2026 · u. Excel',false,{values:cumulative().map((v,i)=>i?v:null)})}</div>`;
}

function stageComposition(provisions=false) {
  const rows=provisions?[18,19,20]:[13,14,15],totals=values(provisions?16:11);
  const series=rows.map((row,i)=>({name:`Stage ${i+1}${i===2?' · NPL':''}`,color:colors.stages[i],values:values(row),sources:sources(row).map(c=>`'${DATA.engines[state.model].sheet}'!${c}`)}));
  return `<section class="panel"><div class="panel-header"><div><h2>${provisions?'Provisiones por stage':'Composición de la cartera'}</h2><p>${scenarioLabel()} · distribución en cada año</p></div><span class="muted">${icon('layers',16)}</span></div><div class="chart-legend">${series.map((s,i)=>`<button class="legend-item" data-detail="${rows[i]}"><i class="legend-dot" style="background:${s.color}"></i>${s.name}</button>`).join('')}</div><div class="stage-timeline">${years.map((year,i)=>`<div class="stage-year" data-year-row="${year}"><div class="stage-year-label"><span>${year}${i===0?' · SP':''}</span><strong>${format(totals[i],'amount',0)} <small>u.</small></strong></div><div class="stage-stack" role="group" aria-label="Composición en ${year}">${series.map((s,j)=>{const v=s.values[i],share=numeric(v)&&numeric(totals[i])&&totals[i]>0?v/totals[i]:null;return numeric(share)?`<button data-detail="${rows[j]}" style="width:${share*100}%;background:${s.color}" data-tooltip="${esc(`${s.name} · ${year}|${format(v)} u.|${format(share,'percent')} del total · ${s.sources[i]}`)}" aria-label="${esc(`${s.name} en ${year}: ${format(v)} unidades, ${format(share,'percent')} del total`)}"></button>`:'';}).join('')}</div></div>`).join('')}<p class="rail-caption">Barras al 100 % de cada año. Totales en unidades del Excel.</p></div>${chartTable(series,'amount',years)}</section>`;
}

function metricTable(rows,title='Detalle de indicadores',opts={}) {
  const ms=rows.map(metric).filter(Boolean);
  return `<section class="panel"><div class="table-heading"><div><h2>${title}</h2><p>${state.model} · ${scenarioLabel()} · pulsa una métrica para consultar su origen</p></div><span class="row-chip">${ms.length} métricas</span></div><div class="table-wrap"><table><thead><tr><th>Indicador</th>${years.map(y=>`<th class="num">${y}${y===2025?' · SP':''}</th>`).join('')}${opts.extra?'<th class="num">2029 · Parámetro</th>':''}<th>Unidad</th></tr></thead><tbody>${ms.map(m=>`<tr><td class="metric-name"><button class="metric-link" data-detail="${m.row}">${esc(m.label)}${icon('arrow',13)}</button></td>${years.map((y,i)=>`<td class="num " title="${esc(source(m.row,state.model,state.scenario,i))}">${format(value(m.row,state.model,state.scenario,i),m.unit)}</td>`).join('')}${opts.extra?`<td class="num">${format(DATA.engines[state.model].scenarios[state.scenario].rows[String(m.row)]?.[4],m.unit)}</td>`:''}<td>${m.unit==='percent'?'%':m.unit==='amount'?'u. Excel':'Estado'}</td></tr>`).join('')||'<tr><td colspan="7" class="empty-state">No hay métricas para este filtro.</td></tr>'}</tbody></table></div></section>`;
}

const note = text => `<div class="note">${icon('info',15)}<div>${text}</div></div>`;

function overview() {
  return `${kpis()}<div class="grid grid-main">${chartPanel(70,{title:'Trayectoria de la morosidad',subtitle:'NPL / exposición total · 2025–2028'})}${stageComposition()}</div><div class="grid grid-two">${chartPanel(16,{title:'Evolución de las provisiones',small:true})}${chartPanel(73,{title:'Impacto anual en resultados',subtitle:'P&L · unidades del Excel · 2025–2028',bars:true,small:true})}</div>${note('Todo el horizonte permanece visible en cada visual. Cambia entre <strong>Base</strong> y <strong>Adverso</strong> para consultar cada escenario por separado. <strong>SP</strong> es el punto de partida de 2025; los flujos y el P&L anual comienzan en 2026.')}`;
}

function credit() {
 return `${kpis()}<div class="grid grid-two">${chartPanel(70,{subtitle:'Stage 3 / exposición total · %'})}${chartPanel(69,{subtitle:'Stage 2 / exposición performing · %'})}</div><div class="grid grid-main">${chartPanel(11)}${stageComposition()}</div>${metricTable([11,12,13,14,15,69,70],'Exposición y calidad de la cartera')}${note('El ratio Stage 2 utiliza la exposición <strong>performing</strong> como denominador. Las barras de composición utilizan la exposición <strong>total</strong> de cada año; son porcentajes distintos.')}`;
}

function coveragePanel() {
 const series=[22,23,24].map((r,i)=>({name:`Stage ${i+1}`,color:colors.stages[i],values:values(r),sources:sources(r).map(c=>`'${DATA.engines[state.model].sheet}'!${c}`),dashed:i===1}));
 return `<section class="panel"><div class="panel-header"><div><h2>Cobertura por stage</h2><p>${state.model} · ${scenarioLabel()} · 2025–2028 · %</p></div></div>${graph(series,'percent',{title:'Cobertura por stage'})}</section>`;
}

function provisions() {
 return `<div class="grid grid-two">${chartPanel(16)}${chartPanel(24)}</div><div class="grid grid-two">${stageComposition(true)}${coveragePanel()}</div>${metricTable([16,17,18,19,20,21,22,23,24],'Provisiones y ratios de cobertura')}`;
}

function matrix() {
 const rows=[25,26,27,28,29,30],labels=['S1 → S2','S2 → S1','S1 → S3','S2 → S3','S3 → S1','S3 → S2'];
 const max=Math.max(.01,...rows.flatMap(r=>values(r)).filter(numeric));
 return `<section class="panel"><div class="panel-header"><div><h2>Tasas de transición en el horizonte</h2><p>${scenarioLabel()} · intensidad relativa en una escala común</p></div></div><div class="table-wrap horizon-table"><table class="transition-table"><thead><tr><th>Transición</th>${years.map(y=>`<th class="num">${y}</th>`).join('')}</tr></thead><tbody>${rows.map((r,j)=>`<tr><td><button class="metric-link" data-detail="${r}">${labels[j]}</button></td>${years.map((year,i)=>{const v=values(r)[i];return `<td class="num heat-cell" style="background:rgba(8,123,230,${numeric(v)?(.04+Math.abs(v)/max*.18):0})" title="${esc(source(r,state.model,state.scenario,i))}">${format(v,'percent')}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div></section>`;
}

function flowBars() {
 const rows=[32,33,35,36,38,39,64],labels=['S1 → S2','S2 → S1','S1 → S3','S2 → S3','S3 → S1','S3 → S2','Write-offs'];
 const max=Math.max(1,...rows.flatMap(r=>values(r)).filter(numeric).map(Math.abs));
 return `<section class="panel"><div class="panel-header"><div><h2>Volumen de los flujos</h2><p>${scenarioLabel()} · unidades del Excel · escala común</p></div></div><div class="table-wrap horizon-table"><table class="flow-timeline"><thead><tr><th>Flujo</th>${years.map(y=>`<th class="num">${y}</th>`).join('')}</tr></thead><tbody>${rows.map((r,j)=>`<tr><td><button class="metric-link" data-detail="${r}">${labels[j]}</button></td>${years.map((year,i)=>{const v=values(r)[i];return `<td class="num" title="${esc(source(r,state.model,state.scenario,i))}"><span class="flow-number">${format(v,'amount',0)}</span><span class="flow-trend"><span style="width:${numeric(v)?Math.abs(v)/max*100:0}%;background:${colors[state.scenario]}"></span></span></td>`;}).join('')}</tr>`).join('')}</tbody></table></div></section>`;
}

function flows() {
 return `<div class="grid grid-two">${chartPanel(34,{small:true})}${chartPanel(37,{small:true})}</div><div class="grid grid-two">${matrix()}${flowBars()}</div>${metricTable([9,10,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,64,65,66,67,71],'Transiciones, flujos y write-offs')}${note('El eje conserva los cuatro años. Los flujos anuales proyectados comienzan en <strong>2026</strong>; los guiones de 2025 indican ausencia de dato, no ceros. Solo se representan las transiciones reportadas en el Excel.')}`;
}

function results() {
 const sc=state.scenario;
 const series=[{name:scenarioLabel(),color:colors[sc],values:cumulative(),sources:years.map((y,i)=>i===0?'Inicio del acumulado (0)':`Suma de '${DATA.engines[state.model].sheet}'!${sc==='baseline'?'F':'K'}73:${sources(73)[i]}`)}];
 const cap=DATA.engines.EBA.scenarios[sc].rows['75']?.[0];
 return `<div class="section-intro"><h2>Impacto del riesgo de crédito</h2><span>${scenarioLabel()} · 2025–2028 · signo contable original</span></div><div class="kpi-grid">${kpi(73,'P&L anual','Unidades del Excel',true)}${kpi(73,'P&L acumulado','Suma desde 2026 · u. Excel',false,{values:cumulative().map((v,i)=>i?v:null)})}${kpi(16,'Stock de provisiones','Unidades del Excel')}${kpi(67,'Write-offs netos','Unidades del Excel')}</div><div class="grid grid-two">${chartPanel(73,{bars:true,subtitle:'Impacto anual · unidades del Excel'})}<section class="panel"><div class="panel-header"><div><h2>P&L acumulado desde 2026</h2><p>${scenarioLabel()} · suma de la fila 73 · unidades del Excel</p></div></div>${graph(series,'amount',{title:'P&L acumulado'})}</section></div>${note('<strong>Negativo = gasto / pérdida.</strong> En el escenario adverso, el one-off ya está incluido en el impacto de 2026. El one-off de transición a IFRS 9 afecta al capital y se mantiene fuera del P&L.')}<div class="grid grid-two"><section class="panel"><div class="panel-header"><h2>Lectura de los ajustes</h2></div><div class="reading-list"><p class="reading-item"><strong>One-off IFRS 9: ${format(cap)} u.</strong><br>Registrado en EBA, ${sc==='baseline'?'E75':'J75'}. Afecta al capital inicial; no se añade a los resultados anuales.</p>${sc==='adverse'?'<p class="reading-item"><strong>One-off adverso incluido en 2026</strong><br>La fila 76 de EBA documenta el ajuste que ya forma parte de K73. No se suma de nuevo.</p>':''}</div></section><section class="panel"><div class="panel-header"><h2>Cómo se obtiene el acumulado</h2></div><div class="reading-list"><p class="reading-item">Cada punto suma los impactos anuales <strong>desde 2026 hasta ese año</strong>. Se muestran todos los puntos juntos. No se acumulan stocks ni porcentajes.</p><p class="reading-item">EBA guarda el total 2026–2028 en ${sc==='baseline'?'H77':'M77'}. En ICAAP el acumulado mostrado es una <strong>suma derivada</strong> de la fila 73.</p></div></section></div>${metricTable([46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,73,...(state.model==='EBA'?[75,76,77]:[])],'Detalle del deterioro y su impacto')}`;
}

function comparison() {
 const rows=[11,14,15,16,24,69,70,73];
 const comparisonRows=(label,unit,eba,icaap,row=null)=>{
   const series=[{name:'EBA',vals:eba},{name:'ICAAP',vals:icaap},{name:'Diferencia',vals:eba.map((a,i)=>numeric(a)&&numeric(icaap[i])?(a-icaap[i])*(unit==='percent'?100:1):null)}];
   return series.map((s,j)=>`<tr>${j===0?`<td class="metric-name" rowspan="3">${row?`<button class="metric-link" data-detail="${row}">${esc(label)}${icon('arrow',13)}</button>`:esc(label)}${row?'':'<span class="table-source">Suma derivada de impactos anuales</span>'}</td>`:''}<td class="comparison-series">${s.name}</td>${s.vals.map(v=>`<td class="num ${j===0?'accent':''}">${j===2?(numeric(v)?signed(v,2)+(unit==='percent'?' pp':' u.'):'—'):format(v,unit)}</td>`).join('')}</tr>`).join('');
 };
 const table=`<section class="panel"><div class="table-heading"><div><h2>Comparación en todo el horizonte</h2><p>${scenarioLabel()} · Hipotecas · 2025–2028</p></div><span class="row-chip">EBA − ICAAP</span></div><div class="table-wrap"><table class="comparison-table"><thead><tr><th>Indicador</th><th>Serie</th>${years.map(y=>`<th class="num">${y}${y===2025?' · SP':''}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>comparisonRows(metric(r).label,metric(r).unit,values(r,'EBA'),values(r,'ICAAP'),r)).join('')}${comparisonRows('P&L acumulado desde 2026','amount',cumulative('EBA').map((v,i)=>i?v:null),cumulative('ICAAP').map((v,i)=>i?v:null))}</tbody></table></div></section>`;
 return `<div class="comparison-banner"><span class="compare-icon">${icon('comparison',23)}</span><div><h2>Mismo escenario. Distinta evolución del balance.</h2><p>En los resultados de hipotecas, EBA mantiene constante la exposición total. ICAAP refleja las variaciones del balance del modelo. Los cuatro años se comparan juntos en el escenario ${scenarioLabel().toLowerCase()}.</p></div></div><div class="grid grid-two">${chartPanel(70,{compare:true})}${chartPanel(16,{compare:true})}${chartPanel(11,{compare:true,small:true})}${chartPanel(73,{compare:true,bars:true,subtitle:'Impacto anual · unidades del Excel',small:true})}</div>${table}${note('Las diferencias se expresan como <strong>EBA menos ICAAP</strong>: en puntos porcentuales (pp) para ratios y en unidades del Excel para importes. Cada columna compara el mismo año, escenario y segmento.')}`;
}

function filteredMetrics() {
 const q=normalize(state.query);
 return DATA.metrics.filter(m=>(state.category==='all'||m.category===state.category)&&(!q||normalize([m.label,m.originalLabel,m.category,m.row].join(' ')).includes(q)));
}

function rawRecords() {
 const sheet=DATA.rawSheets.find(s=>s.name===state.sheet),q=normalize(state.query);
 return (sheet?.cells||[]).filter(c=>!q||normalize([c.address,c.value,c.formula].join(' ')).includes(q));
}

function rawTable() {
  const records=rawRecords(),size=45,pages=Math.max(1,Math.ceil(records.length/size));state.page=Math.min(state.page,pages-1);
 const slice=records.slice(state.page*size,(state.page+1)*size);
 return `<section class="panel"><div class="table-heading"><div><h2>${esc(state.sheet)}</h2><p>Valores originales y fórmulas · sin recalcular</p></div><span class="row-chip">${records.length} celdas</span></div><div class="table-wrap"><table class="raw-table"><thead><tr><th>Celda</th><th>Valor guardado</th><th>Fórmula original</th><th>Formato Excel</th></tr></thead><tbody>${slice.map(c=>`<tr><td><span class="row-chip">${esc(c.address)}</span></td><td class="raw-value">${numeric(c.value)?format(c.value,c.numberFormat?.includes('%')?'percent':'amount',c.numberFormat?.includes('%')?4:6):esc(c.value??'—')}</td><td class="formula">${esc(c.formula||'—')}</td><td class="formula">${esc(c.numberFormat)}</td></tr>`).join('')||'<tr><td colspan="4" class="empty-state">No hay celdas que coincidan con la búsqueda.</td></tr>'}</tbody></table></div><div class="table-foot"><span>${records.length?state.page*size+1:0}–${Math.min((state.page+1)*size,records.length)} de ${records.length} celdas</span><div class="pager"><button class="icon-btn" data-page="${state.page-1}" ${state.page===0?'disabled':''} aria-label="Página anterior">←</button><span>${state.page+1} / ${pages}</span><button class="icon-btn" data-page="${state.page+1}" ${state.page>=pages-1?'disabled':''} aria-label="Página siguiente">→</button></div></div></section>`;
}

function dataView() {
 const cats=[...new Set(DATA.metrics.map(m=>m.category))];
 return `<div class="tabbar" role="tablist" aria-label="Vista de datos"><button role="tab" data-data-tab="metrics" class="${state.dataTab==='metrics'?'active':''}" aria-selected="${state.dataTab==='metrics'}">Métricas del reporte</button><button role="tab" data-data-tab="raw" class="${state.dataTab==='raw'?'active':''}" aria-selected="${state.dataTab==='raw'}">Libro original · 4 hojas</button></div><div class="data-toolbar"><div class="input-wrap">${icon('search')}<input id="data-search" type="search" value="${esc(state.query)}" placeholder="${state.dataTab==='raw'?'Buscar celda, valor o fórmula…':'Filtrar métricas…'}" aria-label="Filtrar los datos"></div>${state.dataTab==='metrics'?`<select id="category-filter" aria-label="Categoría de métricas"><option value="all">Todas las categorías</option>${cats.map(c=>`<option ${state.category===c?'selected':''} value="${esc(c)}">${esc(c)}</option>`).join('')}</select>`:`<select id="sheet-filter" aria-label="Hoja del Excel">${DATA.rawSheets.map(s=>`<option ${state.sheet===s.name?'selected':''} value="${esc(s.name)}">${esc(s.name)}</option>`).join('')}</select>`}<span class="data-count" id="data-count">${state.dataTab==='metrics'?filteredMetrics().length+' métricas':rawRecords().length+' celdas'}</span></div><div id="data-table">${state.dataTab==='metrics'?metricTable(filteredMetrics().map(m=>m.row),'Series completas del modelo',{extra:true}):rawTable()}</div>${note(state.dataTab==='metrics'?'La columna 2029 conserva los parámetros forward disponibles, <strong>no resultados proyectados completos</strong>. Los guiones mantienen las celdas vacías del Excel. Los campos adicionales de EBA no existen en ICAAP.':'Se incluyen las <strong>cuatro hojas y todas sus celdas pobladas</strong>. Database contiene entradas de Hipotecas, Consumer, Corporates y PyMES. Instructions se conserva como documentación del libro; sus ejemplos no representan el segmento de los resultados.')}<section class="panel"><div class="panel-header"><h2>Origen y alcance</h2></div><div class="reading-list"><p class="reading-item"><strong>${esc(DATA.meta.sourceFile)}</strong><br>Versión de la hoja: 30/10/2026 · C84 de ambos motores. Resultados guardados para <strong>Mortgages / Hipotecas</strong>.</p><p class="reading-item">${DATA.checks.populatedCells} celdas pobladas · ${DATA.checks.formulaCount} fórmulas con valores guardados. <strong>Sin errores de fórmula detectados</strong> en la extracción. El HTML es una instantánea del archivo: no recalcula ni se sincroniza automáticamente.</p><p class="reading-item">Moneda y escala no indicadas en el origen. Importes en <strong>unidades del Excel</strong>. Las comparaciones, porcentajes de composición y sumas acumuladas se derivan exclusivamente de los datos guardados.</p></div></section>`;
}

function renderDataTable() {
 $('#data-table').innerHTML=state.dataTab==='metrics'?metricTable(filteredMetrics().map(m=>m.row),'Series completas del modelo',{extra:true}):rawTable();
 $('#data-count').textContent=state.dataTab==='metrics'?filteredMetrics().length+' métricas':rawRecords().length+' celdas';
 const p=$('.raw-table')?.closest('.panel')?.querySelector('.table-heading p');if(p)p.textContent='Valores originales y fórmulas · sin recalcular';
}

function renderInsights() {
 const block=(name,ico,vals,unit,caption)=>`<div class="insight-item"><span class="insight-icon">${icon(ico)}</span><div><strong>${name}</strong><div class="rail-series">${years.map((year,i)=>`<div><span>${year}</span><b>${format(vals[i],unit,unit==='percent'?2:0)}</b></div>`).join('')}</div><p>${caption}</p></div></div>`;
 $('#insights').innerHTML=`<div class="rail-top"><div class="rail-title">Lectura del escenario ${icon('info',15)}</div><span class="context-pill"><span class="status-dot"></span>${state.model} · ${scenarioLabel()} · 2025–2028</span></div><div class="insight-block"><div class="rail-label">EVOLUCIÓN COMPLETA</div>${block('Ratio de morosidad','credit',values(70),'percent','NPL / exposición total.')}${block('Stock de provisiones','layers',values(16),'amount','Unidades del Excel.')}${block('P&L acumulado','results',cumulative().map((v,i)=>i?v:null),'amount','Suma desde 2026 · unidades del Excel.')}</div><div class="rail-divider"></div><div class="insight-block"><div class="rail-label">HORIZONTE DEL REPORTE</div><div class="horizon-static">${years.map(y=>`<span>${y}</span>`).join('')}</div><p class="rail-caption">2025 es el punto de partida.<br>2026–2028 son los años proyectados.<br>Todos los años permanecen visibles.</p><div class="rail-workbook"><div class="book-icon">${icon('book',20)}</div><strong>IFRS9 & Stress Test Tool<br>2026–27.xlsx</strong><p>Segmento guardado: Hipotecas<br>Versión de la hoja: 30 oct. 2026</p><button class="source-link" data-view="data">Consultar datos de origen ${icon('arrow',11)}</button></div></div><div class="rail-end"><div class="rail-divider"></div><div class="rail-label">CRITERIO DE LECTURA</div><p class="rail-caption">Importes en unidades del Excel.<br>Ratios en %. Diferencias en pp.<br>«—» indica un dato no disponible.</p></div>`;
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
 $('#view').getAnimations().forEach(a=>a.cancel());
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)$('#view').animate([{opacity:.55,transform:'translateY(3px)'},{opacity:1,transform:'none'}],{duration:180});
 $('#footer-context').textContent=`${state.view==='comparison'?'EBA e ICAAP':state.model} · ${scenarioLabel()} · Horizonte 2025–2028 · Hipotecas`;
 const next=views[(views.indexOf(v)+1)%views.length];$('#next-section').textContent=next.label+' →';$('#next-section').dataset.view=next.id;
 $('#model-switch').setAttribute('aria-label',state.view==='comparison'?'Modelo para el detalle. Las gráficas comparan ambos modelos.':'Modelo del reporte');
  $('#model-switch').previousElementSibling.textContent=state.view==='comparison'?'Detalle':'Modelo';
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
 state.view=view;render();$('#sidebar').classList.remove('open');$('#menu-button').setAttribute('aria-expanded','false');
 window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}

function showDetail(row) {
 const m=metric(row);if(!m)return;
 const notes={69:'Exposición Stage 2 dividida entre exposición performing. No equivale al peso de Stage 2 sobre la exposición total.',70:'Exposición Stage 3 (NPL) dividida entre la exposición total.',73:'Impacto anual en P&L. Negativo indica gasto / pérdida. El ajuste adverso de 2026 ya está incluido; el one-off de transición IFRS 9 se registra en capital.',77:'Total 2026–2028 guardado en la hoja EBA. No existe un valor equivalente guardado en la hoja ICAAP.',75:'Ajuste de transición a IFRS 9 que afecta al capital inicial. Está separado del P&L anual.'};
 const sheet=DATA.rawSheets.find(s=>s.name===DATA.engines[state.model].sheet);
 const sourceRows=[state.scenario].flatMap(sc=>DATA.engines[state.model].scenarios[sc].sources[String(row)]?.map((address,i)=>({sc,address,year:DATA.periods[i],cell:sheet.cells.find(c=>c.address===address)}))||[]).filter(x=>x.cell);
 $('#detail-content').innerHTML=`<div class="eyebrow">${state.model} · ${esc(m.category)} · FILA ${row}</div><h2>${esc(m.label)}</h2><p class="detail-description">${esc(notes[row]||m.description||m.originalLabel)}</p>${m.unit!=='text'?chartPanel(row,{title:'Evolución del escenario '+scenarioLabel()}):''}<div class="detail-sources"><strong>Origen:</strong> ${esc(DATA.engines[state.model].sheet)}<br><strong>Etiqueta original:</strong> ${esc(m.originalLabel)}<br><strong>Unidad:</strong> ${unitLabel(m.unit)}</div><details open><summary>Celdas, valores y fórmulas originales</summary><div class="table-wrap" style="margin-top:12px"><table><thead><tr><th>Celda</th><th>Escenario / año</th><th class="num">Valor</th><th>Fórmula</th></tr></thead><tbody>${sourceRows.map(x=>`<tr><td>${x.address}</td><td>${x.sc==='baseline'?'Base':'Adverso'} · ${x.year}</td><td class="num">${format(x.cell.value,m.unit,m.unit==='percent'?4:6)}</td><td class="formula">${esc(x.cell.formula||'Valor de entrada')}</td></tr>`).join('')||'<tr><td colspan="4">No hay valores guardados para esta métrica en este modelo.</td></tr>'}</tbody></table></div></details>`;
 if(!$('#detail-dialog').open)$('#detail-dialog').showModal();
}

function searchResults() {
 const q=normalize($('#global-search').value.trim());
 const vs=views.filter(v=>!q||normalize(v.label+' '+v.title).includes(q));
 const ms=DATA.metrics.filter(m=>!q||normalize([m.label,m.originalLabel,m.category,m.row].join(' ')).includes(q)).slice(0,q?18:5);
 $('#search-results').innerHTML=vs.map(v=>`<button class="search-result" data-search-view="${v.id}">${icon(v.id,17)}<div><span>${v.label}</span><small>Sección del reporte</small></div>${icon('chevron',14)}</button>`).join('')+ms.map(m=>`<button class="search-result" data-search-detail="${m.row}">${icon('results',17)}<div><span>${esc(m.label)}</span><small>${esc(m.originalLabel)}</small></div><span class="row-chip">Fila ${m.row}</span></button>`).join('')||'<div class="empty-state">No se encontraron resultados.</div>';
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
   rows=[['Hoja','Celda','Valor guardado','Formula original','Formato'],...rawRecords().map(c=>[state.sheet,c.address,c.value,c.formula,c.numberFormat])];filename='celdas-'+state.sheet;
 } else if(state.view==='comparison') {
   rows=[['Modelo','Escenario','Año','Metrica','Unidad','Valor','Fuente'],...['EBA','ICAAP'].flatMap(model=>DATA.metrics.flatMap(m=>years.map((y,i)=>[model,scenarioLabel(),y,m.label,m.unit,value(m.row,model,state.scenario,i),source(m.row,model,state.scenario,i)])))];filename='comparacion-EBA-ICAAP';
 } else {
   const ms=state.view==='data'?filteredMetrics():DATA.metrics;
   rows=[['Modelo','Escenario','Año','Metrica','Unidad','Valor','Fuente'],...ms.flatMap(m=>[state.scenario].flatMap(sc=>DATA.periods.map((y,i)=>[state.model,sc==='baseline'?'Base':'Adverso',y,m.label,m.unit,DATA.engines[state.model].scenarios[sc].rows[String(m.row)]?.[i]??null,`'${DATA.engines[state.model].sheet}'!${DATA.engines[state.model].scenarios[sc].sources[String(m.row)]?.[i]||''}`])))];filename='stress-test-'+state.model+'-'+scenarioLabel();
 }
 const csv='\ufeff'+rows.map(r=>r.map(csvValue).join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
 const a=document.createElement('a');a.href=url;a.download=filename.replace(/[^a-zA-Z0-9-]/g,'_')+'.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 toast('CSV exportado · valores originales sin redondear');
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

$('#navigation').innerHTML=views.map((v,i)=>`${i===5?'<div class="nav-divider"></div>':''}<a href="#${v.id}" data-view="${v.id}">${icon(v.id)}<span>${v.label}</span></a>`).join('');
$('#home-icon').innerHTML=icon('home',17);$('#search-icon').innerHTML=icon('search',15);$('#modal-search-icon').innerHTML=icon('search',20);$('#menu-button').innerHTML=icon('menu',18);$('#print-button').innerHTML=icon('print',18);$('#export-button').innerHTML=icon('download',14)+'<span>Exportar CSV</span>';

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
$('#menu-button').addEventListener('click',()=>{const isOpen=$('#sidebar').classList.toggle('open');$('#menu-button').setAttribute('aria-expanded',String(isOpen));});
document.addEventListener('click',e=>{if(innerWidth<=800&&!e.target.closest('#sidebar')&&!e.target.closest('#menu-button')){$('#sidebar').classList.remove('open');$('#menu-button').setAttribute('aria-expanded','false');}});
document.addEventListener('keydown',e=>{
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(!$('#detail-dialog').open&&!$('#search-dialog').open)openSearch();}
 if(e.key==='Escape'){$('#sidebar').classList.remove('open');$('#menu-button').setAttribute('aria-expanded','false');hideTooltip();}
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
