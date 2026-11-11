import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const data=JSON.parse(fs.readFileSync(new URL('../data/stress-data.json',import.meta.url),'utf8'));
const source=JSON.stringify(data),context={};
vm.runInNewContext(fs.readFileSync(new URL('../src/risk-engine.js',import.meta.url),'utf8'),context);
const engine=context.StressRisk.createEngine(data),check=engine.validateBase();
assert.ok(check.pass,check.failures.join('\n'));assert.equal(check.count,Object.values(data.engines).reduce((n,e)=>n+Object.values(e.scenarios).reduce((s,c)=>s+Object.values(c.rows).flatMap(v=>v.slice(0,4)).filter(v=>typeof v==='number').length,0),0));assert.ok(check.maxDifference<1e-9);
let cases=0;
for(const model of ['EBA','ICAAP'])for(const scenario of ['baseline','adverse']){
 const saved=data.engines[model].scenarios[scenario].rows,base=engine.simulate(model,scenario);
 const sum=r=>saved[r].slice(1,4).reduce((a,v)=>a+(v??0),0);
 const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${model} ${scenario}: ${a} != ${b}`);
 close(saved[15][0]+sum(35)+sum(36)-(model==='ICAAP'?sum(38)+sum(39)+sum(64):0),saved[15][3]);
 close(-[18,19,20].reduce((s,r)=>s+saved[r][3]-saved[r][0],0)-(model==='ICAAP'?sum(67):0),sum(73));
 const stressed=engine.simulate(model,scenario,{defaults:25,severity:20,lifetime:10,cures:10,recovery:10,growthPp:-.5});
 assert.ok(stressed.valid,stressed.errors.join('\n'));
 assert.ok(engine.simulate(model,scenario,{defaults:25}).npl>base.npl);
 assert.ok(engine.simulate(model,scenario,{severity:20}).loss>base.loss);
 close(engine.simulate(model,scenario,{severity:20}).npl,base.npl);
 if(model==='ICAAP')assert.ok(engine.simulate(model,scenario,{cures:30}).npl<base.npl);
 else close(engine.simulate(model,scenario,{cures:50,recovery:50,growthPp:3}).loss,base.loss);
 for(const settings of [{},{defaults:-40,severity:-30,lifetime:-20},{defaults:80,severity:80},{cures:50,recovery:-50,growthPp:-3}]){
  const r=engine.simulate(model,scenario,settings);assert.ok(r.valid,r.errors.join('\n'));
  for(let i=0;i<4;i++){
   close(r.rows[13][i]+r.rows[14][i]+r.rows[15][i],r.rows[11][i]);
   close(r.rows[18][i]+r.rows[19][i]+r.rows[20][i],r.rows[16][i]);
   close(r.rows[70][i],r.rows[15][i]/r.rows[11][i]);
   for(const row of [11,13,14,15,16,18,19,20])assert.ok(r.rows[row][i]>=0);
   if(i)close(r.costBps[i],-r.rows[73][i]/((r.rows[11][i-1]+r.rows[11][i])/2)*10000);
  }
  assert.equal(r.costBps[0],null);assert.equal(r.rows[11][4],null);
  for(const row of [11,13,14,15,16,18,19,20])close(r.rows[row][0],saved[row][0]);
  cases++;
 }
 for(const outcome of ['loss','npl']){
  const limit=engine.simulate(model,scenario,{defaults:20,severity:20})[outcome];
  const reverse=engine.reverse(model,scenario,outcome,limit);
  assert.equal(reverse.status,'crossed');assert.ok(Math.abs(reverse.shock-20)<1e-5);
  assert.ok(reverse.result[outcome]>=limit-1e-8);
  assert.ok(engine.simulate(model,scenario,{defaults:reverse.shock-.001,severity:reverse.shock-.001})[outcome]<limit);
 }
 assert.equal(engine.reverse(model,scenario,'npl',base.npl*.9).status,'already');
 assert.equal(engine.reverse(model,scenario,'loss',1e9).status,'not-reached');
 assert.equal(engine.simulate(model,scenario,{defaults:1000}).valid,false);
 assert.equal(engine.simulate(model,scenario,{severity:null}).valid,false);
 assert.equal(engine.reverse(model,scenario,'npl',1.5).valid,false);
 const capInputs={openingCapital:5000,rwa:[20000,21000,22000,23000],otherMovements:[0,0,0],taxOffset:0,threshold:.1};
 const cap=engine.capital(model,scenario,capInputs);assert.ok(cap.valid);
 close(cap.amounts[3],5000+base.cumulative[3]);close(cap.ratios[3],cap.amounts[3]/23000);close(cap.headroom[3],cap.amounts[3]-2300);
 assert.equal(engine.capital(model,scenario,{...capInputs,openingCapital:null}).valid,false);
 assert.equal(engine.capital(model,scenario,{...capInputs,rwa:[0,1,1,1]}).valid,false);
}
const missing=structuredClone(data);missing.engines.EBA.scenarios.adverse.rows[40][4]=null;
const unavailable=context.StressRisk.createEngine(missing).simulate('EBA','adverse');
assert.equal(unavailable.valid,false);assert.ok(unavailable.errors.some(e=>e.includes('Missing numeric input')));
assert.equal(JSON.stringify(data),source,'Simulation must not mutate the saved snapshot');
console.log(`PASS: ${check.count} saved values reproduced; ${cases} recalculated cases reconcile; reverse-stress boundaries, probability constraints, missing forward inputs, fixed opening stocks, capital inputs and snapshot immutability verified.`);
