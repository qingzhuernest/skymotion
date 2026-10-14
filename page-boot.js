/** Pick the already generated language page before parsing visible content. */
(() => {
  const root = document.documentElement;
  const base = new URL('.', document.currentScript.src);
  const known = new Set(['index.html','lab.html','diagrams.html','analemma.html','sundial.html','guide.html','project-guide.html','development-guide.html','contact.html','geography-review.html','404.html','space/index.html']);
  function localeUrl(next, value = location.href) {
    const url = new URL(value, document.baseURI);
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return null;
    let path = url.pathname.slice(base.pathname.length);
    if (!path || path.endsWith('/')) path += 'index.html';
    if (!path.endsWith('.html')) path += '.html';
    const source = path.replace(/\.en\.html$/, '.html');
    if (!known.has(source)) return null;
    url.pathname = base.pathname + (next === 'en' ? source.replace(/\.html$/, '.en.html') : source);
    let explicitPreference = false;
    try { explicitPreference = Boolean(sessionStorage.getItem('skymotion-explicit-language')); } catch {}
    if (url.searchParams.has('lang') || explicitPreference) url.searchParams.set('lang', next);
    return url;
  }
  window.skyLocaleUrl = localeUrl;
  const rendered = root.dataset.renderedLanguage || 'zh';
  let preferred = null;
  try { preferred = localStorage.getItem('skymotion-language'); } catch {}
  const explicit = new URLSearchParams(location.search).get('lang');
  let language = explicit || preferred || rendered;
  language = language === 'en' ? 'en' : 'zh';
  if (explicit === 'en' || explicit === 'zh') {
    try { localStorage.setItem('skymotion-language', language); } catch {}
    try { sessionStorage.setItem('skymotion-explicit-language', language); } catch {}
  }
  root.dataset.languagePending = '';
  const guard = document.createElement('style');
  guard.textContent = 'html[data-language-pending] body,html[data-language-pending] body *{visibility:hidden!important}html[data-language-pending]{background:#f4f7f8}html[data-language-pending]::after{content:"";position:fixed;left:calc(50% - 12px);top:calc(50% - 12px);width:24px;height:24px;border:2px solid #cdd9de;border-top-color:#24576b;border-radius:50%;animation:sky-font-loading 1s linear infinite}@keyframes sky-font-loading{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){html[data-language-pending]::after{animation:none}}';
  document.head.append(guard);
  if (rendered !== language) {
    const target = localeUrl(language);
    if (target && target.pathname !== location.pathname) {
      location.replace(target.href);
      return;
    }
  }
  window.skyPageLanguage = language;
  root.lang = language === 'en' ? 'en' : 'zh-CN';
  root.dataset.languagePending = '';
  const files = language === 'en' ? ['charter_regular.woff2','charter_bold.woff2'] : ['reading-regular.woff2','reading-bold.woff2'];
  for (const file of files) {
    const link = document.createElement('link');
    link.rel = 'preload'; link.as = 'font'; link.type = 'font/woff2'; link.crossOrigin = 'anonymous';
    link.fetchPriority = 'high';
    link.href = new URL('fonts/'+file,base); document.head.append(link);
  }
  const preparedFonts = new Map();
  window.skyPrepareFonts = (locale) => {
    locale = locale === 'en' ? 'en' : 'zh';
    if (!preparedFonts.has(locale)) {
      const family = locale === 'en' ? 'SkyMotion Charter' : 'SkyMotion Reading';
      const variants = locale === 'en' ? ['charter_regular.woff2','charter_bold.woff2'] : ['reading-regular.woff2','reading-bold.woff2'];
      let expired = false, timer;
      const loading = Promise.all(variants.map((file,index) => {
        const face = new FontFace(family, `url("${new URL('fonts/'+file,base)}")`, { weight: index ? '600 900' : '400 500', display: 'block' });
        return face.load().then(loaded => { if (!expired) document.fonts.add(loaded); return loaded; });
      }));
      const deadline = new Promise((_,reject) => { timer=setTimeout(() => { expired=true; reject(new Error('Font loading timed out')); },8000); });
      const promise = Promise.race([loading,deadline]).finally(() => clearTimeout(timer));
      preparedFonts.set(locale,promise);
      promise.catch(() => { if (preparedFonts.get(locale)===promise) preparedFonts.delete(locale); });
    }
    return preparedFonts.get(locale);
  };
  const quoteFonts = root.hasAttribute('data-english-quote') ? window.skyPrepareFonts('en') : Promise.resolve();
  window.skyFirstFontsReady = Promise.all([window.skyPrepareFonts(language), quoteFonts]).then(() => {
    // Static content already has the right language. It need not wait for experiments to initialize.
    delete root.dataset.languagePending;
    root.dataset.fontsReady = '';
    document.dispatchEvent(new Event('skymotion:fonts-ready'));
    performance.mark('skymotion-fonts-visible');
  });
  function showFontFailure() {
    root.dataset.fontLoadError = '';
    delete root.dataset.languagePending;
    const show = () => {
      if (document.querySelector('.font-load-notice')) return;
      const notice = document.createElement('aside');
      notice.className = 'font-load-notice'; notice.dataset.i18nSkip = ''; notice.setAttribute('role','status');
      const english = root.lang === 'en';
      const message = document.createElement('span');
      message.textContent = english ? 'Font loading failed. A fallback font is in use.' : '字体未能加载，暂用备用字体。';
      const retry = document.createElement('button'); retry.type='button';
      retry.textContent = english ? 'Retry fonts' : '重试字体';
      retry.onclick = async () => {
        retry.disabled=true;
        try {
          await Promise.all([window.skyPrepareFonts(document.documentElement.lang === 'en' ? 'en' : 'zh'), root.hasAttribute('data-english-quote') ? window.skyPrepareFonts('en') : Promise.resolve()]);
          delete root.dataset.fontLoadError; root.dataset.fontsReady=''; notice.remove();
          document.dispatchEvent(new Event('skymotion:fonts-ready'));
          if(typeof schedule==='function')schedule();
        } catch { retry.disabled=false; }
      };
      notice.append(message,retry);document.body.append(notice);
    };
    if(document.body)show();else document.addEventListener('DOMContentLoaded',show,{once:true});
  }
  window.skyFirstFontsReady.catch(showFontFailure);
})();
