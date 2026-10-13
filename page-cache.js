/** Warm the normal browser HTTP cache; never instantiate hidden experiments or WebGL scenes. */
(() => {
  if (document.body?.dataset.embedded === 'true') return;
  const base = new URL('.', document.currentScript.src);
  let started = false;
  function start() {
    if (started || document.hidden) return;
    started = true;
    const idle = window.requestIdleCallback || (callback => setTimeout(callback,250));
    idle(async () => {
      try {
        const response = await fetch(new URL('page-cache-manifest.json',base),{cache:'force-cache',credentials:'same-origin',priority:'low'});
        if (!response.ok) return;
        const manifest = await response.json();
        const files = [...manifest.pages,'fonts/reading-regular.woff2','fonts/reading-bold.woff2','fonts/charter_regular.woff2','fonts/charter_bold.woff2','fonts/charter_italic.woff2','fonts/charter_bold_italic.woff2'];
        let cursor = 0;
        async function worker() {
          while (cursor < files.length) {
            const file = files[cursor++];
            try { await fetch(new URL(file,base),{cache:'force-cache',credentials:'same-origin',priority:'low'}); } catch {}
          }
        }
        await Promise.all([worker(),worker()]);
      } catch {} // Cache warming is optional; navigation and access checks stay browser-native.
    });
  }
  document.addEventListener('skymotion:ready',start,{once:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!document.documentElement.hasAttribute('data-language-pending'))start()});
  if (!document.documentElement.hasAttribute('data-language-pending')) start();
})();
