(function(){
  const $=id=>document.getElementById(id);
  const S='var(--steel)',A='var(--alu)',O='var(--series-3)';
  const row=(lab,w,c,val,extra='')=>`<div class="bar"><span class="lab">${lab}</span><span class="track">${extra}<span class="fill" style="width:${Math.max(w,0.4)}%;background:${c}"></span></span><span class="val">${val}</span></div>`;
  const grp=(name,inner)=>`<div style="display:flex;flex-direction:column;gap:4px"><span style="font-size:.85rem;font-weight:600">${name}</span>${inner}</div>`;

  const mat=[['Density',7872,2713,'kg/m³'],['Yield strength',250,259.2,'MPa'],['Ultimate strength',460,313.1,'MPa'],["Young's modulus",200,68.9,'GPa']];
  $('matbars').innerHTML=mat.map(m=>{const mx=Math.max(m[1],m[2]);return grp(m[0],row('Steel',m[1]/mx*100,S,`${m[1]} ${m[3]}`)+row('Alu',m[2]/mx*100,A,`${m[2]} ${m[3]}`))}).join('');

  const def=[['Base',0.0015562,0.00048213],['Joint',0.0071232,0.0036526],['Link-1',0.083389,0.065192],['Link-2',0.085189,0.068636]];
  $('defbars').innerHTML=def.map(d=>grp(d[0],row('Pick-up',d[1]/0.09*100,O,d[1].toPrecision(3))+row('At 90°',d[2]/0.09*100,S,d[2].toPrecision(3)))).join('');

  const st=[['Base',5.1493,250,S],['Joint',8.8051,250,S],['Link-1',4.438,259.2,A],['Link-2',1.1322,259.2,A]];
  $('strbars').innerHTML=st.map(s=>row(s[0],s[1]/260*100,s[3],`${s[1].toFixed(2)} / ${s[2]}`,`<span class="mark" style="left:${s[2]/260*100-0.5}%"></span>`)).join('');

  const fos=[['Base',15,15],['Joint',9.7898,4.631],['Link-1',15,9.0155],['Link-2',15,15]];
  const mk=`<span class="mark" style="left:${100/15}%"></span>`;
  $('fosbars').innerHTML=fos.map(f=>grp(f[0],row('Pick-up',f[1]/15*100,O,f[1]==15?'≥15':f[1].toFixed(2),mk)+row('At 90°',f[2]/15*100,S,f[2]==15?'≥15':f[2].toFixed(2),mk))).join('');

  // motion
  const lerp=(a,b,u)=>a+(b-a)*Math.min(1,Math.max(0,u));
  const joint=t=>t<30?lerp(0,90,t/30):t<60?90:t<90?lerp(90,0,(t-60)/30):0;
  function tri(t,pk){const seg=(s,e)=>{const m=(s+e)/2;return t<m?lerp(0,pk,(t-s)/(m-s)):lerp(pk,0,(t-m)/(e-m))};
    if(t>=30&&t<=58)return seg(30,58);if(t>=92&&t<=120)return seg(92,120);return 0}
  const l1=t=>tri(t,25), l2=t=>tri(t,10);
  const G=$('graph'),gx=v=>40+v/120*590,gy=v=>130-v/90*115;
  let g='<g font-size="10" fill="var(--muted)">';
  [0,30,60,90,120].forEach(v=>{g+=`<line x1="${gx(v)}" y1="15" x2="${gx(v)}" y2="130" stroke="var(--border)"/><text x="${gx(v)}" y="144" text-anchor="middle">${v}s</text>`});
  [0,25,45,90].forEach(v=>{g+=`<text x="34" y="${gy(v)+3}" text-anchor="end">${v}°</text>`});
  g+='</g>';
  const line=(f,c)=>{let d='';for(let t=0;t<=120;t+=0.5)d+=(t?'L':'M')+gx(t).toFixed(1)+' '+gy(f(t)).toFixed(1);return `<path d="${d}" fill="none" stroke="${c}" stroke-width="2.2"/>`};
  g+=line(joint,S)+line(l1,A)+line(l2,O)+'<line id="cur" x1="40" y1="12" x2="40" y2="130" stroke="var(--text)" stroke-width="1.2"/>';
  G.innerHTML=g;
  const phases=[[30,'Swinging 90° from the origin to the target, carrying the part.'],[60,'At the target: arms tilt up and back down to place the part.'],[90,'Swinging back 90° to the origin.'],[121,'At the origin: arms tilt up and down again to pick the next part.']];
  function draw(t){
    const a1=l1(t)*Math.PI/180,a2=l2(t)*Math.PI/180,px=85,py=100,L1=165,L2=55;
    const ex=px+L1*Math.cos(a1),ey=py-L1*Math.sin(a1),dir=Math.PI/2-a1+a2,fx=ex+L2*Math.cos(dir),fy=ey+L2*Math.sin(dir);
    $('l1').innerHTML=`<line x1="${px}" y1="${py}" x2="${ex}" y2="${ey}" stroke="var(--alu)" stroke-width="14" stroke-linecap="round"/><line x1="${ex}" y1="${ey}" x2="${fx}" y2="${fy}" stroke="var(--alu)" stroke-width="10" stroke-linecap="round" opacity=".85"/><circle cx="${ex}" cy="${ey}" r="4" fill="var(--chip)"/><rect x="${fx-15}" y="${fy+4}" width="30" height="24" rx="3" fill="var(--steel)" opacity=".6"/>`;
    const j=joint(t)*Math.PI/180,cx=60,cy=140,R=110,tx=cx+R*Math.cos(-j),ty=cy+R*Math.sin(-j);
    $('topArm').innerHTML=`<line x1="${cx}" y1="${cy}" x2="${tx}" y2="${ty}" stroke="var(--alu)" stroke-width="12" stroke-linecap="round"/><rect x="${tx-11}" y="${ty-11}" width="22" height="22" fill="var(--steel)" opacity=".7"/>`;
    $('cur').setAttribute('x1',gx(t));$('cur').setAttribute('x2',gx(t));
    $('rt').textContent=t.toFixed(0)+' s';$('rj').textContent=joint(t).toFixed(0)+'°';$('r1').textContent=l1(t).toFixed(1)+'°';$('r2').textContent=l2(t).toFixed(1)+'°';
    $('phase').innerHTML='<b>Now:</b> '+phases.find(p=>t<p[0])[1];
  }
  const sl=$('t');let raf=null,last=0;
  sl.addEventListener('input',()=>draw(+sl.value));
  function step(ts){if(!last)last=ts;let t=+sl.value+(ts-last)/1000*12;last=ts;if(t>120)t=0;sl.value=t;draw(t);raf=requestAnimationFrame(step)}
  $('play').addEventListener('click',()=>{if(raf){cancelAnimationFrame(raf);raf=null;$('play').textContent='Play'}else{last=0;raf=requestAnimationFrame(step);$('play').textContent='Pause'}});
  draw(0);

  // auto-cycle stepper
  const steps=[
    {n:'Home',nets:'N13 to N16',flag:'M50.0, M50.1',tgt:'Home counts: base %VD1002, shoulder %VD1028',adv:'Base below −745000 and shoulder above −57648500 counts',mag:0},
    {n:'Point 1',nets:'N21',flag:'M31.0',tgt:'%VD2300 → %VD1002 and %VD2400 → %VD1028',adv:'Both axes within ±2000 counts of the targets',mag:0},
    {n:'Point 2',nets:'N22',flag:'M31.1',tgt:'%VD2304 → %VD1002 and %VD2404 → %VD1028',adv:'Both axes within ±2000 counts',mag:0},
    {n:'Point 3 (pick)',nets:'N23',flag:'M31.2, also M30.6',tgt:'%VD2308 → %VD1002 and %VD2408 → %VD1028',adv:'Both axes within window; the magnet switches on',mag:1},
    {n:'Dwell',nets:'N24',flag:'M31.3',tgt:'Targets unchanged',adv:'On-delay T21 (preset 20) has finished',mag:1},
    {n:'Lift to point 2',nets:'N25',flag:'M31.4',tgt:'%VD2304 and %VD2404',adv:'Both axes within ±2000 counts',mag:1},
    {n:'Point 4',nets:'N26',flag:'M31.5',tgt:'%VD2312 and %VD2412',adv:'Both axes within ±2000 counts',mag:1},
    {n:'Point 5 (place)',nets:'N27',flag:'M31.6',tgt:'%VD2316 and %VD2416',adv:'Both axes within window',mag:1},
    {n:'Release and count',nets:'N28 to N30',flag:'M31.7',tgt:'Targets unchanged',adv:'On-delays T22 and T23 release the magnet (M30.6 reset) and C2 counts the cycle; T26 then sets the flag',mag:0},
    {n:'Repeat or stop',nets:'N31 to N35',flag:'M32.0, or M30.2 to stop',tgt:'Point 4, then point 2, then back to point 3; or point 1 to finish',adv:'C2 (cycles done) reaches %VW2036 (cycles wanted)',mag:0}
  ];
  let si=0,sTimer=null;
  const sbs=$('sbs');
  steps.forEach((s,i)=>{const b=document.createElement('button');b.type='button';b.className='sb';b.textContent=(i+1)+'. '+s.n;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>{stopPlay();show(i)});sbs.appendChild(b)});
  function show(i){si=(i+steps.length)%steps.length;const s=steps[si];
    [...sbs.children].forEach((b,k)=>b.setAttribute('aria-pressed',k===si?'true':'false'));
    $('d-name').textContent=s.n;$('d-nets').textContent=s.nets;$('d-flag').textContent=s.flag;$('d-tgt').textContent=s.tgt;$('d-adv').textContent=s.adv;
    const m=$('d-mag');m.textContent=s.mag?'on':'off';m.className='pill'+(s.mag?' on':'')}
  function stopPlay(){if(sTimer){clearInterval(sTimer);sTimer=null;$('splay').textContent='Play'}}
  $('sprev').addEventListener('click',()=>{stopPlay();show(si-1)});
  $('snext').addEventListener('click',()=>{stopPlay();show(si+1)});
  $('splay').addEventListener('click',()=>{if(sTimer){stopPlay()}else{$('splay').textContent='Pause';sTimer=setInterval(()=>show(si+1),2200)}});
  show(0);
})();
