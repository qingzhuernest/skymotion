/* One shared, lazy, read-only assistant. Questions stay in this page's memory. */
(() => {
  if (document.body?.dataset.embedded==='true'||new URLSearchParams(location.search).get('embed')==='1') return;
  const script = document.currentScript;
  const base = new URL('.',script.src);
  const site = new URL('../',base);
  const en = ()=> (window.skyLanguage?.()||document.documentElement.lang)==='en';
  const tr=(zh,english)=>en()?english:zh;
  const node=(tag,text,className)=>{
    const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;
  };
  const host=node('div',undefined,'sky-assistant');host.dataset.i18nSkip='';
  const launch=node('button',undefined,'assistant-launch');launch.type='button';launch.setAttribute('aria-haspopup','dialog');launch.setAttribute('aria-expanded','false');
  const dialog=node('dialog',undefined,'assistant-dialog');dialog.setAttribute('aria-labelledby','assistant-title');
  const header=node('header',undefined,'assistant-header');
  const title=node('h2');title.id='assistant-title';title.tabIndex=-1;
  const close=node('button',undefined,'assistant-close');close.type='button';
  header.append(title,close);
  const intro=node('p',undefined,'assistant-intro');
  const examples=node('div',undefined,'assistant-examples');
  const log=node('div',undefined,'assistant-log');log.setAttribute('role','log');log.setAttribute('aria-label','Answers');
  const status=node('p',undefined,'assistant-status');status.setAttribute('role','status');
  const form=node('form',undefined,'assistant-form');
  const label=node('label');label.htmlFor='assistant-question';
  const input=node('textarea');input.id='assistant-question';input.rows=2;input.maxLength=500;input.required=true;
  const submit=node('button',undefined,'assistant-submit');submit.type='submit';
  form.append(label,input,submit);
  dialog.append(header,intro,examples,log,status,form);host.append(launch,dialog);document.body.append(host);
  let knowledge, engine, searchModule, worker, request=0, pending, history=[], previousId;
  let loadPromise;
  function loading(){
    loadPromise ||= Promise.all([
      fetch(new URL('knowledge.json',base)).then(r=>{if(!r.ok)throw Error('knowledge');return r.json();}),
      fetch(new URL('knowledge-version.json',base)).then(r=>{if(!r.ok)throw Error('version');return r.json();}),
      import(new URL('search.js',base).href)
    ]).then(([data,version,module])=>{
      if(data.version!==version.version)throw Error('Knowledge version mismatch');
      knowledge={records:data.records,version:version.version};searchModule=module;engine=module.createSearch(data.records);
    })
      .catch(error=>{loadPromise=null;throw error;});
    return loadPromise;
  }
  function target(card){
    if(!card.target)return null;
    const url=new URL(card.target,site);
    if(url.origin!==site.origin||!url.pathname.startsWith(site.pathname)||!url.pathname.endsWith('.html'))return null;
    if(en())url.pathname=url.pathname.replace(/(?<!\.en)\.html$/,'.en.html');
    return url.href;
  }
  function showCard(card,container){
    const content=en()&&card.en?card.en:card;
    container.append(node('p',card.id+' · '+(card.intent==='science'?tr('科学原理','Science'):tr('操作指导','How to')),'assistant-source'));
    if(card.status==='draft')container.append(node('p',tr('资料草稿：此条尚未逐项核实，仅供查阅。','Source draft: this entry has not been individually checked.'),'assistant-caution'));
    if(en()&&!card.en)container.append(node('p','This source entry is currently available in Chinese.','assistant-caution'));
    container.append(node('h3',content.title),node('p',content.answer));
    if(content.steps?.length){const list=node('ol');for(const step of content.steps)list.append(node('li',step));container.append(list);}
    for(const warning of content.warnings||[])container.append(node('p',warning,'assistant-caution'));
    const url=target(card);
    if(url){const link=node('a',tr('查看对应使用手册 →','Read the relevant guide →'));link.href=url;container.append(link);}
    const copy=node('button',tr('复制答案','Copy answer'),'assistant-copy');copy.type='button';
    copy.onclick=async()=>{
      try{await navigator.clipboard.writeText([content.title,content.answer,...(content.steps||[]),...(content.warnings||[]),card.id].join('\n'));status.textContent=tr('答案已复制。','Answer copied.');}
      catch{status.textContent=tr('无法自动复制，请选中文字复制。','Select the answer text to copy it.');}
    };container.append(copy);
  }
  function render(){
    launch.textContent=tr('Sky 助手','Sky assistant');title.textContent=tr('Sky 助手 · 预览','Sky assistant · Preview');
    close.textContent=tr('关闭','Close');intro.textContent=tr('本地知识问答，不上传问题，也不会替你修改实验。语义模型仅在需要时下载，首次约 48 MB。','Local knowledge answers. Questions stay on this device; experiments are not changed. Semantic search downloads about 48 MB on first use, only when needed.');
    label.textContent=tr('你想了解什么？','What would you like to know?');input.placeholder=tr('例如：怎样比较两个城市的太阳轨迹？','For example: compare the Sun’s paths for two cities');submit.textContent=tr('提问','Ask');
    examples.replaceChildren();
    for(const question of [tr('怎样比较两个城市的太阳轨迹？','How do I compare two cities?'),tr('为什么有四季？','Why are there seasons?'),tr('日行迹是什么？','What is an analemma?')]){
      const button=node('button',question);button.type='button';button.onclick=()=>{input.value=question;form.requestSubmit();};examples.append(button);
    }
    log.replaceChildren();
    for(const turn of history){
      const article=node('article',undefined,'assistant-turn');article.append(node('p',turn.question,'assistant-user'));
      if(turn.message)article.append(node('p',tr(...turn.message)));
      if(turn.card)showCard(turn.card,article);
      if(turn.candidates?.length){
        const list=node('div',undefined,'assistant-candidates');
        for(const card of turn.candidates){
          const button=node('button',(en()&&card.en?card.en.title:card.title)+' · '+card.id);button.type='button';
          button.onclick=()=>{previousId=card.id;finish({question:tr('查阅条目','Read entry'),card});};list.append(button);
        }article.append(list);
      }
      log.append(article);
    }
  }
  function finish(turn){history.push(turn);if(history.length>12)history.shift();render();log.scrollTop=log.scrollHeight;}
  function semantic(query,id){
    return new Promise((resolve,reject)=>{
      try{
        worker ||= new Worker(new URL('worker.js',base),{type:'module'});
        const timeout=setTimeout(()=>{worker?.terminate();worker=null;pending=null;reject(Error('timeout'));},90000);
        const complete=(value,error)=>{clearTimeout(timeout);pending=null;error?reject(error):resolve(value);};
        pending=complete;
        worker.onmessage=({data})=>{
          if(data.type==='progress'){if(id===request)status.textContent=tr('正在本机准备语义模型…基础检索仍可用。','Preparing local semantic search… basic search remains available.');return;}
          if(data.id!==id)return;
          if(data.type==='error'){worker.terminate();worker=null;complete(null,Error('model'));}else complete(data.matches);
        };
        worker.onerror=()=>{worker?.terminate();worker=null;complete(null,Error('worker'));};
        worker.postMessage({query,id,version:knowledge.version});
      }catch(error){reject(error);}
    });
  }
  form.onsubmit=async event=>{
    event.preventDefault();const question=input.value.trim();if(!question)return;
    const id=++request;
    if(pending){worker?.terminate();worker=null;pending(null,Error('superseded'));}
    input.value='';status.textContent=tr('正在检索本地知识…','Searching local knowledge…');
    try{
      await loading();if(id!==request)return;
      const blocked=searchModule.guard(question);
      if(blocked){
        const messages={
          dynamic:['我暂时不能可靠计算这个实时数值。请在实验台设置地点、日期和时刻，读取对应图解；本原型没有接入动态计算接口。','I cannot reliably calculate this dynamic value. Set the location, date and time in the Lab and read the diagram; this prototype has no live calculation interface.'],
          outside:['这个问题超出本站知识助手的范围。我可以说明网站操作和有关的地理、天文原理。','That is outside this assistant’s scope. I can explain site controls and related geography or astronomy.'],
          action:['本助手不会替你操作网页。请问“如何操作”，我可以提供步骤。','This assistant does not operate the page. Ask how to do it and I can provide instructions.']};
        finish({question,message:messages[blocked]});status.textContent='';return;
      }
      let query=question;
      if(previousId==='site:EDIT-002'&&/保存|save/i.test(question))query='两个城市保存在完整实验';
      const matches=engine(query),top=matches[0];
      const strong=top&&(top.exact||(top.coverage>=0.72&&top.score>=12&&top.score>(matches[1]?.score||0)*1.28));
      if(strong&&top.card.status!=='draft'){
        previousId=top.card.id;finish({question,card:top.card});status.textContent=tr('本地文本检索 · 未调用模型','Local text search · no model inference');return;
      }
      // Exact draft titles are readable, with their unverified status clearly shown.
      if(top?.exact){finish({question,card:top.card});status.textContent=tr('知识草稿查阅','Knowledge draft lookup');return;}
      status.textContent=tr('正在准备本地语义检索，首次需要下载模型…','Preparing local semantic search; first use downloads the model…');
      let candidates=matches.slice(0,3).map(hit=>hit.card),failed=false;
      try{
        const semanticMatches=await semantic(question,id);if(id!==request)return;
        const byId=new Map(knowledge.records.map(card=>[card.id,card]));
        // Prototype semantic matches are suggestions, never uncalibrated factual answers.
        candidates=semanticMatches.filter(hit=>hit.score>=0.5).slice(0,3).map(hit=>byId.get(hit.id)).filter(Boolean);
      }catch{failed=true;}
      if(id!==request)return;
      finish({question,message:['我暂时没有足够可靠的信息直接回答。你可能在找以下条目；也可以补充具体图解或操作目的。','I do not have a reliable direct answer yet. These entries may help; you can also specify the view or task.'],candidates});
      status.textContent=failed?tr('高级语义检索暂不可用，已回退本地文本检索。','Advanced semantic search is unavailable; local text search is still available.'):tr('本地 BGE 语义检索 · 候选需确认','Local BGE semantic search · confirm a suggested entry');
    }catch{if(id===request)status.textContent=tr('知识库暂时无法加载，请联网后重试。','The knowledge data could not load. Reconnect and try again.');}
  };
  input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();form.requestSubmit();}});
  launch.onclick=()=>{dialog.showModal();title.focus();launch.setAttribute('aria-expanded','true');};
  close.onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{launch.setAttribute('aria-expanded','false');launch.focus();});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  document.addEventListener('skymotion:language',render);
  const toolbar=document.querySelector('.time-workbench');
  host.style.setProperty('--assistant-right',toolbar?'124px':'160px');
  const place=()=>{
    let top=0;for(let el=toolbar;el;el=el.offsetParent)top+=el.offsetTop;
    top-=scrollY;
    host.style.setProperty('--assistant-bottom',toolbar&&top<innerHeight?Math.max(16,innerHeight-top+12)+'px':'20px');
  };
  if(toolbar){const observer=new ResizeObserver(place);observer.observe(toolbar);observer.observe(toolbar.parentElement);}
  addEventListener('resize',place);addEventListener('scroll',place,{passive:true});
  document.addEventListener('skymotion:fonts-ready',place);place();render();
})();
