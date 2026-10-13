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
    if (url.searchParams.has('lang')) url.searchParams.set('lang', next);
    return url;
  }
  window.skyLocaleUrl = localeUrl;
  const rendered = root.dataset.renderedLanguage || 'zh';
  let preferred = null;
  try { preferred = localStorage.getItem('skymotion-language'); } catch {}
  let language = new URLSearchParams(location.search).get('lang') || preferred || rendered;
  language = language === 'en' ? 'en' : 'zh';
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
      const promise = Promise.all(variants.map((file,index) => {
        const face = new FontFace(family, `url("${new URL('fonts/'+file,base)}")`, { weight: index ? '600 900' : '400 500', display: 'block' });
        return face.load().then(loaded => { document.fonts.add(loaded); return loaded; });
      }));
      preparedFonts.set(locale,promise);
      promise.catch(() => preparedFonts.delete(locale));
    }
    return preparedFonts.get(locale);
  };
  window.skyFirstFontsReady = window.skyPrepareFonts(language).then(() => {
    // Static content already has the right language. It need not wait for experiments to initialize.
    delete root.dataset.languagePending;
    root.dataset.fontsReady = '';
    document.dispatchEvent(new Event('skymotion:fonts-ready'));
    performance.mark('skymotion-fonts-visible');
  });
  window.skyFirstFontsReady.catch(() => { root.dataset.fontLoadError = ''; });
})();
