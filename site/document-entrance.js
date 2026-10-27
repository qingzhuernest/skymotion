/** Three original bilingual conversations, before intentional document navigation. */
(() => {
  const context = window.skyDocumentEntranceContext;
  if (!context || window.skyPageRedirecting) return;
  window.skyDocumentEntranceInitialized = true;
  const copy = {
    guide: {
      zh: [
        '为何学习地理？',
        '为了读懂我们生活的大地。',
        '知道世界是什么样，便足够了吗？',
        '还要理解，我们如何与它相处。',
        '那么，理解从何处开始？',
        '从愿意再看一眼那些自以为熟悉的事物开始。',
      ],
      en: [
        'Why do we study geography?',
        'To understand the Earth we live on.',
        'Is knowing the world enough?',
        'Only if we also learn how to live within it.',
        'Then where does understanding begin?',
        'With the patience to look again at what we thought we knew.',
      ],
    },
    'project-guide': {
      zh: [
        '模型有什么用？',
        '让复杂的世界，暂时变得清晰。',
        '那么，模型就是世界本身吗？',
        '不。它只是观看世界的一种方式。',
        '它未能呈现的部分呢？',
        '那里，仍有值得我们继续追问的真实。',
      ],
      en: [
        'What is a model for?',
        'To make a complicated world easier to understand.',
        'So, is the model the world?',
        'No. It is a way of looking at it.',
        'And what lies beyond what it shows?',
        'The part of the world that keeps us asking better questions.',
      ],
    },
    'development-guide': {
      zh: [
        '为何建立模型？',
        '为了解释所见，也试着预知将发生的事。',
        '可当模型失效，又该怎么办？',
        '回到观察，问一问：我们遗漏了什么？',
        '这是否意味着，先前的理解全无意义？',
        '并非如此。地理的趣味，正从此处展开。',
      ],
      en: [
        'Why do we build models?',
        'To explain what we see, and predict what may happen.',
        'But what happens when our models fail?',
        'We return to observation, and ask what we have overlooked.',
        'Does that mean we have understood nothing?',
        'No. That is when geography becomes interesting.',
      ],
    },
  };
  const root = document.documentElement,
    english = root.lang === 'en';
  const reduced = (window.SkyPreferences?.reducedMotion || matchMedia('(prefers-reduced-motion:reduce)'));
  const life = new AbortController(),
    animations = [];
  let stage,
    dialogue,
    button,
    master,
    exiting = false,
    finished = false;
  const hiddenContent = [];
  function cleanup() {
    if (finished) return;
    finished = true;
    life.abort();
    animations.forEach((animation) => animation.cancel());
    hiddenContent.forEach(([node, inert]) => {
      node.inert = inert;
    });
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
    animations.forEach((animation) => animation.pause());
    try {
      await track(
        dialogue.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: reduced.matches ? 120 : early ? 180 : 550,
          fill: 'forwards',
        }),
      ).finished;
      button.style.opacity = '0';
      if (context.theme === 'night') {
        await track(
          stage.animate(
            [
              { backgroundColor: getComputedStyle(stage).backgroundColor },
              {
                backgroundColor: getComputedStyle(document.body)
                  .getPropertyValue('--design-paper')
                  .trim(),
              },
            ],
            {
              duration: reduced.matches ? 180 : early ? 450 : 1150,
              easing: 'cubic-bezier(.4,0,.2,1)',
              fill: 'forwards',
            },
          ),
        ).finished;
      }
      // Text leaves before the exposure changes, keeping it legible throughout.
      window.skyResetDocumentEntrance();
      await track(
        stage.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: reduced.matches ? 120 : early ? 180 : 420,
          fill: 'forwards',
        }),
      ).finished;
      const wasFocused = document.activeElement === button;
      cleanup();
      if (wasFocused) {
        const heading = document.querySelector('.document-title');
        heading?.setAttribute('tabindex', '-1');
        heading?.focus({ preventScroll: true });
      }
    } catch {
      cleanup();
    }
  }
  window.skyFinishDocumentEntrance = () => exit(true);
  async function start() {
    const sentences = copy[context.page]?.[english ? 'en' : 'zh'];
    if (!sentences) {
      cleanup();
      return;
    }
    stage = document.createElement('section');
    stage.className = 'document-entrance';
    stage.dataset.theme = context.theme;
    stage.dataset.i18nSkip = '';
    stage.setAttribute(
      'aria-label',
      english ? 'A conversation before reading' : '阅读前的一段对话',
    );
    dialogue = document.createElement('div');
    dialogue.className = 'entrance-dialogue';
    dialogue.setAttribute('role', 'group');
    dialogue.setAttribute('aria-label', stage.getAttribute('aria-label'));
    sentences.forEach((sentence, index) => {
      const line = document.createElement('p');
      line.className = 'entrance-sentence';
      line.dataset.voice = index % 2 ? 'answer' : 'question';
      line.textContent = sentence;
      dialogue.append(line);
    });
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'entrance-continue md-outlined-action';
    button.textContent = english ? 'Continue reading' : '继续阅读';
    button.addEventListener('click', () => exit(true), { signal: life.signal });
    stage.append(dialogue, button);
    for (const node of document.querySelectorAll(
      'body > .page-nav,body > .document-page',
    )) {
      hiddenContent.push([node, node.inert]);
      node.inert = true;
    }
    document.body.append(stage);
    await window.skyFirstFontsReady;
    if (finished) return;
    window.skyMarkReadingSeen(context.page);
    const times = [0, 1500, 3200, 5100, 7000, 9100];
    [...dialogue.children].forEach((line, index) => {
      if (reduced.matches) {
        line.style.opacity = '1';
        return;
      }
      track(
        line.animate(
          [
            {
              opacity: 0,
              transform: 'translateY(8px)',
              clipPath: index % 2 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)',
            },
            { opacity: 1, transform: 'translateY(0)', clipPath: 'inset(0 0 0 0)' },
          ],
          {
            delay: times[index],
            duration: index === 5 ? 1150 : 900,
            easing: 'cubic-bezier(.16,1,.3,1)',
            fill: 'forwards',
          },
        ),
      );
    });
    master = track(
      stage.animate(
        [
          { offset: 0, opacity: 1 },
          { offset: 1, opacity: 1 },
        ],
        { duration: 13600 },
      ),
    );
    master.finished.then(() => exit()).catch(() => {});
    document.addEventListener(
      'keydown',
      (event) => {
        if (['Escape', 'Enter', ' '].includes(event.key)) {
          event.preventDefault();
          exit(true);
        }
      },
      { signal: life.signal },
    );
    document.addEventListener(
      'visibilitychange',
      () => {
        animations.forEach((animation) => {
          if (document.hidden && animation.playState === 'running') animation.pause();
          else if (!document.hidden && animation.playState === 'paused') animation.play();
        });
      },
      { signal: life.signal },
    );
    window.addEventListener('pagehide', cleanup, { signal: life.signal });
    reduced.addEventListener(
      'change',
      () => {
        if (!reduced.matches || exiting) return;
        for (const animation of animations) if (animation !== master) animation.cancel();
        [...dialogue.children].forEach((line) => {
          line.style.opacity = '1';
          line.style.transform = 'none';
          line.style.clipPath = 'none';
        });
      },
      { signal: life.signal },
    );
  }
  start().catch(cleanup);
})();
