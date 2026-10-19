/** Bounded numerical sampling for user-created references; astronomy stays native. */
(() => {
  const cache=new Map();
  const memo=(key,fn)=>{
    if(cache.has(key))return cache.get(key);
    const value=fn();
    if(cache.size>=100)cache.delete(cache.keys().next().value);
    cache.set(key,value);return value;
  };
  function crossings(position,threshold){
    const value=time=>position(time).alt-threshold;
    const samples=Array.from({length:145},(_,i)=>({time:i*10,y:value(i*10)}));
    const points=[...samples];
    // A short visibility interval can fit between two 10-minute samples.
    // Refine local extrema before searching for sign changes on either side.
    const candidates=[];
    for(let i=1;i<samples.length-1;i++){
      const a=samples[i-1],b=samples[i],c=samples[i+1];
      const maximum=b.y>=a.y&&b.y>=c.y&&(b.y-a.y>1e-9||b.y-c.y>1e-9);
      const minimum=b.y<=a.y&&b.y<=c.y&&(a.y-b.y>1e-9||c.y-b.y>1e-9);
      if(maximum&&b.y<=0)candidates.push({left:a.time,right:c.time,maximum:true});
      if(minimum&&b.y>0)candidates.push({left:a.time,right:c.time,maximum:false});
    }
    // Culmination can also fall just inside either end of the observation day.
    for(const [a,b]of [[samples[0],samples[1]],[samples.at(-2),samples.at(-1)]]){
      if(Math.abs(a.y-b.y)<=1e-9)continue;
      const edge=a.time===0?a:b,maximum=edge.y> (a.time===0?b:a).y;
      if(maximum?edge.y<=0:edge.y>0)candidates.push({left:a.time,right:b.time,maximum});
    }
    for(const candidate of candidates){
      let {left,right,maximum}=candidate;
      for(let n=0;n<32;n++){
        const x=left+(right-left)/3,z=right-(right-left)/3;
        if(maximum?value(x)<value(z):value(x)>value(z))left=x;else right=z;
      }
      const time=(left+right)/2;points.push({time,y:value(time)});
    }
    points.sort((a,b)=>a.time-b.time);
    // Zero-height tangencies are not rise/set crossings. Ignore rounding noise.
    const stable=points.filter(p=>Math.abs(p.y)>1e-9),events=[];
    for(let i=1;i<stable.length;i++){
      const a=stable[i-1],b=stable[i];
      if((a.y>0)===(b.y>0))continue;
      let left=a.time,right=b.time;
      for(let n=0;n<20;n++){
        const mid=(left+right)/2;
        if((value(mid)>0)===(a.y>0))left=mid;else right=mid;
      }
      const time=(left+right)/2;
      if(!events.length||time-events.at(-1).time>1e-5)events.push({time,az:position(time).az});
    }
    for(const time of [0,1440])if(Math.abs(value(time))<=1e-9){const before=value(time-.01),after=value(time+.01);if(Math.abs(before)>1e-9&&Math.abs(after)>1e-9&&(before>0)!==(after>0))events.push({time,az:position(time).az});}
    return events.sort((a,b)=>a.time-b.time).filter((event,i,list)=>!i||event.time-list[i-1].time>1e-5);
  }
  window.SkyDiagramSampling={
    memo,
    clock(time){const minute=Math.round(time);return Math.floor(minute/60)+':'+String(minute%60).padStart(2,'0');},
    events(date,threshold,body,lat,lon,manualDec=null){
      return memo(JSON.stringify(['events',date,threshold,body,lat,lon,manualDec]),()=>
        crossings(t=>manualDec===null?skyRaw(body,t,date,lat,lon):solar(lat,manualDec,t),threshold));
    },
    year(options){
      const key=['year',options.date.slice(0,4),options.lat,options.lon,options.analemmaClock,options.analemmaBasis,options.analemmaOffset,!!options.analemmaIdeal,options.analemmaTilt,options.analemmaEccentricity];
      return memo(JSON.stringify(key),()=>{
        const y=Number(options.date.slice(0,4)),start=Date.UTC(y,0,1,12),end=Date.UTC(y+1,0,1,12),points=[];
        for(let t=start;t<end;t+=6*86400000)points.push(analemmaSample(new Date(t).toISOString().slice(0,10),options));
        points.push(analemmaSample(`${y}-12-31`,options));return points;
      });
    }
  };
})();
