// DOM integration checks. Usage: node tests/verify_dashboard.mjs /path/to/linkedom
// These tests do not replace visual verification in a browser.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {parseHTML} = require(process.argv[2] || '/private/tmp/stress-report-qa/node_modules/linkedom');
const html = fs.readFileSync(new URL('../dashboard.html', import.meta.url),'utf8');
const js = fs.readFileSync(new URL('../src/dashboard.js', import.meta.url),'utf8');
const data = JSON.parse(fs.readFileSync(new URL('../data/stress-data.json',import.meta.url),'utf8'));
const {document,window} = parseHTML(html);
Object.defineProperty(window.HTMLSelectElement.prototype,'value',{
  get(){return this.querySelector('option[selected]')?.value || this.querySelector('option')?.value || '';},
  set(v){for(const option of this.querySelectorAll('option'))option.toggleAttribute('selected',option.value===String(v));},
});
window.HTMLElement.prototype.getAnimations=()=>[];
window.HTMLElement.prototype.animate=()=>({cancel(){}});
window.HTMLElement.prototype.scrollIntoView=()=>{};
window.HTMLElement.prototype.showModal=function(){this.open=true;};
window.HTMLElement.prototype.close=function(){this.open=false;};
window.HTMLElement.prototype.getBoundingClientRect=()=>({x:0,y:0,width:100,height:100,left:0,top:0,right:100,bottom:100});
let exportedBlob=null,printCalls=0,downloadName=null,lastURL='';
class MockBlob extends Blob {constructor(parts,opts){super(parts,opts);exportedBlob=this;}}
const mockedURL=class extends URL {};
mockedURL.createObjectURL=()=> 'blob:qa';mockedURL.revokeObjectURL=()=>{};
const originalClick=window.HTMLElement.prototype.click;
window.HTMLElement.prototype.click=function(){if(this.download)downloadName=this.download;else originalClick?.call(this);};
window.scrollTo=()=>{};window.print=()=>{printCalls++;};
const context={document,window,console,Intl,URLSearchParams,URL:mockedURL,Blob:MockBlob,matchMedia:()=>({matches:true}),innerWidth:1440,innerHeight:1000,
 location:{hash:'#overview?modelo=EBA&escenario=adverse&corte=2026'},history:{replaceState(_s,_t,url){lastURL=url;}},setTimeout:fn=>{fn();return 1;},clearTimeout(){}};
