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
  const launch=node('button',undefined,'assistant-launch');launch.dataset.i18nSkip='';launch.type='button';launch.setAttribute('aria-haspopup','dialog');launch.setAttribute('aria-expanded','false');
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
  let loadPromise, lastDiagnostic=null, pendingQuestion='';
  // Opt-in developer inspection only; no questions are logged or persisted.
  window.SkyAssistantDebug=Object.freeze({getLast:()=>structuredClone(lastDiagnostic)});
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
    container.dataset.cardId=card.id;

    if(en()&&!card.en)container.append(node('p','This source entry is currently available in Chinese.','assistant-caution'));
    container.append(node('h3',content.title),node('p',content.answer));
    if(content.steps?.length){const list=node('ol');for(const step of content.steps)list.append(node('li',step));container.append(list);}
    for(const warning of content.warnings||[])if(!/助手|这些是|These (instructions|are)|assistant (does|has)/i.test(warning))container.append(node('p',warning,'assistant-caution'));
    const references=node('details',undefined,'assistant-references');
    references.append(node('summary',tr('参考资料','References')));
    if(card.status==='draft')references.append(node('p',tr('来自知识原文，尚未逐项交互核验。','Source text; not individually interaction-tested.'),'assistant-caution'));
    references.append(node('p',(card.sourceIds||[card.id]).join(' · '),'assistant-source'));
    const url=target(card);
    if(url){const link=node('a',tr('对应使用手册 →','Relevant guide →'));link.href=url;references.append(link);}
    const copy=node('button',tr('复制答案','Copy answer'),'assistant-copy');copy.type='button';
    copy.onclick=async()=>{
      try{await navigator.clipboard.writeText([content.title,content.answer,...(content.steps||[]),...(content.warnings||[]),card.id].join('\n'));status.textContent=tr('答案已复制。','Answer copied.');}
      catch{status.textContent=tr('无法自动复制，请选中文字复制。','Select the answer text to copy it.');}
    };const actions=node('div',undefined,'assistant-answer-actions');actions.append(references,copy);container.append(actions);
  }
  function render(){
    launch.textContent=tr('助手','Assistant');title.textContent=tr('Sky 助手','Sky assistant');
    close.textContent=tr('关闭','Close');intro.textContent=tr('可以问网站操作，也可以问天文与地理问题。','Ask about site controls, astronomy or geography.');intro.hidden=history.length>0||!!pendingQuestion;
    label.textContent=tr('你想了解什么？','What would you like to know?');input.placeholder=tr('例如：怎样比较两个城市的太阳轨迹？','For example: compare the Sun’s paths for two cities');submit.textContent=tr('提问','Ask');
    examples.replaceChildren();examples.hidden=history.length>0||!!pendingQuestion;
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
          const button=node('button',(en()&&card.en?card.en.title:card.title));button.type='button';
          button.onclick=()=>{previousId=card.id;finish({question:tr('查阅条目','Read entry'),card});};list.append(button);
        }article.append(list);
      }
      log.append(article);
    }
    if(pendingQuestion){const article=node('article',undefined,'assistant-turn');article.append(node('p',pendingQuestion,'assistant-user'));log.append(article);}
  }
  function finish(turn){pendingQuestion='';history.push(turn);if(history.length>12)history.shift();render();log.scrollTop=log.scrollHeight;}
  function semantic(query,id){
    return new Promise((resolve,reject)=>{
      try{
        worker ||= new Worker(new URL('worker.js',base),{type:'module'});
        const timeout=setTimeout(()=>{worker?.terminate();worker=null;pending=null;reject(Error('timeout'));},90000);
        const complete=(value,error)=>{clearTimeout(timeout);pending=null;error?reject(error):resolve(value);};
        pending=complete;
        worker.onmessage=({data})=>{
          if(data.type==='progress'){if(id===request)status.textContent=tr('首次准备可能需要一点时间…','Getting ready for the first time…');return;}
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
    input.value='';input.style.height='';pendingQuestion=question;render();status.textContent=tr('正在查找…','Looking it up…');
    try{
      await loading();if(id!==request)return;
      const diagnostic={query:question,normalized:searchModule.normalize(question),method:'lexical',decision:'pending',reason:null,
        top5:engine(question).map(hit=>({id:hit.card.id,score:hit.score,status:hit.card.status,exact:hit.exact,coverage:hit.coverage}))};
      lastDiagnostic=diagnostic;
      const blocked=searchModule.guard(question);
      diagnostic.actionRequested=blocked==='action';
      if(blocked&&blocked!=='action'){
        diagnostic.decision='refuse';diagnostic.reason=blocked;
        const messages={
          dynamic:['我暂时不能可靠计算这个数值。请在实验台设置地点、日期和时刻，读取对应图解。','I cannot reliably calculate this value. Set the location, date and time in the Lab and read the diagram.'],
          outside:['这个问题超出本站知识助手的范围。我可以说明网站操作和有关的地理、天文原理。','That is outside this assistant’s scope. I can explain site controls and related geography or astronomy.'],
          action:['本助手不会替你操作网页。请问“如何操作”，我可以提供步骤。','This assistant does not operate the page. Ask how to do it and I can provide instructions.']};
        finish({question,message:messages[blocked]});status.textContent='';return;
      }
      let query=question;
      if(previousId==='site:EDIT-002'&&/保存|save/i.test(question))query='两个城市保存在完整实验';
      const matches=engine(query),selection=searchModule.selectAnswer(query,matches,knowledge.records);
      diagnostic.reason=selection.reason;diagnostic.intent=selection.intent||null;
      if(selection.card){
        diagnostic.decision='answer';diagnostic.selectedId=selection.card.id;
        previousId=selection.card.id;finish({question,card:selection.card});status.textContent='';return;
      }
      diagnostic.method='semantic';
      status.textContent=tr('正在查找，首次准备可能稍久…','Looking it up; first-time preparation may take a moment…');
      let candidates=matches.slice(0,3).map(hit=>hit.card),failed=false;
      try{
        const semanticMatches=await semantic(question,id);if(id!==request)return;
        diagnostic.semanticTop5=semanticMatches;
        const answer=searchModule.selectSemanticAnswer(question,semanticMatches,matches,knowledge.records);
        if(answer){diagnostic.decision='answer';diagnostic.reason='supported_semantic_match';diagnostic.selectedId=answer.id;
          previousId=answer.id;finish({question,card:answer});status.textContent='';return;}
        const byId=new Map(knowledge.records.map(card=>[card.id,card]));
        // Prototype semantic matches are suggestions, never uncalibrated factual answers.
        candidates=semanticMatches.filter(hit=>hit.score>=0.5).slice(0,3).map(hit=>byId.get(hit.id)).filter(Boolean);
      }catch{failed=true;diagnostic.method='lexical-fallback';diagnostic.failure='semantic_unavailable';}
      if(id!==request)return;
      diagnostic.decision='suggestions';
      finish({question,message:candidates.length?['你想了解哪一项？','Which of these would you like to explore?']:['暂时没有找到对应内容，可以补充图解名称或你想做的操作。','I could not find a matching entry. Add the view name or describe the task.'],candidates});
      status.textContent=failed?tr('暂时只能查找相近条目，你也可以换个说法。','Only related entries are available right now. You can also rephrase.') : '';
    }catch{if(id===request){finish({question,message:['暂时无法查找，请联网后重试。','Unable to look this up. Reconnect and try again.']});status.textContent='';}}
  };
  input.addEventListener('input',()=>{input.style.height='auto';input.style.height=Math.min(96,input.scrollHeight)+'px';});
  input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();form.requestSubmit();}});
  launch.onclick=()=>{dialog.showModal();title.focus();launch.setAttribute('aria-expanded','true');};
  close.onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{launch.setAttribute('aria-expanded','false');launch.focus();});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  document.addEventListener('skymotion:language',render);
  function mountLauncher(){
    const target=(document.body.classList.contains('space-immersive')&&document.querySelector('.head-actions'))
      ||document.querySelector('.welcome-corner-links')||document.querySelector('.page-nav')||document.querySelector('.welcome-brand .language-actions,.welcome-brand');
    if(target&&launch.parentElement!==target)target.append(launch);
  }
  document.addEventListener('DOMContentLoaded',mountLauncher,{once:true});
  document.addEventListener('skymotion:header-ready',mountLauncher);
  addEventListener('space:layout',mountLauncher);
  mountLauncher();render();
})();
