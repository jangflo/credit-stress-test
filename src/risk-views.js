'use strict';
/* Derived views share the report's data, chart components and visual tokens. */
(() => {
function create(c){
 const {data,state,format,numeric,esc,graph,colors,years,values,source,scenarioLabel,note}=c;
 const engine=StressRisk.createEngine(data), calibration=engine.validateBase();
 const sum=a=>a.filter(numeric).reduce((s,v)=>s+v,0);
 const rr=(r,m=state.model,s=state.scenario)=>data.engines[m].scenarios[s].rows[r];
 const total=(r,m=state.model,s=state.scenario)=>sum((rr(r,m,s)||[]).slice(1,4));
 const caseName=(m=state.model,s=state.scenario)=>`${m} · ${s==='baseline'?'Baseline':'Adverse'}`;
 const derived=label=>years.map(()=>label);
 const signed=(v,unit='amount',digits=2)=>(v>0?'+':'')+format(v,unit,digits);
 const panel=(title,subtitle,body,extra='')=>`<section class="panel analysis-panel" ${extra}><div class="panel-header"><div><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div></div>${body}</section>`;
 const scopeSwitch=(kind,current)=>`<div class="analysis-toolbar"><span>Comparison scope</span><div class="segmented" aria-label="${kind==='coverage'?'Coverage':'Model comparison'} scope"><button data-analysis-scope="selected" data-scope-kind="${kind}" aria-pressed="${current!=='all'}" class="${current!=='all'?'active':''}">Selected scenario</button><button data-analysis-scope="all" data-scope-kind="${kind}" aria-pressed="${current==='all'}" class="${current==='all'?'active':''}">Both scenarios</button></div></div>`;
 function allSeries(row,cumulative=false){
  return ['EBA','ICAAP'].flatMap(m=>['baseline','adverse'].map(s=>({name:caseName(m,s),color:colors[m],dashed:s==='baseline',values:cumulative?engine.simulate(m,s).cumulative:values(row,m,s),sources:cumulative?derived('Derived: running sum of row 73'):years.map((_,i)=>source(row,m,s,i))})));
 }
 function compareChart(row,title,bars=false,cum=false){
  const all=state.comparisonScope==='all';
  const series=all?allSeries(row,cum):['EBA','ICAAP'].map(m=>({name:m,color:colors[m],values:cum?engine.simulate(m,state.scenario).cumulative:values(row,m),sources:cum?derived('Derived: running sum of row 73'):years.map((_,i)=>source(row,m,state.scenario,i)),dashed:m==='ICAAP'}));
  return panel(title,`${all?'Both scenarios':scenarioLabel()} · 2025–2028 · ${row===70?'%':'Excel units'}`,graph(series,row===70?'percent':'amount',{title,bars}));
 }
 function compareStages(scenario){
  const exposureMax=Math.max(...['EBA','ICAAP'].flatMap(m=>['baseline','adverse'].flatMap(s=>values(11,m,s))));
  const pairs=[{i:0,m:'EBA',label:'2025 · SP · both models'},...[1,2,3].flatMap(i=>['EBA','ICAAP'].map(m=>({i,m,label:`${years[i]} · ${m}`})))];
  return panel('Exposure by stage',`${scenario==='baseline'?'Baseline':'Adverse'} · EBA and ICAAP · absolute exposure`,
   `<div class="chart-legend">${colors.stages.map((color,i)=>`<span class="legend-item"><i class="legend-dot" style="background:${color}"></i>Stage ${i+1}</span>`).join('')}</div><div class="stage-timeline compare-stage-timeline">${pairs.map(({i,m,label})=>{
    const exp=rr(11,m,scenario)[i];
    return `<div class="stage-year"><div class="stage-year-label"><span>${label}</span><strong>${format(exp,'amount',0)}<small> units</small></strong></div><div class="stage-stack absolute-stack" style="width:${exp/exposureMax*100}%">${[13,14,15].map((r,j)=>`<span style="width:${rr(r,m,scenario)[i]/exp*100}%;background:${colors.stages[j]}" tabindex="0" data-tooltip="${esc(`${label} · Stage ${j+1}|${format(rr(r,m,scenario)[i])} (${format(rr(r,m,scenario)[i]/exp,'percent')})|${source(r,m,scenario,i)}`)}"></span>`).join('')}</div></div>`;
   }).join('')}</div><p class="analysis-caption">A common absolute scale preserves the difference in portfolio size. Starting exposure is identical.</p>`);
 }
 function stageGrowth(){
  const b=rr(15,'EBA','baseline'),a=rr(15,'EBA','adverse');
  const row=(label,vals,percent=false)=>`<tr><td>${label}</td>${vals.map(v=>`<td class="num">${format(v,percent?'percent':'amount',percent?2:1)}</td>`).join('')}</tr>`;
  return panel('EBA Stage 3 · scenario uplift','Growth from the starting point and Adverse relative to Baseline',`<div class="table-wrap"><table class="growth-table"><thead><tr><th>Metric</th>${years.map(y=>`<th class="num">${y}${y===2025?' · SP':''}</th>`).join('')}</tr></thead><tbody>${row('Baseline · Stage 3 exposure',b.slice(0,4))}${row('Adverse · Stage 3 exposure',a.slice(0,4))}${row('Baseline growth vs 2025',b.slice(0,4).map(v=>v/b[0]-1),true)}${row('Adverse growth vs 2025',a.slice(0,4).map(v=>v/a[0]-1),true)}${row('Adverse / Baseline − 1',a.slice(0,4).map((v,i)=>v/b[i]-1),true)}${row('Adverse − Baseline · units',a.slice(0,4).map((v,i)=>v-b[i]))}</tbody></table></div><p class="analysis-caption">Derived from row 15 of both EBA scenarios. Relative uplift uses the same-year Baseline as denominator.</p>`);
 }
 function comparisonCharts(){
  const scenarios=state.comparisonScope==='all'?['baseline','adverse']:[state.scenario];
  return scopeSwitch('comparison',state.comparisonScope)+`<div class="scope-context">${state.comparisonScope==='all'?'Both models and both scenarios. The global scenario selector applies to metric details and source tables below.':`Both models · ${scenarioLabel()}. Switch to Both scenarios for the combined charts.`}</div><div class="grid grid-two">${compareChart(70,'NPL ratio')}${compareChart(16,'Provision stock')}${compareChart(15,'Stage 3 exposure')}${compareChart(73,'Annual P&L impact',true)}${compareChart(73,'Cumulative P&L since 2026',false,true)}${scenarios.length===1?compareStages(scenarios[0]):''}</div>${scenarios.length===2?`<div class="grid grid-two">${scenarios.map(compareStages).join('')}</div>${stageGrowth()}`:''}`;
 }
 function coverage(){
  const all=state.coverageScope==='all';
  const pairs=all?['baseline','adverse'].flatMap(s=>['EBA','ICAAP'].map(m=>[m,s])):[[state.model,state.scenario]];
  return scopeSwitch('coverage',state.coverageScope)+`<div class="grid ${all?'grid-two':''}">${pairs.map(([m,s])=>panel('Coverage by stage',`${caseName(m,s)} · 2025–2028 · %`,graph([22,23,24].map((r,i)=>({name:`Stage ${i+1}`,color:colors.stages[i],dashed:i===1,values:values(r,m,s),sources:years.map((_,j)=>source(r,m,s,j))})),'percent',{title:`Coverage by stage · ${caseName(m,s)}`}))).join('')}</div>`;
 }
 function ticks(min,max,count=4){
  const step0=(max-min||1)/count,mag=10**Math.floor(Math.log10(step0));
  const step=[1,2,2.5,5,10].map(x=>x*mag).find(x=>x>=step0);
  const lo=Math.floor(min/step)*step,hi=Math.ceil(max/step)*step;
  const result=[];for(let t=lo;t<=hi+step*.01;t+=step)result.push(Math.abs(t)<step*1e-7?0:t);
  return {lo,hi:hi===lo?lo+1:hi,values:result};
 }
 function waterfall(entries,title,positiveBad=false){
  let current=0;
  const bars=entries.map(e=>{const start=e.total?0:current,end=e.total?e.value:current+e.value;current=end;return {...e,start,end};});
  const W=760,H=350,L=68,R=26,T=42,B=84;
  const scale=ticks(Math.min(0,...bars.flatMap(b=>[b.start,b.end])),Math.max(0,...bars.flatMap(b=>[b.start,b.end])));
  const y=v=>T+(scale.hi-v)/(scale.hi-scale.lo)*(H-T-B),gap=(W-L-R)/bars.length,bw=Math.min(65,gap*.64);
  let svg=`<svg class="waterfall-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>`;
  svg+=scale.values.map(v=>`<line class="chart-grid" x1="${L}" y1="${y(v)}" x2="${W-R}" y2="${y(v)}"/><text class="chart-label" x="${L-10}" y="${y(v)+4}" text-anchor="end">${format(v,'amount',0)}</text>`).join('');
  bars.forEach((b,i)=>{
   const x=L+gap*(i+.5),color=b.total?colors.EBA:((b.value>0)===positiveBad?'#F391A1':'#57D994');
   const tip=`${b.label}|${format(b.value)}|${b.sources||'Derived reconciliation'}`;
   if(i&&!b.total)svg+=`<line x1="${x-gap+bw/2}" x2="${x-bw/2}" y1="${y(b.start)}" y2="${y(b.start)}" stroke="${colors.EBA}" opacity=".4" stroke-dasharray="3 3"/>`;
   svg+=`<rect x="${x-bw/2}" y="${Math.min(y(b.start),y(b.end))}" width="${bw}" height="${Math.max(1,Math.abs(y(b.start)-y(b.end)))}" rx="4" fill="${color}" fill-opacity="${b.total?.88:.65}" tabindex="0" data-tooltip="${esc(tip)}" aria-label="${esc(tip.replaceAll('|',', '))}"/>`;
   const label=(b.total?'':b.value>0?'+':'')+format(b.value,'amount',1);
   svg+=`<text class="waterfall-value" x="${x}" y="${Math.min(y(b.start),y(b.end))-10}" text-anchor="middle">${label}</text>`;
   const words=b.label.split(' '),lines=[''];for(const word of words){if((lines.at(-1)+' '+word).length>15)lines.push(word);else lines[lines.length-1]+=(lines.at(-1)?' ':'')+word;}
   svg+=lines.map((s,j)=>`<text class="chart-label waterfall-label" x="${x}" y="${H-B+24+j*15}" text-anchor="middle">${esc(s)}</text>`).join('');
  });
  svg+='</svg>';
  return `<div class="chart-wrap">${svg}</div><details class="chart-data"><summary>View reconciliation and sources</summary><div class="table-wrap"><table data-period-context="2025–2028 attribution"><thead><tr><th>Component</th><th class="num">Units</th><th>Source / method</th></tr></thead><tbody>${entries.map(e=>`<tr><td>${esc(e.label)}</td><td class="num">${format(e.value)}</td><td class="analysis-source">${esc(e.sources||'Derived')}</td></tr>`).join('')}</tbody></table></div></details>`;
 }
 function nplBridge(m){
  const entries=[{label:'2025 · SP',value:rr(15,m)[0],total:true,sources:source(15,m,state.scenario,0)},
   {label:'S1 → S3',value:total(35,m),sources:'Sum of row 35 · 2026–2028'},
   {label:'S2 → S3',value:total(36,m),sources:'Sum of row 36 · 2026–2028'},
   {label:'Cures to S1',value:m==='ICAAP'?-total(38,m):0,sources:m==='ICAAP'?'− Sum of row 38 · 2026–2028':'Not applied in the EBA Stage 3 roll-forward'},
   {label:'Cures to S2',value:m==='ICAAP'?-total(39,m):0,sources:m==='ICAAP'?'− Sum of row 39 · 2026–2028':'Not applied in the EBA Stage 3 roll-forward'},
   {label:'Write-offs',value:m==='ICAAP'?-total(64,m):0,sources:m==='ICAAP'?'− Sum of row 64 · 2026–2028':'Not applied in the EBA Stage 3 roll-forward'},
   {label:'2028 close',value:rr(15,m)[3],total:true,sources:source(15,m,state.scenario,3)}];
  return panel(`${m} · Stage 3 balance bridge`,`${scenarioLabel()} · 2025 → 2028 · Excel units`,waterfall(entries,`${m} Stage 3 reconciliation`,true));
 }
 function drivers(){
  const e=rr(15,'EBA'),i=rr(15,'ICAAP');
  const opening=e[0]-i[0],inflows=total(34,'EBA')-total(34,'ICAAP'),cures=total(37,'ICAAP'),wo=total(64,'ICAAP');
  const gap=[{label:'ICAAP · 2028',value:i[3],total:true,sources:source(15,'ICAAP',state.scenario,3)},
   {label:'Opening gap',value:opening,sources:'EBA − ICAAP · 2025 Stage 3'},
   {label:'Inflow difference',value:inflows,sources:'Sum of EBA row 34 − ICAAP row 34 · 2026–2028'},
   {label:'ICAAP cures',value:cures,sources:'Sum of ICAAP row 37 · 2026–2028'},
   {label:'ICAAP write-offs',value:wo,sources:'Sum of ICAAP row 64 · 2026–2028'},
   {label:'EBA · 2028',value:e[3],total:true,sources:source(15,'EBA',state.scenario,3)}];
  return `<div class="comparison-banner"><span class="compare-icon">${c.icon('flows',23)}</span><div><h2>Explain the model difference</h2><p>Follow the flows that reconcile opening and closing NPL balances. Cures and write-offs are shown separately because they have different economic meanings.</p></div></div><div class="grid grid-two">${nplBridge('EBA')}${nplBridge('ICAAP')}</div>${panel('From ICAAP to EBA · closing Stage 3',`${scenarioLabel()} · exact output reconciliation`,waterfall(gap,'ICAAP to EBA Stage 3 bridge',true))}${note('These bridges reconcile the saved outputs. The inflow difference also reflects the evolving portfolio mix; the components are <strong>not isolated causal effects</strong> from a counterfactual rerun. A write-off reduces reported NPL stock without being a cure. Blank EBA cure and write-off cells contribute zero here because those flows are absent from its Stage 3 formula; original source cells remain blank.')}`;
 }
 function plBridge(){
  const m=state.model,entries=[{label:'P&L start',value:0,total:true,sources:'Start of cumulative impact in 2026'},
   ...[18,19,20].map((r,j)=>({label:`Stage ${j+1} provisions`,value:-(rr(r)[3]-rr(r)[0]),sources:`−(2028 − 2025) provision stock · row ${r}`})),
   {label:'Net write-offs',value:m==='ICAAP'?-total(67):0,sources:m==='ICAAP'?'− Sum of row 67 · 2026–2028':'Not applied in the EBA P&L formula'},
   {label:'Cumulative P&L',value:total(73),total:true,sources:'Sum of saved row 73 · 2026–2028'}];
  return panel('What drives cumulative P&L?',`${caseName()} · provision changes and net write-offs`,waterfall(entries,'Cumulative credit P&L bridge'));
 }
 function costRisk(){
  const series=['EBA','ICAAP'].map(m=>({name:m,color:colors[m],dashed:m==='ICAAP',values:engine.simulate(m,state.scenario).costBps,sources:derived('− Annual row 73 / average opening and closing exposure × 10,000')}));
  return panel('Credit impact per unit of exposure',`${scenarioLabel()} · annual modelled credit cost · basis points`,graph(series,'bps',{title:'Modelled credit cost',bars:true})+'<p class="analysis-caption">− Annual P&L / average opening and closing total exposure × 10,000. Negative cost indicates a net release. This is a model-specific measure.</p>');
 }
 function flowData(model,scenario,year){
  const i=years.indexOf(year),q=i-1;if(i<1)return null;
  const r=n=>rr(n,model,scenario),v=n=>r(n)?.[i]||0;
  const applied=model==='ICAAP',prepay=applied?Math.max(-v(10),0):0,newLoans=applied?Math.max(v(10),0):0;
  const left=[{id:'s1',name:'Stage 1',value:r(13)[q]},{id:'s2',name:'Stage 2',value:r(14)[q]},{id:'s3',name:'Stage 3',value:r(15)[q]}];
  const right=[{id:'s1',name:'Stage 1',value:r(13)[i]},{id:'s2',name:'Stage 2',value:r(14)[i]},{id:'s3',name:'Stage 3',value:r(15)[i]}];
  if(newLoans)left.push({id:'new',name:'New loans',value:newLoans});
  if(prepay)right.push({id:'prepay',name:'Prepayments',value:prepay});
  const wo=applied?v(64):0;if(wo)right.push({id:'wo',name:'Write-offs',value:wo});
  const flow=(from,to,value,label,row)=>({from,to,value,label,source:row?source(row,model,scenario,i):'Derived opening balance less reported outflows'});
  const links=[flow('s1','s1',r(13)[q]-v(32)-v(35)-prepay,'S1 retained',null),flow('s1','s2',v(32),'S1 → S2',32),flow('s1','s3',v(35),'S1 → S3',35),flow('s2','s1',v(33),'S2 → S1',33),flow('s2','s2',r(14)[q]-v(33)-v(36),'S2 retained',null),flow('s2','s3',v(36),'S2 → S3',36),flow('s3','s3',r(15)[q]-(applied?v(37)+wo:0),'S3 retained',null)];
  if(applied){links.push(flow('s3','s1',v(38),'S3 → S1 cure',38),flow('s3','s2',v(39),'S3 → S2 cure',39));}
  if(newLoans)links.push(flow('new','s1',newLoans,'New exposures',10));
  if(prepay)links.push(flow('s1','prepay',prepay,'Prepayments',10));
  if(wo)links.push(flow('s3','wo',wo,'Write-offs',64));
  const clean=links.filter(l=>l.value>1e-9);
  const residual=Math.max(...left.map(n=>Math.abs(n.value-sum(clean.filter(l=>l.from===n.id).map(l=>l.value)))),...right.map(n=>Math.abs(n.value-sum(clean.filter(l=>l.to===n.id).map(l=>l.value)))));
  return {left,right,links:clean,residual,year,model,scenario};
 }
 function sankey(){
  const year=state.flowYear||2026,d=flowData(state.model,state.scenario,year),W=850,H=430,top=55,space=30,available=315;
  const maxNodes=Math.max(d.left.length,d.right.length),scale=(available-space*(maxNodes-1))/sum(d.left.map(n=>n.value));
  const layout=nodes=>{let y=top;return nodes.map(n=>{const o={...n,y,height:n.value*scale,used:0};y+=o.height+space;return o;});};
  const left=layout(d.left),right=layout(d.right),palette={s1:colors.stages[0],s2:colors.stages[1],s3:colors.stages[2],new:'#57D994',prepay:'#A1BDC6',wo:'#C5ADFA'};
  let svg=`<svg class="sankey-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Reconciled stage migration in ${year}"><title>Opening stages to closing stages · ${year}</title><text class="chart-label" x="120" y="25">${year-1} closing balance</text><text class="chart-label" x="670" y="25" text-anchor="end">${year} closing balance</text>`;
  for(const link of d.links){
   const from=left.find(n=>n.id===link.from),to=right.find(n=>n.id===link.to),h=link.value*scale,sy=from.y+from.used,ty=to.y+to.used;
   from.used+=h;to.used+=h;
   const color=palette[link.to],tip=`${link.label} · ${year}|${format(link.value)}|${link.source}`;
   svg+=`<path class="sankey-flow" d="M140,${sy} C380,${sy} 430,${ty} 670,${ty} L670,${ty+h} C430,${ty+h} 380,${sy+h} 140,${sy+h} Z" fill="${color}" opacity="${link.from===link.to?.15:.6}" tabindex="0" data-tooltip="${esc(tip)}" aria-label="${esc(tip.replaceAll('|',', '))}"/>`;
  }
  for(const [nodes,x,isLeft] of [[left,120,true],[right,670,false]])for(const n of nodes){
   svg+=`<rect x="${x}" y="${n.y}" width="20" height="${n.height}" rx="2" fill="${palette[n.id]}"/><text class="chart-label" x="${isLeft?x-10:x+30}" y="${n.y+Math.max(n.height/2,2)-4}" text-anchor="${isLeft?'end':'start'}">${n.name}</text><text class="flow-value" x="${isLeft?x-10:x+30}" y="${n.y+Math.max(n.height/2,2)+12}" text-anchor="${isLeft?'end':'start'}">${format(n.value,'amount',0)}</text>`;
  }
  svg+='</svg>';
  const r=rr(14),i=years.indexOf(year),decline=r[i]-r[i-1];
  return panel('Where does the portfolio move?',`${caseName()} · annual stage migration · Excel units`,
   `<div class="analysis-toolbar flow-year-toolbar"><label for="flow-year">Flow year</label><select id="flow-year">${years.slice(1).map(y=>`<option value="${y}" ${y===year?'selected':''}>${y}</option>`).join('')}</select><span>Opening → closing balances reconcile</span></div><div class="sankey-scroll">${svg}</div><div class="flow-reading"><strong>Stage 2 ${decline<0?'decreases':'increases'} by ${format(Math.abs(decline))} units.</strong><p>During ${year}, ${format(rr(36)[i])} units move from Stage 2 to Stage 3 and ${format(rr(33)[i])} return to Stage 1. A smaller Stage 2 balance alone does not establish improving credit quality.</p></div><details class="chart-data"><summary>View migration volumes and sources</summary><div class="table-wrap"><table data-period-context="${year} migration"><thead><tr><th>Movement</th><th class="num">Units</th><th>Source</th></tr></thead><tbody>${d.links.map(l=>`<tr><td>${l.label}</td><td class="num">${format(l.value)}</td><td class="analysis-source">${esc(l.source)}</td></tr>`).join('')}</tbody></table></div></details><p class="analysis-caption">Retained balances are derived. EBA does not apply cures, prepayments or write-offs in its exposure roll-forward. ${d.residual<1e-7?'Every opening and closing node reconciles.':'Reconciliation unavailable.'}</p>`);
 }
 function tornado(outcome){
  const d=engine.sensitivity(state.model,state.scenario,outcome),unit=outcome==='npl'?'percent':'amount',mult=outcome==='npl'?100:1;
  const limit=Math.max(1e-8,...d.drivers.flatMap(x=>[Math.abs(x.low-d.base),Math.abs(x.high-d.base)]))*1.18;
  const W=760,H=80+d.drivers.length*58,left=245,right=60,mid=left+(W-left-right)/2,half=(W-left-right)/2;
  let svg=`<svg class="tornado-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="One-at-a-time sensitivity"><title>Sensitivity around the saved case</title><line class="chart-grid" x1="${mid}" x2="${mid}" y1="24" y2="${H-28}"/>`;
  for(const [i,x] of d.drivers.entries()){
   const y=48+i*58;
   svg+=`<text class="chart-label" x="${left-15}" y="${y+6}" text-anchor="end">${x.name}</text>`;
   for(const [v,color,offset,label] of [[x.low,colors.ICAAP,-9,`−${x.step}${x.unit}`],[x.high,colors.EBA,8,`+${x.step}${x.unit}`]]){
    const delta=v-d.base,end=mid+delta/limit*half,tip=`${x.name} · ${label}|${format(v,unit)}; Δ ${signed(delta*mult)} ${outcome==='npl'?'pp':'units'}|Recalculated around the saved case`;
    svg+=`<rect x="${Math.min(mid,end)}" y="${y+offset}" width="${Math.max(1,Math.abs(end-mid))}" height="13" rx="3" fill="${color}" tabindex="0" data-tooltip="${esc(tip)}" aria-label="${esc(tip.replaceAll('|',', '))}"/>`;
   }
  }
  svg+=`<line class="chart-grid" x1="${left}" x2="${W-right}" y1="${H-52}" y2="${H-52}"/>${[-1,0,1].map(s=>`<text class="chart-label" x="${mid+s*half}" y="${H-29}" text-anchor="${s===-1?'start':s===1?'end':'middle'}">${signed(s*limit*mult,'amount',outcome==='npl'?2:1)}</text>`).join('')}<text class="chart-label" x="${mid}" y="${H-7}" text-anchor="middle">Change vs saved case · ${outcome==='npl'?'percentage points':'Excel units'}</text></svg>`;
  return panel('Which assumptions matter most?',`${caseName()} · one-at-a-time sensitivity around saved assumptions`,`<div class="chart-legend"><span class="legend-item"><i style="background:${colors.ICAAP}" class="legend-dot"></i>Lower assumption</span><span class="legend-item"><i style="background:${colors.EBA}" class="legend-dot"></i>Higher assumption</span></div><div class="chart-wrap">${svg}</div><p class="analysis-caption">±10% relative change per driver; exposure growth uses ±1 percentage point. Bars show change in ${outcome==='npl'?'2028 NPL ratio':'cumulative modelled credit loss'} with all other drivers unchanged.</p><details class="chart-data"><summary>View sensitivity results</summary><div class="table-wrap"><table data-period-context="2028 sensitivity"><thead><tr><th>Driver</th><th>Shock</th><th class="num">Lower</th><th class="num">Saved case</th><th class="num">Higher</th></tr></thead><tbody>${d.drivers.map(x=>`<tr><td>${x.name}</td><td>±${x.step}${x.unit}</td><td class="num">${format(x.low,unit)}</td><td class="num">${format(d.base,unit)}</td><td class="num">${format(x.high,unit)}</td></tr>`).join('')}</tbody></table></div></details>`);
 }
 const getNumber=id=>{const v=document.getElementById(id)?.value;return v==null||v.trim()===''?null:Number(v);};
 const numberField=(id,label,value,min,max,step=1,disabled=false)=>`<label class="analysis-field" for="${id}"><span>${label}</span><input id="${id}" type="number" value="${esc(value??'')}" ${min!=null?`min="${min}"`:''} ${max!=null?`max="${max}"`:''} step="${step}" ${disabled?'disabled':''} inputmode="decimal"></label>`;
 function labSimulation(){
  if(!calibration.pass)return `<div class="analysis-error" role="alert">The calculation engine does not match the source snapshot. Simulations are unavailable.</div>`;
  const settings=state.labSettings||StressRisk.defaults,draft=state.labDraft||settings,base=engine.simulate(state.model,state.scenario),result=engine.simulate(state.model,state.scenario,settings),outcome=state.labOutcome||'loss';
  const fields=StressRisk.drivers.map(d=>numberField(`shock-${d.id}`,d.name+` (${d.unit==='pp'?'pp shift':'% relative'})`,draft[d.id],d.id==='growthPp'?-3:-50,d.id==='growthPp'?3:80,d.id==='growthPp'?.1:1,d.icaap&&state.model!=='ICAAP')).join('');
  const errors=state.labError?.length?state.labError:result.errors;
  const body=errors.length?`<div class="analysis-error" role="alert">${errors.map(esc).join('<br>')}</div>`:`<div class="simulation-summary"><div><span>2028 NPL ratio</span><strong>${format(result.npl,'percent')}</strong><small>Saved ${format(base.npl,'percent')} · Δ ${signed((result.npl-base.npl)*100)} pp</small></div><div><span>Cumulative credit loss</span><strong>${format(result.loss,'amount',1)}</strong><small>Saved ${format(base.loss)} · Δ ${signed(result.loss-base.loss)} units</small></div><div><span>2028 provision stock</span><strong>${format(result.rows[16][3],'amount',1)}</strong><small>Saved ${format(base.rows[16][3])} units</small></div></div><div class="grid grid-two">${panel('Stage 3 · saved vs what-if',`${caseName()} · 2025–2028 · Excel units`,graph([{name:'Saved',color:colors.ICAAP,dashed:true,values:base.rows[15].slice(0,4),sources:derived('Original saved snapshot')},{name:'What-if',color:colors.EBA,values:result.rows[15].slice(0,4),sources:derived('Recalculated using applied assumptions')}],'amount',{title:'Stage 3 what-if'}))}${panel('Cumulative P&L · saved vs what-if',`${caseName()} · original accounting sign`,graph([{name:'Saved',color:colors.ICAAP,dashed:true,values:base.cumulative,sources:derived('Sum of saved annual P&L')},{name:'What-if',color:colors.EBA,values:result.cumulative,sources:derived('Sum of recalculated annual P&L')}],'amount',{title:'P&L what-if'}))}</div>`;
  return panel('Change the assumptions',`${caseName()} · 2025 opening balances remain fixed`,`<div class="analysis-form">${fields}</div><div class="analysis-actions"><button class="button secondary" data-risk-action="apply">Recalculate</button><button class="text-btn" data-risk-action="reset">Reset to saved case</button><span id="lab-draft-status" role="status">${state.labDirty?'Inputs changed. Recalculate to apply.':'Applied assumptions shown below.'}</span></div><div class="applied-inputs">${StressRisk.drivers.filter(d=>!d.icaap||state.model==='ICAAP').map(d=>`<span>${d.name}: <b>${signed(settings[d.id], 'amount',d.id==='growthPp'?1:0)}${d.unit}</b></span>`).join('')}</div><p class="analysis-caption">${state.model==='EBA'?'Cures, write-off recovery and exposure growth are not applied in EBA and are disabled. ':''}Loss severity changes LGD12M and LRLT3-3 together. Available 2029 forward parameters feed 2028 provisions. Saved starting provisions are preserved.</p>`)+body+`<div class="analysis-toolbar"><label for="lab-outcome">Sensitivity outcome</label><select id="lab-outcome"><option value="loss" ${outcome==='loss'?'selected':''}>Cumulative credit loss · units</option><option value="npl" ${outcome==='npl'?'selected':''}>2028 NPL ratio · %</option></select></div>`+tornado(outcome);
 }
 function heatmap(outcome,limit){
  const shocks=[0,20,40,60,80],unit=outcome==='npl'?'percent':'amount';
  return panel('Where is the limit crossed?',`${caseName()} · default transitions × loss severity`,`<div class="table-wrap"><table class="stress-heatmap" data-period-context="2028 stress grid"><thead><tr><th>Severity ↓ / Defaults →</th>${shocks.map(s=>`<th class="num">+${s}%</th>`).join('')}</tr></thead><tbody>${shocks.map(severity=>`<tr><th scope="row">+${severity}%</th>${shocks.map(defaults=>{const r=engine.simulate(state.model,state.scenario,{defaults,severity}),v=r[outcome],breach=r.valid&&v>=limit;return `<td class="num ${breach?'limit-breached':'within-limit'}" title="${r.valid?`Defaults +${defaults}%, severity +${severity}%. ${breach?'At or above':'Below'} user limit.`:esc(r.errors.join(' '))}">${r.valid?format(v,unit):'Invalid'}${breach?'<span class="limit-marker">Limit crossed</span>':''}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div><p class="analysis-caption">Each cell is a full recalculation from the saved case. A relative +20% shock multiplies the affected rates by 1.20. ${outcome==='npl'?'LGD changes do not alter exposures in this model; NPL outcomes therefore repeat across severity rows.':''}</p>`);
 }
 function reverseView(){
  const metric=state.reverseMetric||'loss',limit=Object.hasOwn(state,'reverseLimit')?state.reverseLimit:(metric==='npl'?12:750),unit=metric==='npl'?'percent':'amount',scaled=numeric(limit)?(metric==='npl'?limit/100:limit):null,valid=numeric(scaled)&&scaled>0&&(metric!=='npl'||scaled<=1);
  const result=valid?engine.reverse(state.model,state.scenario,metric,scaled):null;
  const message=!result?'Enter a positive limit.':!result.valid?result.errors.join(' '):result.status==='already'?'The saved case already meets or exceeds this limit.':result.status==='not-reached'?'The limit is not reached within the tested range of +0% to +80%.':`First crossing on the specified path: +${format(result.shock,'amount',2)}% to default transitions and loss severity.`;
  return panel('Reverse stress test',`${caseName()} · user-defined appetite limit`,`<div class="reverse-form"><label class="analysis-field" for="reverse-metric"><span>Outcome</span><select id="reverse-metric"><option value="loss" ${metric==='loss'?'selected':''}>Cumulative credit loss · units</option><option value="npl" ${metric==='npl'?'selected':''}>2028 NPL ratio · %</option></select></label>${numberField('reverse-limit',metric==='npl'?'NPL limit (%)':'Cumulative loss limit (Excel units)',limit,0,metric==='npl'?100:null,metric==='npl'?.1:1)}<button class="button secondary" data-risk-action="reverse">Evaluate limit</button></div><div id="reverse-output"><div class="reverse-result ${result?.status==='crossed'||result?.status==='already'?'crossed':''}" role="status"><strong>${esc(message)}</strong>${result?.valid?`<p>Outcome at ${result.status==='not-reached'?'the end of the tested path':'the reported crossing'}: ${format(result.result[metric],unit)}. Limit: ${format(scaled,unit)}.</p>`:''}</div>${valid?heatmap(metric,scaled):''}</div><p class="analysis-caption">The initial limit is an illustrative editable input, not a bank-approved or regulatory threshold. The search increases default transitions and loss severity by the same relative percentage, holding other inputs fixed. It finds the first crossing along this path, not the least severe combination across every possible scenario.</p>`);
 }
 function capitalView(){
  const draft=state.capDraft||{},applied=state.capApplied;
  const cell=(id,label)=>numberField(`cap-${id}`,label,draft[id],id.startsWith('other')?null:0,id==='tax'||id==='threshold'?100:null,.01);
  let output='<div class="capital-empty"><strong>Capital projection needs your bank inputs.</strong><p>Enter opening CET1, RWA, other net capital movements, a recognised tax offset and a CET1 threshold. No capital amounts or requirements are inferred from the credit dataset.</p></div>';
  if(applied&&!state.capDirty){
   const result=engine.capital(state.model,state.scenario,applied);
   output=result.valid?`<div class="grid grid-two">${panel('Illustrative CET1 trajectory',`${caseName()} · credit impact plus supplied net capital movements`,graph([{name:'CET1 ratio',color:colors.EBA,values:result.ratios,sources:derived('Derived from supplied CET1, RWA, net movements and modelled P&L')},{name:'User threshold',color:'#F391A1',dashed:true,values:years.map(()=>applied.threshold),sources:derived('User-supplied threshold')}],'percent',{title:'Illustrative CET1 projection'}))}${panel('Capital headroom',`${caseName()} · Excel units on the same scale as the credit model`,graph([{name:'Headroom',color:colors.ICAAP,values:result.headroom,sources:derived('CET1 amount − supplied threshold × RWA')}],'amount',{title:'Illustrative capital headroom',bars:true}))}</div>`:`<div class="analysis-error" role="alert">${result.errors.map(esc).join('<br>')}</div>`;
  }
  return panel('Capital capacity · supplied inputs',`${caseName()} · amounts must use the same scale as the credit portfolio`,`<div class="analysis-form capital-main">${cell('opening','Opening CET1 amount · 2025')}${cell('tax','Recognised tax offset on credit impact (%)')}${cell('threshold','User CET1 threshold (%)')}</div><div class="table-wrap capital-input-table"><table data-period-context="user capital assumptions"><thead><tr><th>Assumption</th>${years.map(y=>`<th>${y}</th>`).join('')}</tr></thead><tbody><tr><th>RWA · units</th>${years.map((y,i)=>`<td>${cell('rwa'+i,'RWA '+y)}</td>`).join('')}</tr><tr><th>Other net CET1 movements · after tax</th><td>Opening balance</td>${years.slice(1).map((y,i)=>`<td>${cell('other'+i,'Other movements '+y)}</td>`).join('')}</tr></tbody></table></div><div class="analysis-actions"><button class="button secondary" data-risk-action="capital">Calculate capital path</button><button class="text-btn" data-risk-action="capital-reset">Clear inputs</button><span id="capital-draft-status" role="status">${state.capDirty?'Inputs changed. Calculate to apply.':''}</span></div><p class="analysis-caption">The credit input is the selected saved scenario’s row 73. Other net CET1 movements must include all supplied effects outside this credit P&L, such as other earnings, distributions, OCI and deductions. Enter 0 explicitly where no movement or tax offset is assumed. CET1(t) = CET1(t−1) + credit P&L(t) × (1 − recognised tax offset) + other net movements(t). This is an illustration using your inputs, not a complete regulatory capital forecast.</p>`)+`<div id="capital-output">${output}</div>`;
 }
 function lab(){
  if(!calibration.pass)return `<div class="analysis-error" role="alert">The recalculation engine does not match this workbook snapshot. Risk lab is unavailable until the source formulas and engine have been reconciled.</div>`;
  const tab=state.labTab||'sensitivity';
  return `<div class="lab-intro"><div><span class="eyebrow">DECISION SUPPORT</span><h2>Explore the assumptions behind the outcome.</h2><p>Recalculate the credit model, test a risk limit, or add your capital inputs. The original workbook snapshot remains unchanged.</p></div><details><summary>Recalculation method and checks</summary><p>The no-shock engine reproduces ${calibration.count} saved numeric values across both models and scenarios. Maximum absolute difference: ${calibration.maxDifference.toExponential(2)} units. Starting balances and provisions are fixed at 2025. Input constraints and stage balances are checked before simulated results are shown. Relative shocks also affect available 2029 forward inputs used for 2028 provisioning. This engine implements the supplied workbook, not a complete regulatory stress-testing framework.</p></details></div><div class="tabbar lab-tabs" role="tablist" aria-label="Risk lab tools">${[['sensitivity','What-if & sensitivity'],['reverse','Reverse stress test'],['capital','Capital capacity']].map(([id,name])=>`<button role="tab" data-lab-tab="${id}" aria-selected="${tab===id}" class="${tab===id?'active':''}">${name}</button>`).join('')}</div>${tab==='sensitivity'?labSimulation():tab==='reverse'?reverseView():capitalView()}`;
 }
 function click(button){
  if(button.dataset.analysisScope){state[button.dataset.scopeKind==='coverage'?'coverageScope':'comparisonScope']=button.dataset.analysisScope;return true;}
  if(button.dataset.labTab){state.labTab=button.dataset.labTab;return true;}
  const action=button.dataset.riskAction;if(!action)return false;
  if(action==='apply'){
   const settings={},errors=[];
   for(const d of StressRisk.drivers){const disabled=d.icaap&&state.model!=='ICAAP';settings[d.id]=disabled?0:getNumber(`shock-${d.id}`);if(!numeric(settings[d.id]))errors.push(`${d.name}: enter a number.`);else if(settings[d.id]<(d.id==='growthPp'?-3:-50)||settings[d.id]>(d.id==='growthPp'?3:80))errors.push(`${d.name}: outside the displayed input range.`);}
   const result=errors.length?null:engine.simulate(state.model,state.scenario,settings);
   state.labError=errors.length?errors:result.errors;
   if(!state.labError.length){state.labSettings=settings;state.labDraft={...settings};state.labDirty=false;}
  }
  if(action==='reset'){state.labSettings={...StressRisk.defaults};state.labDraft={...StressRisk.defaults};state.labError=[];state.labDirty=false;}
  if(action==='reverse'){state.reverseLimit=getNumber('reverse-limit');state.reverseDirty=false;}
  if(action==='capital'){
   state.capApplied={openingCapital:getNumber('cap-opening'),rwa:[0,1,2,3].map(i=>getNumber('cap-rwa'+i)),otherMovements:[0,1,2].map(i=>getNumber('cap-other'+i)),taxOffset:getNumber('cap-tax')===null?null:getNumber('cap-tax')/100,threshold:getNumber('cap-threshold')===null?null:getNumber('cap-threshold')/100};state.capDirty=false;
  }
  if(action==='capital-reset'){state.capApplied=null;state.capDraft={};state.capDirty=false;}
  return true;
 }
 function change(target){
  if(target.id==='flow-year'){state.flowYear=Number(target.value);return true;}
  if(target.id==='lab-outcome'){state.labOutcome=target.value;return true;}
  if(target.id==='reverse-metric'){state.reverseMetric=target.value;state.reverseLimit=target.value==='npl'?12:750;state.reverseDirty=false;return true;}
  return false;
 }
 function input(target){
  if(target.id.startsWith('shock-')){
   state.labDraft={...(state.labDraft||state.labSettings||StressRisk.defaults),[target.id.slice(6)]:target.value};state.labDirty=true;
   document.getElementById('lab-draft-status').textContent='Inputs changed. Recalculate to apply.';
  }
  if(target.id==='reverse-limit'){state.reverseDirty=true;const output=document.getElementById('reverse-output');if(output)output.hidden=true;}
  if(target.id.startsWith('cap-')){
   state.capDraft={...(state.capDraft||{}),[target.id.slice(4)]:target.value};state.capDirty=true;
   document.getElementById('capital-draft-status').textContent='Inputs changed. Calculate to apply.';
   const output=document.getElementById('capital-output');if(output)output.hidden=true;
  }
 }
 function exportRows(){
  const model=state.model,scenario=state.scenario;
  if(state.view==='lab'){
   if(!calibration.pass)return null;
   const tab=state.labTab||'sensitivity';
   if(tab==='capital'){
    if(!state.capApplied||state.capDirty)return null;
    const r=engine.capital(model,scenario,state.capApplied);if(!r.valid)return null;
    return {filename:`capital-illustration-${model}-${scenario}`,rows:[['Model','Scenario','Year','CET1 amount','RWA','CET1 ratio','User threshold','Headroom','Recognised tax offset','Other net CET1 movements'],...years.map((y,i)=>[model,scenario,y,r.amounts[i],r.rwa[i],r.ratios[i],r.threshold,r.headroom[i],r.taxOffset,i?state.capApplied.otherMovements[i-1]:null])]};
   }
   if(tab==='reverse'){
    if(state.reverseDirty)return null;
    const outcome=state.reverseMetric||'loss',limit=Object.hasOwn(state,'reverseLimit')?state.reverseLimit:(outcome==='npl'?12:750),scaled=numeric(limit)?(outcome==='npl'?limit/100:limit):null;
    if(!numeric(scaled)||scaled<=0)return null;
    return {filename:`reverse-stress-${model}-${scenario}`,rows:[['Model','Scenario','Default shock %','Severity shock %','Outcome','Value','User limit','At or above limit'],...[0,20,40,60,80].flatMap(severity=>[0,20,40,60,80].map(defaults=>{const r=engine.simulate(model,scenario,{defaults,severity});return [model,scenario,defaults,severity,outcome,r.valid?r[outcome]:null,scaled,r.valid?r[outcome]>=scaled:null];}))]};
   }
   if(state.labError?.length||state.labDirty)return null;
   const r=engine.simulate(model,scenario,state.labSettings||{});if(!r.valid)return null;
   return {filename:`what-if-${model}-${scenario}`,rows:[['Model','Scenario','Year','Metric row','Recalculated value','Applied assumptions'],...data.metrics.flatMap(m=>years.map((y,i)=>[model,scenario,y,m.row,r.rows[m.row]?.[i]??null,JSON.stringify(r.inputs)]))]};
  }
  if(state.view==='drivers')return {filename:`stage3-reconciliation-${scenario}`,rows:[['Model','Scenario','Opening 2025','S1 to S3','S2 to S3','Cures to S1','Cures to S2','Write-offs','Closing 2028'],...['EBA','ICAAP'].map(m=>[m,scenario,rr(15,m)[0],total(35,m),total(36,m),m==='ICAAP'?-total(38,m):0,m==='ICAAP'?-total(39,m):0,m==='ICAAP'?-total(64,m):0,rr(15,m)[3]])]};
  return null;
 }
 return {comparisonCharts,coverage,drivers,plBridge,costRisk,sankey,lab,click,change,input,exportRows,flowData,engine,calibration,scopeSwitch,allSeries};
}
globalThis.StressViews=Object.freeze({create});
})();
