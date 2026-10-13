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
  let preferred = 'zh';
  try { preferred = localStorage.getItem('skymotion-language') || 'zh'; } catch {}
  let language = new URLSearchParams(location.search).get('lang') || (rendered === 'en' ? 'en' : preferred);
  language = language === 'en' ? 'en' : 'zh';
  root.dataset.languagePending = '';
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
  const files = language === 'en' ? ['charter_regular.woff2','charter_bold.woff2','charter_italic.woff2','charter_bold_italic.woff2'] : ['reading-regular.woff2','reading-bold.woff2'];
  for (const file of files) {
    const link = document.createElement('link');
    link.rel = 'preload'; link.as = 'font'; link.type = 'font/woff2'; link.crossOrigin = 'anonymous';
    link.href = new URL('fonts/'+file,base); document.head.append(link);
  }
  window.skyLanguageBoot = setTimeout(() => {
    window.skyLanguageBootExpired = true;
    if (window.skyLanguageStartupFallback) window.skyLanguageStartupFallback();
    else { root.lang = 'zh-CN'; delete root.dataset.languagePending; }
  },8000);
})();
