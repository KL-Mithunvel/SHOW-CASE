(function(){
  const NS='http://www.w3.org/2000/svg';
  const el=(tag,attrs,style)=>{const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(style)e.setAttribute('style',style);return e;};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  const lerp=(a,b,t)=>a+(b-a)*t;
  let reduce=false; try{reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}

  function timeline(phases){
    const T=phases.reduce((s,p)=>s+p.d,0);
    return {T, at(t){let a=0;for(let i=0;i<phases.length;i++){const p=phases[i];if(t<a+p.d||i===phases.length-1)return {i,p,u:clamp((t-a)/p.d,0,1)};a+=p.d;}}};
  }
  function runner(draw,T,btn,scrub){
    let t=0,playing=!reduce,last=null;
    function frame(ts){
      if(last!==null&&playing){t=(t+(ts-last)/1000)%T;}
      last=ts;draw(t);if(scrub&&playing)scrub.value=Math.round(t/T*1000);
      requestAnimationFrame(frame);
    }
    btn.textContent=playing?'Pause':'Play';
    btn.addEventListener('click',()=>{playing=!playing;btn.textContent=playing?'Pause':'Play';});
    if(scrub)scrub.addEventListener('input',()=>{t=scrub.value/1000*T;if(playing){playing=false;btn.textContent='Play';}});
    draw(reduce?T*0.55:0);
    requestAnimationFrame(frame);
  }

  /* ---------- mechanism: SG90 + pinion + two racks ---------- */
  (function(){
    const R=44,N=18,PITCH=2*Math.PI*R/N,CX=290,CY=170,MAXA=60;
    const gear=document.getElementById('m-gear');
    let d='';
    for(let i=0;i<N;i++){
      const a=i*2*Math.PI/N,s=2*Math.PI/N;
      const pts=[[R-6,a],[R+6,a+s*0.2],[R+6,a+s*0.45],[R-6,a+s*0.65],[R-6,a+s]];
      pts.forEach((p,j)=>{d+=(i===0&&j===0?'M':'L')+(p[0]*Math.cos(p[1])).toFixed(2)+','+(p[0]*Math.sin(p[1])).toFixed(2);});
    }
    const gp=el('path',{d:d+'Z'},'fill:var(--gear);stroke:var(--head-dark);stroke-width:1');
    gear.appendChild(gp);
    gear.appendChild(el('circle',{cx:0,cy:0,r:22},'fill:none;stroke:var(--head-dark);stroke-width:1;opacity:.5'));
    function rack(g,x,teethRight){
      const L=170,top=CY-L/2;
      g.appendChild(el('rect',{x:x,y:top,width:20,height:L,rx:2},'fill:var(--rack);stroke:var(--appl-line)'));
      let p='';const tx=teethRight?x+20:x;const dir=teethRight?1:-1;
      for(let y=top+4;y<top+L-PITCH;y+=PITCH){p+=`M${tx},${y} L${tx+dir*10},${y+PITCH*0.3} L${tx+dir*10},${y+PITCH*0.55} L${tx},${y+PITCH*0.85} Z `;}
      g.appendChild(el('path',{d:p},'fill:var(--rack);stroke:var(--appl-line)'));
    }
    const rL=document.getElementById('m-rackL'),rR=document.getElementById('m-rackR');
    rack(rL,222,true);rack(rR,338,false);
    const stack=document.getElementById('m-stack'),magG=document.getElementById('m-mag');
    const mags=[];
    function magnet(){const g=el('g',{});g.appendChild(el('rect',{x:0,y:0,width:44,height:12,rx:2},'fill:var(--mag)'));g.appendChild(el('rect',{x:0,y:0,width:44,height:6,rx:2},'fill:var(--mag-n);opacity:.9'));return g;}
    for(let k=0;k<11;k++){const m=magnet();stack.appendChild(m);mags.push(m);}
    const mv=magnet();magG.appendChild(mv);
    const aL=document.getElementById('m-arrowL'),aR=document.getElementById('m-arrowR'),ph=document.getElementById('mech-phase');
    const P=[
      {d:.7,n:'Ready: magazine loaded'},
      {d:1.3,n:'Dispense stroke: servo turns, dispense rack feeds one magnet'},
      {d:.9,n:'Head moves the tip over the pocket'},
      {d:1.4,n:'Press fit into the pocket, then release stroke frees the magnet; tool shears away'},
      {d:1.0,n:'Servo returns home, stack drops by one'},
      {d:.9,n:'Magnet seated, ready for the next one'}];
    const tl=timeline(P);
    const path=[[58,244],[58,294],[408,294]];
    function along(u){const L1=50,L2=350,s=u*(L1+L2);if(s<L1)return[58,244+s];return[58+(s-L1),294];}
    let lastI=-1;
    function draw(t){
      const {i,u}=tl.at(t);let ang=0,mx=null,my=null,shift=0,show=true;
      if(i===0){ang=0;mx=58;my=244;}
      else if(i===1){const e=ease(u);ang=MAXA*e;[mx,my]=along(e);}
      else if(i===2){ang=MAXA;mx=408;my=294;}
      else if(i===3){const e=ease(u);ang=lerp(MAXA,-MAXA,e);mx=408;my=e<.6?294:lerp(294,332,ease((e-.6)/.4));}
      else if(i===4){ang=lerp(-MAXA,0,ease(u));mx=408;my=332;shift=ease(u);}
      else {ang=0;mx=408;my=332;shift=1;}
      const dpx=R*ang*Math.PI/180;
      gear.setAttribute('transform',`translate(${CX},${CY}) rotate(${-ang})`);
      rL.setAttribute('transform',`translate(0,${dpx})`);
      rR.setAttribute('transform',`translate(0,${-dpx})`);
      // stack: slot k at y=244-18k (k=0 bottom, which is the moving magnet in phase 0)
      const moving=i>=1;
      mags.forEach((m,k)=>{
        const slot=k+1; // stack sits above the dispensed one
        const y=244-18*slot+18*(i>=4||i===5?shift:0);
        m.setAttribute('transform',`translate(58,${y})`);
        m.style.display=slot<=11?'':'none';
      });
      mv.setAttribute('transform',`translate(${mx},${my})`);
      aL.textContent=Math.abs(dpx)<1?'':(dpx>0?'↓':'↑');
      aR.textContent=Math.abs(dpx)<1?'':(dpx>0?'↑':'↓');
      if(i!==lastI){ph.textContent=P[i].n;lastI=i;}
    }
    runner(draw,tl.T,document.getElementById('mech-play'),null);
  })();

  /* ---------- insert cycle, side section view ---------- */
  (function(){
    const BED=270,FLOOR=240,WALL=225,CAP=212,SH=25,OFF=260,TIPZ=20,POCK=325,PARKY=150,PARKX=40;
    const part=document.getElementById('c-part'),voidR=document.getElementById('c-void');
    const head=document.getElementById('c-head'),magG=document.getElementById('c-mag');
    const note=document.getElementById('c-note'),temp=document.getElementById('c-temp');
    const gl=document.getElementById('cyc-g'),list=document.getElementById('cyc-phases');
    // head drawing in local coords, nozzle tip at (0,0)
    head.appendChild(el('rect',{x:-30,y:-96,width:OFF+60,height:16,rx:3},'fill:var(--head)'));
    head.appendChild(el('rect',{x:-18,y:-80,width:36,height:66,rx:3},'fill:var(--head)'));
    head.appendChild(el('polygon',{points:'-7,-14 7,-14 0,0'},'fill:var(--head-dark)'));
    head.appendChild(el('rect',{x:OFF-20,y:-80,width:40,height:80-TIPZ-10,rx:3},'fill:var(--appl);stroke:var(--appl-line)'));
    head.appendChild(el('rect',{x:OFF-13,y:-TIPZ-10,width:26,height:10,rx:2},'fill:var(--appl);stroke:var(--appl-line)'));
    const nozT=el('text',{x:0,y:-104,'text-anchor':'middle'});nozT.textContent='nozzle';head.appendChild(nozT);
    const tipT=el('text',{x:OFF,y:-104,'text-anchor':'middle'});tipT.textContent='applicator tip';head.appendChild(tipT);
    const mag=el('g',{});mag.appendChild(el('rect',{x:0,y:0,width:50,height:15,rx:2},'fill:var(--mag)'));mag.appendChild(el('rect',{x:0,y:0,width:50,height:7.5,rx:2},'fill:var(--mag-n);opacity:.9'));magG.appendChild(mag);
    const zig=s=>255+140*(0.5-0.5*Math.cos(s*5));
    const P=[
      {n:'Print to pocket',d:3.2,g:'G1 X118.4 Y102.7 E0.0213   ; each line answered with ok, layer by layer'},
      {n:'Save + park',d:1.4,g:'M83 · G1 E-3 F2400 · G90 · G1 Z+15 F6000 · M400 · M104 S160'},
      {n:'Dispense',d:1.2,g:'PC → Uno: DISPENSE      Uno → PC: OK DISPENSE'},
      {n:'Approach',d:1.2,g:'G1 X58.0 Y146.8 F6000 · M400   ; nozzle = pocket (X110 Y110) − tool offset'},
      {n:'Press fit',d:1.4,g:'G1 Z6.04 F60 · G4 P500 · M400   ; slow push, magnet press-fits into the pocket'},
      {n:'Release + shear',d:1.6,g:'release stroke · G1 X53.0 F1200 · M400   ; tool shears sideways, pocket walls hold the magnet'},
      {n:'Lift + confirm',d:1.4,g:'G1 Z+15 · park · M400 · operator: Success / Retry / Abort'},
      {n:'Resume',d:1.2,g:'M109 S240 · G1 X Y (saved) · G1 Z (saved) · G1 E3 · G92 E(saved) · M82'},
      {n:'Seal over',d:2.4,g:'streaming continues: the remaining layers print over the magnet'},
      {n:'Done',d:1.2,g:'; magnet sealed inside the part'}];
    P.forEach(p=>{const li=document.createElement('li');li.textContent=p.n;list.appendChild(li);});
    const lis=[...list.children];
    const tl=timeline(P);
    const endPrintX=zig(P[0].d*1.0), resumeY=WALL-2;
    let lastI=-1;
    function draw(t){
      const {i,u}=tl.at(t);const e=ease(u);
      let top,nx,ny,ms='none',my=0,mo=1,nt='',tt='';
      const pressY=FLOOR-15+TIPZ; // nozzle y when magnet bottom touches floor
      switch(i){
        case 0: top=lerp(BED,WALL,u);nx=zig(u*P[0].d);ny=top-1;tt='nozzle 240 °C';break;
        case 1: top=WALL;nx=lerp(endPrintX,PARKX,e);ny=lerp(WALL-1,PARKY,Math.min(1,e*1.6));tt='nozzle → 160 °C standby';nt='print paused';break;
        case 2: top=WALL;nx=PARKX;ny=PARKY;ms='disp';my=u;tt='160 °C standby';nt='servo: dispense stroke';break;
        case 3: top=WALL;nx=lerp(PARKX,POCK-OFF,e);ny=PARKY;ms='held';tt='160 °C standby';break;
        case 4: top=WALL;nx=POCK-OFF;ny=lerp(PARKY,pressY,ease(Math.min(1,u*1.25)));ms='held';tt='slow Z, F60';nt=u>.6?'press fit into pocket':'';break;
        case 5: top=WALL;nx=u<.35?POCK-OFF:lerp(POCK-OFF,POCK-OFF-SH,ease((u-.35)/.65));ny=pressY;ms=u<.3?'held':'seated';nt=u<.35?'servo: release stroke':'shear away sideways';break;
        case 6: top=WALL;nx=lerp(POCK-OFF-SH,PARKX,e);ny=lerp(pressY,PARKY,Math.min(1,e*1.6));ms='seated';nt=u>.5?'operator: Success':'';break;
        case 7: top=WALL;nx=lerp(PARKX,endPrintX,e);ny=lerp(PARKY,resumeY,e);ms='seated';tt='reheat, M109 S240';break;
        case 8: top=lerp(WALL,CAP,u);nx=zig(P[0].d+u*P[8].d);ny=top-1;ms='seated';tt='nozzle 240 °C';break;
        default: top=CAP;nx=lerp(zig(P[0].d+P[8].d),PARKX+40,e);ny=lerp(CAP-1,PARKY,e);ms='seated';nt='magnet sealed inside';
      }
      part.setAttribute('y',top);part.setAttribute('height',BED-top);
      const vTop=Math.max(top,WALL);
      if(top<FLOOR){voidR.setAttribute('y',vTop);voidR.setAttribute('height',FLOOR-vTop);}else{voidR.setAttribute('height',0);}
      // sealed cap drawn over void by drawing part again? cap region is above WALL so void (WALL..FLOOR) stays: section view shows the cavity
      head.setAttribute('transform',`translate(${nx},${ny})`);
      if(ms==='none'){mag.style.display='none';}
      else{
        mag.style.display='';let mx,myy,op=1;
        if(ms==='disp'){mx=nx+OFF-25;myy=lerp(ny-70,ny-TIPZ,ease(my));op=clamp(my*2,0,1);}
        else if(ms==='held'){mx=nx+OFF-25;myy=ny-TIPZ;}
        else {mx=POCK-25;myy=FLOOR-15;op=(i>=8&&top<WALL)?0.75:1;}
        mag.setAttribute('transform',`translate(${mx},${myy})`);mag.style.opacity=op;
      }
      note.textContent=nt;temp.textContent=tt;
      if(i!==lastI){gl.textContent=P[i].g;lis.forEach((l,k)=>l.classList.toggle('on',k===i));lastI=i;}
    }
    runner(draw,tl.T,document.getElementById('cyc-play'),document.getElementById('cyc-scrub'));
  })();
})();
