/** Three original bilingual conversations, before intentional document navigation. */
(() => {
  const context = window.skyDocumentEntranceContext;
  if (!context || window.skyPageRedirecting) return;
  window.skyDocumentEntranceInitialized = true;
  const copy = {
    "guide": {
      "zh": [
        "每天都能看见的天空，为什么还值得学习？",
        "因为熟悉一种现象，并不等于理解它。",
        "理解，只是知道一个正确答案吗？",
        "还要知道答案从何而来，又在什么条件下成立。",
        "那么，学习会有终点吗？",
        "一个答案可以结束一道题，理解却让我们有能力提出新的问题。"
      ],
      "en": [
        "Why study a sky we see every day?",
        "Familiarity with a phenomenon is not the same as understanding it.",
        "Does understanding mean knowing the right answer?",
        "It also means knowing where an answer comes from, and when it holds.",
        "Then does learning ever come to an end?",
        "An answer may finish an exercise. Understanding makes new questions possible."
      ]
    },
    "project-guide": {
      "zh": [
        "模型与真实之间，隔着什么？",
        "隔着我们的选择：留下哪些关系，暂且舍去哪些细节。",
        "有所省略的模型，还能帮助我们认识真实吗？",
        "可以。取舍让问题变得清晰，也为解释划定了边界。",
        "那么，模型没有解释的部分呢？",
        "承认尚未解释的部分，才能让新的观察继续修正我们的理解。"
      ],
      "en": [
        "What stands between a model and reality?",
        "Our choices: which relationships to retain, and which details to set aside.",
        "Can a model that leaves things out still help us understand?",
        "Yes. Simplification clarifies a question, while setting limits on its explanation.",
        "What about everything the model leaves unexplained?",
        "Recognizing those gaps lets new observations reshape our understanding."
      ]
    },
    "development-guide": {
      "zh": [
        "程序运行正确，就意味着理解正确吗？",
        "计算可以忠于规则，规则却未必忠于现实。",
        "那么，怎样让一份实现值得信赖？",
        "让假设可以追溯，让推导可以复查，让结论接受证据的检验。",
        "当新的证据推翻了原来的设计呢？",
        "让实现随认识修正，也把修正的理由清楚地留下。"
      ],
      "en": [
        "Does correct execution mean correct understanding?",
        "A calculation can obey its rules even when those rules misdescribe reality.",
        "Then what makes an implementation trustworthy?",
        "Traceable assumptions, inspectable reasoning, and conclusions tested against evidence.",
        "What if new evidence overturns the original design?",
        "As understanding changes, revise the implementation and record why."
      ]
    }
  };
  const root = document.documentElement, english = root.lang === 'en';
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const life = new AbortController(), animations = [];
  let stage, dialogue, button, master, exiting = false, finished = false;
  const hiddenContent = [];
  function cleanup() {
    if (finished) return;
    finished = true;
    life.abort();
    animations.forEach(animation => animation.cancel());
    hiddenContent.forEach(([node,inert]) => { node.inert = inert; });
    window.skyResetDocumentEntrance();
    stage?.remove();
  }
  function track(animation) {
    animations.push(animation);
    if (document.hidden) animation.pause();
    return animation;
  }
  async function exit(early = false) {
    if (exiting || finished) return;
    exiting = true;
    animations.forEach(animation => animation.pause());
    try {
      await track(dialogue.animate([{opacity:1},{opacity:0}], {duration:reduced.matches?120:early?180:550,fill:'forwards'})).finished;
      button.style.opacity = '0';
      if (context.theme === 'night') {
        await track(stage.animate([{backgroundColor:'#0b131e'},{backgroundColor:'#f4f7f8'}], {
          duration:reduced.matches?180:early?450:1150, easing:'cubic-bezier(.4,0,.2,1)', fill:'forwards',
        })).finished;
      }
      // Text leaves before the exposure changes, keeping it legible throughout.
      window.skyResetDocumentEntrance();
      await track(stage.animate([{opacity:1},{opacity:0}], {duration:reduced.matches?120:early?180:420,fill:'forwards'})).finished;
      const wasFocused = document.activeElement === button;
      cleanup();
      if (wasFocused) {
        const heading = document.querySelector('.document-header h1');
        heading?.setAttribute('tabindex','-1');
        heading?.focus({preventScroll:true});
      }
    } catch { cleanup(); }
  }
  window.skyFinishDocumentEntrance = () => exit(true);
  async function start() {
    const sentences = copy[context.page]?.[english?'en':'zh'];
    if (!sentences) { cleanup(); return; }
    stage = document.createElement('section');
    stage.className = 'document-entrance';
    stage.dataset.theme = context.theme;
    stage.dataset.i18nSkip = '';
    stage.setAttribute('aria-label',english?'A conversation before reading':'阅读前的一段对话');
    dialogue = document.createElement('div');
    dialogue.className = 'entrance-dialogue';
    dialogue.setAttribute('role','group');
    dialogue.setAttribute('aria-label',stage.getAttribute('aria-label'));
    sentences.forEach((sentence,index) => {
      const line = document.createElement('p');
      line.className = 'entrance-sentence';
      line.dataset.voice = index%2?'answer':'question';
      line.textContent = sentence;
      dialogue.append(line);
    });
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'entrance-continue';
    button.textContent = english?'Continue reading':'继续阅读';
    button.addEventListener('click',() => exit(true),{signal:life.signal});
    stage.append(dialogue,button);
    for (const node of document.querySelectorAll('body > .page-nav,body > .document-page')) {
      hiddenContent.push([node,node.inert]);
      node.inert = true;
    }
    document.body.append(stage);
    await window.skyFirstFontsReady;
    if (finished) return;
    window.skyMarkReadingSeen(context.page);
    const times = [0,1500,3200,5100,7000,9100];
    [...dialogue.children].forEach((line,index) => {
      if (reduced.matches) { line.style.opacity = '1'; return; }
      const side = index%2?14:-14;
      track(line.animate([
        {opacity:0,transform:`translateX(${side}px)`,clipPath:index%2?'inset(0 0 0 100%)':'inset(0 100% 0 0)'},
        {opacity:1,transform:'translateX(0)',clipPath:'inset(0 0 0 0)'},
      ], {delay:times[index],duration:index===5?1150:900,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'}));
    });
    master = track(stage.animate([{offset:0,opacity:1},{offset:1,opacity:1}],{duration:13600}));
    master.finished.then(()=>exit()).catch(()=>{});
    document.addEventListener('keydown',event => {
      if (['Escape','Enter',' '].includes(event.key)) { event.preventDefault(); exit(true); }
    },{signal:life.signal});
    document.addEventListener('visibilitychange',() => {
      animations.forEach(animation => {
        if (document.hidden && animation.playState==='running') animation.pause();
        else if (!document.hidden && animation.playState==='paused') animation.play();
      });
    },{signal:life.signal});
    window.addEventListener('pagehide',cleanup,{signal:life.signal});
    reduced.addEventListener('change',() => {
      if (!reduced.matches || exiting) return;
      for (const animation of animations) if (animation!==master) animation.cancel();
      [...dialogue.children].forEach(line=>{line.style.opacity='1';line.style.transform='none';line.style.clipPath='none'});
    },{signal:life.signal});
  }
  start().catch(cleanup);
})();
