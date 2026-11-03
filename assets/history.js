/* Caelochronis — grafici storici basati esclusivamente sulle osservazioni pubblicate. */
(() => {
  'use strict';
  const root = document.querySelector('#andamenti');
  if (!root) return;
  const canvas = document.querySelector('#history-chart');
  const context = canvas.getContext('2d');
  const status = document.querySelector('#history-status');
  const summary = document.querySelector('#history-summary');
  const choices = [...document.querySelectorAll('[data-history-range]')];
  const metricChoices = [...document.querySelectorAll('[data-history-metric]')];
  const chartDefs = {
    temp: { label:'Temperatura',unit:'°C',color:'#ecc178',digits:1 },
    humidity: { label:'Umidità',unit:'%',color:'#79c6dc',digits:0 },
    pressure: { label:'Pressione',unit:'hPa',color:'#bca4fa',digits:1 },
    windSpeed: { label:'Vento',unit:'km/h',color:'#7fd4b1',digits:1 },
    precipTotal: { label:'Pioggia giornaliera cumulata',unit:'mm',color:'#8db3f9',digits:1 }
  };
  let period=24, metric='temp', rows=[], hasLoaded=false;
  const fmt=(n,d=1)=>new Intl.NumberFormat('it-IT',{maximumFractionDigits:d,minimumFractionDigits:d}).format(n);
  const datetime=t=>new Date(t).toLocaleString('it-IT',{timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  const monthName=(date)=>date.getUTCFullYear()+'-'+String(date.getUTCMonth()+1).padStart(2,'0');
  function requiredMonths(){
    const now=new Date(), from=new Date(now.getTime()-31*24*3600*1000);
    const monthStart=new Date(Date.UTC(from.getUTCFullYear(),from.getUTCMonth(),1));
    const result=[];
    while(monthStart<=now){
      result.push(monthName(monthStart));
      monthStart.setUTCMonth(monthStart.getUTCMonth()+1);
    }
    return result;
  }
  async function load(){
    status.textContent='Lettura dell’archivio meteorologico…';
    const promises=requiredMonths().map(async m=>{
      const response=await fetch('./data/history/'+m+'.json',{cache:'no-store'});
      if(response.status===404)return [];
      if(!response.ok)throw new Error('Archivio '+m+' non disponibile');
      const items=await response.json();
      return Array.isArray(items)?items:[];
    });
    const results=await Promise.allSettled(promises);
    const successful=results.filter(x=>x.status==='fulfilled').flatMap(x=>x.value);
    const valid=successful.filter(x=>x&&x.stationId==='IDALMI6'&&Number.isFinite(Date.parse(x.observedAt)));
    const unique=new Map(valid.map(item=>[item.observedAt,item]));
    rows=[...unique.values()].sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt));
    hasLoaded=true;
    if(results.some(x=>x.status==='rejected'))status.textContent='Alcuni file storici non sono momentaneamente disponibili.';
    else if(!rows.length)status.textContent='Lo storico inizierà a riempirsi con i prossimi aggiornamenti automatici.';
    else status.textContent='Dati reali dalla stazione IDALMI6 · 1 rilevazione per ora circa · nessun valore stimato.';
    draw();
  }
  function filtered(){
    const since=Date.now()-period*3600000;
    return rows.filter(r=>Date.parse(r.observedAt)>=since && Number.isFinite(Number(r[metric])) && r[metric]!==null);
  }
  function draw(){
    const points=filtered(), cfg=chartDefs[metric];
    const width=Math.max(300,Math.round(canvas.getBoundingClientRect().width||600));
    const height=292,dpr=Math.min(2,window.devicePixelRatio||1);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    context.setTransform(dpr,0,0,dpr,0,0);
    context.clearRect(0,0,width,height);
    const left=54,right=18,top=20,bottom=46,W=width-left-right,H=height-top-bottom;
    const css=getComputedStyle(document.documentElement);
    context.font='11px system-ui, sans-serif';
    if(!points.length){
      context.fillStyle='#9eb5c4';context.textAlign='center';
      context.fillText(hasLoaded?'Nessun dato disponibile per questo intervallo':'Caricamento…',width/2,height/2);
      summary.textContent='Nessuna osservazione da visualizzare.';
      return;
    }
    const values=points.map(r=>Number(r[metric])),min=Math.min(...values),max=Math.max(...values);
    const pad=Math.max((max-min)*0.14,metric==='pressure'?0.3:metric==='humidity'?1:0.4);
    const lo=min-pad,hi=max+pad;
    const start=Date.now()-period*3600000,end=Date.now();
    const X=r=>left+Math.max(0,Math.min(1,(Date.parse(r.observedAt)-start)/(end-start)))*W;
    const Y=v=>top+(hi-v)/(hi-lo)*H;
    for(let i=0;i<=4;i++){
      const y=top+(H*i/4),val=hi-(hi-lo)*i/4;
      context.beginPath();context.moveTo(left,y);context.lineTo(left+W,y);
      context.strokeStyle='rgba(206,226,240,.13)';context.lineWidth=1;context.stroke();
      context.textAlign='right';context.fillStyle='#9eb5c4';
      context.fillText(fmt(val,cfg.digits),left-9,y+4);
    }
    const tickCount=width<540?3:5;
    for(let i=0;i<tickCount;i++){
      const t=new Date(start+(end-start)*i/(tickCount-1));
      const label=t.toLocaleString('it-IT',{timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',...(period===24?{hour:'2-digit',minute:'2-digit'}:{})});
      context.fillStyle='#9eb5c4';context.textAlign=i===0?'left':i===tickCount-1?'right':'center';
      context.fillText(label,left+W*i/(tickCount-1),height-17);
    }
    context.strokeStyle=cfg.color;context.lineWidth=2.4;context.lineJoin='round';
    const maxGap=period===24?2.5*3600000:3*3600000;
    context.beginPath();
    points.forEach((p,i)=>{
      const x=X(p),y=Y(Number(p[metric]));
      if(!i||Date.parse(p.observedAt)-Date.parse(points[i-1].observedAt)>maxGap)context.moveTo(x,y);
      else context.lineTo(x,y);
    });
    context.stroke();
    if(points.length<=40){
      context.fillStyle=cfg.color;
      points.forEach(p=>{context.beginPath();context.arc(X(p),Y(Number(p[metric])),2.3,0,Math.PI*2);context.fill()});
    }
    const avg=values.reduce((a,b)=>a+b,0)/values.length;
    summary.textContent=cfg.label+': min '+fmt(min,cfg.digits)+' '+cfg.unit+' · max '+fmt(max,cfg.digits)+' '+cfg.unit+' · media campioni '+fmt(avg,cfg.digits)+' '+cfg.unit+' · '+points.length+' osservazioni (ultima '+datetime(points[points.length-1].observedAt)+').';
  }
  choices.forEach(button=>button.addEventListener('click',()=>{
    period=Number(button.dataset.historyRange);
    choices.forEach(b=>b.classList.toggle('active',b===button));
    draw();
  }));
  metricChoices.forEach(button=>button.addEventListener('click',()=>{
    metric=button.dataset.historyMetric;
    metricChoices.forEach(b=>b.classList.toggle('active',b===button));
    draw();
  }));
  let queued=false;
  window.addEventListener('resize',()=>{
    if(queued)return;
    queued=true;requestAnimationFrame(()=>{queued=false;draw()});
  });
  load();
})();
