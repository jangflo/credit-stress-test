'use strict';
/* Recalculation of the supplied FINAL workbook's credit-risk formulas.
   The 2025 snapshot is fixed. Future rates, including available 2029 forward
   inputs, feed the same annual roll-forwards as rows 10–73 of each engine. */
(() => {
const isNumber = v => typeof v === 'number' && Number.isFinite(v);
const DEFAULTS = Object.freeze({defaults:0,severity:0,lifetime:0,cures:0,recovery:0,growthPp:0});
const DRIVERS = Object.freeze([
  {id:'defaults',name:'Default transitions',rows:[27,28],step:10,unit:'%'},
  {id:'severity',name:'Loss severity · LGD / LRLT3',rows:[40,41,45],step:10,unit:'%'},
  {id:'lifetime',name:'Lifetime PD',rows:[42],step:10,unit:'%'},
  {id:'cures',name:'Cure transitions',rows:[29,30],step:10,unit:'%',icaap:true},
  {id:'recovery',name:'Write-off recovery rate',rows:[71],step:10,unit:'%',icaap:true},
  {id:'growthPp',name:'Exposure growth shift',rows:[9],step:1,unit:'pp',icaap:true},
]);
function createEngine(data) {
  function simulate(model,scenario,inputs={}) {
    const p={...DEFAULTS,...inputs}, errors=[];
    if(!data.engines[model]?.scenarios[scenario])return {valid:false,errors:['Unknown model or scenario.']};
    if(Object.values(p).some(v=>!isNumber(v)))return {valid:false,errors:['Every assumption must be a finite number.']};
    const rows=Object.fromEntries(Object.entries(data.engines[model].scenarios[scenario].rows).map(([k,v])=>[k,[...v]]));
    const get=(r,i)=>{const v=rows[r]?.[i];if(isNumber(v))return v;errors.push(`Missing numeric input: row ${r}, year ${2025+i}.`);return NaN;};
    const put=(r,i,v)=>{if(!rows[r])rows[r]=Array(5).fill(null);rows[r][i]=v;};
    for(const driver of DRIVERS){
      if(driver.icaap&&model!=='ICAAP')continue;
      for(const r of driver.rows)for(let i=1;i<5;i++)if(isNumber(rows[r]?.[i])){
        const v=driver.id==='growthPp'?rows[r][i]+p.growthPp/100:rows[r][i]*(1+p[driver.id]/100);
        put(r,i,v);
        if(r===9 ? v<=-1 : v<0||v>1)errors.push(`${driver.name}: ${2025+i} rate is outside its valid range.`);
      }
    }
    for(let i=1;i<4;i++){
      for(const group of [[25,27],[26,28],...(model==='ICAAP'?[[29,30,31]]:[])]){
        if(group.reduce((s,r)=>s+get(r,i),0)>1+1e-12)errors.push(`${2025+i}: outgoing transition / write-off rates exceed 100%.`);
      }
    }
    if(errors.length)return {valid:false,errors:[...new Set(errors)]};
    for(let i=1;i<=3;i++){
      const q=i-1, ICAAP=model==='ICAAP';
      if(ICAAP)put(10,i,get(11,q)*get(9,i));
      // Exposure flows are calculated from opening stage balances.
      for(const [r,stage,rate] of [[32,13,25],[33,14,26],[35,13,27],[36,14,28]])put(r,i,get(stage,q)*get(rate,i));
      put(34,i,get(35,i)+get(36,i));
      if(ICAAP){
        put(38,i,get(15,q)*get(29,i));put(39,i,get(15,q)*get(30,i));
        put(37,i,get(38,i)+get(39,i));put(64,i,get(15,q)*get(31,i));
      }
      put(13,i,get(13,q)-get(32,i)-get(35,i)+get(33,i)+(ICAAP?get(38,i)+get(10,i):0));
      put(14,i,get(14,q)-get(33,i)-get(36,i)+get(32,i)+(ICAAP?get(39,i):0));
      put(15,i,get(15,q)+get(34,i)-(ICAAP?get(37,i)+get(64,i):0));
      put(12,i,get(13,i)+get(14,i));put(11,i,get(12,i)+get(15,i));
      // Lifetime loss rates and forward one-year parameters (including 2029).
      put(43,i,get(42,i)*get(41,i));
      put(44,i,Math.max(get(43,i)-get(41,i)*get(28,i+1),0));
      if(ICAAP)put(46,i,get(10,i)>=0?get(10,i)*get(27,i+1)*get(40,i+1):get(10,i)*get(22,q));
      put(47,i,get(32,i)*get(43,i));put(48,i,get(32,i)*get(22,q));
      put(49,i,get(33,i)*get(27,i+1)*get(40,i+1));put(50,i,get(33,i)*get(23,q));
      put(52,i,get(35,i)*get(40,i));put(53,i,get(36,i)*get(41,i));put(51,i,get(52,i)+get(53,i));
      put(54,i,get(35,i)*get(22,q));put(55,i,get(36,i)*get(23,q));
      if(ICAAP){
        put(56,i,get(38,i)*get(27,i+1)*get(40,i+1));put(57,i,get(39,i)*get(43,i));
        put(59,i,get(38,i)*get(24,q));put(60,i,get(39,i)*get(24,q));put(58,i,get(59,i)+get(60,i));
        put(65,i,get(64,i)*get(24,q));put(66,i,get(64,i)*get(71,i));put(67,i,get(64,i)-get(65,i)-get(66,i));
      }
      put(61,i,get(13,q)*(1-get(25,i)-get(27,i))*(get(27,i+1)*get(40,i+1)-get(22,q)));
      put(62,i,get(14,q)*(1-get(26,i)-get(28,i))*(get(44,i)-get(23,q)));
      put(63,i,ICAAP?get(15,q)*(1-get(30,i)-get(29,i)-get(31,i))*(get(45,i)-get(24,q)):Math.max(0,get(15,q)*(get(45,i)-get(24,q))));
      put(18,i,get(18,q)+get(49,i)-get(48,i)-get(54,i)+get(61,i)+(ICAAP?get(56,i)+get(46,i):0));
      put(19,i,get(19,q)+get(47,i)-get(50,i)-get(55,i)+get(62,i)+(ICAAP?get(57,i):0));
      put(20,i,get(20,q)+get(52,i)+get(53,i)+get(63,i)-(ICAAP?get(59,i)+get(60,i)+get(65,i):0));
      put(17,i,get(18,i)+get(19,i));put(16,i,get(17,i)+get(20,i));
      for(const [r,n,d] of [[21,17,12],[22,18,13],[23,19,14],[24,20,15],[69,14,12],[70,15,11]]){
        if(get(d,i)<=0)errors.push(`${2025+i}: ratio denominator is not positive.`);
        put(r,i,get(n,i)/get(d,i));
      }
      put(73,i,-(get(16,i)-get(16,q)+(ICAAP?get(67,i):0)));
      for(const r of [11,13,14,15,16,18,19,20])if(get(r,i)<-1e-7)errors.push(`${2025+i}: negative ${r>=16?'provision':'exposure'} balance (row ${r}).`);
    }
    if(Object.values(rows).some(a=>a.some(v=>typeof v==='number'&&!Number.isFinite(v))))errors.push('A calculation did not produce a finite result.');
    const pl=[0];for(let i=1;i<=3;i++)pl.push(pl[i-1]+get(73,i));
    const costBps=[null,...[1,2,3].map(i=>-get(73,i)/((get(11,i-1)+get(11,i))/2)*10000)];
    return {valid:!errors.length,errors:[...new Set(errors)],model,scenario,inputs:p,rows,cumulative:pl,costBps,npl:rows[70][3],loss:-pl[3]};
  }
  function validateBase(){
    let count=0,maxDifference=0;const failures=[];
    for(const model of ['EBA','ICAAP'])for(const scenario of ['baseline','adverse']){
      const result=simulate(model,scenario);
      if(!result.valid)failures.push(...result.errors);
      for(const [r,vals] of Object.entries(data.engines[model].scenarios[scenario].rows))for(let i=0;i<4;i++)if(isNumber(vals[i])){
        const diff=Math.abs(vals[i]-result.rows[r][i]);count++;maxDifference=Math.max(maxDifference,diff);
        if(diff>1e-7*Math.max(1,Math.abs(vals[i])))failures.push(`${model}/${scenario}/${2025+i}/row ${r}`);
      }
    }
    return {pass:!failures.length,count,maxDifference,failures};
  }
  function sensitivity(model,scenario,outcome='loss'){
    const base=simulate(model,scenario);
    return {base:base[outcome],outcome,drivers:DRIVERS.filter(d=>!d.icaap||model==='ICAAP').map(d=>{
      const low=simulate(model,scenario,{[d.id]:-d.step}),high=simulate(model,scenario,{[d.id]:d.step});
      return {...d,low:low.valid?low[outcome]:null,high:high.valid?high[outcome]:null};
    }).sort((a,b)=>Math.max(Math.abs(b.low-base[outcome]),Math.abs(b.high-base[outcome]))-Math.max(Math.abs(a.low-base[outcome]),Math.abs(a.high-base[outcome])))};
  }
  function reverse(model,scenario,outcome,limit,maxShock=80){
    if(!['loss','npl'].includes(outcome)||!isNumber(limit)||limit<=0||(outcome==='npl'&&limit>1))return {valid:false,errors:['Enter a positive limit; an NPL limit cannot exceed 100%.']};
    const run=s=>simulate(model,scenario,{defaults:s,severity:s});
    const base=run(0);if(!base.valid)return base;
    if(base[outcome]>=limit)return {valid:true,status:'already',shock:0,result:base,limit,outcome};
    // Scan before refining: report the first crossing on this specified path,
    // without assuming the whole model is globally monotonic.
    let previous=0;
    for(let shock=1;shock<=maxShock;shock++){
      const result=run(shock);
      if(!result.valid)return {valid:false,errors:result.errors};
      if(result[outcome]>=limit){
        let a=previous,b=shock;
        for(let j=0;j<24;j++){const mid=(a+b)/2;if(run(mid)[outcome]>=limit)b=mid;else a=mid;}
        return {valid:true,status:'crossed',shock:b,result:run(b),limit,outcome};
      }
      previous=shock;
    }
    return {valid:true,status:'not-reached',shock:null,result:run(maxShock),limit,outcome,maxShock};
  }
  function capital(model,scenario,inputs){
    const {openingCapital,rwa,otherMovements,taxOffset,threshold}=inputs;
    if(!isNumber(openingCapital)||openingCapital<0||!Array.isArray(rwa)||rwa.length!==4||rwa.some(v=>!isNumber(v)||v<=0)||!Array.isArray(otherMovements)||otherMovements.length!==3||otherMovements.some(v=>!isNumber(v))||!isNumber(taxOffset)||taxOffset<0||taxOffset>1||!isNumber(threshold)||threshold<=0||threshold>1)return {valid:false,errors:['Complete the capital amounts, four positive RWA values, three net movements, tax offset and a positive threshold.']};
    const saved=data.engines[model].scenarios[scenario].rows,amounts=[openingCapital];
    for(let i=1;i<=3;i++)amounts.push(amounts[i-1]+saved[73][i]*(1-taxOffset)+otherMovements[i-1]);
    return {valid:true,amounts,ratios:amounts.map((v,i)=>v/rwa[i]),headroom:amounts.map((v,i)=>v-threshold*rwa[i]),rwa,threshold,taxOffset,otherMovements};
  }
  return Object.freeze({simulate,validateBase,sensitivity,reverse,capital});
}
globalThis.StressRisk=Object.freeze({createEngine,defaults:DEFAULTS,drivers:DRIVERS});
})();