vm.runInNewContext(js,context,{filename:'dashboard.js'});
let checks=0;
const $=s=>document.querySelector(s);
function click(selector){const node=$(selector);assert.ok(node,`Missing ${selector}`);node.dispatchEvent(new window.Event('click',{bubbles:true}));checks++;}
function change(selector,val){const node=$(selector);node.value=String(val);node.dispatchEvent(new window.Event('change',{bubbles:true}));checks++;}
function input(selector,val){const node=$(selector);node.value=val;node.dispatchEvent(new window.Event('input',{bubbles:true}));checks++;}
function englishUI(root=document){
 const spanish=/\b(Adverso|Escenario|Modelo|Hipotecas|Estado|Provisiones|Cobertura|Transición|Fórmula|Celda|Fuente|Actualizado|métricas|celdas|escala común|PYMES)\b/i;
 const text=[...root.querySelectorAll('h1,h2,h3,p,button,a,td,th,summary,option,.rail-label,.context-pill,.chart-label')].map(n=>n.textContent).join(' ');
 assert.ok(!spanish.test(text),'Spanish text remains in rendered UI: '+text.match(spanish));
 for(const n of root.querySelectorAll('[aria-label],[placeholder],[title]'))for(const a of ['aria-label','placeholder','title'])assert.ok(!spanish.test(n.getAttribute(a)||''),'Spanish accessible text remains');
 checks++;
}
function clean(){englishUI();assert.ok(!/(NaN|undefined|Infinity)/.test($('#view').innerHTML),'Invalid content');for(const node of document.querySelectorAll('svg [d],svg [points],svg rect,svg circle')){for(const name of ['d','points','x','y','cx','cy','width','height']){const attr=node.getAttribute(name);assert.ok(!/(NaN|undefined|Infinity)/.test(attr||''),`Bad chart ${name}`);}}checks++;}
function allYears(){
 assert.equal($('#year-switch'),null,'Year selector must be removed');
 assert.equal(document.querySelector('[data-year]'),null,'Year buttons must be removed');
 assert.ok(!/corte=/.test(lastURL),'Year cut must not remain in URLs');
 for(const chart of document.querySelectorAll('#view svg.line-chart'))for(const year of data.meta.resultsYears)assert.ok(chart.textContent.includes(String(year)),`Chart missing ${year}`);
 for(const kpi of document.querySelectorAll('#view .kpi-years'))for(const year of data.meta.resultsYears)assert.ok(kpi.querySelector(`[data-year-value="${year}"]`),`KPI missing ${year}`);
 for(const table of document.querySelectorAll('#view table:not(.raw-table)'))for(const year of data.meta.resultsYears)assert.ok(table.querySelector('thead')?.textContent.includes(String(year)),`Table missing year column ${year}`);
 checks++;
}
assert.ok(html.includes(js),'Standalone HTML must contain the current application code');
assert.deepEqual(JSON.parse($('#report-data').textContent),data,'Embedded workbook snapshot must match extracted data');
assert.equal(document.documentElement.getAttribute('lang'),'en');
assert.match($('#page-title').textContent,/Risk under stress/);
assert.match(document.querySelector('.kpi-years [data-year-value="2028"]').textContent,/10.63/);
const views=['overview','credit','provisions','flows','results','comparison','data'];
for(const model of ['EBA','ICAAP']){
 click(`[data-model="${model}"]`);
 for(const scenario of ['adverse','baseline']){
  change('#scenario-select',scenario);
  for(const view of views){
   click(`#navigation [data-view="${view}"]`);clean();allYears();assert.ok($('#view').textContent.length>100);
   const label=scenario==='baseline'?'Baseline':'Adverse',other=scenario==='baseline'?'Adverse':'Baseline';
   for(const legend of document.querySelectorAll('#view .chart-legend'))assert.ok(!legend.textContent.includes(other),`Unexpected ${other} series in ${label} view`);
   if(view==='comparison')assert.ok($('#view').textContent.includes('EBA − ICAAP'));
   if(view==='overview'||view==='credit'||view==='provisions')for(const stage of document.querySelectorAll('.stage-timeline'))for(const year of data.meta.resultsYears)assert.ok(stage.textContent.includes(String(year)),`Composition missing ${year}`);
  }
 }
}
// The new overview cards must stay tied to the selected workbook scenario.
for(const model of ['EBA','ICAAP']) {
 click(`[data-model="${model}"]`);
 for(const scenario of ['baseline','adverse']) {
  change('#scenario-select',scenario);click('#navigation [data-view="overview"]');
  const coverage=data.engines[model].scenarios[scenario].rows['24'];
  const rings=[...document.querySelectorAll('.coverage-ring-item')];
  assert.equal(rings.length,4);
  rings.forEach((ring,i)=>{assert.ok(ring.getAttribute('aria-label').includes(String(data.meta.resultsYears[i])));assert.ok(ring.textContent.includes(new Intl.NumberFormat('en-GB',{minimumFractionDigits:1,maximumFractionDigits:1}).format(coverage[i]*100)));});
  assert.ok(!document.querySelector('.kpi[data-detail="11"] .kpi-delta').textContent.includes('-0.00'));
  click('#navigation [data-view="results"]');
  assert.match(document.querySelector('.kpi .kpi-delta').textContent,/Projection/);
 }
}
// Drawer dismissal must restore the interactive report and scrim state.
click('#menu-button');assert.equal($('#sidebar-scrim').hidden,false);assert.equal($('.app-shell').inert,true);
click('#sidebar-close');assert.equal($('#sidebar-scrim').hidden,true);assert.equal($('.app-shell').inert,false);
click('#menu-button');click('#sidebar-scrim');assert.ok(!$('#sidebar').classList.contains('open'));
// Check every numeric metric can be graphed and every original source is reachable.
for(const model of ['EBA','ICAAP']){
 click(`[data-model="${model}"]`);
 click('#navigation [data-view="data"]');
 for(const scenario of ['baseline','adverse']){
  change('#scenario-select',scenario);
  for(const m of data.metrics){
   click(`#data-table [data-detail="${m.row}"]`);assert.ok($('#detail-dialog').open);englishUI($('#detail-dialog'));assert.match($('#detail-content').textContent,new RegExp(`ROW ${m.row}`));assert.ok(!/(NaN|undefined|Infinity)/.test($('#detail-content').innerHTML));
   for(const chart of document.querySelectorAll('#detail-content svg.line-chart'))for(const year of data.meta.resultsYears)assert.ok(chart.textContent.includes(String(year)),`Detail chart missing ${year}`);
   for(const cell of document.querySelectorAll('#detail-content details table tbody tr td:nth-child(2)'))assert.ok(!cell.textContent.includes(scenario==='baseline'?'Adverse':'Baseline'),'Detail includes the other scenario');
   click('[data-close="detail-dialog"]');
  }
 }
}
click('[data-model="EBA"]');change('#scenario-select','adverse');click('#navigation [data-view="overview"]');
assert.ok(document.querySelectorAll('.kpi-years')[3].textContent.includes(new Intl.NumberFormat('en-GB',{maximumFractionDigits:0}).format(data.engines.EBA.scenarios.adverse.rows['73'].slice(1,4).reduce((a,b)=>a+b,0))));
click('#navigation [data-view="data"]');input('#data-search','nonexistent_metric_987');assert.equal($('#data-count').textContent,'0 metrics');input('#data-search','NPL');assert.ok(parseInt($('#data-count').textContent)>0);input('#data-search','');
change('#category-filter','Risk parameters');assert.equal($('#data-count').textContent,'6 metrics');change('#category-filter','all');
click('[data-data-tab="raw"]');
for(const s of data.rawSheets){change('#sheet-filter',s.name);assert.equal($('#data-count').textContent,s.cells.length+' cells');clean();click('[data-page="1"]');assert.ok($('.table-foot').textContent.includes('46'));}
// English presentation must preserve source notes verbatim in raw exports.
change('#sheet-filter','ST Engine (ICAAP)');input('#data-search','I16');
assert.ok($('#data-table').textContent.includes('Provision stock represents'));englishUI();
click('#export-button');assert.ok((await exportedBlob.text()).includes('El Stock of Provisions representa'));
input('#data-search','');
change('#sheet-filter','ST Engine (EBA)');input('#data-search','M70');assert.ok($('#data-table').textContent.includes('10.6307%'));assert.ok($('#data-table').textContent.includes('=M15/M11'));input('#data-search','no_such_cell_987654');assert.ok($('#data-table').textContent.includes('No cells'));input('#data-search','');
click('#export-button');assert.ok(exportedBlob);let csv=await exportedBlob.text();assert.ok(csv.startsWith('"Sheet";"Cell";"Saved value"'));assert.ok(csv.includes('"Cell"'));assert.ok(csv.includes('"M70"'));assert.ok(csv.includes(String(data.engines.EBA.scenarios.adverse.rows['70'][3])));assert.ok(csv.includes("'=M15/M11"));assert.ok(downloadName.endsWith('.csv'));
click('#navigation [data-view="comparison"]');click('#export-button');csv=await exportedBlob.text();assert.ok(csv.includes('"EBA"')&&csv.includes('"ICAAP"'));assert.ok(csv.includes('"Adverse"')&&!csv.includes(';"Base";'));
click('#navigation [data-view="overview"]');
for(const scenario of ['adverse','baseline']){change('#scenario-select',scenario);click('#export-button');csv=await exportedBlob.text();assert.ok(csv.includes('"2029"'));const label=scenario==='baseline'?'Baseline':'Adverse',other=scenario==='baseline'?'Adverse':'Baseline';assert.ok(csv.includes(`;"${label}";`)&&!csv.includes(`;"${other}";`));for(const year of data.meta.resultsYears)assert.ok(csv.includes(`;"${year}";`));}
click('#search-button');input('#global-search','NPL');assert.ok($('#search-results').textContent.includes('NPL ratio'));click('[data-search-detail="70"]');assert.ok($('#detail-dialog').open);assert.equal($('#search-dialog').open,false);click('[data-close="detail-dialog"]');
click('#search-button');input('#global-search','coverage');assert.ok($('#search-results').textContent.includes('NPL coverage'));englishUI();click('[data-search-detail="24"]');assert.match($('#detail-content h2').textContent,/NPL coverage/);click('[data-close="detail-dialog"]');
click('#print-button');assert.equal(printCalls,1);click('#menu-button');assert.ok($('#sidebar').classList.contains('open'));click('#menu-button');assert.ok(!$('#sidebar').classList.contains('open'));
// Headline data reconciliation; 2029 has no fabricated result values.
for(const model of ['EBA','ICAAP'])for(const scenario of ['baseline','adverse']){
 const r=data.engines[model].scenarios[scenario].rows;
 for(let i=0;i<4;i++){
  assert.ok(Math.abs(r['13'][i]+r['14'][i]+r['15'][i]-r['11'][i])<1e-7);
  assert.ok(Math.abs(r['18'][i]+r['19'][i]+r['20'][i]-r['16'][i])<1e-7);
  assert.ok(Math.abs(r['70'][i]-r['15'][i]/r['11'][i])<1e-12);
  assert.ok(Math.abs(r['69'][i]-r['14'][i]/r['12'][i])<1e-12);
 }
 if(model==='EBA'&&r['77'])assert.ok(Math.abs(r['73'].slice(1,4).reduce((a,b)=>a+b,0)-r['77'][3])<1e-7);
 assert.equal(r['11'][4],null);assert.equal(r['73'][4],null);
}
assert.equal(data.checks.excelErrors.length,0);assert.equal(data.checks.missingFormulaCaches.length,0);
console.log(`PASS: ${checks} DOM operations/checks; 28 report/filter combinations, ${data.metrics.length*4} metric dialogs, all years visible, isolated scenarios, search, pagination, exports, printing, and financial reconciliations.`);
