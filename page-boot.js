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
  const guard = document.createElement('style');
  guard.textContent = 'html[data-language-pending] body,html[data-language-pending] body *{visibility:hidden!important}html[data-language-pending]{background:#f4f7f8}html[data-language-pending]::after{content:"";position:fixed;left:calc(50% - 12px);top:calc(50% - 12px);width:24px;height:24px;border:2px solid #cdd9de;border-top-color:#24576b;border-radius:50%;animation:sky-font-loading 1s linear infinite}@keyframes sky-font-loading{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){html[data-language-pending]::after{animation:none}}';
  document.head.append(guard);
  const files = language === 'en' ? ['charter_regular.woff2','charter_bold.woff2','charter_italic.woff2','charter_bold_italic.woff2'] : ['reading-regular.woff2','reading-bold.woff2'];
  for (const file of files) {
    const link = document.createElement('link');
    link.rel = 'preload'; link.as = 'font'; link.type = 'font/woff2'; link.crossOrigin = 'anonymous';
    link.href = new URL('fonts/'+file,base); document.head.append(link);
  }
})();
